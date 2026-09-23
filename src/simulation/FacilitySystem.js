import { COLONY_STRUCTURES } from '../interaction/ColonyData.js';
import { ResourceManager } from './ResourceManager.js';
import { AllocationManager } from './AllocationManager.js';

/**
 * FacilityManager (FacilitySystem) — Manages individual colony facilities,
 * base and actual production/consumption rates, priority-based allocation,
 * throttling levels (100%, 75%, 50%, 25%, 0%), condition degradation/repair,
 * and live telemetry for UI inspector.
 *
 * Prepared for future Java OOP backend porting (FacilityManager.java).
 */
export class FacilityManager {
  constructor(colonyState, resourceManager = null, allocationManager = null) {
    this.colonyState = colonyState;
    this.resourceManager = resourceManager || new ResourceManager(colonyState);
    this.allocationManager = allocationManager || new AllocationManager();
    this.facilities = {};
    this.initFacilities();
  }

  initFacilities() {
    this.definitions = {
      power: {
        id: 'power',
        name: 'NUCLEAR POWER STATION',
        baseProduction: { oxygen: 0, water: 0, food: 0, energy: 32.0 },
        baseConsumption: { oxygen: 0, water: 0, food: 0, energy: 0.0 }
      },
      solar: {
        id: 'solar',
        name: 'SOLAR POWER ARRAY',
        baseProduction: { oxygen: 0, water: 0, food: 0, energy: 45.0 }, // Scaled by daylight
        baseConsumption: { oxygen: 0, water: 0, food: 0, energy: 0.0 }
      },
      water: {
        id: 'water',
        name: 'WATER EXTRACTION WELL',
        baseProduction: { oxygen: 0, water: 40.0, food: 0, energy: 0.0 },
        baseConsumption: { oxygen: 0, water: 0, food: 0, energy: 8.0 }
      },
      greenhouse: {
        id: 'greenhouse',
        name: 'CEA BIO-DOME',
        baseProduction: { oxygen: 2.0, water: 0, food: 15.0, energy: 0.0 },
        baseConsumption: { oxygen: 0, water: 20.0, food: 0, energy: 6.0 }
      },
      habitat: {
        id: 'habitat',
        name: 'MAIN HABITAT MODULE',
        baseProduction: { oxygen: 0, water: 0, food: 0, energy: 0.0 },
        baseConsumption: { oxygen: 6.0, water: 8.0, food: 5.0, energy: 10.0 }
      },
      research_lab: {
        id: 'research_lab',
        name: 'RESEARCH FACILITY',
        baseProduction: { oxygen: 0, water: 0, food: 0, energy: 0.0 },
        baseConsumption: { oxygen: 0, water: 1.0, food: 0, energy: 4.0 }
      },
      rocket: {
        id: 'rocket',
        name: 'LANDING & LAUNCH ZONE',
        baseProduction: { oxygen: 0, water: 0, food: 0, energy: 0.0 },
        baseConsumption: { oxygen: 0, water: 0, food: 0, energy: 1.0 }
      },
      oxygen: {
        id: 'oxygen',
        name: 'MOXIE OXYGEN PLANT',
        baseProduction: { oxygen: 12.0, water: 0, food: 0, energy: 0.0 },
        baseConsumption: { oxygen: 0, water: 0, food: 0, energy: 6.0 }
      },
      mining: {
        id: 'mining',
        name: 'REGOLITH MINING AUGER',
        baseProduction: { oxygen: 0, water: 0, food: 0, energy: 0.0 },
        baseConsumption: { oxygen: 0, water: 0, food: 0, energy: 5.0 }
      },
      central_hub: {
        id: 'central_hub',
        name: 'CENTRAL COMMAND CORE',
        baseProduction: { oxygen: 0, water: 0, food: 0, energy: 0.0 },
        baseConsumption: { oxygen: 0, water: 0, food: 0, energy: 3.0 }
      },
      battery: {
        id: 'battery',
        name: 'POWER GRID BUFFER',
        baseProduction: { oxygen: 0, water: 0, food: 0, energy: 0.0 },
        baseConsumption: { oxygen: 0, water: 0, food: 0, energy: 0.0 }
      },
      storage_depot: {
        id: 'storage_depot',
        name: 'AUTOMATED STORAGE DEPOT',
        baseProduction: { oxygen: 0, water: 0, food: 0, energy: 0.0 },
        baseConsumption: { oxygen: 0, water: 0, food: 0, energy: 1.0 }
      }
    };

    // Instantiate runtime facility objects
    Object.keys(this.definitions).forEach(id => {
      const def = this.definitions[id];
      this.facilities[id] = {
        id,
        name: def.name,
        efficiency: 100,
        operatingLevel: 1.0,
        conditionScore: 100,
        condition: 'OPTIMAL',
        status: 'OPERATIONAL',
        actualProduction: { ...def.baseProduction },
        actualConsumption: { ...def.baseConsumption },
        upgradeLevel: 1
      };
    });
  }

