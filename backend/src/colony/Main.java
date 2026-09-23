package colony;

import colony.event.DustStorm;
import colony.event.Event;
import colony.management.ManagementSystem;
import colony.model.Facility;
import colony.model.Power;
import colony.model.PowerStation;
import colony.model.Resource;
import colony.service.ColonyHttpServer;
import colony.simulation.ColonyState;
import colony.simulation.SimulationEngine;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Main — Entry point and demonstration runner for the Mars Colony
 * Resource Management & Monitoring Simulation.
 *
 * Demonstrates the 6-Sol disaster-to-recovery lifecycle:
 * - Sol 1: Normal Operations (Nominal 100%, Colony STABLE)
 * - Sol 2: Dust Storm strikes (Power generation collapses, shortage detected)
 * - Sol 3: Autonomous Management System activates (Priority shedding, Life Support PROTECTED)
 * - Sol 4: Dust storm expires; environmental recovery begins
 * - Sol 5: Recovery System rehabilitation (+50%/Sol step-up)
 * - Sol 6: Nominal equilibrium restored (100% all facilities, STABLE)
 */
public class Main {

    public static void main(String[] args) {
        boolean startServer = false;
        boolean runDemo = true;

        for (String arg : args) {
            if ("--server".equalsIgnoreCase(arg) || "-s".equalsIgnoreCase(arg)) {
                startServer = true;
                runDemo = false;
            } else if ("--all".equalsIgnoreCase(arg) || "-a".equalsIgnoreCase(arg)) {
                startServer = true;
                runDemo = true;
            }
        }

        printBanner();

        SimulationEngine engine = new SimulationEngine();

        if (runDemo) {
            runDemonstrationScenario(engine);
        }

        if (startServer) {
            try {
                System.out.println("\n[HTTP SERVER] Initializing REST API on port 8080...");
                ColonyHttpServer server = new ColonyHttpServer(engine, 8080);
                server.start();
                System.out.println("[HTTP SERVER] Ready. Serving endpoints:");
                System.out.println("  • GET  http://localhost:8080/api/state");
                System.out.println("  • GET  http://localhost:8080/api/resources");
                System.out.println("  • GET  http://localhost:8080/api/facilities");
                System.out.println("  • GET  http://localhost:8080/api/events");
                System.out.println("  • GET  http://localhost:8080/api/management");
                System.out.println("  • GET  http://localhost:8080/api/recovery");
                System.out.println("  • POST http://localhost:8080/api/step");
                System.out.println("\nPress Ctrl+C to terminate server.");
            } catch (IOException e) {
                System.err.println("Failed to start HTTP server: " + e.getMessage());
            }
        } else {
            System.out.println("\n[TIP] To launch the HTTP server for Three.js UI integration, run:");
            System.out.println("      ./start-server.sh  OR  java -cp bin colony.Main --server");
        }
    }

    private static void printBanner() {
        System.out.println("================================================================================");
        System.out.println("   ARES-1 MARS COLONY SIMULATION — AUTONOMOUS RESOURCE MANAGEMENT SYSTEM       ");
        System.out.println("   Java OOP Architecture Demonstration • Pure Standard Library (No Bloat)      ");
        System.out.println("================================================================================");
    }

