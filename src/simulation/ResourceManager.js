import {
  RESOURCE_THRESHOLDS,
  RESOURCE_STATES,
  COLONY_STATUS_STATES,
  EMERGENCY_RESERVES
} from './ResourceConfig.js';

/**
 * ResourceManager — Coordinates resource transactions, balances, storage clamping,
 * resource states (ABUNDANT, NORMAL, LOW, CRITICAL, EMERGENCY), emergency reserves,
 * and Sol-by-Sol historical logging.
 *
 * Prepared for future Java OOP backend porting (ResourceManager.java).
 */
export class ResourceManager {
  constructor(colonyState) {
    this.colonyState = colonyState;

    // Rolling historical record of resource performance per Sol
    // Each resource stores { sol, current, production, consumption, net }
    this.history = {
      oxygen: [],
      water: [],
      food: [],
      energy: []
    };

    this.lastRecordedSol = 0;
    this.maxHistoryLength = 20;

    // Initialize initial history points
    this.recordHistory(1);
  }

  /**
   * Evaluates the current state of a resource based on its stored percentage
   * @param {string} resourceKey 'oxygen' | 'water' | 'food' | 'energy'
   * @returns {string} 'ABUNDANT' | 'NORMAL' | 'LOW' | 'CRITICAL' | 'EMERGENCY'
   */
  getResourceState(resourceKey) {
    const key = resourceKey === 'power' ? 'energy' : resourceKey;
    const res = this.colonyState.resources[key];
    if (!res) return RESOURCE_STATES.NORMAL;

    const pct = (res.current / res.max) * 100;

    if (pct > RESOURCE_THRESHOLDS.ABUNDANT) {
      return RESOURCE_STATES.ABUNDANT;
    } else if (pct >= RESOURCE_THRESHOLDS.NORMAL_MIN) {
      return RESOURCE_STATES.NORMAL;
    } else if (pct >= RESOURCE_THRESHOLDS.LOW) {
      return RESOURCE_STATES.LOW;
    } else if (pct >= RESOURCE_THRESHOLDS.CRITICAL) {
      return RESOURCE_STATES.CRITICAL;
    } else {
      return RESOURCE_STATES.EMERGENCY;
    }
  }

  /**
   * Returns snapshot of all 4 resource states
   */
  getAllResourceStates() {
    return {
      oxygen: this.getResourceState('oxygen'),
      water: this.getResourceState('water'),
      food: this.getResourceState('food'),
      energy: this.getResourceState('energy')
    };
  }

  /**
   * Calculates overall availability factors [0.0 - 1.0] for dependent systems
   */
  getAvailabilityFactors() {
    const res = this.colonyState.resources;

    const energyPct = (res.energy.current / res.energy.max) * 100;
    let energyAvail = 1.0;
    if (res.energy.current <= 0) {
      energyAvail = 0.0;
    } else if (energyPct < RESOURCE_THRESHOLDS.CRITICAL) {
      energyAvail = Math.max(0.15, energyPct / RESOURCE_THRESHOLDS.CRITICAL);
    } else if (energyPct < RESOURCE_THRESHOLDS.NORMAL_MIN) {
      energyAvail = 0.75;
    }

    const waterPct = (res.water.current / res.water.max) * 100;
    let waterAvail = 1.0;
    if (res.water.current <= 0) {
      waterAvail = 0.05;
    } else if (waterPct < RESOURCE_THRESHOLDS.CRITICAL) {
      waterAvail = Math.max(0.1, waterPct / RESOURCE_THRESHOLDS.CRITICAL);
    } else if (waterPct < RESOURCE_THRESHOLDS.NORMAL_MIN) {
      waterAvail = 0.75;
    }

    const o2Pct = (res.oxygen.current / res.oxygen.max) * 100;
    let oxygenAvail = 1.0;
    if (res.oxygen.current <= 0) {
      oxygenAvail = 0.0;
    } else if (o2Pct < RESOURCE_THRESHOLDS.CRITICAL) {
      oxygenAvail = Math.max(0.2, o2Pct / RESOURCE_THRESHOLDS.CRITICAL);
    }

    const foodPct = (res.food.current / res.food.max) * 100;
    let foodAvail = 1.0;
    if (res.food.current <= 0) {
      foodAvail = 0.0;
    } else if (foodPct < RESOURCE_THRESHOLDS.CRITICAL) {
      foodAvail = Math.max(0.25, foodPct / RESOURCE_THRESHOLDS.CRITICAL);
    }

    return {
      energy: energyAvail,
      water: waterAvail,
      oxygen: oxygenAvail,
      food: foodAvail
    };
  }

  /**
   * Applies production and consumption totals for a time delta, clamps storage,
   * updates flow rates, and checks status thresholds.
   *
   * @param {Object} totals { production: { oxygen, water, food, energy }, consumption: { oxygen, water, food, energy } }
   * @param {number} deltaSols Fraction of Sol elapsed (e.g. deltaHours / 24.0)
   * @param {number} currentSol Integer Sol count
   */
  processStep(totals, deltaSols, currentSol = 1) {
    const resourceKeys = ['oxygen', 'water', 'food', 'energy'];

    resourceKeys.forEach(key => {
      const prodPerSol = totals.production[key] || 0;
      const consPerSol = totals.consumption[key] || 0;

      // Net change over this delta
      const deltaAmount = (prodPerSol - consPerSol) * deltaSols;
      this.colonyState.applyDelta(key, deltaAmount);

      // Record rates for HUD & telemetry
      this.colonyState.setRates(key, Number(prodPerSol.toFixed(1)), Number(consPerSol.toFixed(1)));
    });

    // Update overall colony condition status based on updated percentages
    this.updateColonyStatus();

    // Record historical entry once per Sol transition (or initial)
    if (currentSol !== this.lastRecordedSol) {
      this.recordHistory(currentSol);
      this.lastRecordedSol = currentSol;
    }
  }