  /**
   * Toggles user manual priority for a facility
   * @param {string} facilityId
   */
  togglePriority(facilityId) {
    if (!this.allocationManager) return false;
    return this.allocationManager.toggleManualPriority(facilityId);
  }

  /**
   * Performs maintenance on a facility, restoring condition
   * @param {string} facilityId
   */
  repairFacility(facilityId) {
    const fac = this.facilities[facilityId];
    if (fac) {
      fac.conditionScore = 100;
      fac.condition = 'OPTIMAL';
      return true;
    }
    return false;
  }

  /**
   * Upgrades a facility, boosting efficiency
   * @param {string} facilityId
   */
  upgradeFacility(facilityId) {
    const fac = this.facilities[facilityId];
    if (fac) {
      fac.upgradeLevel = (fac.upgradeLevel || 1) + 1;
      return true;
    }
    return false;
  }

  /**
   * Ticks all colony facilities for the given hourly slice
   * @param {number} hourOfDay 0.0 - 24.0
   * @param {number} currentSol integer
   * @param {number} deltaHours hours elapsed (e.g. 0.1 hour micro-step)
   * @param {Object} eventModifiers Environmental event modifiers from EventManager
   */
  tick(hourOfDay, currentSol, deltaHours = 1.0, eventModifiers = null) {
    const deltaSols = deltaHours / 24.0;
    const mods = eventModifiers || {};

    // 1. Calculate daylight factor for solar generation (08:00 - 18:00)
    let daylightFactor = 0;
    if (hourOfDay >= 6.0 && hourOfDay <= 18.0) {
      daylightFactor = Math.sin(((hourOfDay - 6.0) / 12.0) * Math.PI);
    }

    // 2. Fetch resource abundance/shortage states
    const resourceStates = this.resourceManager.getAllResourceStates();

    // Repair drone restoration factor
    const repairRatio = (this.recoveryManager?.repairActive ? (this.recoveryManager.repairProgress || 0) / 100.0 : 0);

    // 3. Compute priority-based resource allocation & throttling levels
    const allocations = this.allocationManager.calculateAllocations(
      resourceStates,
      this.colonyState.resources,
      mods
    );

    // If Conservation Protocol is actively engaged, aggressively pause non-essentials
    if (this.recoveryManager?.conservationActive) {
      if (allocations.research_lab) allocations.research_lab.operatingLevel = 0;
      if (allocations.mining) allocations.mining.operatingLevel = 0;
      if (allocations.rocket) allocations.rocket.operatingLevel = 0;
      if (allocations.storage_depot) allocations.storage_depot.operatingLevel = 0;
    }

    // Totals across all facilities
    const totals = {
      production: { oxygen: 0, water: 0, food: 0, energy: 0 },
      consumption: { oxygen: 0, water: 0, food: 0, energy: 0 }
    };

    // 4. Process Power & Solar Generation
    // Nuclear baseload (affected by grid interruption events, restored by repairs)
    const baseEnergyMod = mods.energyOutputMultiplier ?? 1.0;
    const energyOutputMod = baseEnergyMod + (1.0 - baseEnergyMod) * repairRatio;
    const nuclearKW = Number((32.0 * energyOutputMod).toFixed(1));
    this.facilities.power.actualProduction.energy = nuclearKW;
    this.facilities.power.efficiency = Math.round(98 * energyOutputMod);
    this.facilities.power.operatingLevel = energyOutputMod;
    this.facilities.power.condition = energyOutputMod < 0.8 ? 'GRID INTERRUPTED' : 'NOMINAL';

    // Solar array produces daylight-scaled power (affected by dust storms, restored by repair sweepers)
    const baseSolarMultiplier = mods.solarMultiplier ?? 1.0;
    const solarMultiplier = baseSolarMultiplier + (1.0 - baseSolarMultiplier) * repairRatio;
    const solarKW = Number((45.0 * daylightFactor * solarMultiplier).toFixed(1));
    this.facilities.solar.actualProduction.energy = solarKW;
    this.facilities.solar.efficiency = Math.round(100 * daylightFactor * solarMultiplier);
    this.facilities.solar.operatingLevel = solarMultiplier;
    if (solarMultiplier < 0.5) {
      this.facilities.solar.condition = 'DUST OBSCURED (-80%)';
    } else if (repairRatio > 0 && repairRatio < 1) {
      this.facilities.solar.condition = `SWEEPERS ACTIVE (${Math.round(repairRatio * 100)}%)`;
    } else {
      this.facilities.solar.condition = daylightFactor > 0.05 ? 'TRACKING SUN' : 'STANDBY (NIGHT)';
    }

    // 5. Process Water Extraction (Priority 2, affected by equipment failure / contamination, restored by repairs)
    const waterAlloc = allocations.water || { operatingLevel: 1.0, statusText: 'OPTIMAL' };
    const baseWaterOutputMod = mods.waterOutputMultiplier ?? 1.0;
    const waterOutputMod = baseWaterOutputMod + (1.0 - baseWaterOutputMod) * repairRatio;
    const baseWaterEffMod = mods.facilityEfficiencyMod?.water ?? 1.0;
    const waterEffMod = baseWaterEffMod + (1.0 - baseWaterEffMod) * repairRatio;
    const waterOpLevel = waterAlloc.operatingLevel;
    this.facilities.water.operatingLevel = waterOpLevel;
    this.facilities.water.actualConsumption.energy = Number((8.0 * waterOpLevel).toFixed(1));
    this.facilities.water.actualProduction.water = Number((40.0 * waterOpLevel * waterOutputMod * waterEffMod).toFixed(1));
    this.facilities.water.efficiency = Math.round(100 * waterOpLevel * waterOutputMod * waterEffMod);
    if (repairRatio > 0 && repairRatio < 1 && mods.facilityCondition?.water) {
      this.facilities.water.condition = `DRONE REPAIR IN PROGRESS (${Math.round(repairRatio * 100)}%)`;
    } else if (mods.facilityCondition?.water) {
      this.facilities.water.condition = mods.facilityCondition.water;
    } else {
      this.facilities.water.condition = waterAlloc.statusText;
    }

    // 6. Process MOXIE Oxygen Plant (Priority 1 Life Support)
    const o2Alloc = allocations.oxygen || { operatingLevel: 1.0, statusText: 'OPTIMAL' };
    const o2OpLevel = o2Alloc.operatingLevel;
    this.facilities.oxygen.operatingLevel = o2OpLevel;
    this.facilities.oxygen.actualConsumption.energy = Number((6.0 * o2OpLevel).toFixed(1));
    this.facilities.oxygen.actualProduction.oxygen = Number((12.0 * o2OpLevel).toFixed(1));
    this.facilities.oxygen.efficiency = Math.round(100 * o2OpLevel);
    this.facilities.oxygen.condition = o2Alloc.statusText;

    // 7. Process Greenhouse (Priority 3 Food Production, consumes Water & Energy)
    const ghAlloc = allocations.greenhouse || { operatingLevel: 1.0, statusText: 'OPTIMAL' };
    const ghOpLevel = ghAlloc.operatingLevel;
    this.facilities.greenhouse.operatingLevel = ghOpLevel;
    this.facilities.greenhouse.actualConsumption.energy = Number((6.0 * ghOpLevel).toFixed(1));
    this.facilities.greenhouse.actualConsumption.water = Number((20.0 * ghOpLevel).toFixed(1));
    this.facilities.greenhouse.actualProduction.food = Number((15.0 * ghOpLevel).toFixed(1));
    this.facilities.greenhouse.actualProduction.oxygen = Number((2.0 * ghOpLevel).toFixed(1));
    this.facilities.greenhouse.efficiency = Math.round(96 * ghOpLevel);
    this.facilities.greenhouse.condition = ghAlloc.statusText;

    // 8. Process Habitat (Priority 1 Life Support, Crew Quarters)
    const habAlloc = allocations.habitat || { operatingLevel: 1.0, statusText: 'OPTIMAL' };
    const habOpLevel = habAlloc.operatingLevel;
    this.facilities.habitat.operatingLevel = habOpLevel;
    this.facilities.habitat.actualConsumption.energy = Number((10.0 * habOpLevel).toFixed(1));
    this.facilities.habitat.actualConsumption.water = Number((8.0 * habOpLevel).toFixed(1));
    this.facilities.habitat.actualConsumption.food = Number((5.0 * habOpLevel).toFixed(1));
    this.facilities.habitat.actualConsumption.oxygen = Number((6.0 * habOpLevel).toFixed(1));
    this.facilities.habitat.efficiency = Math.round(100 * habOpLevel);
    this.facilities.habitat.condition = habAlloc.statusText;

    // 9. Process Research Lab (Priority 4 Science, affected by solar flare and manual priority)
    const labAlloc = allocations.research_lab || { operatingLevel: 1.0, statusText: 'OPTIMAL' };
    const labEffMod = mods.facilityEfficiencyMod?.research_lab ?? 1.0;
    const labOpLevel = labAlloc.operatingLevel;
    this.facilities.research_lab.operatingLevel = labOpLevel;
    this.facilities.research_lab.actualConsumption.energy = Number((4.0 * labOpLevel).toFixed(1));
    this.facilities.research_lab.actualConsumption.water = Number((1.0 * labOpLevel).toFixed(1));
    this.facilities.research_lab.efficiency = Math.round(100 * labOpLevel * labEffMod);
    this.facilities.research_lab.condition = labEffMod < 0.8 ? 'RAD INTERFERENCE' : labAlloc.statusText;

    // 10. Process Central Hub, Mining, Rocket, Storage Depot
    const hubAlloc = allocations.central_hub || { operatingLevel: 1.0, statusText: 'OPTIMAL' };
    const hubEffMod = mods.facilityEfficiencyMod?.central_hub ?? 1.0;
    const hubOpLevel = hubAlloc.operatingLevel;
    this.facilities.central_hub.operatingLevel = hubOpLevel;
    this.facilities.central_hub.actualConsumption.energy = Number((3.0 * hubOpLevel).toFixed(1));
    this.facilities.central_hub.efficiency = Math.round(100 * hubOpLevel * hubEffMod);
    this.facilities.central_hub.condition = hubEffMod < 0.8 ? 'COMMS DEGRADED' : hubAlloc.statusText;

    const miningAlloc = allocations.mining || { operatingLevel: 1.0, statusText: 'OPTIMAL' };
    const miningOpLevel = miningAlloc.operatingLevel;
    this.facilities.mining.operatingLevel = miningOpLevel;
    this.facilities.mining.actualConsumption.energy = Number((5.0 * miningOpLevel).toFixed(1));
    this.facilities.mining.efficiency = Math.round(100 * miningOpLevel);
    this.facilities.mining.condition = miningAlloc.statusText;

    const rocketAlloc = allocations.rocket || { operatingLevel: 1.0, statusText: 'OPTIMAL' };
    const rocketOpLevel = rocketAlloc.operatingLevel;
    this.facilities.rocket.operatingLevel = rocketOpLevel;
    this.facilities.rocket.actualConsumption.energy = Number((1.0 * rocketOpLevel).toFixed(1));
    this.facilities.rocket.efficiency = Math.round(100 * rocketOpLevel);
    this.facilities.rocket.condition = rocketAlloc.statusText;

    const depotAlloc = allocations.storage_depot || { operatingLevel: 1.0, statusText: 'OPTIMAL' };
    const depotEffMod = mods.facilityEfficiencyMod?.storage_depot ?? 1.0;
    const depotOpLevel = depotAlloc.operatingLevel;
    this.facilities.storage_depot.operatingLevel = depotOpLevel;
    this.facilities.storage_depot.actualConsumption.energy = Number((1.0 * depotOpLevel).toFixed(1));
    this.facilities.storage_depot.efficiency = Math.round(100 * depotOpLevel * depotEffMod);
    this.facilities.storage_depot.condition = mods.facilityCondition?.storage_depot || depotAlloc.statusText;

    // Battery buffer mirrors power grid storage
    const energyPct = Math.round((this.colonyState.resources.energy.current / this.colonyState.resources.energy.max) * 100);
    this.facilities.battery.efficiency = energyPct;
    this.facilities.battery.condition = energyPct > 20 ? 'OPTIMAL' : 'DEPLETED';

    // 11. Condition stress / maintenance degradation
    Object.values(this.facilities).forEach(fac => {
      if (fac.operatingLevel < 0.5) {
        fac.conditionScore = Math.max(10, fac.conditionScore - (0.15 * deltaSols));
      } else {
        fac.conditionScore = Math.min(100, fac.conditionScore + (0.05 * deltaSols));
      }
    });

    // 12. Accumulate Totals across all facilities
    const keys = ['oxygen', 'water', 'food', 'energy'];
    Object.values(this.facilities).forEach(fac => {
      keys.forEach(k => {
        totals.production[k] += fac.actualProduction[k] || 0;
        totals.consumption[k] += fac.actualConsumption[k] || 0;
      });
    });

    // 12b. Auxiliary Backup Generation
    if (this.recoveryManager?.backupActive) {
      totals.production.energy += 25.0; // +25 kW/Sol auxiliary generator
      if (resourceStates.water !== 'ABUNDANT' && resourceStates.water !== 'NORMAL') {
        totals.production.water += 10.0; // +10 L/Sol atmospheric condenser
      }
      this.facilities.battery.condition = 'AUXILIARY RTG ONLINE (+25 kW)';
    }

    // 13. Forward transactions to ResourceManager to update storage & Sol records
    this.resourceManager.processStep(totals, deltaSols, currentSol);
  }

