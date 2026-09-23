package colony.exception;

/**
 * Thrown when attempting to set an invalid facility operating level outside [0.0, 1.0]
 * or attempting to manually throttle protected systems like Life Support.
 */
public class InvalidOperatingLevelException extends ColonyException {
    private final String facilityName;
    private final double attemptedLevel;

    public InvalidOperatingLevelException(String facilityName, double attemptedLevel, String message) {
        super(message);
        this.facilityName = facilityName;
        this.attemptedLevel = attemptedLevel;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public double getAttemptedLevel() {
        return attemptedLevel;
    }
}
