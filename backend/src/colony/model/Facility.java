package colony.model;

import colony.exception.FacilityDamagedException;
import colony.exception.InvalidOperatingLevelException;
import colony.exception.ResourceDepletedException;
import java.util.Map;

/**
 * Abstract base class representing a Martian Colony facility.
 * Demonstrates:
 * - Encapsulation (private fields, controlled setters with validation)
 * - Abstraction (abstract operate() and calculateConsumption())
 * - Polymorphism (each subclass implements its own input/output profile)
 */
public abstract class Facility {
    private final String name;
    private double operatingLevel; // 0.0 (0% / PAUSED) to 1.0 (100% / FULL)
    private double condition;      // 0.0 (Destroyed) to 100.0 (Optimal)
    private final int priority;    // 1 = Critical (Life Support), 5 = Lowest (Logistics)
    private boolean active;

    public Facility(String name, int priority) {
        this.name = name;
        this.priority = priority;
        this.operatingLevel = 1.0;
        this.condition = 100.0;
        this.active = true;
    }

    /**
     * Executes facility operations over a delta period (fraction of a Sol).
     * Consumes required input resources and produces output resources.
     * @param deltaSols time elapsed in Sols (e.g. 1.0 for a full Sol, or 1/24 for 1 hour)
     * @param resources colony resource map
     * @throws ResourceDepletedException if critical inputs are exhausted
     */
    public abstract void operate(double deltaSols, Map<String, Resource> resources) throws ResourceDepletedException;

    /**
     * Calculates current consumption draw for a specific resource based on operatingLevel.
     * @param resourceName resource key (e.g. "Power", "Water", "Oxygen", "Food")
     * @return draw rate in resource units per Sol
     */
    public abstract double calculateConsumption(String resourceName);

    /**
     * Calculates baseline demand (at 100% operation) for a specific resource.
     */
    public abstract double getBaseDemand(String resourceName);

    /**
     * Sets the operating level [0.0 to 1.0].
     * Priority 1 systems (Life Support) cannot be reduced below 1.0.
     * @throws InvalidOperatingLevelException if level is out of bounds or protected
     */
    public void setOperatingLevel(double level) throws InvalidOperatingLevelException {
        if (this.priority == 1 && level < 1.0) {
            throw new InvalidOperatingLevelException(this.name, level, 
                "Violation: Life Support is permanently locked at 100% (PROTECTED) and cannot be throttled.");
        }
        if (level < 0.0 || level > 1.0) {
            throw new InvalidOperatingLevelException(this.name, level, 
                "Operating level must be between 0.0 (0%) and 1.0 (100%).");
        }
        this.operatingLevel = Math.round(level * 100.0) / 100.0;
        this.active = (this.operatingLevel > 0.0);
    }

    /**
     * Applies physical wear or disaster damage to the facility.
     * @param amount damage percentage (0 - 100)
     * @throws FacilityDamagedException if condition falls below critical threshold (< 20%)
     */
    public void damage(double amount) throws FacilityDamagedException {
        this.condition = Math.max(0.0, this.condition - amount);
        if (this.condition < 20.0) {
            // Auto-throttle under severe physical damage
            this.operatingLevel = Math.min(this.operatingLevel, 0.5);
            throw new FacilityDamagedException(this.name, this.condition,
                String.format("Critical structural damage to %s: Mechanical condition at %.1f%%!", this.name, this.condition));
        }
    }

    /**
     * Performs repair on the facility.
     * @param amount repair percentage (0 - 100)
     */
    public void repair(double amount) {
        this.condition = Math.min(100.0, this.condition + amount);
    }

    /**
     * Applies gradual wear from operational run-time, resource stress, and environmental exposure.
     * Normal operation causes realistic subtle degradation (0.2% - 0.4%/Sol).
     * Resource starvation or disasters accelerate wear.
     */
    public void applyGradualWear(double deltaSols, boolean hasResourceStress, boolean hasDisaster) {
        double wearRate = 0.25 * operatingLevel; // Base mechanical wear
        if (hasResourceStress) {
            wearRate += 0.50; // Thermal/lubrication stress under shortages
        }
        if (hasDisaster) {
            wearRate += 0.40; // Environmental particulate abrasion
        }
        this.condition = Math.max(10.0, this.condition - (wearRate * deltaSols));
        this.condition = Math.round(this.condition * 100.0) / 100.0;
    }

    /**
     * Applies autonomous engineering drone routine maintenance when colony is stable.
     * Prevents unrealistically low condition during prolonged nominal operations,
     * maintaining a realistic operational equilibrium around 94% - 98%.
     */
    public void applyGradualMaintenance(double deltaSols, boolean colonyStable) {
        if (colonyStable && this.condition < 98.0) {
            double maintRate = 0.35; // Gentle drone upkeep
            this.condition = Math.min(98.0, this.condition + (maintRate * deltaSols));
            this.condition = Math.round(this.condition * 100.0) / 100.0;
        }
    }

    /**
     * Calculates combined operating efficiency factor [0.0 - 1.0].
     */
    public double getEfficiency() {
        return (this.condition / 100.0) * this.operatingLevel;
    }

    // Getters and Setters
    public String getName() { return name; }
    public double getOperatingLevel() { return operatingLevel; }
    public double getCondition() { return condition; }
    public void setCondition(double condition) { this.condition = Math.max(0.0, Math.min(100.0, condition)); }
    public int getPriority() { return priority; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getStatusLabel() {
        if (priority == 1) return "PROTECTED";
        if (operatingLevel == 0.0) return "PAUSED";
        if (operatingLevel < 1.0) return "REDUCED (" + (int)(operatingLevel * 100) + "%)";
        return "NOMINAL";
    }

    @Override
    public String toString() {
        return String.format("[%s] Priority: %d | Level: %.0f%% | Cond: %.1f%% | %s",
                name, priority, operatingLevel * 100.0, condition, getStatusLabel());
    }
}
