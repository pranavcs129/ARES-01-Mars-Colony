package colony.simulation;

import colony.event.Event;
import colony.management.ManagementSystem.ResponseAction;
import colony.model.Facility;
import colony.model.Resource;
import java.util.*;

/**
 * ColonyState — Immutable snapshot Data Transfer Object (DTO).
 * Packages live colony statistics, resource inventories, facility states,
 * active disasters, automatic management responses, and recovery progress.
 * Can be serialized to JSON for consumption by the Three.js frontend.
 */
public class ColonyState {
    private final int sol;
    private final double hour;
    private final String status;
    private final Map<String, ResourceData> resources;
    private final List<FacilityData> facilities;
    private final List<EventData> activeEvents;
    private final List<ResponseActionData> managementResponse;
    private final RecoveryData recovery;
    private final HealthData health;
    private final List<HistoryPoint> history;

    public static class HealthData {
        public double score;
        public String status;

        public HealthData(double score, String status) {
            this.score = Math.round(score * 10.0) / 10.0;
            this.status = status;
        }
    }

    public static class HistoryPoint {
        public int sol;
        public double oxygen;
        public double water;
        public double food;
        public double power;
        public double health;

        public HistoryPoint(int sol, double oxygen, double water, double food, double power, double health) {
            this.sol = sol;
            this.oxygen = Math.round(oxygen * 10.0) / 10.0;
            this.water = Math.round(water * 10.0) / 10.0;
            this.food = Math.round(food * 10.0) / 10.0;
            this.power = Math.round(power * 10.0) / 10.0;
            this.health = Math.round(health * 10.0) / 10.0;
        }
    }

    public static class ResourceData {
        public String name;
        public String unit;
        public double current;
        public double max;
        public double percentage;
        public double production;
        public double consumption;
        public double balance;
        public boolean isLow;
        public boolean isCritical;

        public ResourceData(Resource r) {
            this.name = r.getName();
            this.unit = r.getUnit();
            this.current = Math.round(r.getCurrentAmount() * 10.0) / 10.0;
            this.max = Math.round(r.getMaximumCapacity() * 10.0) / 10.0;
            this.percentage = Math.round(r.getPercentage() * 10.0) / 10.0;
            this.production = Math.round(r.getProductionRate() * 10.0) / 10.0;
            this.consumption = Math.round(r.getConsumptionRate() * 10.0) / 10.0;
            this.balance = Math.round(r.getBalance() * 10.0) / 10.0;
            this.isLow = r.isLow();
            this.isCritical = r.isCritical();
        }
    }

    public static class FacilityData {
        public String name;
        public int priority;
        public double operatingLevelPct;
        public double conditionPct;
        public String statusLabel;
        public double powerConsumption;
        public double waterConsumption;

        public FacilityData(Facility f) {
            this.name = f.getName();
            this.priority = f.getPriority();
            this.operatingLevelPct = Math.round(f.getOperatingLevel() * 100.0);
            this.conditionPct = Math.round(f.getCondition() * 10.0) / 10.0;
            this.statusLabel = f.getStatusLabel();
            this.powerConsumption = Math.round(f.calculateConsumption("Power") * 10.0) / 10.0;
            this.waterConsumption = Math.round(f.calculateConsumption("Water") * 10.0) / 10.0;
        }
    }

    public static class EventData {
        public String name;
        public String severity;
        public double durationRemaining;
        public String description;

        public EventData(Event e) {
            this.name = e.getName();
            this.severity = e.getSeverity().name();
            this.durationRemaining = Math.round(e.getDuration() * 10.0) / 10.0;
            this.description = e.getDescription();
        }
    }

    public static class ResponseActionData {
        public String facility;
        public String transition;
        public double before;
        public double after;
        public double saved;
        public String resource;
        public String action;

        public ResponseActionData(ResponseAction a) {
            this.facility = a.getFacilityName();
            this.transition = a.getTransitionText();
            this.before = a.getBeforeOperatingLevel();
            this.after = a.getAfterOperatingLevel();
            this.saved = a.getResourceSaved();
            this.resource = a.getResourceName();
            this.action = a.getActionLabel();
        }
    }

    public static class RecoveryData {
        public boolean backupActive;
        public String status;

        public RecoveryData(boolean backupActive, String status) {
            this.backupActive = backupActive;
            this.status = status;
        }
    }

    public ColonyState(int sol, double hour, String status,
                       Collection<Resource> resources,
                       List<Facility> facilities,
                       List<Event> activeEvents,
                       List<ResponseAction> responseActions,
                       boolean backupActive, String recoveryStatus,
                       HealthData health, List<HistoryPoint> history) {
        this.sol = sol;
        this.hour = hour;
        this.status = status;
        this.resources = new LinkedHashMap<>();
        for (Resource r : resources) {
            this.resources.put(r.getName(), new ResourceData(r));
        }
        this.facilities = new ArrayList<>();
        for (Facility f : facilities) {
            this.facilities.add(new FacilityData(f));
        }
        this.activeEvents = new ArrayList<>();
        for (Event e : activeEvents) {
            if (e.isActive()) {
                this.activeEvents.add(new EventData(e));
            }
        }
        this.managementResponse = new ArrayList<>();
        if (responseActions != null) {
            for (ResponseAction a : responseActions) {
                this.managementResponse.add(new ResponseActionData(a));
            }
        }
        this.recovery = new RecoveryData(backupActive, recoveryStatus);
        this.health = health != null ? health : new HealthData(87.0, status);
        this.history = history != null ? new ArrayList<>(history) : new ArrayList<>();
    }

