package colony.exception;

/**
 * Thrown when a resource drops to 0 or insufficient quantity exists for consumption.
 */
public class ResourceDepletedException extends ColonyException {
    private static final long serialVersionUID = 1L;
    private final String resourceName;

    public ResourceDepletedException(String resourceName, String message) {
        super(message);
        this.resourceName = resourceName;
    }

    public String getResourceName() {
        return resourceName;
    }
}
