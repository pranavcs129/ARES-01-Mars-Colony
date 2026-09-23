package colony.management;

import colony.model.Facility;
import colony.model.PowerStation;
import colony.model.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * RecoverySystem — Coordinates gradual post-disaster rehabilitation.
 * 
 * CORE ARCHITECTURAL PRINCIPLE:
 * Recovery must NOT instantly restore everything.
 * As storms pass and generation recovers:
 * 1. Solar generation gradually improves over consecutive Sols
 * 2. Auxiliary backup generators assist until storage reaches safe margins
 * 3. Emergency reserves stabilize vital life support
 * 4. Reduced or paused facilities are gradually brought back online step-by-step
 * 5. Damaged equipment is progressively repaired by engineering drones
 * 6. Colony status advances back to STABLE
 */
public class RecoverySystem {
    private boolean backupPowerActive;
    private final double backupGeneratorCapacity = 25.0; // kW
    private final double repairRatePerSol = 15.0; // 15% repair progress per Sol (gradual engineering repair)
    private final List<ManagementSystem.ResponseAction> lastRecoveryActions = new ArrayList<>();

    public RecoverySystem() {
        this.backupPowerActive = false;
    }

    public void reset() {
        this.backupPowerActive = false;
        this.lastRecoveryActions.clear();
    }

    /**
     * Toggles auxiliary emergency generator (+25 kW).
     */
    public boolean toggleBackupPower(PowerStation powerStation) {
        this.backupPowerActive = !this.backupPowerActive;
        if (powerStation != null) {
            powerStation.setAuxiliaryBackup(this.backupPowerActive ? backupGeneratorCapacity : 0.0);
        }
        return this.backupPowerActive;
    }

    public void setBackupPowerActive(boolean active, PowerStation powerStation) {
        this.backupPowerActive = active;
        if (powerStation != null) {
            powerStation.setAuxiliaryBackup(active ? backupGeneratorCapacity : 0.0);
        }
    }

    public boolean isBackupPowerActive() {
        return backupPowerActive;
    }

    /**
     * Advances gradual recovery tick over a Sol.
     * @param deltaSols time step in Sols
     * @param facilities list of colony facilities
     * @param resources colony resource map
     * @param hasActiveDisaster whether an active disaster is currently in progress
     */
    public void tickRecovery(double deltaSols, List<Facility> facilities, 
                             Map<String, Resource> resources, boolean hasActiveDisaster) {
        lastRecoveryActions.clear();

        // 1. Facility physical repairs
        for (Facility f : facilities) {
            if (f.getCondition() < 100.0) {
                f.repair(repairRatePerSol * deltaSols);
            }
        }

        // 2. Gradual restoration of throttled facilities if disaster has ended
        if (!hasActiveDisaster) {
            Resource power = resources.get("Power");
            boolean powerSafe = (power != null && power.getCurrentAmount() > 250.0);

            for (Facility f : facilities) {
                if (f.getPriority() > 1 && f.getOperatingLevel() < 1.0) {
                    if (powerSafe) {
                        double beforeLevel = f.getOperatingLevel();
                        // Gradually step up facility operating level (+50% per Sol)
                        double newLevel = Math.min(1.0, beforeLevel + (0.50 * deltaSols));
                        try {
                            f.setOperatingLevel(newLevel);
                        } catch (Exception ignored) {}

                        lastRecoveryActions.add(new ManagementSystem.ResponseAction(
                            f.getName(), beforeLevel, newLevel, 0.0, "Power", "RESTORING"
                        ));
                    }
                }
            }

            // If storage is high and stable (> 85%), automatically disengage auxiliary generator
            if (power != null && power.getPercentage() >= 85.0 && backupPowerActive) {
                backupPowerActive = false;
                for (Facility f : facilities) {
                    if (f instanceof PowerStation) {
                        ((PowerStation) f).setAuxiliaryBackup(0.0);
                        break;
                    }
                }
            }
        }
    }

    public List<ManagementSystem.ResponseAction> getLastRecoveryActions() {
        return lastRecoveryActions;
    }

    public String getRecoveryStatus(Resource powerResource) {
        if (powerResource == null) return "STABLE";
        if (backupPowerActive) return "RECOVERY IN PROGRESS (BACKUP ENGAGED)";
        if (powerResource.isLow()) return "RESTORING RESERVES";
        return "NOMINAL";
    }
}