    public ColonyState(int sol, double hour, String status,
                       Collection<Resource> resources,
                       List<Facility> facilities,
                       List<Event> activeEvents,
                       List<ResponseAction> responseActions,
                       boolean backupActive, String recoveryStatus) {
        this(sol, hour, status, resources, facilities, activeEvents, responseActions, backupActive, recoveryStatus,
             new HealthData(87.0, status), Collections.emptyList());
    }

    // Getters
    public int getSol() { return sol; }
    public double getHour() { return hour; }
    public String getStatus() { return status; }
    public Map<String, ResourceData> getResources() { return resources; }
    public List<FacilityData> getFacilities() { return facilities; }
    public List<EventData> getActiveEvents() { return activeEvents; }
    public List<ResponseActionData> getManagementResponse() { return managementResponse; }
    public RecoveryData getRecovery() { return recovery; }
    public HealthData getHealth() { return health; }
    public List<HistoryPoint> getHistory() { return history; }

    /**
     * Serializes this state to clean JSON without external libraries.
     */
    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"sol\":").append(sol).append(",");
        sb.append("\"hour\":").append(String.format(Locale.US, "%.1f", hour)).append(",");
        sb.append("\"status\":\"").append(status).append("\",");

        // Health
        sb.append("\"health\":{");
        sb.append("\"score\":").append(health.score).append(",");
        sb.append("\"status\":\"").append(health.status).append("\"");
        sb.append("},");

        // Resources
        sb.append("\"resources\":{");
        int rIdx = 0;
        for (Map.Entry<String, ResourceData> entry : resources.entrySet()) {
            if (rIdx++ > 0) sb.append(",");
            ResourceData rd = entry.getValue();
            sb.append("\"").append(entry.getKey()).append("\":{");
            sb.append("\"current\":").append(rd.current).append(",");
            sb.append("\"max\":").append(rd.max).append(",");
            sb.append("\"percentage\":").append(rd.percentage).append(",");
            sb.append("\"production\":").append(rd.production).append(",");
            sb.append("\"consumption\":").append(rd.consumption).append(",");
            sb.append("\"balance\":").append(rd.balance).append(",");
            sb.append("\"unit\":\"").append(rd.unit).append("\",");
            sb.append("\"isLow\":").append(rd.isLow).append(",");
            sb.append("\"isCritical\":").append(rd.isCritical);
            sb.append("}");
        }
        sb.append("},");

        // Facilities
        sb.append("\"facilities\":[");
        for (int i = 0; i < facilities.size(); i++) {
            if (i > 0) sb.append(",");
            FacilityData fd = facilities.get(i);
            sb.append("{");
            sb.append("\"name\":\"").append(fd.name).append("\",");
            sb.append("\"priority\":").append(fd.priority).append(",");
            sb.append("\"operatingLevel\":").append(fd.operatingLevelPct).append(",");
            sb.append("\"condition\":").append(fd.conditionPct).append(",");
            sb.append("\"status\":\"").append(fd.statusLabel).append("\"");
            sb.append("}");
        }
        sb.append("],");

        // Active Events
        sb.append("\"activeEvents\":[");
        for (int i = 0; i < activeEvents.size(); i++) {
            if (i > 0) sb.append(",");
            EventData ed = activeEvents.get(i);
            sb.append("{");
            sb.append("\"name\":\"").append(ed.name).append("\",");
            sb.append("\"severity\":\"").append(ed.severity).append("\",");
            sb.append("\"durationRemaining\":").append(ed.durationRemaining).append(",");
            sb.append("\"description\":\"").append(ed.description.replace("\"", "\\\"")).append("\"");
            sb.append("}");
        }
        sb.append("],");

        // Management Response Actions
        sb.append("\"managementResponse\":[");
        for (int i = 0; i < managementResponse.size(); i++) {
            if (i > 0) sb.append(",");
            ResponseActionData rad = managementResponse.get(i);
            sb.append("{");
            sb.append("\"facility\":\"").append(rad.facility).append("\",");
            sb.append("\"transition\":\"").append(rad.transition).append("\",");
            sb.append("\"before\":").append(String.format(Locale.US, "%.2f", rad.before)).append(",");
            sb.append("\"after\":").append(String.format(Locale.US, "%.2f", rad.after)).append(",");
            sb.append("\"saved\":").append(rad.saved).append(",");
            sb.append("\"resource\":\"").append(rad.resource).append("\",");
            sb.append("\"action\":\"").append(rad.action).append("\"");
            sb.append("}");
        }
        sb.append("],");

        // Recovery
        sb.append("\"recovery\":{");
        sb.append("\"backupActive\":").append(recovery.backupActive).append(",");
        sb.append("\"status\":\"").append(recovery.status).append("\"");
        sb.append("},");

        // History
        sb.append("\"history\":[");
        for (int i = 0; i < history.size(); i++) {
            if (i > 0) sb.append(",");
            HistoryPoint hp = history.get(i);
            sb.append("{");
            sb.append("\"sol\":").append(hp.sol).append(",");
            sb.append("\"oxygen\":").append(hp.oxygen).append(",");
            sb.append("\"water\":").append(hp.water).append(",");
            sb.append("\"food\":").append(hp.food).append(",");
            sb.append("\"power\":").append(hp.power).append(",");
            sb.append("\"health\":").append(hp.health);
            sb.append("}");
        }
        sb.append("]");

        sb.append("}");
        return sb.toString();
    }
}
