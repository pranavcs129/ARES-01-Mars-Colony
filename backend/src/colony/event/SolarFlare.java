package colony.event;

import colony.model.Power;
import colony.simulation.SimulationEngine;

/**
 * Solar Flare Radiation Event.
 * Intense coronal mass ejection bathes Mars in ionizing radiation.
 * Drains battery storage buffers by 30 kW and strains colony electronics.
 */
public class SolarFlare extends Event {
    public SolarFlare(double durationSols) {
        super("Solar Flare", Severity.HIGH, durationSols,
              "Intense solar particle event: Electromagnetic surge and battery buffer drain.");
    }

    @Override
    public void applyEffect(SimulationEngine engine) {
        if (!isActive()) return;
        Power power = (Power) engine.getResourceManager().getResource("Power");
        if (power != null && power.getCurrentAmount() > 0.0) {
            // Drain transient energy buffer
            double drain = Math.min(30.0, power.getCurrentAmount());
            power.setCurrentAmount(power.getCurrentAmount() - drain);
        }
    }
}
