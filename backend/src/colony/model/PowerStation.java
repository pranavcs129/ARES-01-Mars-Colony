package colony.model;

import colony.exception.ResourceDepletedException;
import java.util.Map;

/**
 * Primary Colony Power Generation Facility (Priority 2).
 * Combines high-efficiency solar panel arrays and a Kilopower nuclear reactor.
 * Baseline output: 120 kW.
 * Event modifiers (e.g. Dust Storm) directly affect generation rate.
 */
public class PowerStation extends Facility {
    private static final double BASE_GENERATION = 52.0; // kW (Nominal solar array + Kilopower reactor)
    private double eventModifier = 1.0; // Multiplier from disasters (e.g. 0.15 during Dust Storm)
    private double auxiliaryBackup = 0.0; // Additional +25 kW from backup generator

    public PowerStation() {
        super("Power Station", 2); // Priority 2
    }

    @Override
    public void operate(double deltaSols, Map<String, Resource> resources) throws ResourceDepletedException {
        Resource power = resources.get("Power");
        if (power != null) {
            double effectiveGen = calculateProduction() * deltaSols;
            power.produce(effectiveGen);
        }
    }

    public double calculateProduction() {
        double efficiency = (getCondition() / 100.0) * getOperatingLevel();
        return (BASE_GENERATION * eventModifier * efficiency) + auxiliaryBackup;
    }

    @Override
    public double calculateConsumption(String resourceName) {
        return 0.0; // Power station generates power, does not consume
    }

    @Override
    public double getBaseDemand(String resourceName) {
        return 0.0;
    }

    public void setEventModifier(double mod) {
        this.eventModifier = Math.max(0.0, mod);
    }

    public double getEventModifier() {
        return this.eventModifier;
    }

    public void setAuxiliaryBackup(double backupKW) {
        this.auxiliaryBackup = backupKW;
    }

    public double getAuxiliaryBackup() {
        return this.auxiliaryBackup;
    }
}
