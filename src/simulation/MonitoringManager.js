/**
 * MonitoringManager — Real-time telemetry, environmental conditions,
 * resource history sparklines, and composite Colony Health score.
 * Updates smoothly and avoids abrupt erratic jumps.
 */
export class MonitoringManager {
  constructor() {
    this.historyLength = 16;
    this.historyIntervalHours = 12.0; // Sample history twice per Sol
    this.lastSampleHour = -1;

    // Rolling history for sparkline charts
    this.history = {
      oxygen: [89, 89, 88, 88, 89, 89, 89, 89, 88, 89],
      water: [79, 78, 78, 77, 78, 78, 79, 79, 78, 79],
      food: [81, 81, 82, 82, 82, 82, 82, 82, 83, 82],
      energy: [92, 94, 95, 93, 91, 94, 95, 96, 94, 95]
    };

    // Environmental readings
    this.environment = {
      temp: '-63°C',
      pressure: '6.1 kPa',
      radiation: 'NORMAL',
      solarInput: '78%',
      dust: 'LOW'
    };

    // Overall colony health
    this.colonyHealth = 87; // Percent (0 - 100)
    this.colonyHealthStatus = 'STABLE';
  }

  /**
   * Ticks monitoring system
   * @param {number} hour Current hour
   * @param {number} sol Current Sol
   * @param {Object} colonyState Central ColonyState
   * @param {Object} facilityManager FacilityManager
   * @param {Object} eventManager EventManager
   * @param {Object} resourceManager ResourceManager
   */
  tick(hour, sol, colonyState, facilityManager, eventManager, resourceManager = null) {
    const totalSimHours = (sol - 1) * 24 + hour;

    // Sample history periodically
    if (this.lastSampleHour < 0 || totalSimHours - this.lastSampleHour >= this.historyIntervalHours) {
      this.lastSampleHour = totalSimHours;
      this.sampleHistory(colonyState);
    }

    // 1. Update Environment Readings from EventManager overrides
    const eventMods = eventManager ? eventManager.getModifiers() : {};
    this.environment = {
      temp: eventMods.environment?.temp || '-63°C',
      pressure: eventMods.environment?.pressure || '6.1 kPa',
      radiation: eventMods.environment?.radiation || 'NORMAL',
      solarInput: eventMods.environment?.solarInput || '78%',
      dust: eventMods.environment?.dust || 'LOW'
    };

    // 2. Calculate Composite Colony Health Score (0 - 100%)
    this.calculateColonyHealth(colonyState, facilityManager, eventMods);
  }

  sampleHistory(colonyState) {
    const res = colonyState.resources;
    const o2Pct = Math.round((res.oxygen.current / res.oxygen.max) * 100);
    const waterPct = Math.round((res.water.current / res.water.max) * 100);
    const foodPct = Math.round((res.food.current / res.food.max) * 100);
    const energyPct = Math.round((res.energy.current / res.energy.max) * 100);

    this.pushHistory('oxygen', o2Pct);
    this.pushHistory('water', waterPct);
    this.pushHistory('food', foodPct);
    this.pushHistory('energy', energyPct);
  }

  /**
   * Syncs real health, environment, and history from Java backend
   */
  setFromBackend(backendHealth, backendHistory, backendEnv, resourceMaxes = null) {
    if (backendHealth) {
      this.colonyHealth = backendHealth.score;
      this.colonyHealthStatus = backendHealth.status;
    }
    if (backendEnv) {
      this.environment = {
        temp: `${backendEnv.temperature !== undefined ? Math.round(backendEnv.temperature) : -63}°C`,
        pressure: '6.1 kPa',
        radiation: 'NORMAL',
        solarInput: `${Math.round((backendEnv.solarIrradiance || 0.78) * 100)}%`,
        dust: backendEnv.dustStormActive ? (backendEnv.dustStormIntensity > 0.5 ? 'HEAVY' : 'MODERATE') : 'LOW'
      };
    }
    if (backendHistory && Array.isArray(backendHistory) && backendHistory.length > 0) {
      const o2Max = resourceMaxes?.oxygen || 1000;
      const waterMax = resourceMaxes?.water || 1000;
      const foodMax = resourceMaxes?.food || 1000;
      const energyMax = resourceMaxes?.energy || 500;

      this.history.oxygen = backendHistory.map(h => Math.round((h.oxygen / o2Max) * 100));
      this.history.water = backendHistory.map(h => Math.round((h.water / waterMax) * 100));
      this.history.food = backendHistory.map(h => Math.round((h.food / foodMax) * 100));
      this.history.energy = backendHistory.map(h => Math.round((h.power / energyMax) * 100));
    }
  }

