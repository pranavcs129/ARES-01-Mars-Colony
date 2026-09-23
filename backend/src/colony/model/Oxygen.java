package colony.model;

/**
 * Oxygen resource (measured in kg). Essential for colonist life support.
 * Produced by MOXIE / Sabatier and consumed primarily by Habitat Life Support.
 */
public class Oxygen extends Resource {
    public Oxygen(double currentAmount, double maximumCapacity, double reserveLevel) {
        super("Oxygen", "kg", currentAmount, maximumCapacity, reserveLevel);
    }

    public Oxygen() {
        this(900.0, 1000.0, 200.0);
    }
}
