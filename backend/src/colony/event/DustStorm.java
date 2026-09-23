package colony.event;

import colony.model.PowerStation;
import colony.simulation.SimulationEngine;

/**
 * Severe Martian Dust Storm event.
 * Airborne iron oxide dust blocks sunlight across the quadrant,
 * reducing solar array output by 85% (effective generation multiplier = 0.15).
 * Triggers an immediate power shortage, prompting the ManagementSystem
 * to automatically shed non-essential loads.
 */
public class DustStorm extends Event {
    private final double solarReductionMultiplier;

    public DustStorm(double durationSols, double reductionMultiplier) {
        super("Dust Storm", Severity.HIGH, durationSols, 
              "Severe Martian dust storm blocks sunlight. Solar power generation drops by 85%.");
        this.solarReductionMultiplier = reductionMultiplier;
    }

    public DustStorm(double durationSols) {
        this(durationSols, 0.15); // 85% drop in solar generation
    }

    public DustStorm() {
        this(2.0, 0.15); // Default 2 Sols duration, 85% drop
    }

    @Override
    public void applyEffect(SimulationEngine engine) {
        PowerStation powerStation = engine.getFacility(PowerStation.class);
        if (powerStation != null && isActive()) {
            powerStation.setEventModifier(solarReductionMultiplier);
        }
    }
}
