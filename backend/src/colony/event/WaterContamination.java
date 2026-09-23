package colony.event;

import colony.model.WaterExtractor;
import colony.simulation.SimulationEngine;

/**
 * Water Contamination Disaster Event.
 * Toxic regolith perchlorate breach in the water purification system.
 * Reduces effective potable water production by 70% (multiplier = 0.30).
 */
public class WaterContamination extends Event {
    public WaterContamination(double durationSols) {
        super("Water Contamination", Severity.HIGH, durationSols,
              "Perchlorate breach in filtration line: Potable water extraction reduced by 70%.");
    }

    public WaterContamination() {
        this(3.0);
    }

    @Override
    public void applyEffect(SimulationEngine engine) {
        WaterExtractor extractor = engine.getFacility(WaterExtractor.class);
        if (extractor != null && isActive()) {
            extractor.setEventModifier(0.30);
        }
    }
}
