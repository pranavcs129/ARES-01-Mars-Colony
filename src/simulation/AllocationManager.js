import {
  RESOURCE_STATES,
  FACILITY_BASE_PRIORITIES,
  THROTTLING_LEVELS
} from './ResourceConfig.js';

/**
 * AllocationManager — Deterministic, priority-based resource distribution engine.
 * Distributes available Energy, Water, and other resources to facilities based on
 * priority hierarchy (Life Support > Survival Infra > Food > Science > Logistics),
 * current resource abundance/scarcity states, and manual prioritization.
 *
 * Prepared for future Java OOP backend porting (ResourceAllocationManager.java).
 */
export class AllocationManager {
  constructor() {
    this.basePriorities = { ...FACILITY_BASE_PRIORITIES };
    this.manualPriorities = new Set(); // Set of facility IDs that have manual prioritization enabled
    this.sectorLevels = {
      lifesupport: 1.0,
      water: 1.0,
      greenhouse: 1.0,
      research: 1.0,
      logistics: 1.0
    };
  }

  getFacilitySector(facilityId) {
    if (facilityId === 'habitat' || facilityId === 'oxygen' || facilityId === 'central_hub') return 'lifesupport';
    if (facilityId === 'water') return 'water';
    if (facilityId === 'greenhouse') return 'greenhouse';
    if (facilityId === 'research_lab') return 'research';
    if (facilityId === 'mining' || facilityId === 'rocket' || facilityId === 'storage_depot') return 'logistics';
    return 'other';
  }

  setSectorLevel(sectorKey, level) {
    if (sectorKey === 'lifesupport') return 1.0; // Life Support permanently protected
    const clamped = Math.max(0.0, Math.min(1.0, Math.round(level * 4) / 4));
    this.sectorLevels[sectorKey] = clamped;
    return clamped;
  }

  stepSectorLevel(sectorKey, delta) {
    if (sectorKey === 'lifesupport') return 1.0;
    const cur = this.sectorLevels[sectorKey] ?? 1.0;
    return this.setSectorLevel(sectorKey, cur + (delta * 0.25));
  }

  getSectorLevel(sectorKey) {
    if (sectorKey === 'lifesupport') return 1.0;
    return this.sectorLevels[sectorKey] ?? 1.0;
  }

  resetSectorLevels() {
    this.sectorLevels = {
      lifesupport: 1.0,
      water: 1.0,
      greenhouse: 1.0,
      research: 1.0,
      logistics: 1.0
    };
  }

  /**
   * Toggles manual priority for a facility.
   * Priority 1 (Life Support) is already maximum and cannot be overridden.
   * Other facilities can be boosted to Priority 2 (Science/Infra) or Priority 3 (Logistics).
   * @param {string} facilityId
   * @returns {boolean} New prioritized status
   */
  toggleManualPriority(facilityId) {
    if (this.basePriorities[facilityId] === 1) {
      // Life support is already permanently at Priority 1
      return false;
    }

    if (this.manualPriorities.has(facilityId)) {
      this.manualPriorities.delete(facilityId);
      return false;
    } else {
      this.manualPriorities.add(facilityId);
      return true;
    }
  }

  isPrioritized(facilityId) {
    return this.manualPriorities.has(facilityId);
  }

  /**
   * Returns effective priority level (1 = highest, 5 = lowest).
   * Manual priority elevates non-essential facilities without ever surpassing Life Support (1).
   */
  getEffectivePriority(facilityId) {
    const base = this.basePriorities[facilityId] || 4;
    if (base === 1) return 1; // Life support always Priority 1

    if (this.manualPriorities.has(facilityId)) {
      // Elevate priority: 4 or 5 -> 2; 3 -> 2
      return 2;
    }
    return base;
  }

