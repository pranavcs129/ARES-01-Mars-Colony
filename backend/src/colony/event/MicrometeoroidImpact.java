package colony.event;

import colony.model.Facility;
import colony.simulation.SimulationEngine;

/**
 * High-Velocity Micrometeoroid Impact Event.
 * Punctures external thermal radiation shields and solar bus linkages.
 * Inflicts immediate 35% condition damage to exposed surface facilities.
 */
public class MicrometeoroidImpact extends Event {
    private boolean damageApplied = false;

    public MicrometeoroidImpact(double durationSols) {
        super("Micrometeoroid Impact", Severity.HIGH, durationSols,
              "Hypervelocity regolith debris puncture: Structural damage and solar array stress.");
    }

    public MicrometeoroidImpact() {
        this(2.0);
    }

    @Override
    public void applyEffect(SimulationEngine engine) {
        if (!isActive() || damageApplied) return;
        for (Facility f : engine.getFacilities()) {
            // Priority 5 (Landing/Logistics) and Priority 4 (Research) absorb the kinetic impact
            if (f.getPriority() >= 4) {
                try {
                    f.damage(35.0);
                } catch (colony.exception.FacilityDamagedException ignored) {}
            }
        }
        damageApplied = true;
    }
}
