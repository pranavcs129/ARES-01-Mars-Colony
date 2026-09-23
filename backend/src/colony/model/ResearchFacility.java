package colony.model;

import colony.exception.ResourceDepletedException;
import java.util.Map;

/**
 * Astrobiology & Geology Research Facility (Priority 4).
 * Runs Martian rock spectroscopy, soil sample testing, and microbiology cultures.
 * Consumes: Power (4.0 kW) + Water (1.0 L/Sol).
 * Non-essential during crisis: reduced to 50%, 25%, or paused (0%) when power is short.
 */
public class ResearchFacility extends Facility {
    private static final double BASE_POWER_DEMAND = 4.0; // kW
    private static final double BASE_WATER_DEMAND = 1.0; // L/Sol

    public ResearchFacility() {
        super("Research Facility", 4); // Priority 4 (Reducible)
    }

    @Override
    public void operate(double deltaSols, Map<String, Resource> resources) throws ResourceDepletedException {
        if (getOperatingLevel() <= 0) return;

        Resource power = resources.get("Power");
        Resource water = resources.get("Water");

        if (power != null) {
            power.consume(calculateConsumption("Power") * deltaSols);
        }
        if (water != null) {
            water.consume(calculateConsumption("Water") * deltaSols);
        }
    }

    @Override
    public double calculateConsumption(String resourceName) {
        if ("power".equalsIgnoreCase(resourceName)) {
            return BASE_POWER_DEMAND * getOperatingLevel();
        }
        if ("water".equalsIgnoreCase(resourceName)) {
            return BASE_WATER_DEMAND * getOperatingLevel();
        }
        return 0.0;
    }

    @Override
    public double getBaseDemand(String resourceName) {
        if ("power".equalsIgnoreCase(resourceName)) return BASE_POWER_DEMAND;
        if ("water".equalsIgnoreCase(resourceName)) return BASE_WATER_DEMAND;
        return 0.0;
    }
}
