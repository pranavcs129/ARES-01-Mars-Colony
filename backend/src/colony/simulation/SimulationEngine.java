package colony.simulation;

import colony.event.*;
import colony.exception.ResourceDepletedException;
import colony.management.ManagementSystem;
import colony.management.RecoverySystem;
import colony.management.ResourceManager;
import colony.model.*;
import java.util.*;

/**
 * SimulationEngine — Central simulation director.
 * Implements the deterministic 13-step Sol progression cycle:
 * 1. Read current colony state
 * 2. Apply environment/event modifiers
 * 3. Determine facility operating levels
 * 4. Produce resources
 * 5. Consume resources
 * 6. Apply transfers/storage changes
 * 7. Calculate net resource balance
 * 8. Detect shortages/surpluses
 * 9. Automatic management responds (autonomous load shedding)
 * 10. Apply facility condition changes (gradual wear and routine drone maintenance)
 * 11. Calculate composite colony health & status
 * 12. Save/update current state
 * 13. Record history
 */
public class SimulationEngine {
    private int sol;
    private double hour;
    private final ResourceManager resourceManager;
    private final ManagementSystem managementSystem;
    private final RecoverySystem recoverySystem;
    private final List<Facility> facilities;
    private final List<Event> activeEvents;
    private final List<ColonyState.HistoryPoint> history;
    private double currentColonyHealth;
    private boolean debugLogging = true;

    public SimulationEngine() {
        this.sol = 1;
        this.hour = 8.0;
        this.resourceManager = new ResourceManager();
        this.managementSystem = new ManagementSystem();
        this.recoverySystem = new RecoverySystem();
        this.facilities = new ArrayList<>();
        this.activeEvents = new ArrayList<>();
        this.history = new ArrayList<>();
        this.currentColonyHealth = 88.0;

        initColonyFacilities();
        evaluateShortageAndManagement();
        recordHistoryPoint();
    }

    private void initColonyFacilities() {
        // Priority 1: Life Support (Permanently protected)
        facilities.add(new Habitat());
        // Priority 2: Primary Generation & Extraction
        facilities.add(new PowerStation());
        facilities.add(new WaterExtractor());
        // Priority 3: Food Agriculture
        facilities.add(new Greenhouse());
        // Priority 4: Science & Research
        facilities.add(new ResearchFacility());
        // Priority 5: Mining & Logistics
        facilities.add(new LandingZone());
    }

    /**
     * Synchronizes live production rates for all generation facilities.
     */
    public void updateProductionRates() {
        // Natural Sol-to-Sol environmental micro-variation (±2.5% atmospheric turbidity)
        double envVariance = 1.0 + (Math.sin(sol * 1.7) * 0.025);

        PowerStation ps = getFacility(PowerStation.class);
        if (ps != null) {
            Resource power = resourceManager.getResource("Power");
            if (power != null) {
                // Solar array baseline undergoes slight diurnal/atmospheric flux
                double gen = ps.calculateProduction() * (ps.getEventModifier() < 1.0 ? 1.0 : envVariance);
                power.setProductionRate(Math.round(gen * 10.0) / 10.0);
            }
        }

        WaterExtractor we = getFacility(WaterExtractor.class);
        if (we != null) {
            Resource water = resourceManager.getResource("Water");
            if (water != null) {
                double prod = we.calculateWaterProduction() * (we.getEventModifier() < 1.0 ? 1.0 : (2.0 - envVariance));
                water.setProductionRate(Math.round(prod * 10.0) / 10.0);
            }
        }

        Greenhouse gh = getFacility(Greenhouse.class);
        if (gh != null) {
            Resource food = resourceManager.getResource("Food");
            if (food != null) {
                food.setProductionRate(Math.round(gh.calculateFoodProduction() * 10.0) / 10.0);
            }
        }

        Habitat hab = getFacility(Habitat.class);
        if (hab != null) {
            Resource oxygen = resourceManager.getResource("Oxygen");
            if (oxygen != null) {
                double totalO2 = hab.calculateOxygenProduction() + (gh != null ? gh.calculateOxygenProduction() : 0.0);
                oxygen.setProductionRate(Math.round(totalO2 * 10.0) / 10.0);
            }
        }
    }