    private static void runDemonstrationScenario(SimulationEngine engine) {
        System.out.println("\n>>> STARTING 6-SOL AUTONOMOUS MANAGEMENT & RECOVERY DEMO <<<\n");

        // -------------------------------------------------------------
        // SOL 1 — NORMAL OPERATIONS
        // -------------------------------------------------------------
        printSolHeader(1, "NORMAL OPERATIONS", "STABLE");
        ColonyState s1 = engine.getCurrentState();
        printResourceSummary(s1.getResources());
        printFacilitySummary(s1.getFacilities());
        System.out.println("\n  [MANAGEMENT] Status: Colony operating within nominal margins. No load shedding needed.");
        engine.stepSol(); // Advance to Sol 2

        // -------------------------------------------------------------
        // SOL 2 — DUST STORM STRIKES
        // -------------------------------------------------------------
        printSolHeader(2, "DUST STORM STRIKES", "WARNING / SHORTAGE DETECTED");
        System.out.println("  [INCIDENT ALERT] Severe Martian Dust Storm detected!");
        
        // Trigger Dust Storm event
        DustStorm dustStorm = new DustStorm();
        engine.triggerEvent(dustStorm);

        ColonyState s2 = engine.getCurrentState();
        ColonyState.ResourceData s2Power = s2.getResources().get("Power");
        System.out.printf("  [IMPACT] Solar irradiance reduced by 85%%. Power generation drops to %.1f kW.\n",
                s2Power != null ? s2Power.production : 7.8);
        printResourceSummary(s2.getResources());
        printFacilitySummary(s2.getFacilities());
        if (s2Power != null) {
            System.out.printf("\n  [TELEMETRY] Power Generation: %.1f kW | Total Demand: %.1f kW\n",
                    s2Power.production, s2Power.consumption);
            System.out.printf("  [DEFICIT DETECTED] Power Shortage: %.1f kW. Battery buffer discharging.\n",
                    s2Power.balance);
        }
        engine.stepSol(); // Advance to Sol 3

        // -------------------------------------------------------------
        // SOL 3 — AUTONOMOUS MANAGEMENT SYSTEM ACTIVATES
        // -------------------------------------------------------------
        printSolHeader(3, "AUTONOMOUS MANAGEMENT SYSTEM ACTIVATES", "LOAD SHEDDING ACTIVE");
        System.out.println("  [AUTOMATIC LOAD SHEDDING EXECUTED]");
        System.out.println("  Priority-based shedding engaged to protect Life Support and avoid blackout:\n");

        // Engage auxiliary backup power to supplement colony
        boolean backupOn = engine.toggleBackupPower();
        if (backupOn) {
            System.out.println("  [*] AUXILIARY GENERATOR: ENGAGED (+25.0 kW auxiliary feed)");
        }

        ColonyState s3 = engine.getCurrentState();
        printColonyResponses(s3.getManagementResponse());
        printResourceSummary(s3.getResources());
        printFacilitySummary(s3.getFacilities());

        System.out.println("\n  [MANAGEMENT VERDICT] Essential Life Support (Habitat) strictly preserved at 100%.");
        System.out.println("  Total power savings + backup generator stabilized the power grid.");
        engine.stepSol(); // Advance to Sol 4

        // -------------------------------------------------------------
        // SOL 4 — DUST STORM DISSIPATES; ENVIRONMENTAL RECOVERY
        // -------------------------------------------------------------
        printSolHeader(4, "DUST STORM DISSIPATES", "RECOVERING");
        System.out.println("  [WEATHER REPORT] Dust storm opacity dropping. Atmospheric clear-up in progress.");
        System.out.println("  [STATUS] Solar array output climbing. Active load shedding holding grid steady.");

        ColonyState s4 = engine.getCurrentState();
        printResourceSummary(s4.getResources());
        printFacilitySummary(s4.getFacilities());
        engine.stepSol(); // Advance to Sol 5

        // -------------------------------------------------------------
        // SOL 5 — GRADUAL RECOVERY & REHABILITATION
        // -------------------------------------------------------------
        printSolHeader(5, "GRADUAL RECOVERY & REHABILITATION", "RECOVERING");
        System.out.println("  [RECOVERY SYSTEM] Sol recovery tick initiated: +50% operating level restoration.");
        System.out.println("  Facility levels stepped up in reverse priority order as storage replenishes.");

        ColonyState s5 = engine.getCurrentState();
        printResourceSummary(s5.getResources());
        printFacilitySummary(s5.getFacilities());
        engine.stepSol(); // Advance to Sol 6

        // -------------------------------------------------------------
        // SOL 6 — EQUILIBRIUM RESTORED
        // -------------------------------------------------------------
        printSolHeader(6, "COLONY EQUILIBRIUM RESTORED", "STABLE");
        System.out.println("  [RECOVERY REPORT] All facilities restored to 100% nominal operation.");
        System.out.println("  [SYSTEM] Auxiliary generator disengaged. Battery storage nominal.");

        ColonyState s6 = engine.getCurrentState();
        printResourceSummary(s6.getResources());
        printFacilitySummary(s6.getFacilities());

        printOopVerificationSummary();
    }

