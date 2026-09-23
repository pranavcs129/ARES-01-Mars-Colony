package colony.management;

import colony.exception.InvalidOperatingLevelException;
import colony.model.Facility;
import colony.model.Resource;
import java.util.*;

/**
 * ManagementSystem — Autonomous colony resource management and load shedding engine.
 * 
 * CORE ARCHITECTURAL RULE:
 * The user does NOT manually throttle facility levels. The colony AI automatically
 * evaluates available generation vs required demand and systematically reduces or
 * pauses non-essential operations to protect life support and restore resource equilibrium.
 *
 * Priority Hierarchy:
 * Priority 1: Life Support (Habitat)         -> PROTECTED (Always 100%)
 * Priority 2: Water / Power Infrastructure   -> HIGH PRIORITY
 * Priority 3: Greenhouse (Food Agriculture)  -> NORMAL
 * Priority 4: Research Facility (Science)    -> REDUCIBLE
 * Priority 5: Mining & Logistics             -> REDUCIBLE (First to shed)
 */
public class ManagementSystem {

    public static class ResponseAction {
        private final String facilityName;
        private final double beforeOperatingLevel;
        private final double afterOperatingLevel;
        private final double resourceSaved;
        private final String resourceName;
        private final String actionLabel; // "PROTECTED", "REDUCED", "PAUSED", "NOMINAL", "BOOSTED"

        public ResponseAction(String facilityName, double before, double after, 
                              double saved, String resourceName, String actionLabel) {
            this.facilityName = facilityName;
            this.beforeOperatingLevel = before;
            this.afterOperatingLevel = after;
            this.resourceSaved = Math.round(saved * 10.0) / 10.0;
            this.resourceName = resourceName;
            this.actionLabel = actionLabel;
        }

        public String getFacilityName() { return facilityName; }
        public double getBeforeOperatingLevel() { return beforeOperatingLevel; }
        public double getAfterOperatingLevel() { return afterOperatingLevel; }
        public double getResourceSaved() { return resourceSaved; }
        public String getResourceName() { return resourceName; }
        public String getActionLabel() { return actionLabel; }

        public String getTransitionText() {
            return String.format("%.0f%% → %.0f%%", beforeOperatingLevel * 100.0, afterOperatingLevel * 100.0);
        }

        @Override
        public String toString() {
            if ("PROTECTED".equals(actionLabel)) {
                return String.format("%s\n%s\n%s: PROTECTED", 
                        facilityName, getTransitionText(), actionLabel);
            }
            return String.format("%s\n%s\n%s saved: %.1f %s\n%s",
                    facilityName, getTransitionText(), resourceName, resourceSaved, 
                    "Power".equalsIgnoreCase(resourceName) ? "kW" : "L", actionLabel);
        }
    }

    private final List<ResponseAction> lastResponseActions;

    public ManagementSystem() {
        this.lastResponseActions = new ArrayList<>();
    }

    /**
     * Automatically evaluates colony resource shortages and executes load shedding.
     * Calculates BEFORE -> AFTER operating levels and resource saved per facility.
     * Higher-priority systems remain protected; non-essential systems are reduced or paused.
     *
     * @param resourceName bottleneck resource name (e.g. "Power" or "Water")
     * @param facilities colony facility list
     * @param resources colony resource map
     * @return list of automatic response actions taken
     */
    public List<ResponseAction> manageResourceShortage(String resourceName, 
                                                       List<Facility> facilities, 
                                                       Map<String, Resource> resources) {
        return manageResourceShortage(resourceName, facilities, resources, Collections.emptyList());
    }

