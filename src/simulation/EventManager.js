/**
 * EventManager — Lightweight environmental event simulation for Ares-1 Mars Colony.
 * Handles Dust Storms, Solar Flares, Equipment Failures, Water Contamination,
 * Power Interruptions, and Micrometeoroid impacts.
 */
export class EventManager {
  constructor() {
    this.activeEvents = [];
    this.notifications = [];
    this.lastEventSol = 0;
    this.notificationCounter = 0;

    // Minimum Sols between spontaneous natural events
    this.minSolsBetweenEvents = 6;
  }

  /**
   * Ticks active events and checks for new events as Sols advance
   * @param {number} hour Current hour of Sol
   * @param {number} sol Current Sol count
   * @param {number} deltaSols Fraction of Sol elapsed
   */
  tick(hour, sol, deltaSols) {
    // 1. Progress active events
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
      const ev = this.activeEvents[i];
      ev.solsRemaining -= deltaSols;

      if (ev.solsRemaining <= 0) {
        // Event has concluded
        this.activeEvents.splice(i, 1);
        this.addNotification({
          type: 'RESOLVED',
          eventName: ev.name,
          title: `✓ ${ev.name} CLEARED`,
          message: ev.clearedMessage || `${ev.name} effects subsiding, operations returning to normal.`,
          severity: 'LOW',
          acknowledged: false,
          timestamp: `SOL ${String(sol).padStart(3, '0')}`
        });
      }
    }

