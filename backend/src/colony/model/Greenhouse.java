package colony.model;

import colony.exception.ResourceDepletedException;
import java.util.Map;

/**
 * CEA Greenhouse Biodome Facility (Priority 3).
 * Controlled Environment Agriculture (aeroponics and LED grow lights).
 * Consumes: Power (6.0 kW) + Water (20.0 L/Sol).
 * Produces: Food (15.0 kg/Sol).
 * During water shortages, load shedding reduces greenhouse irrigation to preserve habitat water.
 */
public class Greenhouse extends Facility {
    private static final double BASE_POWER_DEMAND = 6.0;  // kW
    private static final double BASE_WATER_DEMAND = 15.0; // L/Sol (Aeroponic irrigation)
    private static final double BASE_FOOD_PROD = 12.5;    // kg/Sol (Biomass caloric yield)
    private static final double BASE_OXYGEN_PROD = 0.5;   // kg/Sol (Photosynthetic O2 byproduct)

    public Greenhouse() {
        super("Greenhouse", 3); // Priority 3
    }

    @Override
    public void operate(double deltaSols, Map<String, Resource> resources) throws ResourceDepletedException {
        Resource power = resources.get("Power");
        Resource water = resources.get("Water");
        Resource food = resources.get("Food");
        Resource oxygen = resources.get("Oxygen");

        // 1. Consume inputs (scaled by operating level)
        if (power != null) {
            power.consume(calculateConsumption("Power") * deltaSols);
        }
        if (water != null) {
            water.consume(calculateConsumption("Water") * deltaSols);
        }

        // 2. Produce Food
        if (food != null) {
            double effectiveFood = calculateFoodProduction() * deltaSols;
            food.produce(effectiveFood);
        }

        // 3. Produce photosynthetic Oxygen byproduct
        if (oxygen != null) {
            double effectiveO2 = calculateOxygenProduction() * deltaSols;
            oxygen.produce(effectiveO2);
        }
    }

    public double calculateFoodProduction() {
        return BASE_FOOD_PROD * getOperatingLevel() * (getCondition() / 100.0);
    }

    public double calculateOxygenProduction() {
        return BASE_OXYGEN_PROD * getOperatingLevel() * (getCondition() / 100.0);
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