  /**
   * Generates rich live facility profile data for UI detail panel
   * @param {string} facilityId 
   * @param {number} currentSol 
   * @param {number} currentHour 
   */
  getLiveFacilityData(facilityId, currentSol, currentHour) {
    const template = COLONY_STRUCTURES[facilityId];
    if (!template) return null;

    const fac = this.facilities[facilityId] || {
      efficiency: 90,
      condition: 'OPTIMAL',
      operatingLevel: 1.0,
      actualProduction: {},
      actualConsumption: {}
    };

    const isPrioritized = this.allocationManager ? this.allocationManager.isPrioritized(facilityId) : false;
    const priority = this.allocationManager ? this.allocationManager.getEffectivePriority(facilityId) : 3;

    // Deep clone template
    const liveData = JSON.parse(JSON.stringify(template));
    liveData.id = facilityId;
    liveData.efficiency.overall = fac.efficiency;
    liveData.condition = fac.condition;
    liveData.isPrioritized = isPrioritized;
    liveData.priority = priority;
    liveData.operatingLevel = fac.operatingLevel;
    liveData.status = fac.operatingLevel === 0 ? 'PAUSED' : (fac.operatingLevel < 1.0 ? 'THROTTLED' : 'OPERATIONAL');

    // Populate actual live values for each facility type
    if (facilityId === 'greenhouse') {
      const liveWater = fac.actualConsumption.water || 0;
      const liveEnergy = fac.actualConsumption.energy || 0;
      const liveFood = fac.actualProduction.food || 0;
      const liveO2 = fac.actualProduction.oxygen || 0;

      liveData.resourceFlow.inputs = [
        { name: 'WATER', amount: `-${liveWater} L / Sol`, role: 'Hydroponic Irrigation', color: '#38bdf8', icon: 'water' },
        { name: 'ENERGY', amount: `-${liveEnergy} kW`, role: 'LED Array Lighting', color: '#f59e0b', icon: 'power' }
      ];
      liveData.resourceFlow.outputs = [
        { name: 'FOOD', amount: `+${liveFood} kg / Sol`, role: 'Caloric Biomass', color: '#10b981', icon: 'food' },
        { name: 'OXYGEN', amount: `+${liveO2} kg / Sol`, role: 'Photosynthesis Yield', color: '#34d399', icon: 'oxygen' }
      ];
      if (liveData.efficiency?.breakdown) {
        liveData.efficiency.breakdown[0].percent = Math.round(fac.operatingLevel * 100);
        liveData.efficiency.breakdown[1].percent = Math.round(fac.operatingLevel * 100);
        liveData.efficiency.breakdown[2].percent = fac.efficiency;
      }
    } else if (facilityId === 'water') {
      const liveEnergy = fac.actualConsumption.energy || 0;
      const liveWater = fac.actualProduction.water || 0;

      liveData.resourceFlow.inputs = [
        { name: 'ENERGY', amount: `-${liveEnergy} kW`, role: 'Chillers & Pumps', color: '#f59e0b', icon: 'power' },
        { name: 'ATMOS VAPOR', amount: '0.03 g / m³', role: 'Martian Air Intake', color: '#93c5fd', icon: 'wind' }
      ];
      liveData.resourceFlow.outputs = [
        { name: 'POTABLE WATER', amount: `+${liveWater} L / Sol`, role: 'Colony Reservoir', color: '#38bdf8', icon: 'water' }
      ];
    } else if (facilityId === 'power') {
      const liveEnergy = fac.actualProduction.energy || 32;
      liveData.resourceFlow.inputs = [
        { name: 'FISSILE FUEL', amount: '0.02 g / Sol', role: 'Reactor Core Pellet', color: '#a78bfa', icon: 'minerals' }
      ];
      liveData.resourceFlow.outputs = [
        { name: 'ENERGY', amount: `+${liveEnergy} kW`, role: 'Main Grid Baseload', color: '#fbbf24', icon: 'power' }
      ];
    } else if (facilityId === 'solar') {
      const liveEnergy = fac.actualProduction.energy || 0;
      liveData.resourceFlow.outputs = [
        { name: 'ENERGY', amount: `+${liveEnergy} kW`, role: 'Daylight Grid Feed', color: '#fbbf24', icon: 'power' }
      ];
    } else if (facilityId === 'habitat') {
      liveData.resourceFlow.inputs = [
        { name: 'ENERGY', amount: `-${fac.actualConsumption.energy} kW`, role: 'Life Support & HVAC', color: '#f59e0b', icon: 'power' },
        { name: 'OXYGEN', amount: `-${fac.actualConsumption.oxygen} kg / Sol`, role: 'Crew Respiration', color: '#34d399', icon: 'oxygen' },
        { name: 'WATER', amount: `-${fac.actualConsumption.water} L / Sol`, role: 'Domestic & Hydration', color: '#38bdf8', icon: 'water' },
        { name: 'FOOD', amount: `-${fac.actualConsumption.food} kg / Sol`, role: 'Caloric Rations', color: '#10b981', icon: 'food' }
      ];
    } else if (facilityId === 'research_lab') {
      liveData.resourceFlow.inputs = [
        { name: 'ENERGY', amount: `-${fac.actualConsumption.energy} kW`, role: 'Instruments & Computing', color: '#f59e0b', icon: 'power' },
        { name: 'WATER', amount: `-${fac.actualConsumption.water} L / Sol`, role: 'Cooling & Reagents', color: '#38bdf8', icon: 'water' }
      ];
    } else if (facilityId === 'oxygen') {
      liveData.resourceFlow.inputs = [
        { name: 'ENERGY', amount: `-${fac.actualConsumption.energy} kW`, role: 'CO₂ Solid Oxide Electrolysis', color: '#f59e0b', icon: 'power' }
      ];
      liveData.resourceFlow.outputs = [
        { name: 'OXYGEN', amount: `+${fac.actualProduction.oxygen} kg / Sol`, role: 'Life Support Supply', color: '#34d399', icon: 'oxygen' }
      ];
    } else if (facilityId === 'storage_depot') {
      liveData.metricPercent = 78;
      liveData.metricLabel = 'STORED CAPACITY';
      liveData.resourceFlow.inputs = [
        { name: 'PROCESSED REGOLITH', amount: '+3.2 T / Sol', role: 'Mining Inflow', color: '#cbd5e1', icon: 'minerals' },
        { name: 'POWER', amount: `-${fac.actualConsumption.energy || 1.0} kW`, role: 'Climate & Crane', color: '#f59e0b', icon: 'power' }
      ];
      liveData.resourceFlow.outputs = [
        { name: 'FABRICATION BUFFER', amount: '120 T Ready', role: 'Construction Stock', color: '#fbbf24', icon: 'cargo' },
        { name: 'MODULAR SPARES', amount: '412 Units', role: 'Critical Spares Vault', color: '#38bdf8', icon: 'tools' }
      ];
      liveData.resources = [
        { name: 'TOTAL CAPACITY', value: '500 Tons', type: 'Max Vault Volume', icon: 'cargo', color: '#38bdf8' },
        { name: 'STORED RESOURCES', value: '392 Tons', type: 'Active Buffer', icon: 'minerals', color: '#fbbf24' },
        { name: 'AVAILABLE CAPACITY', value: '108 Tons', type: 'Free Vault Bay', icon: 'filter', color: '#34d399' },
        { name: 'RESOURCE FLOW', value: '+3.2 T / Sol', type: 'Mining Inflow', icon: 'tools', color: '#cbd5e1' }
      ];
    } else if (facilityId === 'battery') {
      const pwr = this.colonyState.resources.energy;
      const chargePct = Math.round((pwr.current / pwr.max) * 100);
      const netPower = Number((pwr.productionRate - pwr.consumptionRate).toFixed(1));
      const chargeState = netPower >= 0 ? 'CHARGING' : 'DISCHARGING';
      const backupAvail = this.recoveryManager?.backupActive ? 'ENGAGED (+25 kW)' : '+25 kW READY';

      liveData.metricPercent = chargePct;
      liveData.metricLabel = 'CHARGE LEVEL';
      liveData.resourceFlow.inputs = [
        { name: 'SOLAR & BASAL', amount: `+${Number(pwr.productionRate.toFixed(1))} kW`, role: 'Grid Inflow', color: '#fbbf24', icon: 'power' },
        { name: 'BACKUP STATUS', amount: backupAvail, role: 'Auxiliary Ready', color: '#a78bfa', icon: 'shield' }
      ];
      liveData.resourceFlow.outputs = [
        { name: 'FACILITY DRAW', amount: `-${Number(pwr.consumptionRate.toFixed(1))} kW`, role: 'Active Bus Load', color: '#f59e0b', icon: 'power' },
        { name: 'RESERVE BUFFER', amount: `${Math.round(pwr.current)} kWh`, role: 'Nocturnal Buffer', color: '#38bdf8', icon: 'battery' }
      ];
      liveData.resources = [
        { name: 'CHARGE LEVEL', value: `${chargePct}% (${Math.round(pwr.current)} kWh)`, type: chargeState, icon: 'energy', color: '#f59e0b' },
        { name: 'TOTAL CAPACITY', value: `${Math.round(pwr.max)} kWh`, type: 'Solid-State Cells', icon: 'grid', color: '#38bdf8' },
        { name: 'BACKUP AVAILABILITY', value: backupAvail, type: 'Emergency Reserve', icon: 'shield', color: '#a78bfa' },
        { name: 'POWER FLOW', value: `${netPower >= 0 ? '+' : ''}${netPower} kW`, type: 'Net Grid Balance', icon: 'power', color: netPower >= 0 ? '#34d399' : '#ef4444' }
      ];
    }

    return liveData;
  }
}

export const FacilitySystem = FacilityManager;