    /**
     * Evaluates current generation vs demand and executes autonomous load shedding if shortage detected.
     */
    public void evaluateShortageAndManagement() {
        updateProductionRates();
        resourceManager.calculateTotalConsumption("Power", facilities);
        resourceManager.calculateTotalConsumption("Water", facilities);
        resourceManager.calculateTotalConsumption("Oxygen", facilities);
        resourceManager.calculateTotalConsumption("Food", facilities);

        double powerShortage = resourceManager.detectShortage("Power", facilities);
        double waterShortage = resourceManager.detectShortage("Water", facilities);

        String bottleneck = (waterShortage > 0.0 && powerShortage == 0.0) ? "Water" : "Power";
        managementSystem.manageResourceShortage(bottleneck, facilities, resourceManager.getResourceMap(),
                                                recoverySystem.getLastRecoveryActions());
    }

    /**
     * Executes the mandatory 13-step simulation sequence for one Sol.
     * @return generated ColonyState snapshot
     */
    public ColonyState stepSol() {
        double deltaSols = 1.0;

        // Capture previous resource amounts for concise debug logging
        Map<String, Double> prevAmounts = new LinkedHashMap<>();
        for (Resource r : resourceManager.getAllResources()) {
            prevAmounts.put(r.getName(), r.getCurrentAmount());
        }

        // STEP 1 & 2: Apply active events & update environment modifiers
        for (Event e : activeEvents) {
            if (e.isActive()) {
                e.applyEffect(this);
            }
        }

        // STEP 3: Determine facility operating levels (accounting for ongoing recovery)
        boolean hasActiveDisaster = !activeEvents.isEmpty();
        recoverySystem.tickRecovery(deltaSols, facilities, resourceManager.getResourceMap(), hasActiveDisaster);
        updateProductionRates();

        // STEP 4 & 5: Produce resources & consume resources
        for (Facility f : facilities) {
            try {
                f.operate(deltaSols, resourceManager.getResourceMap());
            } catch (ResourceDepletedException e) {
                System.err.println("WARNING: " + e.getMessage());
            }
        }

        // STEP 6 & 7: Calculate net resource balances & consumption totals
        resourceManager.calculateTotalConsumption("Power", facilities);
        resourceManager.calculateTotalConsumption("Water", facilities);
        resourceManager.calculateTotalConsumption("Oxygen", facilities);
        resourceManager.calculateTotalConsumption("Food", facilities);
        updateProductionRates();

        // STEP 8: Detect shortages
        double powerShortage = resourceManager.detectShortage("Power", facilities);
        double waterShortage = resourceManager.detectShortage("Water", facilities);

        // STEP 9: Automatic management responds (autonomous load shedding)
        String bottleneck = (waterShortage > 0.0 && powerShortage == 0.0) ? "Water" : "Power";
        managementSystem.manageResourceShortage(bottleneck, facilities, resourceManager.getResourceMap(),
                                                recoverySystem.getLastRecoveryActions());

        // STEP 10: Apply facility condition changes (gradual wear & routine drone maintenance)
        boolean hasResourceStress = (powerShortage > 0.0 || waterShortage > 0.0);
        String currentStatus = resourceManager.determineColonyStatus();
        boolean colonyStable = "STABLE".equalsIgnoreCase(currentStatus) && !hasActiveDisaster;

        for (Facility f : facilities) {
            f.applyGradualWear(deltaSols, hasResourceStress, hasActiveDisaster);
            f.applyGradualMaintenance(deltaSols, colonyStable);
        }

        // STEP 11: Calculate composite colony health & status
        ColonyState.HealthData health = calculateColonyHealth();
        String colonyStatus = health.status;

        // Advance Sol counter and tick active events
        this.sol += 1;
        this.hour = 8.0;

        List<Event> toRemove = new ArrayList<>();
        for (Event e : activeEvents) {
            e.tick(deltaSols);
            if (!e.isActive()) {
                toRemove.add(e);
            }
        }
        activeEvents.removeAll(toRemove);

        // Reset modifiers gradually if event ended
        if (activeEvents.isEmpty()) {
            PowerStation ps = getFacility(PowerStation.class);
            if (ps != null && ps.getEventModifier() < 1.0) {
                ps.setEventModifier(Math.min(1.0, ps.getEventModifier() + 0.50));
            }
            WaterExtractor we = getFacility(WaterExtractor.class);
            if (we != null && we.getEventModifier() < 1.0) {
                we.setEventModifier(Math.min(1.0, we.getEventModifier() + 0.50));
            }
            updateProductionRates();
        }

        // STEP 12 & 13: Save/update current state & record history
        recordHistoryPoint();
        ColonyState state = getCurrentState(colonyStatus);

        // Concise simulation debug output
        if (debugLogging) {
            printDebugSummary(prevAmounts, state);
        }

        return state;
    }

