import { ColonyState } from './ColonyState.js';
import { ResourceManager } from './ResourceManager.js';
import { AllocationManager } from './AllocationManager.js';
import { FacilityManager } from './FacilityManager.js';
import { EventManager } from './EventManager.js';
import { MonitoringManager } from './MonitoringManager.js';
import { ProgressionManager } from './ProgressionManager.js';
import { RecoveryManager } from './RecoveryManager.js';
import { colonyApiClient } from '../api/ColonyApiClient.js';

/**
 * SimulationManager — Master simulation engine and Sol clock.
 * Drives Sol cycles, hourly resource processing, priority allocation, facility production/consumption,
 * environmental events, colony monitoring telemetry, and progression milestones.
 *
 * Connected directly to the Java OOP Backend (http://localhost:8080) as the SINGLE SOURCE OF TRUTH.
 */
export class SimulationManager {
  constructor(options = {}) {
    // 1 real second = 0.4 simulated hours (60.0 real seconds = 1 Sol at 1×)
    // 0.5×: 1 Sol every 120.0 seconds (2.0 minutes per Sol - calm/observational)
    // 1×:   1 Sol every 60.0 seconds  (1.0 minute per Sol  - standard realistic pace)
    // 2×:   1 Sol every 30.0 seconds  (30 seconds per Sol  - brisk)
    // 5×:   1 Sol every 12.0 seconds  (12 seconds per Sol  - fast-forward)
    // 10×:  1 Sol every 6.0 seconds   (6 seconds per Sol   - rapid)
    this.simHourPerRealSecond = options.simHourPerRealSecond !== undefined ? options.simHourPerRealSecond : 0.4;
    this.speedMultiplier = 1.0;
    this.isRunning = true;
    this._isStepping = false;

    // Simulation Clock
    this.sol = 1;
    this.hour = 8.0; // Starts at 08:00 (Martian morning)
    this.elapsedRealTime = 0;

    // Accumulator for discrete hourly processing
    this.hourAccumulator = 0;

    // Subsystems
    this.colonyState = new ColonyState();
    this.resourceManager = new ResourceManager(this.colonyState);
    this.allocationManager = new AllocationManager();
    this.facilityManager = new FacilityManager(this.colonyState, this.resourceManager, this.allocationManager);
    this.facilitySystem = this.facilityManager; // Alias for backward compatibility
    this.eventManager = new EventManager();
    this.monitoringManager = new MonitoringManager();
    this.progressionManager = new ProgressionManager();
    this.recoveryManager = new RecoveryManager(this);
    this.facilityManager.recoveryManager = this.recoveryManager;

    // Java Backend Integration
    this.apiClient = colonyApiClient;
    this.backendData = null;
    this.isBackendConnected = false;

    // Callbacks & UI notification throttling
    this.listeners = [];
    this._lastNotifyTime = 0;
    this._notifyPending = false;

    // Run initial tick to populate local state
    const initialMods = this.eventManager.getModifiers();
    this.facilityManager.tick(this.hour, this.sol, 0.01, initialMods);
    this.monitoringManager.tick(this.hour, this.sol, this.colonyState, this.facilityManager, this.eventManager, this.resourceManager);
    this.progressionManager.tick(this.hour, this.sol, this.colonyState, this.facilityManager, this.monitoringManager);

    // Initial fetch from Java backend
    this.syncFromBackend();
  }

  /**
   * Fetches latest colony state from Java backend and applies it
   */
  async syncFromBackend() {
    try {
      const state = await this.apiClient.fetchState();
      if (state) {
        this.applyBackendState(state);
      }
    } catch (err) {
      // Ignore background fetch error
    }
  }

