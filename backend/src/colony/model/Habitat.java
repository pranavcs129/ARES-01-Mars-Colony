package colony.model;

import colony.exception.ResourceDepletedException;
import java.util.Map;

/**
 * Habitat & Life Support Facility (Priority 1).
 * Vital crew quarters housing the colony astronauts.
 * Essential systems: atmospheric pressurization, MOXIE O2 circulation,
 * thermal loop, hydration, and nutritional dispensers.
 * PERMANENTLY PROTECTED — Cannot be throttled or powered down.
 */
public class Habitat extends Facility {
    private static final int CREW_COUNT = 12; // Standard Ares-1 astronaut crew complement
    private static final double BASE_POWER_DEMAND = 24.0; // kW (ECLSS life support + thermal loop + MOXIE)
    private static final double BASE_WATER_DEMAND = 12.0; // L/Sol (Crew hydration & hygiene net draw)
    private static final double BASE_OXYGEN_DEMAND = 10.0; // kg/Sol (Crew metabolic respiration: ~0.83 kg/astronaut/Sol)
    private static final double BASE_FOOD_DEMAND = 8.0;   // kg/Sol (Crew nutritional rations: ~0.67 kg/astronaut/Sol)
    private static final double BASE_MOXIE_O2_PROD = 5.0; // kg/Sol (MOXIE atmospheric processor yield)

    public Habitat() {
        super("Habitat Life Support", 1); // Priority 1 (Highest / Protected)
    }

    @Override
    public void operate(double deltaSols, Map<String, Resource> resources) throws ResourceDepletedException {
        Resource power = resources.get("Power");
        Resource water = resources.get("Water");
        Resource oxygen = resources.get("Oxygen");
        Resource food = resources.get("Food");

        // 1. Habitat consumes power, water, food, and oxygen for astronaut crew
        if (power != null) power.consume(calculateConsumption("Power") * deltaSols);
        if (water != null) water.consume(calculateConsumption("Water") * deltaSols);
        if (food != null) food.consume(calculateConsumption("Food") * deltaSols);
        if (oxygen != null) {
            oxygen.consume(calculateConsumption("Oxygen") * deltaSols);
            // 2. MOXIE atmospheric processor produces breathable O2 scaled by efficiency
            double moxieOutput = calculateOxygenProduction() * deltaSols;
            oxygen.produce(moxieOutput);
        }
    }

    /**
     * Calculates MOXIE atmospheric processor oxygen yield.
     * Proportional to operating level and physical condition of solid oxide cells.
     */
    public double calculateOxygenProduction() {
        return BASE_MOXIE_O2_PROD * getOperatingLevel() * (getCondition() / 100.0);
    }

    @Override
    public double calculateConsumption(String resourceName) {
        return getBaseDemand(resourceName) * getOperatingLevel();
    }

    @Override
    public double getBaseDemand(String resourceName) {
        switch (resourceName.toLowerCase()) {
            case "power": return BASE_POWER_DEMAND;
            case "water": return BASE_WATER_DEMAND;
            case "oxygen": return BASE_OXYGEN_DEMAND;
            case "food": return BASE_FOOD_DEMAND;
            default: return 0.0;
        }
    }

    public int getCrewCount() {
        return CREW_COUNT;
    }
}
