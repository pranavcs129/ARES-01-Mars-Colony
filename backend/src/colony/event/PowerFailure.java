package colony.event;

import colony.model.PowerStation;
import colony.simulation.SimulationEngine;

/**
 * Main Electrical Grid Interruption / Power Failure event.
 * Occurs when high-voltage bus bar shorts or inverter trips.
 * Reduces power delivery by 35% (multiplier = 0.65).
 */
public class PowerFailure extends Event {
    public PowerFailure(double durationSols) {
        super("Power Failure", Severity.MEDIUM, durationSols,
              "Main grid transformer fault: Power output delivery reduced by 35%.");
    }

    @Override
    public void applyEffect(SimulationEngine engine) {
        PowerStation powerStation = engine.getFacility(PowerStation.class);
        if (powerStation != null && isActive()) {
            powerStation.setEventModifier(0.65);
        }
    }
}