  /**
   * Calculates operating levels [0.0 - 1.0] for all facilities based on
   * current resource availability, storage states, and priorities.
   * 
   * @param {Object} resourceStates { oxygen: 'NORMAL', water: 'NORMAL', food: 'NORMAL', energy: 'NORMAL' }
   * @param {Object} resourcePools ColonyState.resources
   * @param {Object} eventModifiers Modifiers from EventManager
   * @returns {Object} { [facilityId]: { operatingLevel, effectivePriority, statusText, isPrioritized } }
   */
  calculateAllocations(resourceStates, resourcePools, eventModifiers = {}) {
    const allocations = {};
    const energyState = resourceStates.energy || resourceStates.power || RESOURCE_STATES.NORMAL;
    const waterState = resourceStates.water || RESOURCE_STATES.NORMAL;

    // Facility IDs to evaluate
    const facilityIds = Object.keys(this.basePriorities);

    for (const id of facilityIds) {
      const priority = this.getEffectivePriority(id);
      const isManual = this.manualPriorities.has(id);

      // Baseline operating level
      let energyFactor = THROTTLING_LEVELS.FULL;
      let waterFactor = THROTTLING_LEVELS.FULL;

      // 1. ENERGY / POWER CONSERVATION & ALLOCATION
      if (energyState === RESOURCE_STATES.ABUNDANT || energyState === RESOURCE_STATES.NORMAL) {
        // Normal & Abundant: 100% full operations
        energyFactor = THROTTLING_LEVELS.FULL;
      } else if (energyState === RESOURCE_STATES.LOW) {
        // Resource Conservation Mode:
        // Priority 1 (Life Support): 100%
        // Priority 2 (Survival Infra / Prioritized): 100%
        // Priority 3 (Food): 75%
        // Priority 4 (Science): 50%
        // Priority 5 (Logistics): 25%
        if (priority <= 2) {
          energyFactor = THROTTLING_LEVELS.FULL;
        } else if (priority === 3) {
          energyFactor = THROTTLING_LEVELS.CONSERVING;
        } else if (priority === 4) {
          energyFactor = THROTTLING_LEVELS.HALF;
        } else {
          energyFactor = THROTTLING_LEVELS.MINIMAL;
        }
      } else if (energyState === RESOURCE_STATES.CRITICAL) {
        // Critical Conservation Mode:
        // Priority 1 (Life Support): 100%
        // Priority 2 (Survival Infra / Prioritized): 75% - 100%
        // Priority 3 (Food): 50%
        // Priority 4 (Science): 0% (Paused)
        // Priority 5 (Logistics): 0% (Paused)
        if (priority === 1) {
          energyFactor = THROTTLING_LEVELS.FULL;
        } else if (priority === 2) {
          energyFactor = THROTTLING_LEVELS.CONSERVING;
        } else if (priority === 3) {
          energyFactor = THROTTLING_LEVELS.HALF;
        } else {
          energyFactor = THROTTLING_LEVELS.OFFLINE;
        }
      } else if (energyState === RESOURCE_STATES.EMERGENCY) {
        // Survival Emergency:
        // Priority 1 only! Everything else offline
        if (priority === 1) {
          energyFactor = THROTTLING_LEVELS.FULL;
        } else if (priority === 2 && id === 'water') {
          energyFactor = THROTTLING_LEVELS.MINIMAL; // trickle extraction if possible
        } else {
          energyFactor = THROTTLING_LEVELS.OFFLINE;
        }
      }

      // 2. WATER CONSERVATION & ALLOCATION
      // Affects water-consuming facilities: Habitat (P1), Greenhouse (P3), Research Lab (P4)
      if (id === 'habitat') {
        // Life support water is strictly protected
        waterFactor = THROTTLING_LEVELS.FULL;
      } else if (id === 'greenhouse') {
        if (waterState === RESOURCE_STATES.ABUNDANT || waterState === RESOURCE_STATES.NORMAL) {
          waterFactor = THROTTLING_LEVELS.FULL;
        } else if (waterState === RESOURCE_STATES.LOW) {
          waterFactor = isManual ? THROTTLING_LEVELS.CONSERVING : THROTTLING_LEVELS.HALF;
        } else if (waterState === RESOURCE_STATES.CRITICAL) {
          waterFactor = THROTTLING_LEVELS.MINIMAL;
        } else if (waterState === RESOURCE_STATES.EMERGENCY) {
          waterFactor = THROTTLING_LEVELS.OFFLINE;
        }
      } else if (id === 'research_lab') {
        if (waterState === RESOURCE_STATES.ABUNDANT || waterState === RESOURCE_STATES.NORMAL) {
          waterFactor = THROTTLING_LEVELS.FULL;
        } else if (waterState === RESOURCE_STATES.LOW) {
          waterFactor = isManual ? THROTTLING_LEVELS.FULL : THROTTLING_LEVELS.HALF;
        } else {
          waterFactor = THROTTLING_LEVELS.OFFLINE;
        }
      }

      // 3. Composite Operating Level
      // A facility's operating level is bounded by its lowest allocated input resource factor and user sector settings
      const sector = this.getFacilitySector(id);
      const userLevel = this.sectorLevels[sector] !== undefined ? this.sectorLevels[sector] : 1.0;

      let operatingLevel = Math.min(energyFactor, waterFactor, userLevel);
      if (this.basePriorities[id] === 1) {
        operatingLevel = 1.0; // Life Support permanently protected
      }

      // Determine human-readable status text
      let statusText = 'NORMAL (100%)';
      if (this.basePriorities[id] === 1) {
        statusText = 'PROTECTED';
      } else if (operatingLevel === 0) {
        statusText = 'PAUSED';
      } else if (operatingLevel <= 0.25) {
        statusText = 'REDUCED (25%)';
      } else if (operatingLevel <= 0.5) {
        statusText = 'REDUCED (50%)';
      } else if (operatingLevel <= 0.75) {
        statusText = 'REDUCED (75%)';
      } else if (isManual) {
        statusText = 'PRIORITIZED (100%)';
      }

      allocations[id] = {
        operatingLevel,
        effectivePriority: priority,
        basePriority: this.basePriorities[id],
        isPrioritized: isManual,
        statusText
      };
    }

    return allocations;
  }
}