    public List<ResponseAction> manageResourceShortage(String resourceName, 
                                                       List<Facility> facilities, 
                                                       Map<String, Resource> resources,
                                                       List<ResponseAction> recoveryActions) {
        lastResponseActions.clear();
        Resource res = resources.get(resourceName);
        if (res == null) return lastResponseActions;

        // 1. Calculate baseline required demand at 100%
        double baselineDemand = 0.0;
        for (Facility f : facilities) {
            baselineDemand += f.getBaseDemand(resourceName);
        }

        // 2. Calculate current available generation vs demand
        double availableGeneration = res.getProductionRate();
        double generationShortage = baselineDemand - availableGeneration;

        // A crisis requiring load shedding occurs if generation drops significantly due to an event
        // (power shortage > 10 kW, water shortage > 15 L) or if storage reserves drop below warning threshold (< 40%).
        boolean isCrisis = ("Power".equalsIgnoreCase(resourceName) && generationShortage > 10.0)
                        || (res.isLow() && generationShortage > 0.0)
                        || ("Water".equalsIgnoreCase(resourceName) && generationShortage > 15.0);

        if (!isCrisis) {
            // Post-disaster recovery phase: display actual rehabilitation transitions (e.g. 50% → 75%, 75% → 100%)
            if (recoveryActions != null && !recoveryActions.isEmpty()) {
                lastResponseActions.addAll(recoveryActions);
            }
            // If a facility did not change, do not display it as a management action.
            // "100% → 100% NOMINAL" should not appear as a reduction.
            return lastResponseActions;
        }

        // Sort facilities by descending priority number (Priority 5 shed first, Priority 1 protected)
        List<Facility> sortedFacilities = new ArrayList<>(facilities);
        sortedFacilities.sort((a, b) -> Integer.compare(b.getPriority(), a.getPriority()));

        double needToSave = Math.max(0.0, generationShortage);

        // 3. Dynamic load shedding based on actual shortage from nominal baseline (100%)
        for (Facility f : sortedFacilities) {
            double baseDemand = f.getBaseDemand(resourceName);

            if (f.getPriority() == 1) {
                // Priority 1 (Life Support): ALWAYS 100% PROTECTED
                try {
                    f.setOperatingLevel(1.0);
                } catch (InvalidOperatingLevelException ignored) {}
                lastResponseActions.add(new ResponseAction(
                    f.getName(), 1.0, 1.0, 0.0, resourceName, "PROTECTED"));
                continue;
            }

            // Calculate required reduction from 100% nominal
            double targetLevel = 1.0;
            if (needToSave > 0.0 && baseDemand > 0.0) {
                if (f.getPriority() == 5) {
                    // Mining / Logistics: Heavy industrial loads shed first
                    if (needToSave >= baseDemand) {
                        targetLevel = 0.0; // PAUSE
                    } else if (needToSave >= (baseDemand * 0.5)) {
                        targetLevel = 0.4; // REDUCED
                    } else {
                        targetLevel = 0.6; // REDUCED
                    }
                } else if (f.getPriority() == 4) {
                    // Research Facility: Non-essential science shed next
                    if (needToSave >= baseDemand) {
                        targetLevel = 0.0; // PAUSE
                    } else if (needToSave >= (baseDemand * 0.5)) {
                        targetLevel = 0.5; // REDUCED
                    } else {
                        targetLevel = 0.75;
                    }
                } else if (f.getPriority() == 3) {
                    // Greenhouse: CEA crop biodome
                    if (needToSave >= (baseDemand * 0.5)) {
                        targetLevel = 0.5; // Conserve 50%
                    } else if (needToSave > 0.0) {
                        targetLevel = 0.75; // Conserve 25%
                    }
                } else if (f.getPriority() == 2) {
                    // Water / Infrastructure: Only conserved if crisis remains extreme
                    if (needToSave >= 2.0 && !"water".equalsIgnoreCase(resourceName)) {
                        targetLevel = 0.75;
                    }
                }
            }

            double beforeLevel = f.getOperatingLevel();
            try {
                f.setOperatingLevel(targetLevel);
            } catch (InvalidOperatingLevelException e) {
                targetLevel = f.getOperatingLevel();
            }

            double saved = baseDemand * (1.0 - targetLevel);
            needToSave = Math.max(0.0, needToSave - saved);

            // Record reduction action if targetLevel < 1.0
            if (targetLevel < 1.0) {
                String actionLabel = (targetLevel == 0.0) ? "PAUSED" : "REDUCED";
                // Show reduction from nominal baseline (100%) if previously reduced
                double displayBefore = (beforeLevel < 1.0 && Math.abs(beforeLevel - targetLevel) < 0.01) ? 1.0 : (beforeLevel > 0.0 ? beforeLevel : 1.0);
                lastResponseActions.add(new ResponseAction(
                    f.getName(), displayBefore, targetLevel, saved, resourceName, actionLabel));
            }
        }

        return lastResponseActions;
    }

    public List<ResponseAction> getLastResponseActions() {
        return Collections.unmodifiableList(lastResponseActions);
    }

    public void printAutomaticResponse() {
        System.out.println("================================================================================");
        System.out.println("COLONY RESPONSE — AUTOMATIC RESOURCE MANAGEMENT");
        for (ResponseAction a : lastResponseActions) {
            System.out.println("----------------------------------------");
            System.out.println(a.toString());
        }
        System.out.println("================================================================================");
    }
}