    /**
     * Calculates composite colony health based on resources, facility condition, and environmental state.
     */
    public ColonyState.HealthData calculateColonyHealth() {
        Resource o2 = resourceManager.getResource("Oxygen");
        Resource water = resourceManager.getResource("Water");
        Resource food = resourceManager.getResource("Food");
        Resource power = resourceManager.getResource("Power");

        double o2Pct = o2 != null ? o2.getPercentage() : 100.0;
        double waterPct = water != null ? water.getPercentage() : 100.0;
        double foodPct = food != null ? food.getPercentage() : 100.0;
        double powerPct = power != null ? power.getPercentage() : 100.0;

        double avgResource = (o2Pct * 0.35 + waterPct * 0.30 + foodPct * 0.20 + powerPct * 0.15);
        double minResource = Math.min(Math.min(o2Pct, waterPct), Math.min(foodPct, powerPct));
        double resourceScore = (avgResource * 0.6) + (minResource * 0.4);

        double totalCond = 0.0;
        double totalEff = 0.0;
        for (Facility f : facilities) {
            totalCond += f.getCondition();
            totalEff += f.getEfficiency() * 100.0;
        }
        double facScore = facilities.isEmpty() ? 100.0 : ((totalCond / facilities.size()) * 0.5 + (totalEff / facilities.size()) * 0.5);

        double envScore = 100.0;
        for (Event e : activeEvents) {
            if (e.isActive()) {
                if (e.getSeverity() == Event.Severity.CRITICAL) envScore -= 30.0;
                else if (e.getSeverity() == Event.Severity.HIGH) envScore -= 20.0;
                else envScore -= 10.0;
            }
        }
        envScore = Math.max(0.0, envScore);

        double targetHealth = (resourceScore * 0.50) + (facScore * 0.30) + (envScore * 0.20);
        // Smooth gradual interpolation
        double newHealth = this.currentColonyHealth + (targetHealth - this.currentColonyHealth) * 0.35;
        newHealth = Math.max(5.0, Math.min(100.0, Math.round(newHealth * 10.0) / 10.0));
        this.currentColonyHealth = newHealth;

        String healthStatus = "STABLE";
        if (newHealth < 40.0) healthStatus = "SURVIVAL EMERGENCY";
        else if (newHealth < 60.0) healthStatus = "CRITICAL";
        else if (newHealth < 80.0) healthStatus = "STRAINED";

        return new ColonyState.HealthData(newHealth, healthStatus);
    }

    private void recordHistoryPoint() {
        Resource o2 = resourceManager.getResource("Oxygen");
        Resource water = resourceManager.getResource("Water");
        Resource food = resourceManager.getResource("Food");
        Resource power = resourceManager.getResource("Power");

        double o2Val = o2 != null ? o2.getCurrentAmount() : 900.0;
        double waterVal = water != null ? water.getCurrentAmount() : 800.0;
        double foodVal = food != null ? food.getCurrentAmount() : 850.0;
        double powerVal = power != null ? power.getCurrentAmount() : 480.0;

        history.add(new ColonyState.HistoryPoint(this.sol, o2Val, waterVal, foodVal, powerVal, this.currentColonyHealth));
        if (history.size() > 30) {
            history.remove(0);
        }
    }

    private void printDebugSummary(Map<String, Double> prev, ColonyState state) {
        System.out.println("----------------------------------------------------------------");
        System.out.printf("SOL %d TELEMETRY SUMMARY:\n", this.sol);
        for (String rName : prev.keySet()) {
            double before = prev.get(rName);
            ColonyState.ResourceData rd = state.getResources().get(rName);
            double after = rd != null ? rd.current : before;
            double diff = after - before;
            String sign = diff >= 0 ? "+" : "";
            System.out.printf("  %-6s: %6.1f → %6.1f %s (%s%.1f %s/Sol)\n",
                    rName.toUpperCase(), before, after, rd != null ? rd.unit : "", sign, diff, rd != null ? rd.unit : "");
        }
        System.out.println("Facilities:");
        for (ColonyState.FacilityData fd : state.getFacilities()) {
            System.out.printf("  • %-22s: %3.0f%% (Cond: %4.1f%%) [%s]\n",
                    fd.name, fd.operatingLevelPct, fd.conditionPct, fd.statusLabel);
        }
        System.out.printf("Colony Health: %.1f%% [%s] | Events: %s\n",
                state.getHealth().score, state.getHealth().status,
                state.getActiveEvents().isEmpty() ? "NONE" : state.getActiveEvents().get(0).name);
        System.out.println("----------------------------------------------------------------");
    }

