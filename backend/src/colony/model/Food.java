package colony.model;

/**
 * Food resource (measured in kg).
 * Produced through Controlled Environment Agriculture (CEA) inside the Greenhouse.
 * Consumed by colonists in Habitat Life Support.
 */
public class Food extends Resource {
    public Food(double currentAmount, double maximumCapacity, double reserveLevel) {
        super("Food", "kg", currentAmount, maximumCapacity, reserveLevel);
    }

    public Food() {
        this(850.0, 1000.0, 200.0);
    }
}
