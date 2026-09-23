import {
  RESOURCE_THRESHOLDS,
  RESOURCE_STATES,
  COLONY_STATUS_STATES,
  EMERGENCY_RESERVES
} from './ResourceConfig.js';

/**
 * ColonyState — Central single source of truth for Mars Colony resources and life support.
 * Manages pools for Oxygen, Water, Food, and Energy (Power).
 * All resource data lives in ONE central state.
 *
 * Prepared for future Java OOP backend porting (ColonyState.java).
 */
export class ColonyState {
  constructor(initialData = {}) {
    this.population = initialData.population || 12;
    this.maxPopulation = 20;

    // Core resource pools
    this.resources = {
      oxygen: {
        id: 'oxygen',
        name: 'OXYGEN',
        symbol: 'O₂',
        unit: 'kg',
        current: 890,
        max: 1000,
        productionRate: 14.0,  // kg / Sol
        consumptionRate: 12.0, // kg / Sol
        warningThreshold: RESOURCE_THRESHOLDS.LOW,
        reserve: EMERGENCY_RESERVES.oxygen
      },
      water: {
        id: 'water',
        name: 'WATER',
        symbol: 'H₂O',
        unit: 'L',
        current: 790,
        max: 1000,
        productionRate: 40.0,  // L / Sol
        consumptionRate: 29.0, // L / Sol
        warningThreshold: RESOURCE_THRESHOLDS.LOW,
        reserve: EMERGENCY_RESERVES.water
      },
      food: {
        id: 'food',
        name: 'FOOD',
        symbol: 'FOOD',
        unit: 'kg',
        current: 820,
        max: 1000,
        productionRate: 15.0,  // kg / Sol
        consumptionRate: 10.0, // kg / Sol
        warningThreshold: RESOURCE_THRESHOLDS.LOW,
        reserve: EMERGENCY_RESERVES.food
      },
      energy: {
        id: 'energy',
        name: 'ENERGY',
        symbol: 'PWR',
        unit: 'kW',
        current: 475,
        max: 500,
        productionRate: 77.0,  // kW peak / Sol
        consumptionRate: 35.0, // kW load
        warningThreshold: RESOURCE_THRESHOLDS.LOW,
        reserve: EMERGENCY_RESERVES.energy
      }
    };

    // Alias power -> energy for seamless backward compatibility
    Object.defineProperty(this.resources, 'power', {
      get: () => this.resources.energy,
      set: (val) => { this.resources.energy = val; },
      enumerable: false
    });

    // Overall colony condition state
    this.status = COLONY_STATUS_STATES.STABLE;
    this.bottleneckResource = null;
  }

  /**
   * Applies delta to a specific resource, safely clamping between 0 and max
   * @param {string} resourceId 'oxygen' | 'water' | 'food' | 'energy' | 'power'
   * @param {number} deltaAmount 
   */
  applyDelta(resourceId, deltaAmount) {
    const key = resourceId === 'power' ? 'energy' : resourceId;
    const res = this.resources[key];
    if (!res) return;

    res.current = Math.max(0, Math.min(res.max, res.current + deltaAmount));
  }

  /**
   * Sets the latest calculated rates for telemetry display
   */
  setRates(resourceId, productionRate, consumptionRate) {
    const key = resourceId === 'power' ? 'energy' : resourceId;
    const res = this.resources[key];
    if (!res) return;
    res.productionRate = productionRate;
    res.consumptionRate = consumptionRate;
  }

