package colony.model;

import colony.exception.ResourceDepletedException;
import java.util.Map;

/**
 * Landing Zone & Heavy Industrial Logistics (Priority 5).
 * Operates heavy regolith mining augers, storage depot thermal loops,
 * and rocket telemetry transponders.
 * Baseline requirements: 7.0 kW Power.
 * Lowest priority non-essential operations: first to be reduced or paused (0%)
 * when a resource shortage occurs.
 */
public class LandingZone extends Facility {
    private static final double BASE_POWER_DEMAND = 7.0; // kW

    public LandingZone() {
        super("Landing & Logistics", 5); // Priority 5 (Lowest / Reducible)
    }

    @Override
    public void operate(double deltaSols, Map<String, Resource> resources) throws ResourceDepletedException {
        if (getOperatingLevel() <= 0) return;

        Resource power = resources.get("Power");
        if (power != null) {
            power.consume(calculateConsumption("Power") * deltaSols);
        }
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
}
