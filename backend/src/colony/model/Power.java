package colony.model;

/**
 * Power/Energy resource (measured in kW flux and stored in kWh batteries).
 * Primary lifeblood of the Martian colony: drives life support, extraction,
 * thermal regulation, and science experiments.
 */
public class Power extends Resource {
    public Power(double currentAmount, double maximumCapacity, double reserveLevel) {
        super("Power", "kW", currentAmount, maximumCapacity, reserveLevel);
    }

    public Power() {
        this(480.0, 500.0, 100.0);
    }
}