  pushHistory(key, val) {
    this.history[key].push(val);
    if (this.history[key].length > this.historyLength) {
      this.history[key].shift();
    }
  }

  /**
   * Calculates overall colony health from:
   * 1. Resource storage levels (55% weight)
   * 2. Facility condition & efficiency (25% weight)
   * 3. Environmental conditions & events (20% weight)
   * Changes gradually rather than jumping wildly.
   */
  calculateColonyHealth(colonyState, facilityManager, eventMods) {
    const res = colonyState.resources;
    const o2Pct = (res.oxygen.current / res.oxygen.max) * 100;
    const waterPct = (res.water.current / res.water.max) * 100;
    const foodPct = (res.food.current / res.food.max) * 100;
    const energyPct = (res.energy.current / res.energy.max) * 100;

    // Resource score: mean weighted towards life support minimum
    const avgResource = (o2Pct * 0.35 + waterPct * 0.30 + foodPct * 0.20 + energyPct * 0.15);
    const minResource = Math.min(o2Pct, waterPct, foodPct, energyPct);
    const resourceScore = (avgResource * 0.6) + (minResource * 0.4);

    // Facility score: average efficiency across facilities
    let totalFacEff = 0;
    let facCount = 0;
    if (facilityManager && facilityManager.facilities) {
      Object.values(facilityManager.facilities).forEach(f => {
        totalFacEff += f.efficiency || 90;
        facCount++;
      });
    }
    const facilityScore = facCount > 0 ? (totalFacEff / facCount) : 90;

    // Environmental penalty:
    let envScore = 100;
    if (this.environment.dust === 'HEAVY') envScore -= 20;
    if (this.environment.radiation === 'ELEVATED') envScore -= 25;
    if (eventMods && eventMods.solarMultiplier < 0.5) envScore -= 10;

    // Target composite score
    const targetComposite = Math.round(
      resourceScore * 0.55 +
      facilityScore * 0.25 +
      envScore * 0.20
    );

    // Health changes gradually (smooth interpolation)
    const current = this.colonyHealth;
    const delta = (targetComposite - current) * 0.05; // 5% approach rate per tick
    this.colonyHealth = Math.max(5, Math.min(100, Math.round(current + delta)));

    // Health Status
    if (this.colonyHealth >= 80) {
      this.colonyHealthStatus = 'STABLE';
    } else if (this.colonyHealth >= 60) {
      this.colonyHealthStatus = 'STRAINED';
    } else if (this.colonyHealth >= 35) {
      this.colonyHealthStatus = 'CRITICAL';
    } else {
      this.colonyHealthStatus = 'SURVIVAL EMERGENCY';
    }
  }

  /**
   * Snapshot for UI
   */
  getSnapshot(colonyState, resourceManager = null) {
    const summary = colonyState.getSummary();

    return {
      health: {
        score: this.colonyHealth,
        status: this.colonyHealthStatus
      },
      environment: { ...this.environment },
      history: {
        oxygen: [...this.history.oxygen],
        water: [...this.history.water],
        food: [...this.history.food],
        energy: [...this.history.energy]
      },
      resources: {
        oxygen: {
          ...summary.oxygen,
          history: [...this.history.oxygen]
        },
        water: {
          ...summary.water,
          history: [...this.history.water]
        },
        food: {
          ...summary.food,
          history: [...this.history.food]
        },
        energy: {
          ...summary.energy,
          history: [...this.history.energy]
        }
      }
    };
  }

  reset() {
    this.history = {
      oxygen: [89, 89, 88, 88, 89, 89, 89, 89, 88, 89],
      water: [79, 78, 78, 77, 78, 78, 79, 79, 78, 79],
      food: [81, 81, 82, 82, 82, 82, 82, 82, 83, 82],
      energy: [92, 94, 95, 93, 91, 94, 95, 96, 94, 95]
    };
    this.colonyHealth = 87;
    this.colonyHealthStatus = 'STABLE';
    this.lastSampleHour = -1;
  }
}