  /**
   * Applies Java Backend ColonyState as the SINGLE SOURCE OF TRUTH
   */
  applyBackendState(backendState) {
    if (!backendState) return;
    this.isBackendConnected = true;
    this.backendData = backendState;

    // 1. Clock & Sol
    if (backendState.sol !== undefined) {
      this.sol = backendState.sol;
    }
    // Only set hour on initial load or reset, NEVER while simulation is actively progressing
    if (!this.isRunning && this.sol === 1 && backendState.hour !== undefined) {
      this.hour = backendState.hour;
    }

    // 2. Colony Status
    if (backendState.status) {
      this.colonyState.status = backendState.status;
    }

    // 3. Resources (Java is Single Source of Truth)
    if (backendState.resources) {
      const bRes = backendState.resources;
      const resMap = {
        oxygen: bRes.Oxygen,
        water: bRes.Water,
        food: bRes.Food,
        energy: bRes.Power
      };
      for (const [key, bData] of Object.entries(resMap)) {
        if (bData && this.colonyState.resources[key]) {
          const r = this.colonyState.resources[key];
          r.current = bData.current;
          r.max = bData.max;
          r.productionRate = bData.production;
          r.consumptionRate = bData.consumption;
        }
      }
      this.colonyState.updateColonyStatus();
    }

    // 4. Facilities & Sectors (Java is Single Source of Truth)
    if (backendState.facilities && this.facilityManager?.facilities) {
      for (const bFac of backendState.facilities) {
        const name = (bFac.name || '').toLowerCase();
        const level = bFac.operatingLevel / 100.0;
        const levelPct = bFac.operatingLevel;
        const cond = bFac.condition !== undefined ? bFac.condition : 100.0;
        const eff = bFac.efficiency !== undefined ? bFac.efficiency : Math.round(levelPct * (cond / 100.0));
        const condText = cond >= 95 ? 'OPTIMAL' : (cond >= 80 ? `${Math.round(cond)}% NOMINAL` : (cond >= 60 ? `${Math.round(cond)}% DEGRADED` : `${Math.round(cond)}% DAMAGED`));

        if (name.includes('habitat')) {
          if (this.facilityManager.facilities.habitat) {
            const fac = this.facilityManager.facilities.habitat;
            fac.efficiency = eff;
            fac.operatingLevel = 1.0;
            fac.status = bFac.status;
            fac.conditionScore = cond;
            fac.condition = condText;
            fac.actualConsumption = {
              energy: Number((24.0 * level).toFixed(1)),
              water: Number((12.0 * level).toFixed(1)),
              oxygen: Number((10.0 * level).toFixed(1)),
              food: Number((8.0 * level).toFixed(1))
            };
            fac.actualProduction = {
              oxygen: Number((9.5 * level * (cond / 100.0)).toFixed(1))
            };
          }
          if (this.facilityManager.facilities.oxygen) {
            const fac = this.facilityManager.facilities.oxygen;
            fac.efficiency = eff;
            fac.operatingLevel = 1.0;
            fac.conditionScore = cond;
            fac.condition = condText;
          }
          if (this.facilityManager.facilities.central_hub) {
            const fac = this.facilityManager.facilities.central_hub;
            fac.efficiency = eff;
            fac.operatingLevel = 1.0;
            fac.conditionScore = cond;
            fac.condition = condText;
          }
          if (this.allocationManager?.sectorLevels) {
            this.allocationManager.sectorLevels.lifesupport = 1.0;
          }
        } else if (name.includes('power')) {
          if (this.facilityManager.facilities.power) {
            const fac = this.facilityManager.facilities.power;
            fac.efficiency = eff;
            fac.operatingLevel = level;
            fac.status = bFac.status;
            fac.conditionScore = cond;
            fac.condition = condText;
            fac.actualProduction = { energy: Number((70.0 * level * (cond / 100.0)).toFixed(1)) };
          }
          if (this.facilityManager.facilities.solar) {
            const fac = this.facilityManager.facilities.solar;
            fac.efficiency = eff;
            fac.operatingLevel = level;
            fac.conditionScore = cond;
            fac.condition = condText;
          }
          if (this.facilityManager.facilities.battery) {
            const fac = this.facilityManager.facilities.battery;
            fac.efficiency = eff;
            fac.operatingLevel = level;
            fac.conditionScore = cond;
            fac.condition = condText;
          }
        } else if (name.includes('water')) {
          if (this.facilityManager.facilities.water) {
            const fac = this.facilityManager.facilities.water;
            fac.efficiency = eff;
            fac.operatingLevel = level;
            fac.status = bFac.status;
            fac.conditionScore = cond;
            fac.condition = condText;
            fac.actualProduction = { water: Number((28.0 * level * (cond / 100.0)).toFixed(1)) };
            fac.actualConsumption = { energy: Number((8.0 * level).toFixed(1)) };
          }
          if (this.allocationManager?.sectorLevels) {
            this.allocationManager.sectorLevels.water = level;
          }
        } else if (name.includes('greenhouse')) {
          if (this.facilityManager.facilities.greenhouse) {
            const fac = this.facilityManager.facilities.greenhouse;
            fac.efficiency = eff;
            fac.operatingLevel = level;
            fac.status = bFac.status;
            fac.conditionScore = cond;
            fac.condition = condText;
            fac.actualProduction = {
              food: Number((8.5 * level * (cond / 100.0)).toFixed(1)),
              oxygen: Number((0.5 * level).toFixed(1))
            };
            fac.actualConsumption = {
              water: Number((15.0 * level).toFixed(1)),
              energy: Number((6.0 * level).toFixed(1))
            };
          }
          if (this.allocationManager?.sectorLevels) {
            this.allocationManager.sectorLevels.greenhouse = level;
          }
        } else if (name.includes('research')) {
          if (this.facilityManager.facilities.research_lab) {
            const fac = this.facilityManager.facilities.research_lab;
            fac.efficiency = eff;
            fac.operatingLevel = level;
            fac.status = bFac.status;
            fac.conditionScore = cond;
            fac.condition = condText;
            fac.actualConsumption = {
              energy: Number((4.0 * level).toFixed(1)),
              water: Number((1.0 * level).toFixed(1))
            };
          }
          if (this.allocationManager?.sectorLevels) {
            this.allocationManager.sectorLevels.research = level;
          }
        } else if (name.includes('landing') || name.includes('logistics')) {
          if (this.facilityManager.facilities.rocket) {
            const fac = this.facilityManager.facilities.rocket;
            fac.efficiency = eff;
            fac.operatingLevel = level;
            fac.status = bFac.status;
            fac.conditionScore = cond;
            fac.condition = condText;
          }
          if (this.facilityManager.facilities.mining) {
            const fac = this.facilityManager.facilities.mining;
            fac.efficiency = eff;
            fac.operatingLevel = level;
            fac.status = bFac.status;
            fac.conditionScore = cond;
            fac.condition = condText;
          }
          if (this.facilityManager.facilities.storage_depot) {
            const fac = this.facilityManager.facilities.storage_depot;
            fac.efficiency = eff;
            fac.operatingLevel = level;
            fac.conditionScore = cond;
            fac.condition = condText;
          }
          if (this.allocationManager?.sectorLevels) {
            this.allocationManager.sectorLevels.logistics = level;
          }
        }
      }
    }

    // 5. Active Events
    if (backendState.activeEvents && this.eventManager) {
      this.eventManager.activeEvents = backendState.activeEvents.map(be => ({
        type: be.name.toUpperCase().replace(/\s+/g, '_'),
        name: be.name.toUpperCase(),
        severity: be.severity,
        solsRemaining: be.durationRemaining,
        description: be.description,
        effects: be.name.toLowerCase().includes('dust') ? { solarOutput: 0.15 } : {}
      }));
    }

    // 6. Recovery & Auxiliary Backup
    if (backendState.recovery && this.recoveryManager) {
      this.recoveryManager.backupActive = backendState.recovery.backupActive;
    }

    // 7. Health, Environment, and History Sync from Java
    if (this.monitoringManager) {
      const resMaxes = {
        oxygen: this.colonyState.resources.oxygen?.max || 1000,
        water: this.colonyState.resources.water?.max || 1000,
        food: this.colonyState.resources.food?.max || 1000,
        energy: this.colonyState.resources.energy?.max || 500
      };
      this.monitoringManager.setFromBackend(backendState.health, backendState.history, backendState.environment, resMaxes);
    }
    if (this.resourceManager && backendState.history) {
      this.resourceManager.syncFromBackendHistory(backendState.history);
    }

    this.notifyListeners();
  }

