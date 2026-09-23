/**
 * RecoveryManager — Coordinates disaster mitigation, resource shortage management,
 * facility allocation reductions, and gradual resource recovery.
 *
 * Core Flow:
 * WHAT HAPPENED?
 * → WHAT RESOURCE IS SHORT?
 * → WHERE IS THE RESOURCE BEING USED?
 * → WHAT CAN WE REDUCE?
 * → HOW MUCH DO WE SAVE?
 * → HOW DO WE RECOVER THE SHORTAGE?
 * → IS THE COLONY STABLE AGAIN?
 */

export class RecoveryManager {
  constructor(simulationManager) {
    this.sim = simulationManager;

    // Action States
    this.backupActive = false;
    this.reserveDrawn = {
      energy: 0,
      water: 0,
      oxygen: 0,
      food: 0
    };
    this.lastReserveDrawSol = 0;

    // Repair Sequence
    this.repairActive = false;
    this.repairProgress = 0; // 0 to 100%
    this.repairRatePerSol = 50.0; // Restores 50% per Sol (~2 Sols to complete repair)
  }

  /**
   * Action 1: USE EMERGENCY RESERVE
   * Transfers buffer from reserve into active storage pool
   */
  useEmergencyReserve(resourceKey = 'energy') {
    const key = resourceKey === 'power' ? 'energy' : resourceKey;
    const res = this.sim.colonyState.resources[key];
    if (!res) return { success: false, reason: 'Invalid resource' };

    const drawAmount = key === 'energy' ? 50.0 : (key === 'water' ? 40.0 : 20.0);
    
    // Transfer from reserve to current pool
    res.current = Math.min(res.max, res.current + drawAmount);
    this.reserveDrawn[key] = (this.reserveDrawn[key] || 0) + drawAmount;
    this.lastReserveDrawSol = this.sim.sol;

    this.sim.resourceManager.updateColonyStatus();
    this.sim.notifyListeners();

    return {
      success: true,
      amount: drawAmount,
      resource: key
    };
  }

  /**
   * Action 2: ACTIVATE BACKUP POWER
   * Toggles auxiliary generator (+25 kW/Sol)
   */
  toggleBackupPower() {
    this.backupActive = !this.backupActive;
    this.sim.notifyListeners();
    return this.backupActive;
  }

  /**
   * Action 3: REDUCE RESOURCE USE (Quick preset toggle)
   * Drops Research to 25%, Logistics to 0%, Greenhouse to 75%
   */
  toggleConservation() {
    const isCurrentlyConserving = this.sim.allocationManager.getSectorLevel('research') <= 0.5;
    if (isCurrentlyConserving) {
      // Restore to 100%
      this.sim.allocationManager.setSectorLevel('research', 1.0);
      this.sim.allocationManager.setSectorLevel('greenhouse', 1.0);
      this.sim.allocationManager.setSectorLevel('logistics', 1.0);
      this.sim.allocationManager.setSectorLevel('water', 1.0);
    } else {
      // Apply recommended reductions
      this.sim.allocationManager.setSectorLevel('research', 0.25);
      this.sim.allocationManager.setSectorLevel('greenhouse', 0.75);
      this.sim.allocationManager.setSectorLevel('logistics', 0.0);
    }
    this.sim.notifyListeners();
    return !isCurrentlyConserving;
  }

  /**
   * Action 4: START REPAIR
   * Dispatches drone crew to repair damaged facilities over Sols
   */
  startRepair() {
    if (this.repairActive && this.repairProgress >= 100) {
      this.repairProgress = 0;
    }
    this.repairActive = true;
    this.sim.notifyListeners();
    return true;
  }

  /**
   * Advances repair progress and recovery ticks
   */
  tick(hour, sol, deltaSols, deltaHours) {
    if (this.repairActive && this.repairProgress < 100) {
      this.repairProgress = Math.min(100, this.repairProgress + (this.repairRatePerSol * deltaSols));

      // When repair hits 100%, complete the repair and resolve disaster
      if (this.repairProgress >= 100) {
        this.onRepairCompleted(sol);
      }
    }

    const activeEvents = this.sim.eventManager.activeEvents || [];
    if (activeEvents.length === 0 && this.repairProgress >= 100) {
      this.repairActive = false;
      this.repairProgress = 0;
    }
  }

