package colony.event;

import colony.model.Facility;
import colony.simulation.SimulationEngine;

/**
 * Mechanical Equipment Failure Event.
 * Physical degradation or micrometeorite impact on specific hardware.
 * Degrades facility mechanical condition by 45%.
 */
public class EquipmentFailure extends Event {
    private final String targetFacilityName;
    private boolean damageApplied = false;

    public EquipmentFailure(String targetFacilityName, double durationSols) {
        super("Equipment Failure (" + targetFacilityName + ")", Severity.MEDIUM, durationSols,
              "Mechanical fatigue in " + targetFacilityName + ": Condition degraded by 45%.");
        this.targetFacilityName = targetFacilityName;
    }

    public EquipmentFailure(double durationSols) {
        this("Water Extractor", durationSols);
    }

    @Override
    public void applyEffect(SimulationEngine engine) {
        if (!isActive() || damageApplied) return;
        for (Facility f : engine.getFacilities()) {
            if (f.getName().toLowerCase().contains(targetFacilityName.toLowerCase())) {
                try {
                    f.damage(45.0);
                } catch (colony.exception.FacilityDamagedException e) {
                    System.err.println("WARNING: " + e.getMessage());
                }
            }
        }
        this.damageApplied = true;
    }
}
