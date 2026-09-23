package colony.exception;

/**
 * Base exception for Mars Colony simulation errors.
 */
public class ColonyException extends Exception {
    public ColonyException(String message) {
        super(message);
    }

    public ColonyException(String message, Throwable cause) {
        super(message, cause);
    }
}
