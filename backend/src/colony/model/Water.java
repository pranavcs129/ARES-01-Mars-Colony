package colony.model;

/**
 * Water resource (measured in Liters). Essential for hydration and CEA crop growth.
 * Extracted from subsurface regolith ice by WaterExtractor.
 */
public class Water extends Resource {
    public Water(double currentAmount, double maximumCapacity, double reserveLevel) {
        super("Water", "L", currentAmount, maximumCapacity, reserveLevel);
    }

    public Water() {
        this(800.0, 1000.0, 250.0);
    }
}