    // 2. Check for spontaneous environmental event triggers
    // Only trigger once per Sol transition and ensure cooldown has elapsed
    if (hour < 0.2 && sol > this.lastEventSol + this.minSolsBetweenEvents) {
      this.checkSpontaneousTrigger(sol);
    }
  }

  /**
   * Probabilistic check to spawn a random event
   */
  checkSpontaneousTrigger(sol) {
    // 25% chance of an event per Sol once cooldown passes
    if (Math.random() < 0.25) {
      const eventTypes = [
        'DUST_STORM',
        'SOLAR_FLARE',
        'EQUIPMENT_FAILURE',
        'WATER_CONTAMINATION',
        'POWER_INTERRUPTION',
        'MICROMETEOROID_IMPACT'
      ];
      const selected = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      this.triggerEvent(selected, sol);
    }
  }

  /**
   * Triggers an environmental event by type
   * @param {string} type Event type key
   * @param {number} currentSol Sol of occurrence
   * @param {number} customDuration Optional duration in Sols
   */
  triggerEvent(type, currentSol = 1, customDuration = null) {
    // Check if same type is already running
    if (this.activeEvents.some(e => e.type === type)) return;

    let newEvent = null;

    switch (type) {
      case 'DUST_STORM':
        newEvent = {
          type: 'DUST_STORM',
          name: 'DUST STORM',
          severity: 'HIGH',
          description: 'Atmospheric dust obscuration: Solar generation reduced by 80%',
          clearedMessage: 'Dust storm cleared. Solar generation returning to normal.',
          durationSols: customDuration || 6,
          solsRemaining: customDuration || 6,
          modifiers: {
            solarMultiplier: 0.2,
            environment: {
              solarInput: '15%',
              dust: 'HEAVY',
              temp: '-78°C'
            }
          }
        };
        break;

      case 'SOLAR_FLARE':
        newEvent = {
          type: 'SOLAR_FLARE',
          name: 'SOLAR FLARE',
          severity: 'MODERATE',
          description: 'Coronal mass ejection: Radiation elevated, research & comms throttled',
          clearedMessage: 'Radiation levels returned to normal background baseline.',
          durationSols: customDuration || 3,
          solsRemaining: customDuration || 3,
          modifiers: {
            facilityEfficiencyMod: {
              research_lab: 0.5,
              central_hub: 0.7
            },
            environment: {
              radiation: 'ELEVATED'
            }
          }
        };
        break;

      case 'EQUIPMENT_FAILURE':
        newEvent = {
          type: 'EQUIPMENT_FAILURE',
          name: 'EQUIPMENT FAILURE',
          severity: 'MODERATE',
          description: 'Water extraction pump seal degraded: Output reduced by 60%',
          clearedMessage: 'Pump seal replaced by automated diagnostic routine.',
          durationSols: customDuration || 4,
          solsRemaining: customDuration || 4,
          modifiers: {
            facilityEfficiencyMod: {
              water: 0.4
            },
            facilityCondition: {
              water: 'DEGRADED PUMP'
            }
          }
        };
        break;

      case 'WATER_CONTAMINATION':
        newEvent = {
          type: 'WATER_CONTAMINATION',
          name: 'WATER CONTAMINATION',
          severity: 'HIGH',
          description: 'Subsurface perchlorate spike: Potable water output reduced by 50%',
          clearedMessage: 'Secondary filtration scrub complete, potable reserves pure.',
          durationSols: customDuration || 4,
          solsRemaining: customDuration || 4,
          modifiers: {
            waterOutputMultiplier: 0.5,
            facilityCondition: {
              water: 'FILTRATION PURGE'
            }
          }
        };
        break;

      case 'POWER_INTERRUPTION':
        newEvent = {
          type: 'POWER_INTERRUPTION',
          name: 'POWER INTERRUPTION',
          severity: 'MODERATE',
          description: 'Main bus transformer fault: Grid throughput throttled by 35%',
          clearedMessage: 'Transformer relay stabilized, full power delivery online.',
          durationSols: customDuration || 2.5,
          solsRemaining: customDuration || 2.5,
          modifiers: {
            energyOutputMultiplier: 0.65
          }
        };
        break;

      case 'MICROMETEOROID_IMPACT':
        newEvent = {
          type: 'MICROMETEOROID_IMPACT',
          name: 'MICROMETEOROID IMPACT',
          severity: 'LOW',
          description: 'Micrometeoroid strike on Storage Depot outer shielding',
          clearedMessage: 'Automated sealant patch applied to depot hull.',
          durationSols: customDuration || 3,
          solsRemaining: customDuration || 3,
          modifiers: {
            facilityCondition: {
              storage_depot: 'HULL PATCHING'
            },
            facilityEfficiencyMod: {
              storage_depot: 0.7
            }
          }
        };
        break;
    }

    if (newEvent) {
      this.activeEvents.push(newEvent);
      this.lastEventSol = currentSol;

      this.addNotification({
        type: 'ALERT',
        eventName: newEvent.name,
        title: `⚠ ${newEvent.name} DETECTED`,
        message: newEvent.description,
        severity: newEvent.severity,
        duration: `${newEvent.durationSols} Sols`,
        acknowledged: false,
        timestamp: `SOL ${String(currentSol).padStart(3, '0')}`
      });
    }
  }

  addNotification(notif) {
    notif.id = ++this.notificationCounter;
    // Keep up to 5 recent notifications
    this.notifications.unshift(notif);
    if (this.notifications.length > 5) {
      this.notifications.pop();
    }
  }

  acknowledgeNotification(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.acknowledged = true;
    }
  }

  dismissNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  /**
   * Consolidates all active event modifiers for FacilityManager & MonitoringManager
   */
  getModifiers() {
    const combined = {
      solarMultiplier: 1.0,
      energyOutputMultiplier: 1.0,
      waterOutputMultiplier: 1.0,
      facilityEfficiencyMod: {},
      facilityCondition: {},
      environment: {
        temp: '-63°C',
        pressure: '6.1 kPa',
        radiation: 'NORMAL',
        solarInput: '78%',
        dust: 'LOW'
      }
    };

    for (const ev of this.activeEvents) {
      const mods = ev.modifiers || {};
      if (mods.solarMultiplier !== undefined) {
        combined.solarMultiplier *= mods.solarMultiplier;
      }
      if (mods.energyOutputMultiplier !== undefined) {
        combined.energyOutputMultiplier *= mods.energyOutputMultiplier;
      }
      if (mods.waterOutputMultiplier !== undefined) {
        combined.waterOutputMultiplier *= mods.waterOutputMultiplier;
      }
      if (mods.facilityEfficiencyMod) {
        Object.assign(combined.facilityEfficiencyMod, mods.facilityEfficiencyMod);
      }
      if (mods.facilityCondition) {
        Object.assign(combined.facilityCondition, mods.facilityCondition);
      }
      if (mods.environment) {
        Object.assign(combined.environment, mods.environment);
      }
    }

    return combined;
  }

  /**
   * Returns snapshot for UI
   */
  getSnapshot() {
    return {
      activeEvents: this.activeEvents.map(e => ({
        type: e.type,
        name: e.name,
        severity: e.severity,
        description: e.description,
        solsRemaining: Math.ceil(e.solsRemaining)
      })),
      notifications: [...this.notifications]
    };
  }

  reset() {
    this.activeEvents = [];
    this.notifications = [];
    this.lastEventSol = 0;
  }
}
