package colony.exception;

/**
 * Thrown when an event or disaster causes severe mechanical failure in a facility.
 */
public class FacilityDamagedException extends ColonyException {
    private final String facilityName;
    private final double condition;

    public FacilityDamagedException(String facilityName, double condition, String message) {
        super(message);
        this.facilityName = facilityName;
        this.condition = condition;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public double getCondition() {
        return condition;
    }
}
