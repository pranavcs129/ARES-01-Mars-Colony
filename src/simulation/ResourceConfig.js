/**
 * ResourceConfig.js — Centralized configuration for the Mars Colony Resource Management System.
 * Clean, decoupled configuration designed for straightforward Java OOP porting.
 */

export const RESOURCE_THRESHOLDS = {
  ABUNDANT: 80, // > 80%
  NORMAL_MIN: 50, // 50% - 80%
  LOW: 25, // 25% - 50%
  CRITICAL: 10, // 10% - 25%
  EMERGENCY: 10 // < 10%
};

export const RESOURCE_STATES = {
  ABUNDANT: 'ABUNDANT',
  NORMAL: 'NORMAL',
  LOW: 'LOW',
  CRITICAL: 'CRITICAL',
  EMERGENCY: 'EMERGENCY'
};

export const COLONY_STATUS_STATES = {
  STABLE: 'STABLE',
  RESOURCE_CONSTRAINED: 'RESOURCE CONSTRAINED',
  CRITICAL: 'CRITICAL',
  SURVIVAL_EMERGENCY: 'SURVIVAL EMERGENCY'
};

export const EMERGENCY_RESERVES = {
  oxygen: 200, // kg (~20% of 1000 kg max)
  water: 200,  // L (~20% of 1000 L max)
  food: 200,   // kg (~20% of 1000 kg max)
  energy: 75   // kW (~15% of 500 kW max)
};

export const FACILITY_BASE_PRIORITIES = {
  // PRIORITY 1: LIFE SUPPORT (Essential survival)
  habitat: 1,
  oxygen: 1, // MOXIE

  // PRIORITY 2: SURVIVAL INFRASTRUCTURE
  water: 2,   // Water extraction
  power: 2,   // Nuclear power station
  solar: 2,   // Solar array
  battery: 2, // Power grid buffer

  // PRIORITY 3: FOOD PRODUCTION
  greenhouse: 3, // Bio-dome agriculture

  // PRIORITY 4: SCIENCE & COMMUNICATIONS
  research_lab: 4, // Research laboratory
  central_hub: 4,  // Command core

  // PRIORITY 5: LOGISTICS & NON-ESSENTIAL
  rocket: 5,        // Landing / launch zone
  mining: 5,        // Regolith mining auger
  storage_depot: 5  // Automated depot
};

export const THROTTLING_LEVELS = {
  FULL: 1.0,        // 100% - Normal operations
  CONSERVING: 0.75, // 75%  - Mild throttling
  HALF: 0.50,       // 50%  - Moderate throttling
  MINIMAL: 0.25,    // 25%  - Critical standby
  OFFLINE: 0.0      // 0%   - Paused / Shutdown
};
