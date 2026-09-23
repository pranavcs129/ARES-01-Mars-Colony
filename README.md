# ARES-01 — Mars Colony Resource Management & Simulation

ARES-01 is a Java-based Object-Oriented Programming (OOP) project that simulates resource management, facility operations, and environmental monitoring in an off-world Martian settlement. The colony serves as a primary case study for designing a modular, resilient, and scalable resource-management architecture under extreme external constraints.

The project combines an autonomous Java simulation backend—handling dynamic Sol cycles, production/consumption thermodynamics, incident generation, and recovery logic—with an interactive Three.js 2.5D isometric frontend for real-time visualization and facility inspection.

---

## Architecture

The system operates on a client-server architecture where the Java OOP simulation maintains authoritative colony state and exposes state snapshots via an embedded HTTP REST API consumed by the Three.js visualization layer.

```
Three.js Frontend (Vite, JavaScript, CSS)
       ↓  (HTTP REST Polling & Colony Response Actions)
REST API (ColonyHttpServer / Java HttpServer)
       ↓
Java OOP Simulation Engine
       ↓
Resources / Facilities / Events / Management / Recovery
```

### Major Systems
- **Resource Management**: Tracking and calculating dynamic production, consumption, reserve capacities, and critical limits for Power, Water, Oxygen, and Food.
- **Resource Monitoring**: Real-time telemetry monitoring, Sol-by-Sol rate-of-change analysis, and system health status grading.
- **Facility Management**: Operational state handling for Habitat, Greenhouse, Water Extractor, Solar Array, Nuclear Reactor, Life Support, and Storage Depot modules.
- **Environmental Conditions**: External environmental simulation tracking solar irradiance, surface temperature, atmospheric pressure, and dust levels.
- **Events & Hazards**: Dynamic generation and resolution of environmental and operational incidents (e.g., Dust Storms, Solar Flares, Equipment Malfunctions).
- **Automatic Resource Allocation**: Priority-weighted distribution of power, water, and oxygen when supplies operate below safe operating thresholds.
- **Incident Recovery**: Multi-tier response strategies and automated triage procedures to stabilize degraded facility subsystems.
- **Colony Progression**: Milestone and Sol tracking monitoring settlement longevity, population stability, and resource sustainability.
- **Three.js Visualization**: Interactive isometric 3D viewport rendering the colony model, module statuses, shadows, and status overlays.
- **Java OOP Backend**: Strongly-typed object model implementing encapsulation, inheritance, interfaces, and custom exception handling.

---

## Technologies Used

- **Java (JDK 17+)**: Core object-oriented simulation engine, domain models, and HTTP server.
- **Object-Oriented Programming (OOP)**: Encapsulated subsystems, polymorphic facilities, domain exceptions, and manager patterns.
- **Three.js**: WebGL-based 2.5D isometric colony rendering, lighting, camera controls, and interactive raycasting.
- **JavaScript (ES6+)**: Frontend application logic, telemetry streaming, and UI controller modules.
- **Vite**: Modern development server and build tool for the frontend client.
- **REST API**: JSON-based state exchange between Java backend and web client.

---

## Key Features

- **Authoritative Simulation State**: All production, consumption, degradation, and Sol transitions are computed in Java.
- **Live Colony Telemetry**: Detailed real-time readings of colony reserves, per-Sol generation rates, and active alerts.
- **Facility Inspector**: Interactive 3D selection of settlement structures with real-time operational efficiency metrics.
- **Manual & Automated Response**: Execute recovery actions (e.g., life support purge, backup power routing, greenhouse rationing) to stabilize distressed modules.
- **Incident Mechanics**: Unforeseen hazards impact specific facilities and demand active resource redistribution.
- **Lightweight & High-Performance**: Optimized Three.js rendering maintaining smooth framerates on standard hardware.

---

## Project Structure

```
.
├── backend/
│   ├── src/colony/
│   │   ├── api/           # ColonyHttpServer REST API endpoints
│   │   ├── event/         # EventManager, Event, and incident types
│   │   ├── exception/     # Custom domain exceptions
│   │   ├── management/    # ResourceManager, ManagementSystem, RecoverySystem
│   │   ├── model/         # Facility subclasses (Habitat, Greenhouse, etc.)
│   │   └── simulation/    # SimulationEngine, ColonyState, Sol progression
│   ├── compile.sh         # Java compilation script
│   ├── run.sh             # Run headless CLI simulation
│   └── start-server.sh    # Start the Java REST API server
├── src/
│   ├── controls/          # Camera navigation and interaction controls
│   ├── core/              # Three.js SceneManager, CameraController
│   ├── environment/       # Lighting, terrain bed, colony animations
│   ├── interaction/       # Raycasting, building selection, hover events
│   ├── loaders/           # GLTF/GLB colony asset loader
│   ├── simulation/        # Frontend SimulationManager & REST client bridge
│   ├── styles/            # UI styles (HUD, facility inspector, monitors)
│   ├── ui/                # UI overlays, monitoring panels, response modals
│   └── main.js            # Frontend entry point and bootstrap
├── assets/                # 3D assets, textures, and UI cards
├── public/                # Static public web assets
├── index.html             # Application HTML shell
├── package.json           # Frontend dependencies and npm scripts
└── vite.config.js         # Vite configuration and proxy setup
```

---

## Running the Project

Running ARES-01 requires running the Java REST API backend and the Vite frontend in separate terminal windows.

### Prerequisites
- **Java Development Kit (JDK 17 or later)**
- **Node.js (v18 or later) & npm**

---

### Step 1: Start the Java Backend

In your first terminal, navigate to the `backend` directory and start the server:

```bash
cd backend
./start-server.sh
```

*Note: `start-server.sh` will automatically compile the Java source files into `backend/bin` if binaries are missing, then launch the REST server on `http://localhost:8080`.*

---

### Step 2: Start the Frontend Client

In a second terminal, install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Open your browser and navigate to the local address displayed by Vite (typically `http://localhost:5173`).

---

## Current Status

ARES-01 is actively maintained and functional as an academic and portfolio project. The core colony environment, 3D module visualization, Sol progression, dynamic resource simulation, facility inspector, and incident recovery workflows are fully implemented and integrated.

---

## Future Scope

- Extended facility construction and module expansion mechanics.
- Enhanced historical Sol logging and data export capabilities.
- Additional environmental hazard profiles and custom scenario scripting.
- Automated unit test suites covering edge-case recovery scenarios.