    public ColonyState getCurrentState(String status) {
        Power power = (Power) resourceManager.getResource("Power");
        ColonyState.HealthData healthData = calculateColonyHealth();
        return new ColonyState(
            this.sol,
            this.hour,
            status != null ? status : healthData.status,
            resourceManager.getAllResources(),
            this.facilities,
            this.activeEvents,
            managementSystem.getLastResponseActions(),
            recoverySystem.isBackupPowerActive(),
            recoverySystem.getRecoveryStatus(power),
            healthData,
            this.history
        );
    }

    public ColonyState getCurrentState() {
        return getCurrentState(null);
    }

    /**
     * Resets the entire simulation back to Sol 1 nominal state.
     */
    public void reset() {
        this.sol = 1;
        this.hour = 8.0;
        this.activeEvents.clear();
        this.resourceManager.reset();
        this.facilities.clear();
        this.recoverySystem.reset();
        this.history.clear();
        this.currentColonyHealth = 88.0;
        initColonyFacilities();
        evaluateShortageAndManagement();
        recordHistoryPoint();
    }

    /**
     * Injects a disaster event into the colony simulation.
     */
    public void triggerEvent(Event event) {
        this.activeEvents.add(event);
        event.applyEffect(this);
        evaluateShortageAndManagement();
    }

    /**
     * Injects an event by type string.
     */
    public Event triggerEventByType(String type, double duration) {
        if (type == null) return null;
        double dur = duration > 0 ? duration : 3.0;
        Event event;
        String t = type.trim().toLowerCase();
        if (t.contains("dust") || t.contains("storm")) {
            event = new DustStorm(dur);
        } else if (t.contains("power") || t.contains("grid")) {
            event = new PowerFailure(dur);
        } else if (t.contains("contam")) {
            event = new WaterContamination(dur);
        } else if (t.contains("water") || t.contains("pump")) {
            event = new WaterFailure(dur);
        } else if (t.contains("flare") || t.contains("solar")) {
            event = new SolarFlare(dur);
        } else if (t.contains("meteor") || t.contains("impact")) {
            event = new MicrometeoroidImpact(dur);
        } else if (t.contains("equip") || t.contains("damage")) {
            event = new EquipmentFailure(dur);
        } else {
            event = new DustStorm(dur);
        }
        triggerEvent(event);
        return event;
    }

    /**
     * Toggles auxiliary backup generator.
     */
    public boolean toggleBackupPower() {
        PowerStation ps = getFacility(PowerStation.class);
        boolean active = recoverySystem.toggleBackupPower(ps);
        updateProductionRates();
        return active;
    }

    @SuppressWarnings("unchecked")
    public <T extends Facility> T getFacility(Class<T> facilityClass) {
        for (Facility f : facilities) {
            if (facilityClass.isInstance(f)) {
                return (T) f;
            }
        }
        return null;
    }

    public Facility getFacilityByName(String name) {
        for (Facility f : facilities) {
            if (f.getName().equalsIgnoreCase(name) || f.getName().toLowerCase().contains(name.toLowerCase())) {
                return f;
            }
        }
        return null;
    }

    // Accessors
    public int getSol() { return sol; }
    public double getHour() { return hour; }
    public ResourceManager getResourceManager() { return resourceManager; }
    public ManagementSystem getManagementSystem() { return managementSystem; }
    public RecoverySystem getRecoverySystem() { return recoverySystem; }
    public List<Facility> getFacilities() { return facilities; }
    public List<Event> getActiveEvents() { return activeEvents; }
    public List<ColonyState.HistoryPoint> getHistory() { return history; }
    public boolean isDebugLogging() { return debugLogging; }
    public void setDebugLogging(boolean debugLogging) { this.debugLogging = debugLogging; }
}