  /**
   * Advances simulation by 1 Sol in the Java backend
   */
  async stepSol() {
    if (this._isStepping) return;
    this._isStepping = true;
    try {
      const newState = await this.apiClient.stepSol();
      if (newState) {
        this.applyBackendState(newState);
      } else {
        this.sol += 1;
        this.notifyListeners();
      }
      return newState;
    } catch (err) {
      console.warn('⚠️ [SimulationManager] stepSol failed, advancing locally:', err.message);
      this.sol += 1;
      this.notifyListeners();
    } finally {
      this._isStepping = false;
    }
  }

  /**
   * Called on every frame by SceneManager render loop
   * @param {number} delta real seconds since last frame
   */
  update(delta) {
    if (!this.isRunning) return;

    this.elapsedRealTime += delta;

    // Advance simulated hours: 1 real second = 4.8 simulated hours at 1× (24 hours in 5.0 seconds)
    const deltaHours = delta * this.simHourPerRealSecond * this.speedMultiplier;
    this.hour += deltaHours;

    // Advance Sol when 24 hours pass — calls Java backend!
    if (this.hour >= 24.0) {
      this.hour -= 24.0;
      this.stepSol();
    }

    // Accumulate time for micro-step updates
    this.hourAccumulator += deltaHours;
    if (this.hourAccumulator >= 0.05) {
      const deltaSols = this.hourAccumulator / 24.0;
      if (!this.isBackendConnected) {
        this.eventManager.tick(this.hour, this.sol, deltaSols);
        this.recoveryManager.tick(this.hour, this.sol, deltaSols, this.hourAccumulator);
        const eventMods = this.eventManager.getModifiers();
        this.facilityManager.tick(this.hour, this.sol, this.hourAccumulator, eventMods);
        this.monitoringManager.tick(this.hour, this.sol, this.colonyState, this.facilityManager, this.eventManager, this.resourceManager);
      }
      this.progressionManager.tick(this.hour, this.sol, this.colonyState, this.facilityManager, this.monitoringManager);
      this.hourAccumulator = 0;
      this.requestNotifyListeners();
    }
  }

