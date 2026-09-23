package colony.service;

import colony.simulation.ColonyState;
import colony.simulation.SimulationEngine;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

/**
 * ColonyHttpServer — Lightweight REST API layer.
 * Uses Java SE's built-in com.sun.net.httpserver.HttpServer (zero external dependencies).
 * Provides HTTP JSON endpoints for the Three.js frontend:
 * - GET /api/state
 * - GET /api/resources
 * - GET /api/facilities
 * - GET /api/events
 * - GET /api/management
 * - GET /api/recovery
 * - POST /api/step (advance Sol)
 */
public class ColonyHttpServer {
    private final int port;
    private final SimulationEngine engine;
    private HttpServer server;

    public ColonyHttpServer(SimulationEngine engine, int port) {
        this.engine = engine;
        this.port = port;
    }

    public ColonyHttpServer(SimulationEngine engine) {
        this(engine, 8080);
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);

        // 0. GET / and /api Dashboard
        server.createContext("/", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                String path = exchange.getRequestURI().getPath();
                if ("/".equals(path) || "/api".equals(path) || "/index.html".equals(path)) {
                    sendHtmlResponse(exchange, 200, generateDashboardHtml());
                } else {
                    String err = "{\"error\":\"Not Found\",\"path\":\"" + path + "\"}";
                    sendJsonResponse(exchange, 404, err);
                }
            }
        });

        // 1. GET /api/state
        server.createContext("/api/state", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                String json = engine.getCurrentState().toJson();
                sendJsonResponse(exchange, 200, json);
            }
        });

        // 2. GET /api/resources
        server.createContext("/api/resources", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                ColonyState state = engine.getCurrentState();
                StringBuilder sb = new StringBuilder("{");
                int idx = 0;
                for (ColonyState.ResourceData rd : state.getResources().values()) {
                    if (idx++ > 0) sb.append(",");
                    sb.append("\"").append(rd.name).append("\":{")
                      .append("\"current\":").append(rd.current).append(",")
                      .append("\"max\":").append(rd.max).append(",")
                      .append("\"percentage\":").append(rd.percentage).append(",")
                      .append("\"production\":").append(rd.production).append(",")
                      .append("\"consumption\":").append(rd.consumption).append(",")
                      .append("\"balance\":").append(rd.balance).append(",")
                      .append("\"unit\":\"").append(rd.unit).append("\",")
                      .append("\"isLow\":").append(rd.isLow).append(",")
                      .append("\"isCritical\":").append(rd.isCritical).append("}");
                }
                sb.append("}");
                sendJsonResponse(exchange, 200, sb.toString());
            }
        });

        // 3. GET /api/facilities
        server.createContext("/api/facilities", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                ColonyState state = engine.getCurrentState();
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < state.getFacilities().size(); i++) {
                    if (i > 0) sb.append(",");
                    ColonyState.FacilityData fd = state.getFacilities().get(i);
                    sb.append("{\"name\":\"").append(fd.name).append("\",")
                      .append("\"priority\":").append(fd.priority).append(",")
                      .append("\"operatingLevel\":").append(fd.operatingLevelPct).append(",")
                      .append("\"level\":").append(fd.operatingLevelPct).append(",")
                      .append("\"condition\":").append(fd.conditionPct).append(",")
                      .append("\"powerConsumption\":").append(fd.powerConsumption).append(",")
                      .append("\"waterConsumption\":").append(fd.waterConsumption).append(",")
                      .append("\"status\":\"").append(fd.statusLabel).append("\"}");
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());
            }
        });

        // 4. GET /api/events
        server.createContext("/api/events", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                ColonyState state = engine.getCurrentState();
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < state.getActiveEvents().size(); i++) {
                    if (i > 0) sb.append(",");
                    ColonyState.EventData ed = state.getActiveEvents().get(i);
                    sb.append("{\"name\":\"").append(ed.name).append("\",")
                      .append("\"severity\":\"").append(ed.severity).append("\",")
                      .append("\"durationRemaining\":").append(ed.durationRemaining).append("}");
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());
            }
        });

        // 5. GET /api/management
        server.createContext("/api/management", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                ColonyState state = engine.getCurrentState();
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < state.getManagementResponse().size(); i++) {
                    if (i > 0) sb.append(",");
                    ColonyState.ResponseActionData rad = state.getManagementResponse().get(i);
                    sb.append("{\"facility\":\"").append(rad.facility).append("\",")
                      .append("\"transition\":\"").append(rad.transition).append("\",")
                      .append("\"before\":").append(String.format(java.util.Locale.US, "%.2f", rad.before)).append(",")
                      .append("\"after\":").append(String.format(java.util.Locale.US, "%.2f", rad.after)).append(",")
                      .append("\"saved\":").append(rad.saved).append(",")
                      .append("\"resource\":\"").append(rad.resource).append("\",")
                      .append("\"action\":\"").append(rad.action).append("\"}");
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());
            }
        });

        // 6. GET /api/recovery
        server.createContext("/api/recovery", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                ColonyState state = engine.getCurrentState();
                String json = String.format("{\"backupActive\":%b,\"status\":\"%s\"}",
                        state.getRecovery().backupActive, state.getRecovery().status);
                sendJsonResponse(exchange, 200, json);
            }
        });

        // 7. POST /api/step (Advance Sol)
        server.createContext("/api/step", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                ColonyState newState = engine.stepSol();
                sendJsonResponse(exchange, 200, newState.toJson());
            }
        });

        // 8. POST /api/events/trigger (Trigger disaster event)
        server.createContext("/api/events/trigger", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                String query = exchange.getRequestURI().getQuery();
                String body = readBody(exchange);
                String full = ((query != null ? query : "") + " " + (body != null ? body : "")).toLowerCase();
                
                String type = "dust_storm";
                double duration = 3.0;
                if (full.contains("power") || full.contains("grid")) {
                    type = "power_failure";
                } else if (full.contains("contam")) {
                    type = "water_contamination";
                } else if (full.contains("water") || full.contains("pump")) {
                    type = "water_failure";
                } else if (full.contains("flare") || full.contains("solar")) {
                    type = "solar_flare";
                } else if (full.contains("meteor") || full.contains("impact")) {
                    type = "micrometeoroid_impact";
                } else if (full.contains("equip") || full.contains("damage")) {
                    type = "equipment_failure";
                }

                java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?:duration[\"=:]\\s*|duration=)([0-9.]+)").matcher(full);
                if (m.find()) {
                    try {
                        duration = Double.parseDouble(m.group(1));
                    } catch (NumberFormatException ignored) {}
                }

                if (full.contains("clear") || full.contains("none")) {
                    engine.getActiveEvents().clear();
                    colony.model.PowerStation ps = engine.getFacility(colony.model.PowerStation.class);
                    if (ps != null) ps.setEventModifier(1.0);
                    colony.model.WaterExtractor we = engine.getFacility(colony.model.WaterExtractor.class);
                    if (we != null) we.setEventModifier(1.0);
                    engine.evaluateShortageAndManagement();
                    sendJsonResponse(exchange, 200, engine.getCurrentState().toJson());
                    return;
                }

                engine.triggerEventByType(type, duration);
                sendJsonResponse(exchange, 200, engine.getCurrentState().toJson());
            }
        });

        // 9. POST /api/reset (Reset simulation to Sol 1)
        server.createContext("/api/reset", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                engine.reset();
                sendJsonResponse(exchange, 200, engine.getCurrentState().toJson());
            }
        });

        // 10. POST /api/recovery/backup (Toggle backup auxiliary power)
        server.createContext("/api/recovery/backup", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendCors(exchange);
                    return;
                }
                engine.toggleBackupPower();
                sendJsonResponse(exchange, 200, engine.getCurrentState().toJson());
            }
        });

        server.setExecutor(null);
        server.start();
        System.out.println("ColonyHttpServer started on http://localhost:" + port);
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }

    private String readBody(HttpExchange exchange) {
        try (java.io.InputStream is = exchange.getRequestBody()) {
            java.util.Scanner s = new java.util.Scanner(is, StandardCharsets.UTF_8.name()).useDelimiter("\\A");
            return s.hasNext() ? s.next() : "";
        } catch (Exception e) {
            return "";
        }
    }

    private void sendCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
        exchange.sendResponseHeaders(204, -1);
    }

    private void sendJsonResponse(HttpExchange exchange, int statusCode, String responseJson) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        byte[] bytes = responseJson.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void sendHtmlResponse(HttpExchange exchange, int statusCode, String htmlContent) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
        exchange.getResponseHeaders().add("Content-Type", "text/html; charset=UTF-8");
        byte[] bytes = htmlContent.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private String generateDashboardHtml() {
        ColonyState state = engine.getCurrentState();
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n");
        sb.append("<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
        sb.append("<title>Ares-1 Mars Colony — Backend REST API & Telemetry</title>\n");
        sb.append("<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n");
        sb.append("<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap\" rel=\"stylesheet\">\n");
        sb.append("<style>\n");
        sb.append(":root { --bg: #070a12; --card: #0f172a; --card-border: rgba(255,255,255,0.08); --accent: #00f0ff; --mars: #ff5722; --text: #f8fafc; --muted: #94a3b8; --green: #10b981; --amber: #f59e0b; --red: #ef4444; }\n");
        sb.append("* { box-sizing: border-box; margin: 0; padding: 0; }\n");
        sb.append("body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; padding: 24px; min-height: 100vh; line-height: 1.5; }\n");
        sb.append(".container { max-width: 1100px; margin: 0 auto; }\n");
        sb.append(".header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--card-border); padding-bottom: 18px; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }\n");
        sb.append(".title-area h1 { font-family: 'Chakra Petch', sans-serif; font-size: 22px; color: #fff; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }\n");
        sb.append(".title-area p { color: var(--muted); font-size: 13px; margin-top: 4px; }\n");
        sb.append(".badge-group { display: flex; gap: 10px; align-items: center; }\n");
        sb.append(".pill { font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 6px; }\n");
        sb.append(".pill-green { background: rgba(16,185,129,0.15); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }\n");
        sb.append(".pill-amber { background: rgba(245,158,11,0.15); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }\n");
        sb.append(".pill-red { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }\n");
        sb.append(".pill-cyan { background: rgba(0,240,255,0.15); color: var(--accent); border: 1px solid rgba(0,240,255,0.3); }\n");
        sb.append(".dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; }\n");
        sb.append(".controls { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; background: var(--card); padding: 14px 18px; border-radius: 10px; border: 1px solid var(--card-border); align-items: center; }\n");
        sb.append(".btn { background: rgba(255,255,255,0.06); border: 1px solid var(--card-border); color: #fff; padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; font-family: inherit; }\n");
        sb.append(".btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }\n");
        sb.append(".btn-primary { background: rgba(0,240,255,0.15); color: var(--accent); border-color: rgba(0,240,255,0.4); }\n");
        sb.append(".btn-primary:hover { background: rgba(0,240,255,0.25); box-shadow: 0 0 12px rgba(0,240,255,0.2); }\n");
        sb.append(".btn-warn { background: rgba(255,87,34,0.15); color: var(--mars); border-color: rgba(255,87,34,0.4); }\n");
        sb.append(".grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }\n");
        sb.append("@media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }\n");
        sb.append(".card { background: var(--card); border: 1px solid var(--card-border); border-radius: 10px; padding: 18px; margin-bottom: 24px; }\n");
        sb.append(".card-title { font-family: 'Chakra Petch', sans-serif; font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 0.5px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; }\n");
        sb.append(".res-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }\n");
        sb.append(".res-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 14px; }\n");
        sb.append(".res-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }\n");
        sb.append(".res-name { font-weight: 600; font-size: 13px; color: #fff; }\n");
        sb.append(".res-val { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: var(--accent); }\n");
        sb.append(".bar-track { background: rgba(255,255,255,0.08); height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 8px; }\n");
        sb.append(".bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }\n");
        sb.append(".res-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }\n");
        sb.append(".data-table { width: 100%; border-collapse: collapse; font-size: 13px; }\n");
        sb.append(".data-table th { text-align: left; padding: 10px 12px; color: var(--muted); font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }\n");
        sb.append(".data-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }\n");
        sb.append(".tag { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; display: inline-block; }\n");
        sb.append(".tag-prot { background: rgba(0,240,255,0.15); color: var(--accent); border: 1px solid rgba(0,240,255,0.3); }\n");
        sb.append(".tag-nom { background: rgba(16,185,129,0.15); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }\n");
        sb.append(".tag-red { background: rgba(245,158,11,0.15); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }\n");
        sb.append(".tag-pau { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }\n");
        sb.append(".endpoints-list { display: flex; flex-wrap: wrap; gap: 10px; }\n");
        sb.append(".api-chip { font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 6px 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); border-radius: 6px; color: var(--accent); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }\n");
        sb.append(".api-chip:hover { background: rgba(0,240,255,0.1); border-color: rgba(0,240,255,0.3); }\n");
        sb.append(".api-method { font-size: 10px; font-weight: 700; color: #fff; background: rgba(255,255,255,0.1); padding: 2px 5px; border-radius: 3px; }\n");
        sb.append(".empty-note { color: var(--muted); font-size: 13px; font-style: italic; padding: 6px 0; }\n");
        sb.append("</style>\n</head>\n<body>\n<div class=\"container\">\n");

        // Header
        sb.append("<header class=\"header\">\n<div class=\"title-area\">\n");
        sb.append("<h1><span style=\"color:var(--mars);\">●</span> ARES-1 MARS COLONY SIMULATION</h1>\n");
        sb.append("<p>Java OOP Backend Service • Standard Library HTTP Server (Port ").append(port).append(")</p>\n");
        sb.append("</div>\n<div class=\"badge-group\">\n");
        String statusPill = "pill-green";
        if ("RESOURCE CONSTRAINED".equalsIgnoreCase(state.getStatus())) statusPill = "pill-amber";
        else if (state.getStatus().toUpperCase().contains("CRIT") || state.getStatus().toUpperCase().contains("EMERG")) statusPill = "pill-red";
        sb.append("<div class=\"pill ").append(statusPill).append("\"><span class=\"dot\"></span>").append(state.getStatus()).append("</div>\n");
        sb.append("<div class=\"pill pill-cyan\">SOL ").append(state.getSol()).append(" • ").append(String.format(java.util.Locale.US, "%02d:00", (int) state.getHour())).append("</div>\n");
        sb.append("</div>\n</header>\n");

        // Quick Controls
        sb.append("<div class=\"controls\">\n<span style=\"font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase; margin-right:6px;\">API Actions:</span>\n");
        sb.append("<button class=\"btn btn-primary\" onclick=\"apiCall('/api/step')\">▶ Step +1 Sol</button>\n");
        sb.append("<button class=\"btn btn-warn\" onclick=\"apiCall('/api/events/trigger', 'POST', {type: 'dust_storm', duration: 2.0})\">⚡ Trigger Dust Storm</button>\n");
        sb.append("<button class=\"btn\" onclick=\"apiCall('/api/recovery/backup')\">🔋 Toggle Backup Power (").append(state.getRecovery().backupActive ? "Active" : "Off").append(")</button>\n");
        sb.append("<button class=\"btn\" onclick=\"apiCall('/api/reset')\">↺ Reset Sol 1</button>\n");
        sb.append("<a class=\"btn\" href=\"http://localhost:5173\" target=\"_blank\" style=\"margin-left:auto; text-decoration:none;\">Open 3D Web UI ↗</a>\n");
        sb.append("</div>\n");

        // Resources Grid
        sb.append("<div class=\"card\">\n<div class=\"card-title\"><span>COLONY RESOURCE TELEMETRY</span><span style=\"font-size:11px; font-weight:400; color:var(--muted);\">Central Inventory</span></div>\n");
        sb.append("<div class=\"res-grid\">\n");
        for (ColonyState.ResourceData r : state.getResources().values()) {
            int pct = (int) Math.min(100, Math.max(0, r.percentage));
            String barColor = "var(--green)";
            if (r.isCritical) barColor = "var(--red)";
            else if (r.isLow) barColor = "var(--amber)";
            else if ("Power".equalsIgnoreCase(r.name)) barColor = "var(--accent)";

            String balanceSign = r.balance >= 0 ? "+" : "";
            sb.append("<div class=\"res-box\">\n");
            sb.append("<div class=\"res-top\"><span class=\"res-name\">").append(r.name).append("</span>");
            sb.append("<span class=\"res-val\">").append((int) r.current).append(" <span style=\"font-size:11px; color:var(--muted);\">/ ").append((int) r.max).append(" ").append(r.unit).append("</span></span></div>\n");
            sb.append("<div class=\"bar-track\"><div class=\"bar-fill\" style=\"width:").append(pct).append("%; background:").append(barColor).append(";\"></div></div>\n");
            sb.append("<div class=\"res-meta\"><span>Balance: ").append(balanceSign).append(String.format(java.util.Locale.US, "%.1f", r.balance)).append(" ").append(r.unit).append("/Sol</span><span>").append(pct).append("%</span></div>\n");
            sb.append("</div>\n");
        }
        sb.append("</div>\n</div>\n");

        // Facilities Table
        sb.append("<div class=\"card\">\n<div class=\"card-title\"><span>FACILITY OPERATIONAL STATUS & ALLOCATION</span><span style=\"font-size:11px; font-weight:400; color:var(--muted);\">Autonomous Priority Hierarchy</span></div>\n");
        sb.append("<div style=\"overflow-x:auto;\"><table class=\"data-table\">\n");
        sb.append("<thead><tr><th>Priority</th><th>Facility</th><th>Operating Level</th><th>Condition</th><th>Status</th><th>Power Draw</th><th>Water Draw</th></tr></thead>\n<tbody>\n");
        for (ColonyState.FacilityData f : state.getFacilities()) {
            String tagClass = "tag-nom";
            if ("PROTECTED".equals(f.statusLabel)) tagClass = "tag-prot";
            else if (f.statusLabel != null && f.statusLabel.startsWith("REDUCED")) tagClass = "tag-red";
            else if ("PAUSED".equals(f.statusLabel)) tagClass = "tag-pau";

            sb.append("<tr>\n");
            sb.append("<td style=\"font-weight:700; color:var(--accent);\">Pri ").append(f.priority).append("</td>\n");
            sb.append("<td style=\"font-weight:600; color:#fff;\">").append(f.name).append("</td>\n");
            sb.append("<td><div style=\"display:flex; align-items:center; gap:8px;\"><div class=\"bar-track\" style=\"width:70px; margin:0;\"><div class=\"bar-fill\" style=\"width:").append((int) f.operatingLevelPct).append("%; background:var(--accent);\"></div></div><span>").append((int) f.operatingLevelPct).append("%</span></div></td>\n");
            sb.append("<td>").append(String.format(java.util.Locale.US, "%.0f%%", f.conditionPct)).append("</td>\n");
            sb.append("<td><span class=\"tag ").append(tagClass).append("\">").append(f.statusLabel).append("</span></td>\n");
            sb.append("<td style=\"font-family:'JetBrains Mono',monospace;\">").append(String.format(java.util.Locale.US, "%.1f kW", f.powerConsumption)).append("</td>\n");
            sb.append("<td style=\"font-family:'JetBrains Mono',monospace;\">").append(String.format(java.util.Locale.US, "%.1f L", f.waterConsumption)).append("</td>\n");
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table></div>\n</div>\n");

        // Management Actions & Events Grid
        sb.append("<div class=\"grid-2\">\n");
        
        // Active Events
        sb.append("<div class=\"card\" style=\"margin-bottom:0;\">\n");
        sb.append("<div class=\"card-title\"><span>ACTIVE ENVIRONMENTAL HAZARDS</span></div>\n");
        if (state.getActiveEvents().isEmpty()) {
            sb.append("<div class=\"empty-note\">✓ Nominal conditions — No active environmental hazards.</div>\n");
        } else {
            for (ColonyState.EventData ev : state.getActiveEvents()) {
                sb.append("<div style=\"background:rgba(255,87,34,0.1); border:1px solid rgba(255,87,34,0.3); border-radius:6px; padding:10px 14px; margin-bottom:8px;\">\n");
                sb.append("<div style=\"display:flex; justify-content:space-between; font-weight:600; font-size:13px; color:var(--mars);\"><span>").append(ev.name).append("</span><span style=\"font-size:11px;\">").append(ev.durationRemaining).append(" Sols Remaining</span></div>\n");
                sb.append("<div style=\"font-size:12px; color:var(--muted); margin-top:4px;\">").append(ev.description).append("</div>\n");
                sb.append("</div>\n");
            }
        }
        sb.append("</div>\n");

        // Autonomous Responses
        sb.append("<div class=\"card\" style=\"margin-bottom:0;\">\n");
        sb.append("<div class=\"card-title\"><span>AUTONOMOUS MANAGEMENT ACTIONS</span></div>\n");
        if (state.getManagementResponse().isEmpty()) {
            sb.append("<div class=\"empty-note\">Colony equilibrium steady. No active load shedding.</div>\n");
        } else {
            for (ColonyState.ResponseActionData act : state.getManagementResponse()) {
                sb.append("<div style=\"display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:12px;\">\n");
                sb.append("<div><span style=\"font-weight:600; color:#fff;\">").append(act.facility).append("</span> <span style=\"color:var(--muted);\">(").append(act.transition).append(")</span></div>\n");
                sb.append("<span class=\"tag tag-").append("PROTECTED".equals(act.action) ? "prot" : ("PAUSED".equals(act.action) ? "pau" : "red")).append("\">").append(act.action).append("</span>\n");
                sb.append("</div>\n");
            }
        }
        sb.append("</div>\n");
        sb.append("</div>\n");

        // API Endpoints Explorer
        sb.append("<div class=\"card\" style=\"margin-top:24px;\">\n");
        sb.append("<div class=\"card-title\"><span>REST API ENDPOINTS (JSON)</span><span style=\"font-size:11px; font-weight:400; color:var(--muted);\">Click to Inspect Live Payload</span></div>\n");
        sb.append("<div class=\"endpoints-list\">\n");
        sb.append("<a class=\"api-chip\" href=\"/api/state\" target=\"_blank\"><span class=\"api-method\">GET</span>/api/state</a>\n");
        sb.append("<a class=\"api-chip\" href=\"/api/resources\" target=\"_blank\"><span class=\"api-method\">GET</span>/api/resources</a>\n");
        sb.append("<a class=\"api-chip\" href=\"/api/facilities\" target=\"_blank\"><span class=\"api-method\">GET</span>/api/facilities</a>\n");
        sb.append("<a class=\"api-chip\" href=\"/api/events\" target=\"_blank\"><span class=\"api-method\">GET</span>/api/events</a>\n");
        sb.append("<a class=\"api-chip\" href=\"/api/management\" target=\"_blank\"><span class=\"api-method\">GET</span>/api/management</a>\n");
        sb.append("<a class=\"api-chip\" href=\"/api/recovery\" target=\"_blank\"><span class=\"api-method\">GET</span>/api/recovery</a>\n");
        sb.append("</div>\n</div>\n");

        sb.append("</div>\n"); // container
        sb.append("<script>\n");
        sb.append("async function apiCall(endpoint, method='POST', body=null) {\n");
        sb.append("  try {\n");
        sb.append("    const opts = { method, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };\n");
        sb.append("    if (body) opts.body = JSON.stringify(body);\n");
        sb.append("    const res = await fetch(endpoint, opts);\n");
        sb.append("    if (res.ok) { location.reload(); }\n");
        sb.append("  } catch (e) { alert('API Error: ' + e.message); }\n");
        sb.append("}\n");
        sb.append("</script>\n</body>\n</html>\n");
        return sb.toString();
    }
}