  /**
   * Triggered when repair drones finish 100% repairs
   */
  onRepairCompleted(sol) {
    const activeEvents = this.sim.eventManager.activeEvents;
    if (activeEvents.length > 0) {
      const ev = activeEvents[0];
      this.sim.eventManager.activeEvents.splice(0, 1);
      this.sim.eventManager.addNotification({
        type: 'RESOLVED',
        eventName: ev.name,
        title: `✓ ${ev.name} REPAIRED`,
        message: `Engineering drone repairs completed at 100%. Solar & facility generation restored.`,
        severity: 'LOW',
        acknowledged: false,
        timestamp: `SOL ${String(sol).padStart(3, '0')}`
      });
    }

    const facs = this.sim.facilityManager.facilities;
    Object.values(facs).forEach(f => {
      f.efficiency = 100;
      f.condition = 'OPTIMAL';
      f.conditionScore = 100;
    });

    this.sim.resourceManager.updateColonyStatus();
  }

  /**
   * Generates comprehensive management state for the UI
   */
  getRecoveryState() {
    const javaEvents = this.sim.backendData?.activeEvents || [];
    const localEvents = this.sim.eventManager.activeEvents || [];
    const hasDisaster = javaEvents.length > 0 || localEvents.length > 0;
    const activeEvent = javaEvents.length > 0 ? javaEvents[0] : (localEvents.length > 0 ? localEvents[0] : null);

    const colony = this.sim.colonyState.resources;
    const allocMgr = this.sim.allocationManager;
    const sectorLevels = allocMgr.sectorLevels;

    // 1. ACTIVE PROBLEM
    let activeEventInfo = null;
    let resourceEffectText = 'All generation nominal.';

    const effectiveEvent = activeEvent;
    const isJavaEvent = javaEvents.length > 0;

    if (effectiveEvent) {
      const rem = isJavaEvent 
        ? Math.max(0.1, Number((effectiveEvent.durationRemaining || 2.0).toFixed(1)))
        : Math.max(0.1, Number(effectiveEvent.solsRemaining.toFixed(1)));
      let explanation = effectiveEvent.description || 'Solar power generation has been greatly reduced.';
      let generationDrop = '120 kW → 18 kW';
      const evName = (effectiveEvent.name || '').toUpperCase();
      
      if (evName.includes('DUST') || evName.includes('STORM')) {
        explanation = effectiveEvent.description || 'Severe Martian dust storm blocks sunlight. Solar power generation drops by 85%.';
        resourceEffectText = 'Power generation −85%';
        generationDrop = '120 kW → 18 kW';
      } else if (evName.includes('EQUIPMENT') || evName.includes('PUMP')) {
        explanation = effectiveEvent.description || 'Water extraction pump failure: Extraction output reduced.';
        resourceEffectText = 'Water generation −60%';
        generationDrop = '40 L → 16 L';
      } else if (evName.includes('POWER') || evName.includes('INTERRUPTION')) {
        explanation = effectiveEvent.description || 'Main grid transformer fault: Power delivery reduced.';
        resourceEffectText = 'Power generation −35%';
        generationDrop = '120 kW → 78 kW';
      }

      activeEventInfo = {
        name: effectiveEvent.name.toUpperCase(),
        severity: effectiveEvent.severity || 'HIGH',
        duration: `${rem} ${rem === 1 ? 'SOL' : 'SOLS'} REMAINING`,
        solsRemaining: rem,
        explanation,
        generationDrop,
        resourceEffect: resourceEffectText,
        resourceEffectText
      };
    } else {
      activeEventInfo = {
        name: 'NORMAL OPERATIONS',
        severity: 'NOMINAL',
        duration: 'CLEAR CONDITIONS',
        solsRemaining: 0,
        explanation: 'All major systems are operating normally. No active shortages detected.',
        generationDrop: '120 kW (Nominal)',
        resourceEffect: 'No active resource loss',
        resourceEffectText: 'No active resource loss'
      };
    }

    // 2. SHORTAGE METRICS & "HOW TO MANAGE"
    // Determine bottleneck resource: Power or Water
    const isWaterBottleneck = hasDisaster && (activeEvent.type === 'EQUIPMENT_FAILURE' || activeEvent.type === 'WATER_CONTAMINATION');
    const resKey = isWaterBottleneck ? 'water' : 'energy';
    const resName = isWaterBottleneck ? 'Water' : 'Power';
    const unit = isWaterBottleneck ? 'L' : 'kW';

    // Baseline 100% consumption requirements per sector
    const powerBaseReq = {
      lifesupport: 19.0, // Habitat (10) + MOXIE (6) + Central Hub (3)
      water: 8.0,
      greenhouse: 6.0,
      research: 4.0,
      logistics: 7.0    // Mining (5) + Rocket (1) + Depot (1)
    };

    const waterBaseReq = {
      lifesupport: 8.0,
      greenhouse: 20.0,
      research: 1.0,
      water: 0.0,
      logistics: 0.0
    };

    const baseReqMap = isWaterBottleneck ? waterBaseReq : powerBaseReq;
    const requiredTotal = Object.values(baseReqMap).reduce((a, b) => a + b, 0);

    // Live Generation
    const rawGen = Number(colony[resKey].productionRate.toFixed(1));
    const backupKW = (this.backupActive && !isWaterBottleneck) ? 25.0 : (this.backupActive && isWaterBottleneck ? 10.0 : 0.0);
    const availableGen = rawGen; // already includes backup if active
    const baseGenWithoutBackup = Math.max(0, availableGen - backupKW);

    // Initial shortage before user reductions and backup
    const shortageAmount = hasDisaster ? Math.max(5.0, Number((requiredTotal - baseGenWithoutBackup).toFixed(1))) : 0.0;

    // Automatic Colony Response:
    // When Java backend is connected, read facility levels directly from Java Single Source of Truth
    let autoLogisticsLevel = 1.0;
    let autoResearchLevel = 1.0;
    let autoGreenhouseLevel = 1.0;
    let autoWaterLevel = 1.0;

    if (this.sim.backendData?.facilities && this.sim.backendData.facilities.length > 0) {
      for (const f of this.sim.backendData.facilities) {
        const name = (f.name || '').toLowerCase();
        const lvl = f.operatingLevel / 100.0;
        if (name.includes('landing') || name.includes('logistics')) autoLogisticsLevel = lvl;
        else if (name.includes('research')) autoResearchLevel = lvl;
        else if (name.includes('greenhouse')) autoGreenhouseLevel = lvl;
        else if (name.includes('water')) autoWaterLevel = lvl;
      }
    } else if (hasDisaster && shortageAmount > 0) {
      let needToSave = shortageAmount;

      if (isWaterBottleneck) {
        // Water shortage: Greenhouse is the primary consumer (20 L out of 29 L)
        autoGreenhouseLevel = 0.5; // Saves 10 L
        autoResearchLevel = 0.0;   // Saves 1 L
        autoLogisticsLevel = 1.0;  // 0 L water draw
        autoWaterLevel = 1.0;      // Extraction pump max
      } else {
        // Power shortage:
        // 1. Logistics / Mining (Priority 5, Base: 7 kW) - non-essential heavy industry
        if (needToSave >= 7.0) {
          autoLogisticsLevel = 0.0;
          needToSave -= 7.0;
        } else if (needToSave >= 3.5) {
          autoLogisticsLevel = 0.5;
          needToSave -= 3.5;
        } else if (needToSave > 0) {
          autoLogisticsLevel = 0.75;
          needToSave -= 1.75;
        }

        // 2. Research Lab (Priority 4, Base: 4 kW) - non-essential science
        if (needToSave >= 4.0) {
          autoResearchLevel = 0.0;
          needToSave -= 4.0;
        } else if (needToSave >= 2.0) {
          autoResearchLevel = 0.5;
          needToSave -= 2.0;
        } else if (needToSave > 0) {
          autoResearchLevel = 0.75;
          needToSave -= 1.0;
        }

        // 3. CEA Greenhouse (Priority 3, Base: 6 kW) - food CEA dome
        if (needToSave >= 3.0) {
          autoGreenhouseLevel = 0.5;
          needToSave -= 3.0;
        } else if (needToSave > 0) {
          autoGreenhouseLevel = 0.75;
          needToSave -= 1.5;
        }

        // 4. Water Extraction (Priority 2, Base: 8 kW) - survival infrastructure
        if (needToSave >= 2.0) {
          autoWaterLevel = 0.75;
          needToSave -= 2.0;
        }
      }
    }

    // Automatic facility response cards for the UI (Powered by Java Backend Single Source of Truth)
    let automaticResponses = [];
    if (this.sim.backendData?.managementResponse && this.sim.backendData.managementResponse.length > 0) {
      automaticResponses = this.sim.backendData.managementResponse
        .filter(r => r.action !== 'NOMINAL')
        .map(r => {
          const isProt = r.action === 'PROTECTED';
          const isPaused = r.action === 'PAUSED';
          const isRed = r.action === 'REDUCED';
          const isRestoring = r.action === 'RESTORING';

          let savedText = `${r.resource || resName} saved: ${r.saved} ${unit}`;
          if (isProt) savedText = 'Life Support PROTECTED';
          else if (isRestoring) savedText = 'Gradual restoration active';
          else if (r.saved === 0) savedText = `${r.resource || resName} demand: nominal`;

          let beforePct = 100;
          let afterPct = 100;

          if (typeof r.before === 'number' && typeof r.after === 'number') {
            beforePct = Math.round(r.before * 100);
            afterPct = Math.round(r.after * 100);
          } else {
            const parts = (r.transition || '').split('→');
            beforePct = parts.length > 0 ? (parseInt(parts[0].replace(/[^0-9]/g, ''), 10) || 100) : 100;
            afterPct = parts.length > 1 ? (parseInt(parts[1].replace(/[^0-9]/g, ''), 10) || (isPaused ? 0 : 100)) : (isPaused ? 0 : 100);
          }

          const transitionText = r.transition || `${beforePct}% → ${afterPct}%`;

          return {
            id: r.facility.toLowerCase().replace(/[^a-z0-9]/g, ''),
            sectorKey: r.facility.toLowerCase(),
            name: r.facility.toUpperCase(),
            beforePct,
            afterPct,
            transitionText,
            saved: r.saved,
            savedText,
            action: r.action,
            actionClass: r.action.toLowerCase()
          };
        });
    } else {
      automaticResponses = [
        {
          id: 'mining',
          sectorKey: 'logistics',
          name: 'MINING OPERATION',
          beforePct: 100,
          afterPct: Math.round(autoLogisticsLevel * 100),
          transitionText: `100% → ${Math.round(autoLogisticsLevel * 100)}%`,
          saved: Number((baseReqMap.logistics * (1.0 - autoLogisticsLevel)).toFixed(1)),
          savedText: (1.0 - autoLogisticsLevel) > 0 ? `${resName} saved: ${Number((baseReqMap.logistics * (1.0 - autoLogisticsLevel)).toFixed(1))} ${unit}` : `${resName} demand: ${baseReqMap.logistics} ${unit}`,
          action: autoLogisticsLevel === 0 ? 'PAUSED' : (autoLogisticsLevel < 1.0 ? 'REDUCED' : 'NOMINAL'),
          actionClass: autoLogisticsLevel === 0 ? 'paused' : (autoLogisticsLevel < 1.0 ? 'reduced' : 'nominal')
        },
        {
          id: 'research',
          sectorKey: 'research',
          name: 'RESEARCH FACILITY',
          beforePct: 100,
          afterPct: Math.round(autoResearchLevel * 100),
          transitionText: `100% → ${Math.round(autoResearchLevel * 100)}%`,
          saved: Number((baseReqMap.research * (1.0 - autoResearchLevel)).toFixed(1)),
          savedText: (1.0 - autoResearchLevel) > 0 ? `${resName} saved: ${Number((baseReqMap.research * (1.0 - autoResearchLevel)).toFixed(1))} ${unit}` : `${resName} demand: ${baseReqMap.research} ${unit}`,
          action: autoResearchLevel === 0 ? 'PAUSED' : (autoResearchLevel < 1.0 ? 'REDUCED' : 'NOMINAL'),
          actionClass: autoResearchLevel === 0 ? 'paused' : (autoResearchLevel < 1.0 ? 'reduced' : 'nominal')
        },
        {
          id: 'greenhouse',
          sectorKey: 'greenhouse',
          name: 'CEA GREENHOUSE',
          beforePct: 100,
          afterPct: Math.round(autoGreenhouseLevel * 100),
          transitionText: `100% → ${Math.round(autoGreenhouseLevel * 100)}%`,
          saved: Number((baseReqMap.greenhouse * (1.0 - autoGreenhouseLevel)).toFixed(1)),
          savedText: (1.0 - autoGreenhouseLevel) > 0 ? `${resName} saved: ${Number((baseReqMap.greenhouse * (1.0 - autoGreenhouseLevel)).toFixed(1))} ${unit}` : `${resName} demand: ${baseReqMap.greenhouse} ${unit}`,
          action: autoGreenhouseLevel === 0 ? 'PAUSED' : (autoGreenhouseLevel < 1.0 ? 'REDUCED' : 'NOMINAL'),
          actionClass: autoGreenhouseLevel === 0 ? 'paused' : (autoGreenhouseLevel < 1.0 ? 'reduced' : 'nominal')
        },
        {
          id: 'water',
          sectorKey: 'water',
          name: isWaterBottleneck ? 'WATER WELL' : 'WATER EXTRACTION',
          beforePct: 100,
          afterPct: Math.round(autoWaterLevel * 100),
          transitionText: `100% → ${Math.round(autoWaterLevel * 100)}%`,
          saved: Number((baseReqMap.water * (1.0 - autoWaterLevel)).toFixed(1)),
          savedText: (1.0 - autoWaterLevel) > 0 ? `${resName} saved: ${Number((baseReqMap.water * (1.0 - autoWaterLevel)).toFixed(1))} ${unit}` : `${resName} demand: ${baseReqMap.water} ${unit}`,
          action: autoWaterLevel < 1.0 ? 'REDUCED' : (isWaterBottleneck ? 'PRIORITIZED' : 'NOMINAL'),
          actionClass: autoWaterLevel < 1.0 ? 'reduced' : 'nominal'
        },
        {
          id: 'lifesupport',
          sectorKey: 'lifesupport',
          name: 'LIFE SUPPORT',
          beforePct: 100,
          afterPct: 100,
          transitionText: '100% → 100%',
          saved: 0.0,
          savedText: `${resName} demand: ${baseReqMap.lifesupport} ${unit}`,
          action: 'PROTECTED',
          actionClass: 'protected'
        }
      ];
    }

    // Build Sector Models using automatic levels
    const sectors = [
      {
        key: 'lifesupport',
        sectorKey: 'lifesupport',
        name: 'LIFE SUPPORT',
        priorityText: 'PROTECTED',
        priorityClass: 'protected',
        level: 1.0,
        levelPct: 100,
        isProtected: true,
        baseReq: baseReqMap.lifesupport,
        currentDraw: Number(baseReqMap.lifesupport.toFixed(1)),
        saved: 0.0,
        savedVal: 0.0,
        unit,
        statusText: 'PROTECTED',
        note: '🔒 PROTECTED — Cannot be reduced.'
      },
      {
        key: 'water',
        sectorKey: 'water',
        name: isWaterBottleneck ? 'WATER WELL' : 'WATER EXTRACTION',
        priorityText: 'HIGH PRIORITY',
        priorityClass: 'high',
        level: autoWaterLevel,
        levelPct: Math.round(autoWaterLevel * 100),
        isProtected: false,
        baseReq: baseReqMap.water,
        currentDraw: Number((baseReqMap.water * autoWaterLevel).toFixed(1)),
        saved: Number((baseReqMap.water * (1.0 - autoWaterLevel)).toFixed(1)),
        savedVal: Number((baseReqMap.water * (1.0 - autoWaterLevel)).toFixed(1)),
        unit,
        statusText: autoWaterLevel === 0 ? 'PAUSED' : (autoWaterLevel < 1.0 ? 'REDUCED' : 'NORMAL'),
        note: isWaterBottleneck ? 'Primary extraction' : 'Survival infrastructure'
      },
      {
        key: 'greenhouse',
        sectorKey: 'greenhouse',
        name: 'GREENHOUSE',
        priorityText: 'NORMAL',
        priorityClass: 'normal',
        level: autoGreenhouseLevel,
        levelPct: Math.round(autoGreenhouseLevel * 100),
        isProtected: false,
        baseReq: baseReqMap.greenhouse,
        currentDraw: Number((baseReqMap.greenhouse * autoGreenhouseLevel).toFixed(1)),
        saved: Number((baseReqMap.greenhouse * (1.0 - autoGreenhouseLevel)).toFixed(1)),
        savedVal: Number((baseReqMap.greenhouse * (1.0 - autoGreenhouseLevel)).toFixed(1)),
        unit,
        statusText: autoGreenhouseLevel === 0 ? 'PAUSED' : (autoGreenhouseLevel < 1.0 ? 'REDUCED' : 'NORMAL'),
        note: 'Food production CEA dome'
      },
      {
        key: 'research',
        sectorKey: 'research',
        name: 'RESEARCH',
        priorityText: 'REDUCIBLE',
        priorityClass: 'reducible',
        level: autoResearchLevel,
        levelPct: Math.round(autoResearchLevel * 100),
        isProtected: false,
        baseReq: baseReqMap.research,
        currentDraw: Number((baseReqMap.research * autoResearchLevel).toFixed(1)),
        saved: Number((baseReqMap.research * (1.0 - autoResearchLevel)).toFixed(1)),
        savedVal: Number((baseReqMap.research * (1.0 - autoResearchLevel)).toFixed(1)),
        unit,
        statusText: autoResearchLevel === 0 ? 'PAUSED' : (autoResearchLevel < 1.0 ? 'REDUCED' : 'NORMAL'),
        note: 'Science & Astrobiology lab'
      },
      {
        key: 'logistics',
        sectorKey: 'logistics',
        name: 'LOGISTICS',
        priorityText: 'REDUCIBLE',
        priorityClass: 'reducible',
        level: autoLogisticsLevel,
        levelPct: Math.round(autoLogisticsLevel * 100),
        isProtected: false,
        baseReq: baseReqMap.logistics,
        currentDraw: Number((baseReqMap.logistics * autoLogisticsLevel).toFixed(1)),
        saved: Number((baseReqMap.logistics * (1.0 - autoLogisticsLevel)).toFixed(1)),
        savedVal: Number((baseReqMap.logistics * (1.0 - autoLogisticsLevel)).toFixed(1)),
        unit,
        statusText: autoLogisticsLevel === 0 ? 'PAUSED' : (autoLogisticsLevel < 1.0 ? 'REDUCED' : 'NORMAL'),
        note: 'Mining auger & launch zone'
      }
    ];

    // Total saved from reductions (Powered by Java Backend Single Source of Truth)
    const totalSaved = (this.sim.backendData?.managementResponse && this.sim.backendData.managementResponse.length > 0)
      ? Number(automaticResponses.reduce((sum, r) => sum + (r.saved || 0), 0).toFixed(1))
      : Number(sectors.reduce((sum, s) => sum + s.saved, 0).toFixed(1));

    // Managed Consumption
    const managedConsumption = Number((requiredTotal - totalSaved).toFixed(1));

    // Remaining shortage
    const remainingShortage = Math.max(0.0, Number((shortageAmount - totalSaved - backupKW).toFixed(1)));

    // Balance calculations
    // BEFORE: BaseGen vs Required
    const beforeBalance = Number((baseGenWithoutBackup - requiredTotal).toFixed(1));
    // AFTER: BaseGen vs Managed
    const afterBalance = Number((baseGenWithoutBackup - managedConsumption).toFixed(1));
    // FINAL: With Backup
    const finalBalance = Number(((baseGenWithoutBackup + backupKW) - managedConsumption).toFixed(1));

    // 3. "HOW TO MANAGE" BREAKDOWN STEPS
    const managementSteps = [];
    let stepCount = 1;

    if (sectors.find(s => s.key === 'research').saved > 0) {
      const s = sectors.find(s => s.key === 'research');
      managementSteps.push({
        num: stepCount++,
        title: 'REDUCE RESEARCH',
        changeText: `100% → ${s.levelPct}%`,
        savingsText: `Saves ${s.saved} ${unit}`,
        savingsVal: s.saved
      });
    } else if (hasDisaster) {
      managementSteps.push({
        num: stepCount++,
        title: 'REDUCE RESEARCH',
        changeText: '100% → 25%',
        savingsText: `Saves ${(baseReqMap.research * 0.75).toFixed(1)} ${unit}`,
        savingsVal: Number((baseReqMap.research * 0.75).toFixed(1))
      });
    }

    if (sectors.find(s => s.key === 'greenhouse').saved > 0) {
      const s = sectors.find(s => s.key === 'greenhouse');
      managementSteps.push({
        num: stepCount++,
        title: 'REDUCE GREENHOUSE',
        changeText: `100% → ${s.levelPct}%`,
        savingsText: `Saves ${s.saved} ${unit}`,
        savingsVal: s.saved
      });
    } else if (hasDisaster) {
      managementSteps.push({
        num: stepCount++,
        title: 'REDUCE GREENHOUSE',
        changeText: '100% → 75%',
        savingsText: `Saves ${(baseReqMap.greenhouse * 0.25).toFixed(1)} ${unit}`,
        savingsVal: Number((baseReqMap.greenhouse * 0.25).toFixed(1))
      });
    }

    if (sectors.find(s => s.key === 'logistics').saved > 0) {
      const s = sectors.find(s => s.key === 'logistics');
      managementSteps.push({
        num: stepCount++,
        title: s.level === 0 ? 'PAUSE LOGISTICS' : 'REDUCE LOGISTICS',
        changeText: `100% → ${s.levelPct}%`,
        savingsText: `Saves ${s.saved} ${unit}`,
        savingsVal: s.saved
      });
    } else if (hasDisaster) {
      managementSteps.push({
        num: stepCount++,
        title: 'PAUSE LOGISTICS',
        changeText: '100% → 0%',
        savingsText: `Saves ${baseReqMap.logistics.toFixed(1)} ${unit}`,
        savingsVal: baseReqMap.logistics
      });
    }

    // 4. "WHY THIS WORKED" EXPLANATIONS
    const whyItems = [];
    sectors.forEach(s => {
      if (s.saved > 0) {
        whyItems.push({
          action: `${s.name.charAt(0) + s.name.slice(1).toLowerCase()} ${s.level === 0 ? 'paused' : 'reduced'}`,
          savedText: `${s.saved} ${unit} saved`
        });
      }
    });
    if (this.backupActive) {
      whyItems.push({
        action: 'Backup power active',
        savedText: `+${backupKW} ${unit}`
      });
    }
    if (this.reserveDrawn[resKey] > 0) {
      whyItems.push({
        action: 'Emergency reserve injected',
        savedText: `+${this.reserveDrawn[resKey]} ${unit}`
      });
    }

    // 5. RESOURCE RECOVERY
    const currentStorage = Math.round(colony[resKey].current);
    const targetStorage = Math.round(colony[resKey].max * 0.9);
    const recoveryProgress = Math.min(100, Math.round((currentStorage / targetStorage) * 100));

    const recoverySources = [
      { label: 'Backup Power', value: `+${backupKW} ${unit}`, active: this.backupActive },
      { label: 'Reduced Usage', value: `+${totalSaved} ${unit}`, active: totalSaved > 0 },
      { label: hasDisaster ? 'Solar Recovery' : 'Nominal Solar', value: `+${Math.round(baseGenWithoutBackup)} ${unit}`, active: true }
    ];

    // 6. CAUSE & EFFECT FLOW
    let causeAndEffect = [];
    if (activeEvent?.type === 'DUST_STORM') {
      causeAndEffect = [
        'Dust Storm',
        'Solar power reduced −85%',
        `Power shortage (${Math.round(shortageAmount)} kW)`,
        'Non-essential usage reduced',
        'Essential life support protected',
        'Power begins recovering'
      ];
    } else if (activeEvent?.type === 'EQUIPMENT_FAILURE') {
      causeAndEffect = [
        'Pump seal failure',
        'Water extraction reduced −60%',
        `Water shortage (${Math.round(shortageAmount)} L)`,
        'Greenhouse irrigation reduced',
        'Life support protected',
        'Water begins recovering'
      ];
    } else if (activeEvent?.type === 'POWER_INTERRUPTION') {
      causeAndEffect = [
        'Grid transformer fault',
        'Power delivery reduced −35%',
        `Power shortage (${Math.round(shortageAmount)} kW)`,
        'Non-essential systems paused',
        'Essential life support protected',
        'Power begins recovering'
      ];
    } else {
      causeAndEffect = [
        'Martian weather clear',
        'Solar & nuclear nominal',
        'Resource grids balanced',
        'All facilities operating normally',
        'Colony status stable'
      ];
    }

    // 7. FINAL RECOVERY STATUS
    let finalColonyStatus = 'STABLE';
    let statusClass = 'status-normal';

    if (hasDisaster) {
      if (finalBalance >= 0 && (totalSaved > 0 || this.backupActive)) {
        finalColonyStatus = 'RECOVERING';
        statusClass = 'status-recovering';
      } else if (remainingShortage > 0) {
        finalColonyStatus = 'CRITICAL';
        statusClass = 'status-critical';
      } else {
        finalColonyStatus = 'RECOVERING';
        statusClass = 'status-recovering';
      }
    } else if (finalBalance >= 0) {
      finalColonyStatus = 'STABLE';
      statusClass = 'status-normal';
    }

    return {
      hasDisaster,
      activeEvent: activeEventInfo,
      resName,
      unit,
      howToManage: {
        resourceShort: resName,
        unit,
        available: Math.round(baseGenWithoutBackup),
        required: Math.round(requiredTotal),
        shortage: Math.round(shortageAmount),
        steps: managementSteps,
        responses: automaticResponses,
        totalSaved,
        remainingShortage,
        backupActive: this.backupActive,
        backupKW,
        finalBalance,
        isResolved: remainingShortage === 0 && finalBalance >= 0
      },
      sectors,
      balance: {
        unit,
        beforeGen: Math.round(baseGenWithoutBackup),
        beforeCons: Math.round(requiredTotal),
        beforeBal: beforeBalance,
        afterGen: Math.round(baseGenWithoutBackup),
        afterCons: Math.round(managedConsumption),
        afterBal: afterBalance,
        backupKW,
        finalBal: finalBalance
      },
      whyThisWorked: {
        items: whyItems,
        shortageTransition: `${Math.round(shortageAmount)} ${unit} → ${Math.round(remainingShortage)} ${unit}`,
        isResolved: remainingShortage === 0
      },
      recovery: {
        title: `${resName.toUpperCase()} RECOVERY`,
        resourceName: resName,
        current: currentStorage,
        target: targetStorage,
        unit,
        sources: recoverySources,
        progress: recoveryProgress,
        progressPct: recoveryProgress,
        status: finalColonyStatus === 'STABLE' ? 'STABLE' : 'RECOVERING',
        statusClass
      },
      causeAndEffect,
      effectsOnColony: causeAndEffect,
      recoveryStatus: finalColonyStatus,
      statusClass,
      recoveryStatusDetails: {
        shortageResolved: remainingShortage === 0,
        emergencyReserveInUse: (this.reserveDrawn[resKey] > 0),
        researchStatus: (sectorLevels.research ?? 1.0) === 0 ? 'PAUSED' : ((sectorLevels.research ?? 1.0) < 1.0 ? 'REDUCED' : 'NORMAL'),
        logisticsStatus: (sectorLevels.logistics ?? 1.0) === 0 ? 'PAUSED' : ((sectorLevels.logistics ?? 1.0) < 1.0 ? 'REDUCED' : 'NORMAL'),
        generationStatus: hasDisaster ? 'RECOVERING' : 'NOMINAL',
        estimatedRecoverySols: hasDisaster ? Math.max(1, Math.ceil(activeEvent?.solsRemaining || 2)) : 0,
        colonyStatus: finalColonyStatus
      },
      actions: {
        backupActive: this.backupActive,
        conservationActive: totalSaved > 0,
        reserveDrawn: this.reserveDrawn,
        repairActive: this.repairActive,
        repairProgress: Math.round(this.repairProgress)
      },
      recoveryOptions: [
        {
          id: 'backup-power',
          title: 'BACKUP POWER',
          boost: `+${backupKW > 0 ? backupKW : 25} ${unit}`,
          boostVal: backupKW > 0 ? backupKW : 25,
          active: this.backupActive,
          actionText: this.backupActive ? 'ACTIVE' : 'ACTIVATE',
          actionKey: 'backup-power'
        },
        {
          id: 'emergency-reserve',
          title: 'EMERGENCY RESERVE',
          boost: `+${isWaterBottleneck ? 30 : 40} ${unit}`,
          boostVal: isWaterBottleneck ? 30 : 40,
          active: (this.reserveDrawn[resKey] > 0),
          actionText: (this.reserveDrawn[resKey] > 0) ? 'IN USE' : 'USE',
          actionKey: 'emergency-reserve'
        },
        {
          id: 'solar-recovery',
          title: hasDisaster ? (isWaterBottleneck ? 'WELL RECOVERY' : 'SOLAR RECOVERY') : 'NATURAL GENERATION',
          boost: `+${hasDisaster ? 10 : Math.round(baseGenWithoutBackup)} ${unit}`,
          boostVal: hasDisaster ? 10 : Math.round(baseGenWithoutBackup),
          active: true,
          actionText: hasDisaster ? 'RECOVERING' : 'NOMINAL',
          actionKey: null
        }
      ]
    };
  }

  reset() {
    this.backupActive = false;
    this.reserveDrawn = { energy: 0, water: 0, oxygen: 0, food: 0 };
    this.lastReserveDrawSol = 0;
    this.repairActive = false;
    this.repairProgress = 0;
    this.sim.allocationManager.resetSectorLevels();
  }
}
