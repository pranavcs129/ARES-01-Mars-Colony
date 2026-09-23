/**
 * ProgressionManager — Handles colony development phases, progression milestones,
 * and criteria evaluation for advancement across Ares-1 settlement eras.
 */
export class ProgressionManager {
  constructor() {
    this.phases = [
      { id: 0, code: 'PHASE 0', title: 'ROBOTIC RECON' },
      { id: 1, code: 'PHASE 1', title: 'ISRU DEPLOYMENT' },
      { id: 2, code: 'PHASE 2', title: 'INITIAL CREW' },
      { id: 3, code: 'PHASE 3', title: 'PERMANENT BASE' },
      { id: 4, code: 'PHASE 4', title: 'SELF-SUSTAINING SETTLEMENT' }
    ];

    // Colony starts at Phase 2: Initial Crew
    this.currentPhaseIndex = 2;

    // Milestone definitions for each phase
    this.milestoneDefinitions = {
      2: [
        {
          id: 'hab_ops',
          title: 'Habitat operational',
          description: 'Life support efficiency maintained above 80%',
          check: (c, f, m) => (f.facilities?.habitat?.efficiency || 0) >= 80
        },
        {
          id: 'power_ops',
          title: 'Power system operational',
          description: 'Energy grid storage above 50% capacity',
          check: (c, f, m) => (c.resources.energy.current / c.resources.energy.max) >= 0.50
        },
        {
          id: 'water_ops',
          title: 'Water extraction operational',
          description: 'ISRU condenser extractor operating at or above 80% efficiency',
          check: (c, f, m) => (f.facilities?.water?.efficiency || 0) >= 80
        },
        {
          id: 'food_est',
          title: 'Food production established',
          description: 'CEA Bio-Dome actively yielding caloric biomass',
          check: (c, f, m) => (f.facilities?.greenhouse?.actualProduction?.food || 0) > 0
        },
        {
          id: 'surplus',
          title: 'Stable resource surplus',
          description: 'Colony health maintained at or above 85% with positive resource trend',
          check: (c, f, m) => (m.colonyHealth || 0) >= 85 && c.resources.oxygen.productionRate >= c.resources.oxygen.consumptionRate
        }
      ],
      3: [
        {
          id: 'res_stability',
          title: 'Long-term resource stability',
          description: 'All core life support reserves maintained above 70%',
          check: (c, f, m) => {
            const r = c.resources;
            return (r.oxygen.current / r.oxygen.max >= 0.70) &&
                   (r.water.current / r.water.max >= 0.70) &&
                   (r.food.current / r.food.max >= 0.70) &&
                   (r.energy.current / r.energy.max >= 0.70);
          }
        },
        {
          id: 'infra_expanded',
          title: 'Expanded infrastructure',
          description: 'All 12 surface facilities operating without degradation (>85% efficiency)',
          check: (c, f, m) => {
            if (!f.facilities) return false;
            return Object.values(f.facilities).every(fac => (fac.efficiency || 0) >= 80);
          }
        },
        {
          id: 'power_reliable',
          title: 'Reliable energy production',
          description: 'Grid buffer charged above 85% with nuclear baseload intact',
          check: (c, f, m) => (c.resources.energy.current / c.resources.energy.max) >= 0.85
        },
        {
          id: 'food_reliable',
          title: 'Reliable food reserves',
          description: 'Stored caloric rations exceed 800 kg',
          check: (c, f, m) => c.resources.food.current >= 800
        },
        {
          id: 'health_strong',
          title: 'Strong colony health',
          description: 'Overall settlement health score reaches 90% or higher',
          check: (c, f, m) => (m.colonyHealth || 0) >= 90
        }
      ]
    };

    // Cached evaluation state
    this.evaluatedMilestones = [];
    this.progressPercent = 80;
    this.canAdvance = false;
  }

  /**
   * Evaluates progression requirements
   */
  tick(hour, sol, colonyState, facilityManager, monitoringManager) {
    const activeDefs = this.milestoneDefinitions[this.currentPhaseIndex] || [];
    let completedCount = 0;

    this.evaluatedMilestones = activeDefs.map(def => {
      const isMet = def.check(colonyState, facilityManager, monitoringManager);
      if (isMet) completedCount++;
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        completed: isMet
      };
    });

    const total = activeDefs.length || 1;
    this.progressPercent = Math.round((completedCount / total) * 100);
    this.canAdvance = completedCount === total && this.currentPhaseIndex < this.phases.length - 1;
  }

  /**
   * Advances colony to next progression era
   */
  advancePhase() {
    if (this.currentPhaseIndex < this.phases.length - 1) {
      this.currentPhaseIndex++;
      this.progressPercent = 0;
      this.canAdvance = false;
      return true;
    }
    return false;
  }

  /**
   * Returns snapshot for UI
   */
  getSnapshot() {
    const current = this.phases[this.currentPhaseIndex];
    const next = this.phases[this.currentPhaseIndex + 1] || null;

    return {
      currentPhase: { ...current },
      nextPhase: next ? { ...next } : null,
      progressPercent: this.progressPercent,
      canAdvance: this.canAdvance,
      milestones: [...this.evaluatedMilestones]
    };
  }

  reset() {
    this.currentPhaseIndex = 2;
    this.progressPercent = 80;
    this.canAdvance = false;
  }
}
