package colony.model;

import colony.exception.ResourceDepletedException;

/**
 * Abstract base class representing a vital Martian colony resource.
 * Demonstrates encapsulation (private fields, controlled getters/setters)
 * and abstraction (template methods for lifecycle management).
 */
public abstract class Resource {
    private final String name;
    private final String unit;
    private double currentAmount;
    private double maximumCapacity;
    private double productionRate;  // per Sol or per hour depending on delta
    private double consumptionRate; // per Sol or per hour
    private double reserveLevel;    // Emergency buffer separated from active storage

    public Resource(String name, String unit, double currentAmount, double maximumCapacity, double reserveLevel) {
        this.name = name;
        this.unit = unit;
        this.currentAmount = Math.min(maximumCapacity, Math.max(0.0, currentAmount));
        this.maximumCapacity = maximumCapacity;
        this.reserveLevel = reserveLevel;
        this.productionRate = 0.0;
        this.consumptionRate = 0.0;
    }

    /**
     * Adds produced resource into the active storage pool up to maximum capacity.
     * @param amount quantity produced
     */
    public void produce(double amount) {
        if (amount <= 0) return;
        this.currentAmount = Math.min(this.maximumCapacity, this.currentAmount + amount);
    }

    /**
     * Consumes resource from the active pool.
     * @param amount quantity to consume
     * @throws ResourceDepletedException if pool drops to 0
     */
    public void consume(double amount) throws ResourceDepletedException {
        if (amount <= 0) return;
        if (this.currentAmount < amount) {
            double shortfall = amount - this.currentAmount;
            this.currentAmount = 0.0;
            throw new ResourceDepletedException(this.name, 
                String.format("Critical: %s depleted! Required: %.1f %s, shortfall: %.1f %s", 
                    name, amount, unit, shortfall, unit));
        }
        this.currentAmount -= amount;
    }

    /**
     * Net resource balance: Production Rate - Consumption Rate.
     * Positive = surplus, Negative = deficit/shortage.
     */
    public double getBalance() {
        return this.productionRate - this.consumptionRate;
    }

    /**
     * Returns current storage level as a percentage (0 - 100%).
     */
    public double getPercentage() {
        if (maximumCapacity <= 0) return 0.0;
        return (currentAmount / maximumCapacity) * 100.0;
    }

    /**
     * Identifies if storage has fallen below warning threshold (< 40%).
     */
    public boolean isLow() {
        return getPercentage() < 40.0;
    }

    /**
     * Identifies if storage has fallen below emergency threshold (< 20%).
     */
    public boolean isCritical() {
        return getPercentage() < 20.0;
    }

    /**
     * Transfers emergency reserve into active pool.
     */
    public double drawEmergencyReserve(double requestAmount) {
        double drawn = Math.min(reserveLevel, requestAmount);
        reserveLevel -= drawn;
        currentAmount = Math.min(maximumCapacity, currentAmount + drawn);
        return drawn;
    }

    // Getters and controlled setters
    public String getName() { return name; }
    public String getUnit() { return unit; }
    public double getCurrentAmount() { return currentAmount; }
    public void setCurrentAmount(double currentAmount) {
        this.currentAmount = Math.min(maximumCapacity, Math.max(0.0, currentAmount));
    }
    public double getMaximumCapacity() { return maximumCapacity; }
    public void setMaximumCapacity(double maximumCapacity) { this.maximumCapacity = maximumCapacity; }
    public double getProductionRate() { return productionRate; }
    public void setProductionRate(double productionRate) { this.productionRate = productionRate; }
    public double getConsumptionRate() { return consumptionRate; }
    public void setConsumptionRate(double consumptionRate) { this.consumptionRate = consumptionRate; }
    public double getReserveLevel() { return reserveLevel; }
    public void setReserveLevel(double reserveLevel) { this.reserveLevel = reserveLevel; }

    @Override
    public String toString() {
        return String.format("%s: %.1f / %.1f %s (%.1f%%) | Prod: +%.1f, Cons: -%.1f | Bal: %+.1f %s",
                name, currentAmount, maximumCapacity, unit, getPercentage(), 
                productionRate, consumptionRate, getBalance(), unit);
    }
}