  /**
   * Records Sol-by-Sol history snapshot
   */
  recordHistory(sol) {
    const res = this.colonyState.resources;
    const keys = ['oxygen', 'water', 'food', 'energy'];

    keys.forEach(key => {
      const r = res[key];
      const entry = {
        sol,
        current: Math.round(r.current),
        max: r.max,
        percent: Math.round((r.current / r.max) * 100),
        production: Number(r.productionRate.toFixed(1)),
        consumption: Number(r.consumptionRate.toFixed(1)),
        net: Number((r.productionRate - r.consumptionRate).toFixed(1))
      };

      this.history[key].push(entry);
      if (this.history[key].length > this.maxHistoryLength) {
        this.history[key].shift();
      }
    });
  }

  /**
   * Evaluates overall colony status from resource conditions
   */
  updateColonyStatus() {
    const states = this.getAllResourceStates();
    const stateValues = Object.values(states);

    // Identify if any resource is in EMERGENCY or CRITICAL
    const hasEmergency = stateValues.includes(RESOURCE_STATES.EMERGENCY);
    const hasCritical = stateValues.includes(RESOURCE_STATES.CRITICAL);
    const hasLow = stateValues.includes(RESOURCE_STATES.LOW);

    // Find bottleneck resource
    let bottleneck = null;
    if (hasEmergency) {
      bottleneck = Object.keys(states).find(k => states[k] === RESOURCE_STATES.EMERGENCY);
      this.colonyState.status = COLONY_STATUS_STATES.SURVIVAL_EMERGENCY;
    } else if (hasCritical) {
      bottleneck = Object.keys(states).find(k => states[k] === RESOURCE_STATES.CRITICAL);
      this.colonyState.status = COLONY_STATUS_STATES.CRITICAL;
    } else if (hasLow) {
      bottleneck = Object.keys(states).find(k => states[k] === RESOURCE_STATES.LOW);
      this.colonyState.status = COLONY_STATUS_STATES.RESOURCE_CONSTRAINED;
    } else {
      this.colonyState.status = COLONY_STATUS_STATES.STABLE;
    }

    this.colonyState.bottleneckResource = bottleneck;
  }

  /**
   * Returns complete telemetry profile for a given resource
   */
  getResourceTelemetry(resourceKey) {
    const key = resourceKey === 'power' ? 'energy' : resourceKey;
    const r = this.colonyState.resources[key];
    const state = this.getResourceState(key);
    const reserve = EMERGENCY_RESERVES[key] || 0;
    const net = Number((r.productionRate - r.consumptionRate).toFixed(1));
    const percent = Math.round((r.current / r.max) * 100);

    return {
      id: key,
      name: r.name,
      symbol: r.symbol,
      unit: r.unit,
      current: Math.round(r.current),
      max: r.max,
      percent,
      state,
      reserve,
      productionRate: r.productionRate,
      consumptionRate: r.consumptionRate,
      netRate: net,
      trend: net > 0.1 ? '↑' : (net < -0.1 ? '↓' : '→'),
      isConservationActive: state === RESOURCE_STATES.LOW || state === RESOURCE_STATES.CRITICAL || state === RESOURCE_STATES.EMERGENCY,
      isEmergencyActive: state === RESOURCE_STATES.EMERGENCY,
      isAbundant: state === RESOURCE_STATES.ABUNDANT,
      history: this.history[key] || []
    };
  }

  syncFromBackendHistory(backendHistory) {
    if (!backendHistory || !Array.isArray(backendHistory) || backendHistory.length === 0) return;
    const res = this.colonyState.resources;
    const keyMap = { oxygen: 'oxygen', water: 'water', food: 'food', energy: 'power' };

    Object.keys(this.history).forEach(k => {
      this.history[k] = [];
    });

    backendHistory.forEach(hp => {
      Object.keys(keyMap).forEach(k => {
        const bKey = keyMap[k];
        const val = hp[bKey] !== undefined ? hp[bKey] : 0;
        const r = res[k] || { max: 1000, productionRate: 0, consumptionRate: 0 };
        this.history[k].push({
          sol: hp.sol,
          current: Math.round(val),
          max: r.max,
          percent: Math.round((val / r.max) * 100),
          production: Number((r.productionRate || 0).toFixed(1)),
          consumption: Number((r.consumptionRate || 0).toFixed(1)),
          net: Number(((r.productionRate || 0) - (r.consumptionRate || 0)).toFixed(1))
        });
        if (this.history[k].length > this.maxHistoryLength) {
          this.history[k].shift();
        }
      });
    });
  }

  reset() {
    this.history = {
      oxygen: [],
      water: [],
      food: [],
      energy: []
    };
    this.lastRecordedSol = 0;
    this.recordHistory(1);
  }
}
