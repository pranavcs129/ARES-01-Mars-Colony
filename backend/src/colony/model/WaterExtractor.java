package colony.model;

import colony.exception.ResourceDepletedException;
import java.util.Map;

/**
 * Water Extraction Facility (Priority 2).
 * Drills into Martian permafrost and vaporizes subsurface ice.
 * Baseline requirements: 8.0 kW Power.
 * Baseline output: 40.0 L Water / Sol.
 */
public class WaterExtractor extends Facility {
    private static final double BASE_POWER_DEMAND = 8.0; // kW
    private static final double BASE_WATER_PRODUCTION = 22.0; // L/Sol (Permafrost thermal sublimator output)
    private double eventModifier = 1.0; // Reduced during pump/seal failures

    public WaterExtractor() {
        super("Water Extractor", 2); // Priority 2
    }

    @Override
    public void operate(double deltaSols, Map<String, Resource> resources) throws ResourceDepletedException {
        Resource power = resources.get("Power");
        Resource water = resources.get("Water");

        // 1. Consume Power
        if (power != null) {
            double powerNeeded = calculateConsumption("Power") * deltaSols;
            power.consume(powerNeeded);
        }

        // 2. Produce Water proportional to operating level and mechanical condition
        if (water != null) {
            double effectiveProd = calculateWaterProduction() * deltaSols;
            water.produce(effectiveProd);
        }
    }

    public double calculateWaterProduction() {
        double efficiency = (getCondition() / 100.0) * getOperatingLevel();
        return BASE_WATER_PRODUCTION * eventModifier * efficiency;
    }

    @Override
    public double calculateConsumption(String resourceName) {
        if ("power".equalsIgnoreCase(resourceName)) {
            return BASE_POWER_DEMAND * getOperatingLevel();
        }
        return 0.0;
    }

    @Override
    public double getBaseDemand(String resourceName) {
        if ("power".equalsIgnoreCase(resourceName)) {
            return BASE_POWER_DEMAND;
        }
        return 0.0;
    }

    public void setEventModifier(double mod) {
        this.eventModifier = Math.max(0.0, mod);
    }

    public double getEventModifier() {
        return this.eventModifier;
    }
}
