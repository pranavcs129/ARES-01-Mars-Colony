# Mars Colony Resource Management & Monitoring Simulation
## Java OOP Backend Architecture

This backend simulates an autonomous resource management and monitoring system for an isolated Martian colony. It fulfills BTech S3 Object-Oriented Programming (OOP) requirements through clean, idiomatic Java using only the standard library (no external Maven or Gradle dependencies).

---

## 1. Quick Start

### Compile
```bash
./backend/compile.sh
```

### Run 6-Sol Demonstration Scenario
```bash
./backend/run.sh
```

### Start REST API Server (Port 8080)
```bash
./backend/start-server.sh
```

---

## 2. Package Architecture

```
colony/
├── Main.java                # 6-Sol demonstration runner and CLI entry point
├── exception/               # Custom checked exceptions
│   ├── ColonyException.java
│   ├── ResourceDepletedException.java
│   ├── InvalidOperatingLevelException.java
│   └── FacilityDamagedException.java
├── model/                  # Domain entity models
│   ├── Resource.java        # Abstract base resource
│   ├── Oxygen.java          # 900 / 1000 kg
│   ├── Water.java           # 800 / 1000 L
│   ├── Food.java            # 850 / 1000 kg
│   ├── Power.java           # 480 / 500 kW (with emergency battery reserve)
│   ├── Facility.java        # Abstract base facility (operating level 0.0-1.0, priority 1-5)
│   ├── Habitat.java         # Priority 1: Life Support (Permanently PROTECTED at 100%)
│   ├── PowerStation.java    # Priority 2: Primary Generation (Solar + Nuclear + Aux)
│   ├── WaterExtractor.java  # Priority 2: Sub-surface water extraction
│   ├── Greenhouse.java      # Priority 3: Hydroponic crop production
│   ├── ResearchFacility.java# Priority 4: Scientific telemetry and research
│   └── LandingZone.java     # Priority 5: Mining & logistics (First load shed)
├── event/                  # Dynamic hazards & system malfunctions
│   ├── Event.java           # Abstract base event
│   ├── DustStorm.java       # Reduces solar generation by 85%
│   ├── PowerFailure.java    # Grid delivery reduction
│   ├── WaterFailure.java    # Pipe blockages / extraction loss
│   ├── SolarFlare.java      # Radiation burst / battery drain
│   └── EquipmentFailure.java# Hardware degradation
├── management/             # Autonomous decision-making
│   ├── ResourceManager.java # Central telemetry, rates, and shortage detection
│   ├── ManagementSystem.java# Automatic priority-based load shedding
│   └── RecoverySystem.java  # Auxiliary generator control & stepwise rehabilitation
├── simulation/             # Simulation director & state snapshots
│   ├── ColonyState.java     # Immutable snapshot DTO with zero-dependency JSON serializer
│   └── SimulationEngine.java# Deterministic 9-step Sol tick cycle
└── service/                # Zero-dependency HTTP REST API
    └── ColonyHttpServer.java# Built-in HttpServer on port 8080 with CORS
```

---

## 3. OOP Principles Demonstrated

1. **Encapsulation**: Private fields, guarded accessors, and invariant protection (e.g., `Habitat` throws `InvalidOperatingLevelException` if any attempt is made to throttle Life Support below 100%).
2. **Inheritance**: Base hierarchies rooted in `Resource`, `Facility`, `Event`, and `ColonyException`.
3. **Abstraction**: Abstract behaviors (`operate()`, `applyEffect()`, `calculateConsumption()`, `getBaseDemand()`) implemented specifically by each child class.
4. **Polymorphism**: Dynamic method dispatch across heterogenous collections (`List<Facility>`, `List<Event>`).
5. **Collections & Generics**: `Map<String, Resource>` for $O(1)$ metric lookup, `List<Facility>` dynamically sorted by priority during load shedding.
6. **Exception Handling**: Custom checked exceptions handling missing resources and illegal operation bounds.
7. **Autonomous Control**: The user does NOT manually drag sliders; the colony management system autonomously sheds non-essential load to maintain power balance while protecting Life Support.
8. **Built-in REST API**: Standard library `com.sun.net.httpserver.HttpServer` allows full integration with the Three.js web UI without any external JARs.

---

## 4. HTTP API Endpoints (Port 8080)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/state` | Complete colony telemetry, resources, facilities, events, and response actions (JSON) |
| `GET` | `/api/resources` | Current balances, production, and consumption rates |
| `GET` | `/api/facilities` | Operating levels, priorities, and status labels |
| `GET` | `/api/events` | Active environmental hazards and remaining duration |
| `GET` | `/api/management` | Autonomous actions taken during current Sol |
| `GET` | `/api/recovery` | Auxiliary generator status and battery rehabilitation level |
| `POST`| `/api/step` | Advance simulation by 1 Sol and return updated state JSON |
