package colony.management;

import colony.model.*;
import colony.exception.ResourceDepletedException;
import java.util.*;

/**
 * ResourceManager manages all vital Martian resources.
 * Uses Java Collections (Map<String, Resource>) for fast lookup and traversal.
 * Tracks live generation, consumption, net balance, shortage detection,
 * and emergency reserve management.
 */
public class ResourceManager {
    private final Map<String, Resource> resources;

    public ResourceManager() {
        this.resources = new LinkedHashMap<>();
        initDefaultResources();
    }

    private void initDefaultResources() {
        addResource(new Oxygen(900.0, 1000.0, 200.0));
        addResource(new Water(800.0, 1000.0, 250.0));
        addResource(new Food(850.0, 1000.0, 200.0));
        addResource(new Power(480.0, 500.0, 100.0));
    }

    public void addResource(Resource res) {
        resources.put(res.getName(), res);
    }

    public Resource getResource(String name) {
        return resources.get(name);
    }

    public Collection<Resource> getAllResources() {
        return Collections.unmodifiableCollection(resources.values());
    }

    public Map<String, Resource> getResourceMap() {
        return resources;
    }

    /**
     * Calculates total colony consumption for a resource across all active facilities.
     */
    public double calculateTotalConsumption(String resourceName, List<Facility> facilities) {
        double total = 0.0;
        for (Facility f : facilities) {
            total += f.calculateConsumption(resourceName);
        }
        Resource res = getResource(resourceName);
        if (res != null) {
            res.setConsumptionRate(total);
        }
        return total;
    }

    /**
     * Calculates total baseline requirement (at 100% operation).
     */
    public double calculateBaselineDemand(String resourceName, List<Facility> facilities) {
        double total = 0.0;
        for (Facility f : facilities) {
            total += f.getBaseDemand(resourceName);
        }
        return total;
    }

    /**
     * Detects if an immediate generation shortage exists: Demand > Current Generation.
     * @return shortage amount (positive if shortage, 0.0 if balanced or surplus)
     */
    public double detectShortage(String resourceName, List<Facility> facilities) {
        Resource res = getResource(resourceName);
        if (res == null) return 0.0;
        double currentDemand = calculateTotalConsumption(resourceName, facilities);
        double production = res.getProductionRate();
        double deficit = currentDemand - production;
        return Math.max(0.0, deficit);
    }

    /**
     * Returns a list of all resources currently below emergency threshold (< 20%).
     */
    public List<Resource> getCriticalResources() {
        List<Resource> critical = new ArrayList<>();
        for (Resource r : resources.values()) {
            if (r.isCritical()) {
                critical.add(r);
            }
        }
        return critical;
    }

    /**
     * Returns a list of all resources currently below warning threshold (< 40%).
     */
    public List<Resource> getLowResources() {
        List<Resource> low = new ArrayList<>();
        for (Resource r : resources.values()) {
            if (r.isLow()) {
                low.add(r);
            }
        }
        return low;
    }

    /**
     * Draws from emergency reserve pool for a specific resource.
     */
    public double useEmergencyReserve(String resourceName, double amount) {
        Resource res = getResource(resourceName);
        if (res != null) {
            return res.drawEmergencyReserve(amount);
        }
        return 0.0;
    }

    /**
     * Determines overall colony status string based on resource states.
     */
    public String determineColonyStatus() {
        if (!getCriticalResources().isEmpty()) {
            return "CRITICAL CRISIS";
        }
        if (!getLowResources().isEmpty()) {
            return "RESOURCE CONSTRAINED";
        }
        return "STABLE";
    }

    public void printResourceSummary() {
        System.out.println("--------------------------------------------------------------------------------");
        System.out.println("COLONY RESOURCE BALANCES:");
        for (Resource r : resources.values()) {
            System.out.println("  * " + r.toString());
        }
        System.out.println("--------------------------------------------------------------------------------");
    }

    public void reset() {
        resources.clear();
        initDefaultResources();
    }
}