  /**
   * Recalculates overall colony status from resource percentages
   */
  updateColonyStatus() {
    const res = this.resources;
    const o2Pct = (res.oxygen.current / res.oxygen.max) * 100;
    const waterPct = (res.water.current / res.water.max) * 100;
    const foodPct = (res.food.current / res.food.max) * 100;
    const energyPct = (res.energy.current / res.energy.max) * 100;

    const pcts = [
      { key: 'oxygen', pct: o2Pct },
      { key: 'water', pct: waterPct },
      { key: 'food', pct: foodPct },
      { key: 'energy', pct: energyPct }
    ];

    const minItem = pcts.reduce((prev, curr) => curr.pct < prev.pct ? curr : prev, pcts[0]);
    const emergencyItems = pcts.filter(p => p.pct < RESOURCE_THRESHOLDS.CRITICAL);

    if (minItem.pct < RESOURCE_THRESHOLDS.CRITICAL || o2Pct < RESOURCE_THRESHOLDS.CRITICAL) {
      this.status = COLONY_STATUS_STATES.SURVIVAL_EMERGENCY;
      this.bottleneckResource = minItem.key;
    } else if (minItem.pct < RESOURCE_THRESHOLDS.LOW) {
      this.status = COLONY_STATUS_STATES.CRITICAL;
      this.bottleneckResource = minItem.key;
    } else if (minItem.pct < RESOURCE_THRESHOLDS.NORMAL_MIN) {
      this.status = COLONY_STATUS_STATES.RESOURCE_CONSTRAINED;
      this.bottleneckResource = minItem.key;
    } else {
      this.status = COLONY_STATUS_STATES.STABLE;
      this.bottleneckResource = null;
    }
  }

  /**
   * Helper to derive resource state string
   */
  _deriveState(pct) {
    if (pct > RESOURCE_THRESHOLDS.ABUNDANT) return RESOURCE_STATES.ABUNDANT;
    if (pct >= RESOURCE_THRESHOLDS.NORMAL_MIN) return RESOURCE_STATES.NORMAL;
    if (pct >= RESOURCE_THRESHOLDS.LOW) return RESOURCE_STATES.LOW;
    if (pct >= RESOURCE_THRESHOLDS.CRITICAL) return RESOURCE_STATES.CRITICAL;
    return RESOURCE_STATES.EMERGENCY;
  }

  /**
   * Builds summary item for a resource
   */
  _buildResourceSummary(res) {
    const net = Number((res.productionRate - res.consumptionRate).toFixed(1));
    const trend = net > 0.1 ? '↑' : (net < -0.1 ? '↓' : '→');
    const percent = Math.round((res.current / res.max) * 100);
    const state = this._deriveState(percent);

    return {
      id: res.id,
      name: res.name,
      symbol: res.symbol,
      current: Math.round(res.current),
      max: res.max,
      percent,
      state,
      reserve: res.reserve || EMERGENCY_RESERVES[res.id] || 0,
      productionRate: res.productionRate,
      consumptionRate: res.consumptionRate,
      netRate: net,
      trend,
      unit: res.unit,
      isWarning: percent <= res.warningThreshold,
      isConservationActive: state === RESOURCE_STATES.LOW || state === RESOURCE_STATES.CRITICAL || state === RESOURCE_STATES.EMERGENCY,
      isAbundant: state === RESOURCE_STATES.ABUNDANT
    };
  }

  /**
   * Returns snapshot of colony resource summary for UI HUD
   */
  getSummary() {
    const res = this.resources;
    const oxygenSummary = this._buildResourceSummary(res.oxygen);
    const waterSummary = this._buildResourceSummary(res.water);
    const foodSummary = this._buildResourceSummary(res.food);
    const energySummary = this._buildResourceSummary(res.energy);

    return {
      population: this.population,
      maxPopulation: this.maxPopulation,
      status: this.status,
      bottleneckResource: this.bottleneckResource,
      oxygen: oxygenSummary,
      water: waterSummary,
      food: foodSummary,
      energy: energySummary,
      power: energySummary // backward compatible alias
    };
  }

  reset() {
    this.resources.oxygen.current = 890;
    this.resources.water.current = 790;
    this.resources.food.current = 820;
    this.resources.energy.current = 475;
    this.status = COLONY_STATUS_STATES.STABLE;
    this.bottleneckResource = null;
  }
}