  start() {
    this.isRunning = true;
    this.notifyListeners();
  }

  pause() {
    this.isRunning = false;
    this.notifyListeners();
  }

  togglePlay() {
    this.isRunning = !this.isRunning;
    this.notifyListeners();
    return this.isRunning;
  }

  async reset() {
    this.sol = 1;
    this.hour = 8.0;
    this.elapsedRealTime = 0;
    this.hourAccumulator = 0;
    const newState = await this.apiClient.resetSimulation();
    if (newState) {
      this.applyBackendState(newState);
    } else {
      this.colonyState.reset();
      this.resourceManager.reset();
      this.eventManager.reset();
      this.monitoringManager.reset();
      this.progressionManager.reset();
      this.recoveryManager.reset();
      this.facilityManager.initFacilities();
      this.notifyListeners();
    }
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.25, Math.min(20.0, multiplier));
    this.notifyListeners();
  }

  async triggerEvent(type, duration = null) {
    const dur = duration || 3.0;
    const newState = await this.apiClient.triggerEvent(type, dur);
    if (newState) {
      this.applyBackendState(newState);
    } else {
      this.eventManager.triggerEvent(type, this.sol, dur);
      this.notifyListeners();
    }
    return newState;
  }

  acknowledgeNotification(id) {
    this.eventManager.acknowledgeNotification(id);
    this.notifyListeners();
  }

  dismissNotification(id) {
    this.eventManager.dismissNotification(id);
    this.notifyListeners();
  }

  advancePhase() {
    const success = this.progressionManager.advancePhase();
    if (success) {
      this.progressionManager.tick(this.hour, this.sol, this.colonyState, this.facilityManager, this.monitoringManager);
      this.notifyListeners();
    }
    return success;
  }

  toggleFacilityPriority(facilityId) {
    const result = this.facilityManager.togglePriority(facilityId);
    const eventMods = this.eventManager.getModifiers();
    this.facilityManager.tick(this.hour, this.sol, 0.01, eventMods);
    this.notifyListeners();
    return result;
  }

  repairFacility(facilityId) {
    const result = this.facilityManager.repairFacility(facilityId);
    this.notifyListeners();
    return result;
  }

  upgradeFacility(facilityId) {
    const result = this.facilityManager.upgradeFacility(facilityId);
    this.notifyListeners();
    return result;
  }

  useEmergencyReserve(resourceKey = 'energy') {
    const res = this.recoveryManager.useEmergencyReserve(resourceKey);
    const eventMods = this.eventManager.getModifiers();
    this.facilityManager.tick(this.hour, this.sol, 0.01, eventMods);
    this.notifyListeners();
    return res;
  }

  async toggleBackupPower() {
    const newState = await this.apiClient.toggleBackupPower();
    if (newState) {
      this.applyBackendState(newState);
      return newState.recovery?.backupActive;
    }
    const res = this.recoveryManager.toggleBackupPower();
    const eventMods = this.eventManager.getModifiers();
    this.facilityManager.tick(this.hour, this.sol, 0.01, eventMods);
    this.notifyListeners();
    return res;
  }

  toggleConservation() {
    const res = this.recoveryManager.toggleConservation();
    const eventMods = this.eventManager.getModifiers();
    this.facilityManager.tick(this.hour, this.sol, 0.01, eventMods);
    this.notifyListeners();
    return res;
  }

  startRepair() {
    const res = this.recoveryManager.startRepair();
    const eventMods = this.eventManager.getModifiers();
    this.facilityManager.tick(this.hour, this.sol, 0.01, eventMods);
    this.notifyListeners();
    return res;
  }

  stepSectorLevel(sectorKey, delta) {
    const newLevel = this.allocationManager.stepSectorLevel(sectorKey, delta);
    const eventMods = this.eventManager.getModifiers();
    this.facilityManager.tick(this.hour, this.sol, 0.01, eventMods);
    this.notifyListeners();
    return newLevel;
  }

  setSectorLevel(sectorKey, level) {
    const newLevel = this.allocationManager.setSectorLevel(sectorKey, level);
    const eventMods = this.eventManager.getModifiers();
    this.facilityManager.tick(this.hour, this.sol, 0.01, eventMods);
    this.notifyListeners();
    return newLevel;
  }

  resetSectorLevels() {
    this.allocationManager.resetSectorLevels();
    const eventMods = this.eventManager.getModifiers();
    this.facilityManager.tick(this.hour, this.sol, 0.01, eventMods);
    this.notifyListeners();
  }

  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      // Immediately invoke with initial state
      callback(this.getSnapshot());
    }
  }

  /**
   * Batches/throttles UI listener notifications to ~12-15 Hz during continuous simulation,
   * completely preventing 60 Hz DOM thrashing at 5x speed while keeping UI responsive.
   */
  requestNotifyListeners() {
    const now = performance.now();
    if (now - this._lastNotifyTime < 66) {
      if (!this._notifyPending) {
        this._notifyPending = true;
        setTimeout(() => {
          this._notifyPending = false;
          this.notifyListeners();
        }, Math.max(10, 66 - (now - this._lastNotifyTime)));
      }
      return;
    }
    this.notifyListeners();
  }

  notifyListeners(immediate = false) {
    this._lastNotifyTime = performance.now();
    this._notifyPending = false;
    const snapshot = this.getSnapshot();
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](snapshot);
    }
  }

  /**
   * Formats current time as "08:30"
   */
  getFormattedTime() {
    const totalMinutes = Math.floor(this.hour * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  getSolString() {
    return `SOL ${String(this.sol).padStart(3, '0')}`;
  }

  /**
   * Comprehensive simulation snapshot for UI
   */
  getSnapshot() {
    return {
      sol: this.sol,
      solString: this.getSolString(),
      hour: this.hour,
      timeString: this.getFormattedTime(),
      isDaylight: this.hour >= 6.0 && this.hour <= 18.0,
      isRunning: this.isRunning,
      speedMultiplier: this.speedMultiplier,
      isBackendConnected: this.isBackendConnected,
      backendState: this.backendData,
      colony: this.colonyState.getSummary(),
      events: this.eventManager.getSnapshot(),
      monitoring: this.monitoringManager.getSnapshot(this.colonyState, this.resourceManager),
      progression: this.progressionManager.getSnapshot(),
      recovery: this.recoveryManager.getRecoveryState(),
      getLiveFacilityData: (facilityId) => {
        return this.facilityManager.getLiveFacilityData(facilityId, this.sol, this.hour);
      }
    };
  }
}
