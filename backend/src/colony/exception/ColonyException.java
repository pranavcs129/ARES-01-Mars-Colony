package colony.exception;

/**
 * Base exception for Mars Colony simulation errors.
 */
public class ColonyException extends Exception {
    private static final long serialVersionUID = 1L;

    public ColonyException(String message) {
        super(message);
    }

    public ColonyException(String message, Throwable cause) {
        super(message, cause);
    }
}
