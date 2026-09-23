package colony.event;

import colony.model.WaterExtractor;
import colony.simulation.SimulationEngine;

/**
 * Subsurface Water Extraction Pump Failure.
 * Drill motor overcurrent or cryogenic seal rupture.
 * Reduces water output by 60% (multiplier = 0.40).
 */
public class WaterFailure extends Event {
    public WaterFailure(double durationSols) {
        super("Water Failure", Severity.MEDIUM, durationSols,
              "Extraction pump seal rupture: Water extraction reduced by 60%.");
    }

    @Override
    public void applyEffect(SimulationEngine engine) {
        WaterExtractor extractor = engine.getFacility(WaterExtractor.class);
        if (extractor != null && isActive()) {
            extractor.setEventModifier(0.40);
        }
    }
}