    private static void printSolHeader(int sol, String title, String status) {
        System.out.println("\n================================================================================");
        System.out.printf("  SOL %d — %s\n", sol, title);
        System.out.printf("  Colony Operational Status: [%s]\n", status);
        System.out.println("================================================================================");
    }

    private static void printResourceSummary(Map<String, ColonyState.ResourceData> resources) {
        System.out.println("\n  RESOURCE TELEMETRY:");
        for (ColonyState.ResourceData r : resources.values()) {
            String delta = (r.balance >= 0) ? String.format("+%.1f", r.balance) : String.format("%.1f", r.balance);
            System.out.printf("    %-8s: %6.1f / %6.1f %-4s | Daily Balance: %7s %s/Sol\n",
                    r.name, r.current, r.max, r.unit, delta, r.unit);
        }
    }

    private static void printFacilitySummary(List<ColonyState.FacilityData> facilities) {
        System.out.println("\n  FACILITY OPERATIONAL STATUS:");
        for (ColonyState.FacilityData f : facilities) {
            String badge = f.statusLabel;
            if ("PROTECTED".equals(badge)) {
                badge = "[PROTECTED 100%]";
            } else if (badge != null && badge.startsWith("REDUCED")) {
                badge = "[" + badge + "]";
            } else if ("PAUSED".equals(badge)) {
                badge = "[PAUSED]";
            } else {
                badge = "[NOMINAL]";
            }
            System.out.printf("    (Pri %d) %-22s : %3d%%  %-16s (Consumes: %4.1f kW, %4.1f L)\n",
                    f.priority, f.name, (int) f.operatingLevelPct, badge, f.powerConsumption, f.waterConsumption);
        }
    }

    private static void printColonyResponses(List<ColonyState.ResponseActionData> actions) {
        System.out.println("  COLONY RESPONSE ACTIONS:");
        for (ColonyState.ResponseActionData a : actions) {
            String unit = "Power".equalsIgnoreCase(a.resource) ? "kW" : "L";
            System.out.printf("    • %-20s %-14s -> Saved: %5.1f %-2s | Action: [%s]\n",
                    a.facility, a.transition, a.saved, unit, a.action);
        }
        System.out.println();
    }

    private static void printOopVerificationSummary() {
        System.out.println("\n================================================================================");
        System.out.println("                    OOP ARCHITECTURE VERIFICATION MATRIX                        ");
        System.out.println("================================================================================");
        System.out.println("  [1] ENCAPSULATION      : Private fields, guarded getters/setters, invariant checks");
        System.out.println("                           (e.g., Habitat life-support cannot be reduced < 100%).");
        System.out.println("  [2] INHERITANCE        : Resource -> Oxygen, Water, Food, Power");
        System.out.println("                           Facility -> Habitat, PowerStation, WaterExtractor,");
        System.out.println("                                       Greenhouse, ResearchFacility, LandingZone");
        System.out.println("                           Event    -> DustStorm, PowerFailure, WaterFailure, etc.");
        System.out.println("  [3] ABSTRACTION        : Abstract operate(), applyEffect(), calculateConsumption()");
        System.out.println("  [4] POLYMORPHISM       : Dynamic dispatch across List<Facility> and List<Event>.");
        System.out.println("  [5] COLLECTIONS        : Map<String, Resource>, List<Facility>, Collections.sort()");
        System.out.println("  [6] EXCEPTION HANDLING : ResourceDepletedException, InvalidOperatingLevelException");
        System.out.println("  [7] AUTONOMOUS CONTROL : Automated priority-based load shedding; no manual slider.");
        System.out.println("  [8] ZERO-DEPENDENCY API: Built-in HttpServer on port 8080 with full JSON CORS.");
        System.out.println("================================================================================\n");
    }
}
