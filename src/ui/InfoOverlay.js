import { FacilityInspectorRenderer } from './FacilityInspectorRenderer.js';
import { ResourceManagementWindow } from './ResourceManagementWindow.js';

export class InfoOverlay {
  constructor(containerElement, cameraController) {
    this.container = containerElement;
    this.cameraController = cameraController;
    this.interactionManager = null;
    this.simulationManager = null;
    this.currentStructureId = null;

    // Persistent event notification states to prevent repeated animations/flashing
    this.eventMeta = new Map();
    this.resolvedMeta = new Map();

    // Cached DOM references for high-performance tick updates
    this.dom = {};

    this.loadingStartTime = Date.now();
    this.isLoadingComplete = false;
    this.loadingAnimRaf = null;

    this.render();
    this.cacheDomReferences();
    this.startLoadingEmblemAnimation();
    this.resourceWindow = new ResourceManagementWindow(this.container, this.simulationManager);
    this.attachEvents();
    this.startCompassTracker();
  }

  setCameraController(cameraController) {
    this.cameraController = cameraController;
  }

  setInteractionManager(interactionManager) {
    this.interactionManager = interactionManager;
  }

  setSimulationManager(simulationManager) {
    this.simulationManager = simulationManager;
    if (this.resourceWindow) {
      this.resourceWindow.simulationManager = simulationManager;
    }
    this.simulationManager.addListener((snapshot) => {
      this.onSimulationTick(snapshot);
    });
  }

  render() {
    this.container.innerHTML = `
      <!-- EXACT REFERENCE TOP HUD: Single Horizontal System of Connected-Looking Rounded Capsules -->
      <header class="mission-hud-bar" aria-label="Ares-01 Colony Telemetry and Operations">
        
        <!-- [1] COLONY IDENTITY -->
        <div class="hud-capsule hud-identity-capsule ares-glass-pill" id="hud-colony-identity" title="Colony Outpost Ares-01">
          <div class="hud-capsule-icon-wrap hud-planet-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14.5c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              <path d="M3 15.5c2.5 1.5 6 2 9 2s6.5-.5 9-2" />
              <path d="M6 11.5c1.8-1 4-1.5 6-1.5s4.2.5 6 1.5" />
            </svg>
          </div>
          <span class="hud-status-dot green-dot" id="hud-identity-dot"></span>
          <div class="hud-text-stack">
            <span class="hud-label-primary">ARES-01</span>
            <span class="hud-label-secondary">MARS COLONY</span>
          </div>
        </div>

        <!-- [2] SOL / TIME -->
        <div class="hud-capsule hud-time-capsule ares-glass-pill" id="hud-sol-time">
          <div class="hud-time-sub">
            <span id="clock-sol-text" class="hud-label-primary">SOL 003</span>
            <span class="hud-label-secondary">MARTIAN DAY</span>
          </div>
          <div class="hud-hairline-sep"></div>
          <div class="hud-time-sub">
            <span id="clock-time-text" class="hud-label-primary">04:54</span>
            <span class="hud-label-secondary">LOCAL TIME</span>
          </div>
        </div>

        <!-- [3] SIMULATION CONTROLS -->
        <div class="hud-capsule hud-sim-capsule ares-glass-pill" aria-label="Simulation Speed Controls">
          <button id="btn-sim-playpause" class="hud-ctrl-icon-btn" title="Toggle Play / Pause">
            <span id="btn-playpause-icon" class="hud-icon-svg">
              <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
                <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" />
                <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" />
              </svg>
            </span>
          </button>
          <div class="hud-speed-pill-group">
            <button class="speed-opt" data-speed="0.5" title="0.5x Slow (1 Sol = 2 mins)">0.5x</button>
            <button class="speed-opt active" data-speed="1" title="1x Real Pace (1 Sol = 1 min)">1x</button>
            <button class="speed-opt" data-speed="2" title="2x Fast (1 Sol = 30s)">2x</button>
            <button class="speed-opt" data-speed="5" title="5x Very Fast (1 Sol = 12s)">5x</button>
            <button class="speed-opt" data-speed="10" title="10x Rapid (1 Sol = 6s)">10x</button>
          </div>
          <button id="btn-sim-reset" class="hud-ctrl-icon-btn hud-reset-icon-btn" title="Reset Simulation Clock">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
              <path d="M2.5 8a5.5 5.5 0 1 0 1.2-3.4L2 6.5"/>
              <path d="M2 2.5v4h4"/>
            </svg>
          </button>
        </div>

        <!-- [4] COLONY STATUS -->
        <div class="hud-capsule hud-status-capsule status-stable ares-glass-pill" id="hud-colony-status-pill" title="Colony Health Status">
          <span class="hud-status-dot" id="hud-status-dot"></span>
          <div class="hud-text-stack">
            <span id="hud-colony-status-text" class="hud-label-primary">STABLE</span>
            <span class="hud-label-secondary">COLONY STATUS</span>
          </div>
        </div>



        <!-- [5] OXYGEN -->
        <div class="hud-capsule hud-resource-capsule ares-glass-pill" id="res-item-oxygen" title="Atmospheric O₂ Supply">
          <div class="hud-resource-icon cyan-accent">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="9" r="5.5" />
              <path d="M12.5 12.5a2 2 0 1 1-2-2" />
            </svg>
          </div>
          <div class="hud-resource-content">
            <div class="hud-resource-top">
              <span class="hud-resource-code">O₂</span>
              <span id="res-val-oxygen" class="hud-resource-val">90%</span>
              <span id="res-trend-oxygen" class="hud-resource-trend trend-up">↑</span>
            </div>
            <div class="hud-resource-bar-track">
              <div id="res-bar-oxygen" class="hud-resource-bar-fill bar-o2" style="width: 90%"></div>
            </div>
          </div>
        </div>

        <!-- [6] WATER -->
        <div class="hud-capsule hud-resource-capsule ares-glass-pill" id="res-item-water" title="H₂O Reserves">
          <div class="hud-resource-icon cyan-accent">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 2.5C7 5.5 5 8 5 11a4 4 0 0 0 8 0c0-3-2-5.5-4-8.5z" />
            </svg>
          </div>
          <div class="hud-resource-content">
            <div class="hud-resource-top">
              <span class="hud-resource-code">H₂O</span>
              <span id="res-val-water" class="hud-resource-val">78%</span>
              <span id="res-trend-water" class="hud-resource-trend trend-down">↓</span>
            </div>
            <div class="hud-resource-bar-track">
              <div id="res-bar-water" class="hud-resource-bar-fill bar-water" style="width: 78%"></div>
            </div>
          </div>
        </div>

        <!-- [7] FOOD -->
        <div class="hud-capsule hud-resource-capsule ares-glass-pill" id="res-item-food" title="Food Reserves">
          <div class="hud-resource-icon amber-accent">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 16V8" />
              <path d="M9 8c0-3 2.5-4.5 4.5-4.5 0 2.5-1.5 4.5-4.5 4.5z" />
              <path d="M9 11.5c0-2-2-3-3.5-3 0 2 1.2 3 3.5 3z" />
            </svg>
          </div>
          <div class="hud-resource-content">
            <div class="hud-resource-top">
              <span class="hud-resource-code">FOOD</span>
              <span id="res-val-food" class="hud-resource-val">86%</span>
              <span id="res-trend-food" class="hud-resource-trend trend-neutral">—</span>
            </div>
            <div class="hud-resource-bar-track">
              <div id="res-bar-food" class="hud-resource-bar-fill bar-food" style="width: 86%"></div>
            </div>
          </div>
        </div>

        <!-- [8] POWER -->
        <div class="hud-capsule hud-resource-capsule ares-glass-pill" id="res-item-power" title="Grid Power Output">
          <div class="hud-resource-icon yellow-accent">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="10,2 4,10 9,10 8,16 14,8 9,8" />
            </svg>
          </div>
          <div class="hud-resource-content">
            <div class="hud-resource-top">
              <span class="hud-resource-code">POWER</span>
              <span id="res-val-power" class="hud-resource-val">88%</span>
              <span id="res-trend-power" class="hud-resource-trend trend-down">↓</span>
            </div>
            <div class="hud-resource-bar-track">
              <div id="res-bar-power" class="hud-resource-bar-fill bar-power" style="width: 88%"></div>
            </div>
          </div>
        </div>

        <!-- [9] COLONY HEALTH / PHASE -->
        <div class="hud-capsule hud-health-phase-capsule ares-glass-pill" id="hud-health-badge" title="Colony Vital Health & Expansion Phase (Click to view telemetry)">
          <div class="hud-health-icon">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 15.2s-5.5-3.4-5.5-7.2a3.5 3.5 0 0 1 5.5-2.2 3.5 3.5 0 0 1 5.5 2.2c0 3.8-5.5 7.2-5.5 7.2z" />
            </svg>
          </div>
          <div class="hud-health-content">
            <div class="hud-health-top">
              <span class="hud-health-title">HEALTH</span>
              <span id="hud-health-score" class="hud-health-val">73%</span>
            </div>
            <div class="hud-health-bar-track">
              <div id="hud-health-bar" class="hud-health-bar-fill" style="width: 73%"></div>
            </div>
            <div class="hud-phase-row">
              <span id="hud-prog-phase-code" class="hud-phase-text">PHASE 3</span>
              <span class="hud-phase-dot">·</span>
              <span id="hud-prog-pct" class="hud-phase-pct">60%</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Persistent Calm Event Alert Dock (Upper Center/Right) -->
      <div id="hud-event-dock" class="hud-event-dock" aria-live="polite"></div>

      <!-- Compact Colony Monitoring Drawer (Toggled by HEALTH button) -->
      <aside id="colony-monitor-drawer" class="colony-monitor-drawer ares-liquid-glass ares-glass-panel" aria-label="Colony Monitoring Console">
        <div class="monitor-inner">
          <!-- Header -->
          <div class="monitor-header">
            <span class="monitor-title">COLONY MONITORING</span>
            <button id="btn-close-monitor" class="drawer-close-btn" title="Close Monitor">✕</button>
          </div>

          <!-- Section 1: Colony Status -->
          <div class="cm-section">
            <div class="cm-section-label">COLONY STATUS</div>
            <div class="cm-status-header">
              <div class="cm-status-lead">
                <span class="cm-status-dot dot-stable" id="cm-status-dot"></span>
                <span id="cm-status-badge" class="cm-status-badge cm-badge-stable">STABLE</span>
                <span class="cm-status-divider">/</span>
                <span class="cm-health-prefix">HEALTH</span>
                <span id="cm-health-value" class="cm-health-value">87%</span>
              </div>
            </div>
            <div class="cm-health-bar-track">
              <div id="cm-health-bar-fill" class="cm-health-bar-fill" style="width: 87%"></div>
            </div>
          </div>

          <!-- Section 2: Mars Environment -->
          <div class="cm-section">
            <div class="cm-section-label">MARS ENVIRONMENT</div>
            <div class="cm-env-strip">
              <div class="cm-env-col">
                <span class="cm-env-key">TEMP</span>
                <span id="cm-env-temp" class="cm-env-val">-63°C</span>
              </div>
              <div class="cm-env-sep"></div>
              <div class="cm-env-col">
                <span class="cm-env-key">PRESSURE</span>
                <span id="cm-env-pressure" class="cm-env-val">6.1 kPa</span>
              </div>
              <div class="cm-env-sep"></div>
              <div class="cm-env-col">
                <span class="cm-env-key">RADIATION</span>
                <span id="cm-env-radiation" class="cm-env-val cm-env-nominal">NORMAL</span>
              </div>
              <div class="cm-env-sep"></div>
              <div class="cm-env-col">
                <span class="cm-env-key">SOLAR</span>
                <span id="cm-env-solar" class="cm-env-val">78%</span>
              </div>
              <div class="cm-env-sep"></div>
              <div class="cm-env-col">
                <span class="cm-env-key">DUST</span>
                <span id="cm-env-dust" class="cm-env-val cm-env-nominal">LOW</span>
              </div>
            </div>
          </div>

          <!-- Section 3: Resource Telemetry -->
          <div class="cm-section">
            <div class="cm-section-label">RESOURCE TELEMETRY</div>
            <div id="cm-resource-list" class="cm-resource-list">
              <!-- Dynamically populated telemetry rows -->
            </div>
          </div>

          <!-- Section 4: Active Conditions -->
          <div class="cm-section">
            <div class="cm-section-label">ACTIVE CONDITIONS</div>
            <div id="cm-conditions-body" class="cm-conditions-body">
              <span class="cm-no-conditions">NO ACTIVE CONDITIONS</span>
            </div>
          </div>

          <!-- Section 5: Event Triggers (dev) -->
          <div class="cm-section">
            <div class="cm-section-label">TRIGGER EVENT</div>
            <div class="cm-trigger-grid">
              <button class="cm-trigger-btn event-trigger-btn" data-event-type="DUST_STORM">Dust Storm</button>
              <button class="cm-trigger-btn event-trigger-btn" data-event-type="SOLAR_FLARE">Solar Flare</button>
              <button class="cm-trigger-btn event-trigger-btn" data-event-type="EQUIPMENT_FAILURE">Equip. Fail</button>
              <button class="cm-trigger-btn event-trigger-btn" data-event-type="WATER_CONTAMINATION">Water Contam.</button>
              <button class="cm-trigger-btn event-trigger-btn" data-event-type="POWER_INTERRUPTION">Power Cut</button>
              <button class="cm-trigger-btn event-trigger-btn" data-event-type="MICROMETEOROID_IMPACT">Meteoroid</button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Compact Colony Progression Drawer (Toggled by PHASE button) -->
      <aside id="progression-drawer" class="progression-drawer ares-liquid-glass ares-glass-panel" aria-label="Colony Progression Console">
        <div class="progression-inner">
          <div class="prog-header">
            <div class="prog-title-group">
              <span class="prog-tag">COLONY DEVELOPMENT</span>
              <h3 id="prog-current-phase" class="prog-phase-title">PHASE 2 • INITIAL CREW</h3>
            </div>
            <button id="btn-close-progression" class="drawer-close-btn" title="Close Progression">✕</button>
          </div>

          <!-- Progression Meter -->
          <div class="prog-meter-box">
            <div class="prog-meta-row">
              <span class="prog-next-label">NEXT: <strong id="prog-next-phase">PERMANENT BASE</strong></span>
              <span id="prog-percent-text" class="prog-pct-val">80%</span>
            </div>
            <div class="prog-bar-track">
              <div id="prog-bar-fill" class="prog-bar-fill" style="width: 80%"></div>
            </div>
          </div>

          <!-- Unlock / Advance Action Button (Shown when canAdvance is true) -->
          <div id="prog-advance-container" class="prog-advance-box" style="display: none;">
            <button id="btn-advance-phase" class="btn-advance-phase">
              <span class="advance-icon">🚀</span>
              <span id="advance-phase-label">ADVANCE TO PHASE 3</span>
            </button>
          </div>

          <!-- Milestone Checklist -->
          <div class="prog-section">
            <div class="section-micro-header">DEVELOPMENT MILESTONES</div>
            <div id="prog-milestones-list" class="milestone-checklist">
              <!-- Populated dynamically with checklist items -->
            </div>
          </div>
        </div>
      </aside>

      <!-- Master NASA Mission-Control Facility Inspector Panel -->
      <aside id="structure-info-panel" class="facility-profile-panel ares-liquid-glass ares-glass-panel" aria-label="Facility Operations Console"></aside>

      <!-- Floating Hover Tooltip -->
      <div id="hover-tooltip" class="hover-tooltip ares-glass-pill">
        <div class="tooltip-header">
          <span class="tooltip-beacon"></span>
          <span id="tooltip-sector" class="tooltip-sector">FACILITY</span>
        </div>
        <div id="tooltip-title" class="tooltip-title">STRUCTURE NAME</div>
        <div id="tooltip-sub" class="tooltip-sub">CLICK TO VIEW PROFILE</div>
      </div>

      <!-- ARES-01 Minimal Animated Mission Boot Sequence -->
      <div id="colony-loading-overlay" class="loading-overlay" aria-label="System Initializing">
        <div class="loading-content">
          <!-- Layered Mars Orbital Composition -->
          <div class="loading-emblem-wrap">
            <svg class="loading-emblem-svg" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <!-- Mars Spherical Gradient -->
                <radialGradient id="marsSurfaceGrad" cx="35%" cy="32%" r="65%">
                  <stop offset="0%" stop-color="#fb923c" />
                  <stop offset="38%" stop-color="#ea580c" />
                  <stop offset="72%" stop-color="#c2410c" />
                  <stop offset="100%" stop-color="#7c2d12" />
                </radialGradient>

                <!-- Mars Surface Clip -->
                <clipPath id="marsBodyClip">
                  <circle cx="160" cy="160" r="52" />
                </clipPath>

                <!-- Rocket Thruster Exhaust Gradient -->
                <linearGradient id="rocketExhaustGrad" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stop-color="#f97316" stop-opacity="0.95" />
                  <stop offset="55%" stop-color="#ea580c" stop-opacity="0.45" />
                  <stop offset="100%" stop-color="#c2410c" stop-opacity="0" />
                </linearGradient>
              </defs>

              <!-- Layer 1: Back Orbit Arc (Behind Mars) -->
              <g class="loading-orbit-track" transform="translate(160, 160) rotate(-26)">
                <path class="orbit-path-back" d="M 112,0 A 112,38 0 0,1 -112,0" />
              </g>

              <!-- Layer 2: Rocket on Back Half (Occluded when behind Mars) -->
              <g transform="translate(160, 160) rotate(-26)">
                <g id="loading-rocket-back" class="loading-rocket-carrier" style="opacity: 0;">
                  <g class="rocket-silhouette">
                    <!-- Exhaust plume -->
                    <path class="rocket-exhaust" d="M -6,-1.8 L -20,0 L -6,1.8 Z" fill="url(#rocketExhaustGrad)" />
                    <path class="rocket-exhaust-core" d="M -6,-0.8 L -13,0 L -6,0.8 Z" fill="#fed7aa" />
                    <!-- Stabilizer fins -->
                    <path d="M -2,-3 L -5,-5.5 L -4,-3" fill="#cbd5e1" stroke="#0f172a" stroke-width="0.6" />
                    <path d="M -2,3 L -5,5.5 L -4,3" fill="#cbd5e1" stroke="#0f172a" stroke-width="0.6" />
                    <!-- Fuselage body -->
                    <path d="M 8,0 C 6,-1.6 0,-3 -5,-3 L -5,3 C 0,3 6,1.6 8,0 Z" fill="#ffffff" stroke="#0f172a" stroke-width="0.75" />
                    <!-- Cabin window -->
                    <circle cx="1.5" cy="0" r="1.2" fill="#0f172a" />
                  </g>
                </g>
              </g>

              <!-- Layer 3: Mars Sphere & Subtle Surface Markings -->
              <g class="loading-mars-sphere">
                <circle cx="160" cy="160" r="52" fill="url(#marsSurfaceGrad)" />
                <g clip-path="url(#marsBodyClip)">
                  <!-- Subtle crater markings -->
                  <ellipse cx="152" cy="135" rx="10" ry="5.5" transform="rotate(-20 152 135)" fill="#581c0c" opacity="0.38" />
                  <ellipse cx="132" cy="165" rx="14" ry="9" transform="rotate(-15 132 165)" fill="#4a1507" opacity="0.32" />
                  <!-- Diagonal canyon band -->
                  <path d="M 110,180 Q 145,172 178,185 T 215,190 L 215,220 L 110,220 Z" fill="#3b1105" opacity="0.22" />
                  <!-- Subtle terminator shadow -->
                  <path d="M 160,108 A 52,52 0 0,1 202,198 A 52,52 0 0,0 160,108 Z" fill="#1f0702" opacity="0.18" />
                </g>
              </g>

              <!-- Layer 4: Front Orbit Arc (Across front of Mars) -->
              <g class="loading-orbit-track" transform="translate(160, 160) rotate(-26)">
                <path class="orbit-path-front" d="M -112,0 A 112,38 0 0,1 112,0" />
              </g>

              <!-- Layer 5: Rocket on Front Half (In front of Mars) -->
              <g transform="translate(160, 160) rotate(-26)">
                <g id="loading-rocket-front" class="loading-rocket-carrier">
                  <g class="rocket-silhouette">
                    <!-- Exhaust plume -->
                    <path class="rocket-exhaust" d="M -6,-1.8 L -20,0 L -6,1.8 Z" fill="url(#rocketExhaustGrad)" />
                    <path class="rocket-exhaust-core" d="M -6,-0.8 L -13,0 L -6,0.8 Z" fill="#fed7aa" />
                    <!-- Stabilizer fins -->
                    <path d="M -2,-3 L -5,-5.5 L -4,-3" fill="#cbd5e1" stroke="#0f172a" stroke-width="0.6" />
                    <path d="M -2,3 L -5,5.5 L -4,3" fill="#cbd5e1" stroke="#0f172a" stroke-width="0.6" />
                    <!-- Fuselage body -->
                    <path d="M 8,0 C 6,-1.6 0,-3 -5,-3 L -5,3 C 0,3 6,1.6 8,0 Z" fill="#ffffff" stroke="#0f172a" stroke-width="0.75" />
                    <!-- Cabin window -->
                    <circle cx="1.5" cy="0" r="1.2" fill="#0f172a" />
                  </g>
                </g>
              </g>

              <!-- Layer 6: Astronaut Silhouette (Perched at upper-right apex) -->
              <g transform="translate(160, 160) rotate(-26)">
                <g class="loading-astronaut-carrier" transform="translate(112, -2)">
                  <g class="astronaut-silhouette">
                    <!-- Backpack (PLSS) -->
                    <rect x="-6" y="-9" width="3" height="7" rx="1.2" fill="#334155" stroke="#1e293b" stroke-width="0.7" />
                    <!-- Spacesuit torso -->
                    <path d="M -3,-8 C -4,-5 -4,0 -2,4 C -1,5 2,5 3,3 C 4,1 4,-5 2,-8 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="0.8" />
                    <!-- Helmet -->
                    <circle cx="0" cy="-13" r="5.5" fill="#f8fafc" stroke="#1e293b" stroke-width="0.8" />
                    <!-- Visor -->
                    <ellipse cx="1" cy="-13" rx="3.2" ry="3.5" fill="#0f172a" />
                    <path d="M -0.5,-15 A 2.2,2.2 0 0,1 2.2,-13" fill="none" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" />
                    <!-- Legs perched on orbit -->
                    <path d="M -1.5,4 L -2,9 L 0.5,9" fill="none" stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M 1.5,3.5 L 2.5,8 L 4.5,8" fill="none" stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                </g>
              </g>
            </svg>
          </div>

          <!-- ARES-01 Futuristic Typography & Mars Accent Bar -->
          <div class="loading-brand-wrap">
            <div class="loading-brand-title">ARES-01</div>
            <div class="loading-brand-bar"></div>
          </div>

          <!-- Understated Loading Progress -->
          <div class="loading-status-wrap">
            <div class="loading-status-label">INITIALIZING</div>
            <div class="loading-progress-track">
              <div class="loading-progress-fill" id="loading-progress-fill" style="width: 0%"></div>
            </div>
            <div class="loading-pct" id="loading-pct-val">0%</div>
          </div>
        </div>
      </div>

      <!-- EXACT REFERENCE LEFT-BOTTOM CONTROLS: Floating Vertical Stack + Compass Orbit Widget -->
      <div class="left-bottom-controls" aria-label="Colony Views and Orientation Controls">
        <!-- 1. Analytics / Monitoring -->
        <button id="btn-nav-analytics" class="left-nav-btn ares-glass-pill" title="Colony Telemetry & Analytics Console">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4.5" y1="16" x2="4.5" y2="12" />
            <line x1="10" y1="16" x2="10" y2="7.5" />
            <line x1="15.5" y1="16" x2="15.5" y2="4" />
          </svg>
        </button>

        <!-- 2. Map / Overview -->
        <button id="btn-nav-map" class="left-nav-btn ares-glass-pill" title="Colony Map / Strategic Overview">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="2.5,4.5 7.5,2.5 12.5,4.5 17.5,2.5 17.5,15.5 12.5,17.5 7.5,15.5 2.5,17.5" />
            <line x1="7.5" y1="2.5" x2="7.5" y2="15.5" />
            <line x1="12.5" y1="4.5" x2="12.5" y2="17.5" />
          </svg>
        </button>

        <!-- 3. Settings / Progression -->
        <button id="btn-nav-settings" class="left-nav-btn ares-glass-pill" title="Colony Development & Settings">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="10" cy="10" r="3.2" />
            <path d="M16.2 10a6.2 6.2 0 0 0-.1-1l1.5-1.1-1.4-2.5-1.8.6a6.2 6.2 0 0 0-1.7-1l-.3-1.8H9.3l-.3 1.8a6.2 6.2 0 0 0-1.7 1l-1.8-.6-1.4 2.5 1.5 1.1a6.2 6.2 0 0 0 0 2l-1.5 1.1 1.4 2.5 1.8-.6a6.2 6.2 0 0 0 1.7 1l.3 1.8h2.8l.3-1.8a6.2 6.2 0 0 0 1.7-1l1.8.6 1.4-2.5-1.5-1.1c.1-.3.1-.7.1-1z" />
          </svg>
        </button>

        <!-- Compass & Orbit Widget -->
        <div class="camera-control-stack">
          <div class="compass-widget ares-glass-pill" id="btn-camera-compass" title="Orientation Compass (Click to reset North)">
            <span class="compass-north-letter">N</span>
            <svg viewBox="0 0 56 56" class="compass-svg">
              <!-- Outer subtle rings -->
              <circle cx="28" cy="28" r="25.5" fill="none" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1" />
              <circle cx="28" cy="28" r="21" fill="none" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1" stroke-dasharray="2 2" />
              <!-- Subtle tick markers -->
              <line x1="28" y1="4.5" x2="28" y2="9" stroke="rgba(255, 255, 255, 0.45)" stroke-width="1.2" />
              <line x1="28" y1="47" x2="28" y2="51.5" stroke="rgba(255, 255, 255, 0.18)" stroke-width="1" />
              <line x1="4.5" y1="28" x2="9" y2="28" stroke="rgba(255, 255, 255, 0.18)" stroke-width="1" />
              <line x1="47" y1="28" x2="51.5" y2="28" stroke="rgba(255, 255, 255, 0.18)" stroke-width="1" />
              <!-- Rotating needle group representing current camera azimuth -->
              <g id="compass-needle-group" transform="rotate(0 28 28)">
                <polygon points="28,12 32,28 28,25 24,28" fill="#ffffff" />
                <polygon points="28,44 32,28 28,25 24,28" fill="rgba(255, 255, 255, 0.22)" />
                <circle cx="28" cy="28" r="2.5" fill="#ffffff" />
              </g>
            </svg>
          </div>

          <div class="camera-orbit-pill ares-glass-pill" id="btn-camera-orbit" title="Orbit Camera View (Click to rotate 45°)">
            <span>CAMERA</span>
            <span>ORBIT</span>
          </div>
        </div>
      </div>

      <!-- EXACT BOTTOM-RIGHT FLOATING ACCESS BUTTON: Standalone Resource Management -->
      <div class="right-bottom-controls" aria-label="Colony Resource Management">
        <button id="btn-resource-manager" class="right-nav-btn ares-glass-pill" title="Resource Management & Allocation Console (Click to Open)">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="10" cy="4.5" rx="6.5" ry="2.2" />
            <path d="M3.5 4.5v5.5c0 1.2 2.9 2.2 6.5 2.2s6.5-1 6.5-2.2V4.5" />
            <path d="M3.5 10v5.5c0 1.2 2.9 2.2 6.5 2.2s6.5-1 6.5-2.2V10" />
          </svg>
        </button>
        <span class="right-nav-pill-label">RESOURCES</span>
      </div>
    `;
  }

  cacheDomReferences() {
    this.dom = {
      // Mission Telemetry
      solText: document.getElementById('clock-sol-text'),
      timeText: document.getElementById('clock-time-text'),
      statusPill: document.getElementById('hud-colony-status-pill'),
      statusText: document.getElementById('hud-colony-status-text'),
      statusDot: document.getElementById('hud-status-dot'),


      // Secondary Sim controls
      playPauseBtn: document.getElementById('btn-sim-playpause'),
      playPauseIcon: document.getElementById('btn-playpause-icon'),
      playPauseText: document.getElementById('btn-playpause-text'),
      resetSimBtn: document.getElementById('btn-sim-reset'),
      speedOpts: document.querySelectorAll('.speed-opt'),

      // Telemetry & Progression HUD Badges
      healthBadge: document.getElementById('hud-health-badge'),
      healthScore: document.getElementById('hud-health-score'),
      healthBar: document.getElementById('hud-health-bar'),
      progBadge: document.getElementById('hud-prog-badge'),
      progPhaseCode: document.getElementById('hud-prog-phase-code'),
      progPct: document.getElementById('hud-prog-pct'),

      // Left-Bottom Floating Controls & Compass
      navAnalyticsBtn: document.getElementById('btn-nav-analytics'),
      navMapBtn: document.getElementById('btn-nav-map'),
      navSettingsBtn: document.getElementById('btn-nav-settings'),
      cameraCompass: document.getElementById('btn-camera-compass'),
      compassNeedleGroup: document.getElementById('compass-needle-group'),
      cameraOrbitBtn: document.getElementById('btn-camera-orbit'),

      // Bottom-Right Floating Control
      btnResourceManager: document.getElementById('btn-resource-manager'),

      // Top Resources
      resO2Val: document.getElementById('res-val-oxygen'),
      resO2Bar: document.getElementById('res-bar-oxygen'),
      resO2Trend: document.getElementById('res-trend-oxygen'),
      resO2Item: document.getElementById('res-item-oxygen'),

      resWaterVal: document.getElementById('res-val-water'),
      resWaterBar: document.getElementById('res-bar-water'),
      resWaterTrend: document.getElementById('res-trend-water'),
      resWaterItem: document.getElementById('res-item-water'),

      resFoodVal: document.getElementById('res-val-food'),
      resFoodBar: document.getElementById('res-bar-food'),
      resFoodTrend: document.getElementById('res-trend-food'),
      resFoodItem: document.getElementById('res-item-food'),

      resPowerVal: document.getElementById('res-val-power'),
      resPowerBar: document.getElementById('res-bar-power'),
      resPowerTrend: document.getElementById('res-trend-power'),
      resPowerItem: document.getElementById('res-item-power'),

      // Persistent Event Alert Dock
      eventDock: document.getElementById('hud-event-dock'),

      // Colony Monitoring Drawer
      monitorDrawer: document.getElementById('colony-monitor-drawer'),
      closeMonitorBtn: document.getElementById('btn-close-monitor'),
      cmStatusDot: document.getElementById('cm-status-dot'),
      cmStatusBadge: document.getElementById('cm-status-badge'),
      cmHealthValue: document.getElementById('cm-health-value'),
      cmHealthBarFill: document.getElementById('cm-health-bar-fill'),
      cmEnvTemp: document.getElementById('cm-env-temp'),
      cmEnvPressure: document.getElementById('cm-env-pressure'),
      cmEnvRadiation: document.getElementById('cm-env-radiation'),
      cmEnvSolar: document.getElementById('cm-env-solar'),
      cmEnvDust: document.getElementById('cm-env-dust'),
      cmResourceList: document.getElementById('cm-resource-list'),
      cmResourceTbody: document.getElementById('cm-resource-list'),
      cmConditionsBody: document.getElementById('cm-conditions-body'),

      // Progression Drawer
      progDrawer: document.getElementById('progression-drawer'),
      closeProgBtn: document.getElementById('btn-close-progression'),
      progCurrentPhase: document.getElementById('prog-current-phase'),
      progNextPhase: document.getElementById('prog-next-phase'),
      progPercentText: document.getElementById('prog-percent-text'),
      progBarFill: document.getElementById('prog-bar-fill'),
      progAdvanceContainer: document.getElementById('prog-advance-container'),
      advancePhaseBtn: document.getElementById('btn-advance-phase'),
      advancePhaseLabel: document.getElementById('advance-phase-label'),
      progMilestonesList: document.getElementById('prog-milestones-list'),

      // Facility Panel
      panel: document.getElementById('structure-info-panel'),
      panelSector: document.getElementById('profile-sector'),
      panelCondition: document.getElementById('profile-condition'),
      panelStatus: document.getElementById('profile-status'),
      panelTitle: document.getElementById('profile-title'),
      panelSubtitle: document.getElementById('profile-subtitle'),
      panelRole: document.getElementById('profile-role'),
      processName: document.getElementById('profile-process-name'),
      flowInputs: document.getElementById('profile-flow-inputs'),
      flowOutputs: document.getElementById('profile-flow-outputs'),
      effOverall: document.getElementById('profile-eff-overall'),
      effBars: document.getElementById('profile-eff-bars'),
      actPrimary: document.getElementById('profile-act-primary'),
      actStatus: document.getElementById('profile-act-status'),
      actNext: document.getElementById('profile-act-next'),
      impactChips: document.getElementById('profile-impact-chips'),
      telemetryGrid: document.getElementById('profile-telemetry-grid')
    };
  }

  attachEvents() {
    // Camera reset button in footer
    const resetBtn = document.getElementById('btn-reset-view');
    if (resetBtn && this.cameraController) {
      resetBtn.addEventListener('click', () => {
        if (this.interactionManager) {
          this.interactionManager.deselect();
        }
        this.cameraController.resetView();
      });
    }

    // Panel close
    const closeBtn = document.getElementById('btn-close-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.interactionManager) {
          this.interactionManager.deselect();
        } else {
          this.hideStructure();
        }
      });
    }

    // Panel focus
    const focusBtn = document.getElementById('btn-focus-structure');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        if (this.currentStructureId && this.cameraController) {
          const struct = this.interactionManager ? this.interactionManager.structuresMap.get(this.currentStructureId) : null;
          if (struct) {
            this.cameraController.focusTarget(struct.worldCenter, 12.0);
          }
        }
      });
    }

    // Panel overview button
    const overviewBtn = document.getElementById('btn-overview-structure');
    if (overviewBtn) {
      overviewBtn.addEventListener('click', () => {
        if (this.cameraController) {
          this.cameraController.resetView();
        }
      });
    }

    // Simulation Clock: Play/Pause
    if (this.dom.playPauseBtn) {
      this.dom.playPauseBtn.addEventListener('click', () => {
        if (this.simulationManager) {
          this.simulationManager.togglePlay();
        }
      });
    }

    // Keyboard shortcut 's' / 'S' to advance Sol (dev convenience)
    window.addEventListener('keydown', (e) => {
      if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        if (this.simulationManager) {
          this.simulationManager.stepSol();
        }
      }
    });

    // Simulation Clock: Reset
    if (this.dom.resetSimBtn) {
      this.dom.resetSimBtn.addEventListener('click', () => {
        if (this.simulationManager) {
          this.simulationManager.reset();
        }
      });
    }

    // Simulation Clock: Speed multipliers
    if (this.dom.speedOpts) {
      this.dom.speedOpts.forEach(opt => {
        opt.addEventListener('click', () => {
          const speed = parseFloat(opt.getAttribute('data-speed'));
          if (this.simulationManager) {
            this.simulationManager.setSpeed(speed);
          }
          this.dom.speedOpts.forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
        });
      });
    }

    // Colony Health Badge -> Toggle Monitor Drawer
    if (this.dom.healthBadge && this.dom.monitorDrawer) {
      this.dom.healthBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.dom.monitorDrawer.classList.contains('active');
        if (isOpen) {
          this.dom.monitorDrawer.classList.remove('active');
          this.dom.healthBadge.classList.remove('active');
        } else {
          this.dom.monitorDrawer.classList.add('active');
          this.dom.healthBadge.classList.add('active');
          if (this.dom.progDrawer) {
            this.dom.progDrawer.classList.remove('active');
            if (this.dom.progBadge) this.dom.progBadge.classList.remove('active');
          }
          if (this.simulationManager) {
            this.updateMonitoringUI(this.simulationManager.getSnapshot());
          }
        }
      });
    }

    // Progression Badge -> Toggle Progression Drawer
    if (this.dom.progBadge && this.dom.progDrawer) {
      this.dom.progBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.dom.progDrawer.classList.contains('active');
        if (isOpen) {
          this.dom.progDrawer.classList.remove('active');
          this.dom.progBadge.classList.remove('active');
        } else {
          this.dom.progDrawer.classList.add('active');
          this.dom.progBadge.classList.add('active');
          if (this.dom.monitorDrawer) {
            this.dom.monitorDrawer.classList.remove('active');
            if (this.dom.healthBadge) this.dom.healthBadge.classList.remove('active');
          }
          if (this.simulationManager) {
            this.updateProgressionUI(this.simulationManager.getSnapshot());
          }
        }
      });
    }

    // Close Monitor Drawer button
    if (this.dom.closeMonitorBtn && this.dom.monitorDrawer) {
      this.dom.closeMonitorBtn.addEventListener('click', () => {
        this.dom.monitorDrawer.classList.remove('active');
        if (this.dom.healthBadge) this.dom.healthBadge.classList.remove('active');
      });
    }

    // Close Progression Drawer button
    if (this.dom.closeProgBtn && this.dom.progDrawer) {
      this.dom.closeProgBtn.addEventListener('click', () => {
        this.dom.progDrawer.classList.remove('active');
        if (this.dom.progBadge) this.dom.progBadge.classList.remove('active');
      });
    }

    // Advance Phase Action button
    if (this.dom.advancePhaseBtn) {
      this.dom.advancePhaseBtn.addEventListener('click', () => {
        if (this.simulationManager) {
          this.simulationManager.advancePhase();
        }
      });
    }

    // Environmental Event Quick Trigger Buttons (Test controls)
    const triggerBtns = this.container.querySelectorAll('.event-trigger-btn');
    triggerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-event-type');
        if (this.simulationManager && type) {
          this.simulationManager.triggerEvent(type);
        }
      });
    });

    // Event Dock Click Delegation (Collapse, Expand, Dismiss)
    if (this.dom.eventDock) {
      this.dom.eventDock.addEventListener('click', (e) => {
        const dismissEventBtn = e.target.closest('[data-action="dismiss-event"]');
        if (dismissEventBtn) {
          e.stopPropagation();
          const type = dismissEventBtn.getAttribute('data-type');
          if (this.eventMeta.has(type)) {
            this.eventMeta.get(type).dismissed = true;
            if (this.simulationManager) this.updateEventNotifications(this.simulationManager.getSnapshot().events);
          }
          return;
        }

        const collapseBtn = e.target.closest('[data-action="collapse-event"]');
        if (collapseBtn) {
          e.stopPropagation();
          const type = collapseBtn.getAttribute('data-type');
          if (this.eventMeta.has(type)) {
            const m = this.eventMeta.get(type);
            m.userExpanded = false;
            if (this.simulationManager) this.updateEventNotifications(this.simulationManager.getSnapshot().events);
          }
          return;
        }

        const toggleCapsule = e.target.closest('[data-action="toggle-event"]');
        if (toggleCapsule) {
          e.stopPropagation();
          const type = toggleCapsule.getAttribute('data-type');
          if (this.eventMeta.has(type)) {
            const m = this.eventMeta.get(type);
            m.userExpanded = !m.userExpanded;
            if (this.simulationManager) this.updateEventNotifications(this.simulationManager.getSnapshot().events);
          }
          return;
        }

        const dismissBtn = e.target.closest('[data-action="dismiss-notif"]');
        if (dismissBtn) {
          e.stopPropagation();
          const id = parseInt(dismissBtn.getAttribute('data-id'), 10);
          if (this.simulationManager && id) {
            this.simulationManager.acknowledgeNotification(id);
            this.simulationManager.dismissNotification(id);
            this.resolvedMeta.delete(id);
            this.updateEventNotifications(this.simulationManager.getSnapshot().events);
          }
          return;
        }
      });
    }

    // Left Navigation Button 1: Analytics / Monitoring Console
    if (this.dom.navAnalyticsBtn && this.dom.monitorDrawer) {
      this.dom.navAnalyticsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.dom.monitorDrawer.classList.contains('active');
        if (isOpen) {
          this.dom.monitorDrawer.classList.remove('active');
          this.dom.navAnalyticsBtn.classList.remove('active');
          if (this.dom.healthBadge) this.dom.healthBadge.classList.remove('active');
        } else {
          this.dom.monitorDrawer.classList.add('active');
          this.dom.navAnalyticsBtn.classList.add('active');
          if (this.dom.healthBadge) this.dom.healthBadge.classList.add('active');
          if (this.dom.progDrawer) {
            this.dom.progDrawer.classList.remove('active');
            if (this.dom.navSettingsBtn) this.dom.navSettingsBtn.classList.remove('active');
            if (this.dom.progBadge) this.dom.progBadge.classList.remove('active');
          }
          if (this.simulationManager) {
            this.updateMonitoringUI(this.simulationManager.getSnapshot());
          }
        }
      });
    }

    // Left Navigation Button 2: Map / Strategic Colony Overview
    if (this.dom.navMapBtn) {
      this.dom.navMapBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.interactionManager) {
          this.interactionManager.deselect();
        } else {
          this.hideStructure();
        }
        if (this.cameraController) {
          this.cameraController.resetView();
        }
      });
    }

    // Left Navigation Button 3: Settings / Progression Console
    if (this.dom.navSettingsBtn && this.dom.progDrawer) {
      this.dom.navSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.dom.progDrawer.classList.contains('active');
        if (isOpen) {
          this.dom.progDrawer.classList.remove('active');
          this.dom.navSettingsBtn.classList.remove('active');
          if (this.dom.progBadge) this.dom.progBadge.classList.remove('active');
        } else {
          this.dom.progDrawer.classList.add('active');
          this.dom.navSettingsBtn.classList.add('active');
          if (this.dom.progBadge) this.dom.progBadge.classList.add('active');
          if (this.dom.monitorDrawer) {
            this.dom.monitorDrawer.classList.remove('active');
            if (this.dom.navAnalyticsBtn) this.dom.navAnalyticsBtn.classList.remove('active');
            if (this.dom.healthBadge) this.dom.healthBadge.classList.remove('active');
          }
          if (this.simulationManager) {
            this.updateProgressionUI(this.simulationManager.getSnapshot());
          }
        }
      });
    }

    // Compass Widget: Click to align / reset North strategy orientation
    if (this.dom.cameraCompass && this.cameraController) {
      this.dom.cameraCompass.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cameraController.targetAzimuth = Math.PI / 4;
      });
    }

    // Camera Orbit Pill: Click to rotate camera orbit by 45°
    if (this.dom.cameraOrbitBtn && this.cameraController) {
      this.dom.cameraOrbitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cameraController.targetAzimuth += Math.PI / 4;
      });
    }

    // Top Status Capsule Click -> Open Colony Monitor
    if (this.dom.statusPill && this.dom.monitorDrawer) {
      this.dom.statusPill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.dom.healthBadge) this.dom.healthBadge.click();
      });
    }

    // Bottom-Right Resource Management Button
    if (this.dom.btnResourceManager) {
      this.dom.btnResourceManager.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.resourceWindow) {
          this.resourceWindow.toggle();
        }
      });
    }

    // Top HUD Resource Capsules (Power, Water, Food, Oxygen) -> Open Resource Management
    ['res-item-power', 'res-item-water', 'res-item-food', 'res-item-oxygen'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.resourceWindow) {
            this.resourceWindow.open();
          }
        });
      }
    });
  }

  /**
   * Tracks camera yaw angle and smoothly rotates the compass needle SVG
   */
  startCompassTracker() {
    if (this._compassTrackerStarted) return;
    this._compassTrackerStarted = true;
    this._lastCompassDeg = null;
    const tick = () => {
      if (this.cameraController && this.dom.compassNeedleGroup) {
        const rad = this.cameraController.currentAzimuth || 0;
        const deg = Number((-((rad * 180) / Math.PI) + 45).toFixed(1));
        if (deg !== this._lastCompassDeg) {
          this._lastCompassDeg = deg;
          this.dom.compassNeedleGroup.setAttribute('transform', `rotate(${deg} 28 28)`);
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /**
   * Called on every simulation tick to update clock, resources, status, and live panel data
   */
  onSimulationTick(snapshot) {
    // 1. Update Clock (guarded)
    if (this.dom.solText && this.dom.solText.textContent !== snapshot.solString) {
      this.dom.solText.textContent = snapshot.solString;
    }
    if (this.dom.timeText && this.dom.timeText.textContent !== snapshot.timeString) {
      this.dom.timeText.textContent = snapshot.timeString;
    }

    // Play/Pause button state (guarded to avoid re-parsing SVG HTML on every tick)
    if (this.dom.playPauseIcon && this._lastIsRunning !== snapshot.isRunning) {
      this._lastIsRunning = snapshot.isRunning;
      if (snapshot.isRunning) {
        this.dom.playPauseIcon.innerHTML = `
          <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
            <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" />
            <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" />
          </svg>
        `;
        if (this.dom.playPauseText) this.dom.playPauseText.textContent = 'PAUSE';
      } else {
        this.dom.playPauseIcon.innerHTML = `
          <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
            <polygon points="4,2.5 13.5,8 4,13.5" />
          </svg>
        `;
        if (this.dom.playPauseText) this.dom.playPauseText.textContent = 'START';
      }
    }

    // 2. Colony Status
    const col = snapshot.colony;
    const targetStatus = col.status === 'RESOURCE CONSTRAINED' ? 'CONSTRAINED' : (col.status === 'CRITICAL CRISIS' ? 'CRITICAL' : col.status);
    if (this.dom.statusText && this.dom.statusText.textContent !== targetStatus) {
      this.dom.statusText.textContent = targetStatus;
    }
    if (this.dom.statusPill) {
      let statusClass = 'status-stable';
      if (col.status === 'RESOURCE CONSTRAINED') statusClass = 'status-constrained';
      else if (col.status === 'CRITICAL' || col.status === 'CRITICAL CRISIS') statusClass = 'status-critical';
      else if (col.status === 'SURVIVAL EMERGENCY') statusClass = 'status-emergency';
      const targetPillClass = `hud-capsule hud-status-capsule ${statusClass} ares-glass-pill`;
      if (this.dom.statusPill.className !== targetPillClass) {
        this.dom.statusPill.className = targetPillClass;
      }
    }



    // 3. Colony Health HUD Badge & Bar
    if (snapshot.monitoring) {
      const score = snapshot.monitoring.health.score;
      if (this.dom.healthScore) this.dom.healthScore.textContent = `${score}%`;
      if (this.dom.healthBar) this.dom.healthBar.style.width = `${score}%`;
      if (this.dom.healthBadge) {
        this.dom.healthBadge.classList.remove('status-good', 'status-warn', 'status-danger');
        if (score >= 80) this.dom.healthBadge.classList.add('status-good');
        else if (score >= 50) this.dom.healthBadge.classList.add('status-warn');
        else this.dom.healthBadge.classList.add('status-danger');
      }
    }

    // 4. Colony Progression HUD Badge
    if (snapshot.progression) {
      if (this.dom.progPhaseCode) this.dom.progPhaseCode.textContent = snapshot.progression.currentPhase.code;
      if (this.dom.progPct) this.dom.progPct.textContent = `${snapshot.progression.progressPercent}%`;
    }

    // 5. Compact Resource Indicators
    this.updateResourceItem(this.dom.resO2Val, this.dom.resO2Bar, this.dom.resO2Trend, this.dom.resO2Item, col.oxygen, 'O₂');
    this.updateResourceItem(this.dom.resWaterVal, this.dom.resWaterBar, this.dom.resWaterTrend, this.dom.resWaterItem, col.water, 'H₂O');
    this.updateResourceItem(this.dom.resFoodVal, this.dom.resFoodBar, this.dom.resFoodTrend, this.dom.resFoodItem, col.food, 'Food');
    this.updateResourceItem(this.dom.resPowerVal, this.dom.resPowerBar, this.dom.resPowerTrend, this.dom.resPowerItem, col.energy || col.power, 'Power');

    // 6. Persistent Calm Event Warnings
    if (snapshot.events) {
      this.updateEventNotifications(snapshot.events);
    }

    // 7. Active Colony Monitoring Drawer
    if (this.dom.monitorDrawer && this.dom.monitorDrawer.classList.contains('active')) {
      this.updateMonitoringUI(snapshot);
    }

    // 8. Active Colony Progression Drawer
    if (this.dom.progDrawer && this.dom.progDrawer.classList.contains('active')) {
      this.updateProgressionUI(snapshot);
    }

    // 9. Live Facility Detail Window Update
    if (this.currentStructureId && this.dom.panel && this.dom.panel.classList.contains('active')) {
      const liveData = snapshot.getLiveFacilityData(this.currentStructureId);
      if (liveData) {
        this.updateLiveFacilityPanel(liveData);
      }
    }

    // 10. Standalone Resource Management Window Update
    if (this.resourceWindow && this.resourceWindow.isOpen) {
      this.resourceWindow.update();
    }
  }

  /**
   * Lightweight SVG sparkline generator
   */
  generateSparklineSVG(dataPoints, color = '#f59e0b', width = 64, height = 18) {
    if (!dataPoints || dataPoints.length < 2) {
      return `<svg width="${width}" height="${height}" class="sparkline-svg"></svg>`;
    }
    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = (max - min) || 1;
    const paddingY = 2;
    const usableHeight = height - paddingY * 2;
    const stepX = width / (dataPoints.length - 1);

    const points = dataPoints.map((val, idx) => {
      const x = (idx * stepX).toFixed(1);
      const y = (height - paddingY - ((val - min) / range) * usableHeight).toFixed(1);
      return `${x},${y}`;
    }).join(' ');

    const lastVal = dataPoints[dataPoints.length - 1];
    const lastX = width.toFixed(1);
    const lastY = (height - paddingY - ((lastVal - min) / range) * usableHeight).toFixed(1);

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="sparkline-svg">
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="${lastX}" cy="${lastY}" r="2.2" fill="${color}" />
      </svg>
    `;
  }

  /**
   * Minimal SVG icon helper for event notifications
   */
  getEventIconSvg(type) {
    if (type === 'check') {
      return `<svg class="event-capsule-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M5.5 8L7.2 9.8L10.8 6.2"/></svg>`;
    }
    return `<svg class="event-capsule-icon" viewBox="0 0 16 16" fill="none" stroke="#f5a623" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7.15 3.2L1.85 12.38C1.5 13 1.95 13.8 2.7 13.8H13.3C14.05 13.8 14.5 13 14.15 12.38L8.85 3.2C8.48 2.56 7.52 2.56 7.15 3.2Z"/>
      <line x1="8" y1="6.8" x2="8" y2="9.6"/>
      <circle cx="8" cy="11.8" r="0.6" fill="#f5a623"/>
    </svg>`;
  }

  /**
   * Renders calm, persistent capsule event notification dock (no flashing, single entrance animation)
   */
  updateEventNotifications(eventsSnapshot) {
    if (!this.dom.eventDock) return;
    const active = eventsSnapshot.activeEvents || [];
    const notifs = eventsSnapshot.notifications || [];
    const now = Date.now();

    // Clean up stale event meta
    const activeTypes = new Set(active.map(a => a.type));
    for (const [type] of this.eventMeta) {
      if (!activeTypes.has(type)) {
        this.eventMeta.delete(type);
      }
    }

    // Filter recent resolved notifications (< 8s)
    const recentResolved = notifs.filter(n => {
      if (n.type !== 'RESOLVED') return false;
      if (!this.resolvedMeta.has(n.id)) {
        this.resolvedMeta.set(n.id, { enteredAt: now });
      }
      const entry = this.resolvedMeta.get(n.id);
      return (now - entry.enteredAt) < 8000;
    });

    if (active.length === 0 && recentResolved.length === 0) {
      if (this.dom.eventDock.innerHTML !== '') {
        this.dom.eventDock.innerHTML = '';
        this._lastEventSig = '';
      }
      return;
    }

    // Fast signature to skip redundant DOM re-rendering when event state is unchanged
    const activeSig = active.map(a => `${a.type}:${a.solsRemaining}:${a.severity}`).join('|');
    const resSig = recentResolved.map(r => r.id).join('|');
    const expandedSig = Array.from(this.eventMeta.entries()).map(([k, v]) => `${k}:${v.userExpanded}:${v.dismissed}`).join('|');
    const fullSig = `${activeSig}__${resSig}__${expandedSig}`;

    if (this._lastEventSig === fullSig) {
      return; // State unchanged, skip innerHTML wipe
    }
    this._lastEventSig = fullSig;

    let html = '';

    // 1. Render active events as compact capsules
    for (const ev of active) {
      if (!this.eventMeta.has(ev.type)) {
        this.eventMeta.set(ev.type, { enteredAt: now, userExpanded: false, animateOnce: true, dismissed: false });
      }
      const meta = this.eventMeta.get(ev.type);
      if (meta.dismissed) continue;

      const isExpanded = !!meta.userExpanded;
      const shouldAnimate = meta.animateOnce;
      if (shouldAnimate) meta.animateOnce = false;

      const sevClass = (ev.severity || 'MODERATE').toLowerCase(); // 'low', 'moderate', 'high', 'emergency'
      const animateClass = shouldAnimate ? ' event-enter' : '';

      if (isExpanded) {
        html += `
          <div class="event-detail-panel sev-${sevClass}${animateClass} ares-liquid-glass ares-glass-panel" data-event-type="${ev.type}">
            <div class="event-detail-top">
              <div class="event-detail-title-group">
                <span class="event-capsule-icon-wrap" aria-hidden="true">
                  ${this.getEventIconSvg('warning')}
                </span>
                <span class="event-detail-title">${ev.name}</span>
              </div>
              <button class="event-detail-close" data-action="collapse-event" data-type="${ev.type}" title="Minimize to capsule">✕</button>
            </div>
            <div class="event-detail-desc">${ev.description}</div>
            <div class="event-detail-footer">
              <span class="event-capsule-sev sev-${sevClass}">${ev.severity}</span>
              <span class="event-detail-sols">${ev.solsRemaining} SOLS REMAINING</span>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="event-capsule sev-${sevClass}${animateClass} ares-glass-notification" data-action="toggle-event" data-type="${ev.type}" title="Click to view details">
            <span class="event-capsule-icon-wrap" aria-hidden="true">
              ${this.getEventIconSvg('warning')}
            </span>
            <span class="event-capsule-name">${ev.name}</span>
            <span class="event-capsule-sev sev-${sevClass}">${ev.severity}</span>
            <span class="event-capsule-sols">${ev.solsRemaining} SOLS</span>
            <button class="event-capsule-close" data-action="dismiss-event" data-type="${ev.type}" title="Dismiss alert">✕</button>
          </div>
        `;
      }
    }

    // 2. Render recent cleared/resolved notifications
    for (const res of recentResolved) {
      html += `
        <div class="event-capsule sev-resolved event-enter ares-glass-notification" data-notif-id="${res.id}">
          <span class="event-capsule-icon-wrap" aria-hidden="true">
            ${this.getEventIconSvg('check')}
          </span>
          <span class="event-capsule-name">${res.eventName || 'EVENT'} CLEARED</span>
          <span class="event-capsule-sev sev-resolved">RESOLVED</span>
          <button class="event-detail-close" data-action="dismiss-notif" data-id="${res.id}" title="Dismiss">✕</button>
        </div>
      `;
    }

    this.dom.eventDock.innerHTML = html;
  }

  /**
   * Updates Colony Monitoring Drawer content
   */
  updateMonitoringUI(snapshot) {
    if (!snapshot || !snapshot.monitoring) return;
    const mon = snapshot.monitoring;

    // 1. Colony Status badge + health
    // 1. Colony Status indicator + health
    if (this.dom.cmStatusBadge) {
      const status = mon.health.status || 'STABLE';
      this.dom.cmStatusBadge.textContent = status;
      let badgeClass = 'cm-status-badge cm-badge-stable';
      let dotClass = 'cm-status-dot dot-stable';
      if (status === 'STRAINED') {
        badgeClass = 'cm-status-badge cm-badge-strained';
        dotClass = 'cm-status-dot dot-strained';
      } else if (status === 'CRITICAL' || status === 'SURVIVAL EMERGENCY') {
        badgeClass = 'cm-status-badge cm-badge-critical';
        dotClass = 'cm-status-dot dot-critical';
      }
      if (this.dom.cmStatusBadge.className !== badgeClass) this.dom.cmStatusBadge.className = badgeClass;
      if (this.dom.cmStatusDot && this.dom.cmStatusDot.className !== dotClass) this.dom.cmStatusDot.className = dotClass;
    }
    if (this.dom.cmHealthValue) this.dom.cmHealthValue.textContent = `${mon.health.score}%`;
    if (this.dom.cmHealthBarFill) this.dom.cmHealthBarFill.style.width = `${mon.health.score}%`;

    // 2. Mars Environment
    const env = mon.environment;
    if (this.dom.cmEnvTemp) {
      this.dom.cmEnvTemp.textContent = env.temp;
      this.dom.cmEnvTemp.className = env.temp !== '-63°C' ? 'cm-env-val cm-env-alert' : 'cm-env-val';
    }
    if (this.dom.cmEnvPressure) this.dom.cmEnvPressure.textContent = env.pressure;
    if (this.dom.cmEnvRadiation) {
      this.dom.cmEnvRadiation.textContent = env.radiation;
      this.dom.cmEnvRadiation.className = env.radiation !== 'NORMAL' ? 'cm-env-val cm-env-alert' : 'cm-env-val cm-env-nominal';
    }
    if (this.dom.cmEnvSolar) {
      this.dom.cmEnvSolar.textContent = env.solarInput !== '78%' ? `${env.solarInput}` : '78%';
      this.dom.cmEnvSolar.className = env.solarInput !== '78%' ? 'cm-env-val cm-env-alert' : 'cm-env-val';
    }
    if (this.dom.cmEnvDust) {
      this.dom.cmEnvDust.textContent = env.dust;
      this.dom.cmEnvDust.className = env.dust !== 'LOW' ? 'cm-env-val cm-env-alert' : 'cm-env-val cm-env-nominal';
    }

    // 3. Resource Telemetry Rows
    const resourceContainer = this.dom.cmResourceList || this.dom.cmResourceTbody;
    if (resourceContainer && mon.resources) {
      const items = [
        { key: 'oxygen', label: 'O\u2082', unit: 'kg', color: '#38bdf8' },
        { key: 'water', label: 'H\u2082O', unit: 'L', color: '#60a5fa' },
        { key: 'food', label: 'FOOD', unit: 'kg', color: '#34d399' },
        { key: 'energy', label: 'POWER', unit: 'kW', color: '#fbbf24' }
      ];

      resourceContainer.innerHTML = items.map(cfg => {
        const r = mon.resources[cfg.key] || {};
        const netSign = (r.netRate >= 0) ? '+' : '';
        const netClass = (r.netRate >= 0) ? 'cm-net-pos' : 'cm-net-neg';
        const sparkSvg = this.generateSparklineSVG(r.history, cfg.color, 44, 13);

        return `<div class="cm-res-row">
          <div class="cm-res-row-head">
            <div class="cm-res-title-group">
              <span class="cm-res-name">${cfg.label}</span>
              <span class="cm-res-spark">${sparkSvg}</span>
            </div>
            <span class="cm-res-pct">${r.percent}%</span>
          </div>

          <div class="cm-res-bar-track">
            <div class="cm-res-bar-fill" style="width: ${Math.min(100, Math.max(0, r.percent))}%; background: ${cfg.color};"></div>
          </div>

          <div class="cm-res-row-meta">
            <span class="cm-res-qty">${r.current} <span class="cm-res-max">/ ${r.max} ${cfg.unit}</span></span>
            <div class="cm-res-rates">
              <span class="cm-res-rate cm-rate-prod">+${r.productionRate}/Sol</span>
              <span class="cm-res-rate cm-rate-cons">−${r.consumptionRate}/Sol</span>
              <span class="cm-res-rate cm-res-net ${netClass}">NET ${netSign}${r.netRate}/Sol</span>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    // 4. Active Conditions
    if (this.dom.cmConditionsBody) {
      const events = snapshot.events?.active || [];
      if (events.length === 0) {
        this.dom.cmConditionsBody.innerHTML = '<span class="cm-no-conditions">NO ACTIVE CONDITIONS</span>';
      } else {
        this.dom.cmConditionsBody.innerHTML = events.map(ev => {
          const sev = ev.severity || 'MEDIUM';
          const sevClass = sev === 'HIGH' ? 'cm-cond-high' : sev === 'CRITICAL' ? 'cm-cond-critical' : 'cm-cond-medium';
          return `<div class="cm-condition-row ${sevClass}">
            <span class="cm-cond-beacon"></span>
            <span class="cm-cond-name">${ev.name || ev.type}</span>
            <span class="cm-cond-sev">${sev}</span>
            ${ev.remaining != null ? `<span class="cm-cond-dur">${ev.remaining} Sol rem.</span>` : ''}
          </div>`;
        }).join('');
      }
    }
  }

  /**
   * Updates Colony Progression Drawer content
   */
  updateProgressionUI(snapshot) {
    if (!snapshot || !snapshot.progression) return;
    const prog = snapshot.progression;

    // 1. Current & Next Phase
    if (this.dom.progCurrentPhase) {
      this.dom.progCurrentPhase.textContent = `${prog.currentPhase.code} • ${prog.currentPhase.title}`;
    }
    if (this.dom.progNextPhase) {
      this.dom.progNextPhase.textContent = prog.nextPhase ? prog.nextPhase.title : 'MAX COLONY EXPANSION';
    }

    // 2. Development Percent & Bar
    if (this.dom.progPercentText) {
      this.dom.progPercentText.textContent = `${prog.progressPercent}%`;
    }
    if (this.dom.progBarFill) {
      this.dom.progBarFill.style.width = `${prog.progressPercent}%`;
    }

    // 3. Advance Phase Button
    if (this.dom.progAdvanceContainer) {
      if (prog.canAdvance && prog.nextPhase) {
        this.dom.progAdvanceContainer.style.display = 'block';
        if (this.dom.advancePhaseLabel) {
          this.dom.advancePhaseLabel.textContent = `ADVANCE TO ${prog.nextPhase.code}: ${prog.nextPhase.title}`;
        }
      } else {
        this.dom.progAdvanceContainer.style.display = 'none';
      }
    }

    // 4. Milestone Checklist
    if (this.dom.progMilestonesList && prog.milestones) {
      this.dom.progMilestonesList.innerHTML = prog.milestones.map(m => `
        <div class="milestone-item ${m.completed ? 'completed' : 'pending'}">
          <span class="milestone-check">${m.completed ? '✓' : '○'}</span>
          <div class="milestone-body">
            <div class="milestone-title">${m.title}</div>
            <div class="milestone-desc">${m.description}</div>
          </div>
          <span class="milestone-tag">${m.completed ? 'COMPLETED' : 'IN PROGRESS'}</span>
        </div>
      `).join('');
    }
  }

  updateResourceItem(valEl, barEl, trendEl, itemEl, data, name) {
    if (!valEl || !itemEl || !data) return;
    const arrow = data.trend || (data.netRate > 0.1 ? '↑' : (data.netRate < -0.1 ? '↓' : '—'));
    const pctStr = `${data.percent}%`;

    if (valEl.textContent !== pctStr) {
      valEl.textContent = pctStr;
    }
    if (trendEl) {
      if (trendEl.textContent !== arrow) trendEl.textContent = arrow;
      const trendClass = 'hud-resource-trend ' + (data.netRate > 0.1 ? 'trend-up' : (data.netRate < -0.1 ? 'trend-down' : 'trend-neutral'));
      if (trendEl.className !== trendClass) trendEl.className = trendClass;
    }
    if (barEl && barEl.style.width !== pctStr) {
      barEl.style.width = pctStr;
    }

    const sign = data.netRate >= 0 ? '+' : '';
    const newTitle = `${name}: ${data.percent}% (${data.current} / ${data.max} ${data.unit}, ${sign}${data.netRate} / Sol)`;
    if (itemEl.title !== newTitle) itemEl.title = newTitle;

    if (data.isWarning) {
      if (!itemEl.classList.contains('res-warning')) itemEl.classList.add('res-warning');
    } else {
      if (itemEl.classList.contains('res-warning')) itemEl.classList.remove('res-warning');
    }
  }

  /**
   * Helper to get SVG icon string by keyword
   */
  getIconSvg(type) {
    switch (type) {
      case 'water':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
      case 'power':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      case 'food':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 4 13a7 7 0 0 1 7-7c4 0 7 2 9 5-2 3-5 5-9 5z"/><path d="M11 13l4 4"/></svg>`;
      case 'oxygen':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/></svg>`;
      case 'heat':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`;
      case 'minerals':
      case 'metal':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>`;
      case 'science':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31L4 18h16l-6-8.69V2h-4z"/></svg>`;
      case 'cargo':
      case 'tools':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`;
      case 'data':
      case 'wifi':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><circle cx="12" cy="20" r="1"/></svg>`;
      case 'battery':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="12" rx="2"/><line x1="22" y1="11" x2="22" y2="15"/></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    }
  }

  /**
   * Display structure information in the master NASA mission-control facility inspector
   */
  showStructure(structure) {
    if (!structure || !this.dom.panel) return;
    this.currentStructureId = structure.id || structure.name;

    let liveData = null;
    if (this.simulationManager) {
      liveData = this.simulationManager.facilityManager.getLiveFacilityData(
        this.currentStructureId,
        this.simulationManager.sol,
        this.simulationManager.hour
      );
    }

    // Render the master card HTML using the unified FacilityInspectorRenderer
    this.dom.panel.innerHTML = FacilityInspectorRenderer.renderFacilityHtml(this.currentStructureId, liveData);

    // Cache card element references to eliminate 10+ querySelectors per simulation tick
    const card = this.dom.panel.querySelector('.facility-master-card');
    if (card) {
      this._cardElements = {
        card,
        statusVal: card.querySelector('.f-status-val'),
        conditionVal: card.querySelector('.f-sub-val'),
        effVal: card.querySelector('.f-eff-num'),
        effBar: card.querySelector('.f-eff-bar'),
        donutVal: card.querySelector('.f-donut-val'),
        donutFill: card.querySelector('.f-donut-fill'),
        prioritizeBtn: card.querySelector('[data-action="prioritize-facility"]'),
        prioritizeSpan: card.querySelector('[data-action="prioritize-facility"] span'),
        resVals: Array.from(card.querySelectorAll('.f-res-card .f-res-val'))
      };
    } else {
      this._cardElements = null;
    }

    // Attach card-internal event listeners (close, actions)
    this.attachInspectorEvents();

    // Slide in from right
    this.dom.panel.classList.add('active');

    // Hide hover tooltip
    this.hideHoverTooltip();
  }

  /**
   * Attaches interactive handlers inside the active facility card
   */
  attachInspectorEvents() {
    if (!this.dom.panel) return;

    // Close button
    const closeBtn = this.dom.panel.querySelector('[data-action="close-inspector"]');
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        if (this.interactionManager) {
          this.interactionManager.deselect();
        } else {
          this.hideStructure();
        }
      };
    }

    // Prioritize button
    const prioritizeBtn = this.dom.panel.querySelector('[data-action="prioritize-facility"]');
    if (prioritizeBtn) {
      prioritizeBtn.onclick = (e) => {
        e.stopPropagation();
        prioritizeBtn.classList.add('f-btn-clicked');
        setTimeout(() => prioritizeBtn.classList.remove('f-btn-clicked'), 250);
        if (this.simulationManager && this.currentStructureId) {
          const isNowPrioritized = this.simulationManager.toggleFacilityPriority(this.currentStructureId);
          if (isNowPrioritized) {
            prioritizeBtn.classList.add('is-prioritized');
            const span = prioritizeBtn.querySelector('span');
            if (span) span.textContent = 'PRIORITIZED';
          } else {
            prioritizeBtn.classList.remove('is-prioritized');
            const span = prioritizeBtn.querySelector('span');
            if (span) span.textContent = 'PRIORITIZE';
          }
        }
      };
    }

    // Maintenance button
    const maintBtn = this.dom.panel.querySelector('[data-action="maint-facility"]');
    if (maintBtn) {
      maintBtn.onclick = (e) => {
        e.stopPropagation();
        maintBtn.classList.add('f-btn-clicked');
        setTimeout(() => maintBtn.classList.remove('f-btn-clicked'), 250);
        if (this.simulationManager && this.currentStructureId) {
          this.simulationManager.repairFacility(this.currentStructureId);
        }
      };
    }

    // Upgrade button
    const upgradeBtn = this.dom.panel.querySelector('[data-action="upgrade-facility"]');
    if (upgradeBtn) {
      upgradeBtn.onclick = (e) => {
        e.stopPropagation();
        upgradeBtn.classList.add('f-btn-clicked');
        setTimeout(() => upgradeBtn.classList.remove('f-btn-clicked'), 250);
        if (this.simulationManager && this.currentStructureId) {
          this.simulationManager.upgradeFacility(this.currentStructureId);
        }
      };
    }
  }

  /**
   * Updates open facility card dynamically on every simulation tick using cached references
   */
  updateLiveFacilityPanel(liveData) {
    if (!this.dom.panel || !liveData || !this._cardElements) return;
    const el = this._cardElements;

    // Status and condition
    if (el.statusVal && liveData.status && el.statusVal.textContent !== liveData.status) {
      el.statusVal.textContent = liveData.status;
    }
    if (el.conditionVal && liveData.condition && el.conditionVal.textContent !== liveData.condition) {
      el.conditionVal.textContent = liveData.condition;
    }

    // Efficiency
    if (liveData.efficiency?.overall !== undefined) {
      const eff = liveData.efficiency.overall;
      const effStr = `${eff}%`;
      if (el.effVal && el.effVal.textContent !== effStr) {
        el.effVal.textContent = effStr;
      }
      if (el.effBar && el.effBar.style.width !== effStr) {
        el.effBar.style.width = effStr;
      }

      // Donut Gauge
      if (el.donutVal && this._lastDonutVal !== eff) {
        this._lastDonutVal = eff;
        el.donutVal.innerHTML = `${eff}<span class="f-donut-pct">%</span>`;
        if (el.donutFill) {
          const r = 36;
          const c = 2 * Math.PI * r;
          const strokeOffset = c * (1 - (eff / 100));
          el.donutFill.setAttribute('stroke-dashoffset', strokeOffset);
        }
      }
    }

    // Prioritize button state
    if (el.prioritizeBtn) {
      if (liveData.isPrioritized) {
        if (!el.prioritizeBtn.classList.contains('is-prioritized')) {
          el.prioritizeBtn.classList.add('is-prioritized');
          if (el.prioritizeSpan) el.prioritizeSpan.textContent = 'PRIORITIZED';
        }
      } else {
        if (el.prioritizeBtn.classList.contains('is-prioritized')) {
          el.prioritizeBtn.classList.remove('is-prioritized');
          if (el.prioritizeSpan) el.prioritizeSpan.textContent = 'PRIORITIZE';
        }
      }
    }

    // Resource cards (Inputs & Outputs)
    if (liveData.resourceFlow && el.resVals && el.resVals.length > 0) {
      const allFlows = [];
      if (liveData.resourceFlow.inputs) {
        liveData.resourceFlow.inputs.forEach(inp => allFlows.push(inp.amount));
      }
      if (liveData.resourceFlow.outputs) {
        liveData.resourceFlow.outputs.forEach(out => allFlows.push(out.amount));
      }

      for (let idx = 0; idx < el.resVals.length; idx++) {
        if (allFlows[idx] !== undefined) {
          const valEl = el.resVals[idx];
          if (valEl && valEl.textContent !== allFlows[idx]) {
            valEl.textContent = allFlows[idx];
          }
        }
      }
    }
  }

  /**
   * Hide the structure info panel and reset state
   */
  hideStructure() {
    this.currentStructureId = null;
    this._cardElements = null;
    this._lastDonutVal = null;
    if (this.dom.panel) {
      this.dom.panel.classList.remove('active');
    }
  }

  /**
   * Show hover tooltip near mouse cursor
   */
  showHoverTooltip(structure, clientX, clientY) {
    const tooltip = document.getElementById('hover-tooltip');
    if (!tooltip) return;

    if (this.currentStructureId && this.currentStructureId === structure.id) {
      tooltip.classList.remove('visible');
      return;
    }

    const titleEl = document.getElementById('tooltip-title');
    const sectorEl = document.getElementById('tooltip-sector');

    if (titleEl) titleEl.textContent = structure.title || structure.name;
    if (sectorEl) sectorEl.textContent = structure.sector || 'SECTOR ALPHA';

    const padding = 16;
    const tooltipWidth = 240;
    const tooltipHeight = 65;

    let posX = clientX + 16;
    let posY = clientY + 16;

    if (posX + tooltipWidth > window.innerWidth - padding) {
      posX = clientX - tooltipWidth - 12;
    }
    if (posY + tooltipHeight > window.innerHeight - padding) {
      posY = clientY - tooltipHeight - 12;
    }

    tooltip.style.transform = `translate(${posX}px, ${posY}px)`;
    tooltip.classList.add('visible');
  }

  /**
   * Hide hover tooltip
   */
  hideHoverTooltip() {
    const tooltip = document.getElementById('hover-tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }

  startLoadingEmblemAnimation() {
    const frontRocket = document.getElementById('loading-rocket-front');
    const backRocket = document.getElementById('loading-rocket-back');
    if (!frontRocket && !backRocket) return;

    const a = 112; // semi-major axis
    const b = 38;  // semi-minor axis
    const orbitPeriod = 18000; // 18 seconds for a calm, cinematic orbit
    const delay = 1500; // 1.5s delay before movement begins
    const startTime = performance.now();

    const setRocketPos = (rad) => {
      // Orbit parametric equation starting at lower-left (-a, 0)
      const x = -a * Math.cos(rad);
      const y = b * Math.sin(rad);

      // Tangent velocity vector
      const dx = a * Math.sin(rad);
      const dy = b * Math.cos(rad);
      const deg = Math.atan2(dy, dx) * (180 / Math.PI);

      const transformStr = `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${deg.toFixed(2)})`;

      if (y >= -0.01) {
        // In front of Mars
        if (frontRocket) {
          frontRocket.setAttribute('transform', transformStr);
          frontRocket.style.opacity = '1';
        }
        if (backRocket) {
          backRocket.style.opacity = '0';
        }
      } else {
        // Behind Mars
        if (backRocket) {
          backRocket.setAttribute('transform', transformStr);
          backRocket.style.opacity = '1';
        }
        if (frontRocket) {
          frontRocket.style.opacity = '0';
        }
      }
    };

    // Set initial position at lower-left turn
    setRocketPos(0);

    const frame = (now) => {
      if (this.isLoadingComplete) return;

      const elapsed = now - startTime;
      if (elapsed > delay) {
        const t = ((elapsed - delay) % orbitPeriod) / orbitPeriod;
        const rad = t * 2 * Math.PI;
        setRocketPos(rad);
      } else {
        setRocketPos(0);
      }

      this.loadingAnimRaf = requestAnimationFrame(frame);
    };

    this.loadingAnimRaf = requestAnimationFrame(frame);
  }

  updateProgress(percent) {
    const p = Math.min(100, Math.max(0, Math.round(percent)));
    const fill = document.getElementById('loading-progress-fill');
    const pct = document.getElementById('loading-pct-val');

    if (fill) fill.style.width = `${p}%`;
    if (pct) pct.textContent = `${p}%`;
  }

  onLoadComplete() {
    this.updateProgress(100);

    const elapsed = Date.now() - (this.loadingStartTime || Date.now());
    // Ensure the minimal animation sequence has time to play (at least 2100ms total)
    const remainingHold = Math.max(350, 2100 - elapsed);

    setTimeout(() => {
      const overlay = document.getElementById('colony-loading-overlay');
      if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.style.display = 'none';
          this.isLoadingComplete = true;
          if (this.loadingAnimRaf) {
            cancelAnimationFrame(this.loadingAnimRaf);
            this.loadingAnimRaf = null;
          }
        }, 800);
      }
    }, remainingHold);
  }

  onLoadError(errorMsg, options = {}) {
    const isWebGL = errorMsg && (errorMsg.includes('WebGL') || errorMsg.includes('context'));
    const pct = document.getElementById('loading-pct-val');
    if (pct) {
      pct.textContent = isWebGL ? 'GRAPHICS ACCELERATION UNAVAILABLE' : `SYSTEM ALERT: ${errorMsg}`;
      pct.style.color = '#ef4444';
    }

    const content = document.querySelector('.loading-content');
    if (content && !document.getElementById('loading-error-card')) {
      const card = document.createElement('div');
      card.id = 'loading-error-card';
      card.className = 'loading-error-card';
      card.innerHTML = `
        <div class="error-card-inner">
          <div class="error-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            ${isWebGL ? 'GRAPHICS SYSTEM NOTICE' : 'TELEMETRY CONNECTION ERROR'}
          </div>
          <p class="error-desc">
            ${isWebGL
              ? 'Martian 3D visualizer requires WebGL hardware acceleration. If disabled, enable "Use graphics acceleration when available" in your browser settings (chrome://settings/system).'
              : errorMsg}
          </p>
          <div class="error-action-row">
            <button id="btn-enter-telemetry" class="error-action-btn primary-btn">
              ⚡ ENTER 2D TELEMETRY &amp; COMMAND MODE
            </button>
            <button id="btn-reload-mission" class="error-action-btn secondary-btn">
              🔄 RETRY CONNECTION
            </button>
          </div>
        </div>
      `;

      content.appendChild(card);

      const telemetryBtn = document.getElementById('btn-enter-telemetry');
      if (telemetryBtn) {
        telemetryBtn.addEventListener('click', () => {
          this.enterTelemetryMode();
          if (options.onCommandMode) options.onCommandMode();
        });
      }

      const reloadBtn = document.getElementById('btn-reload-mission');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
          window.location.reload();
        });
      }
    }
  }

  enterTelemetryMode() {
    this.isLoadingComplete = true;
    if (this.loadingAnimRaf) {
      cancelAnimationFrame(this.loadingAnimRaf);
      this.loadingAnimRaf = null;
    }
    const overlay = document.getElementById('colony-loading-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 350);
    }
    const app = document.getElementById('app');
    if (app && (!app.children.length || !app.querySelector('canvas'))) {
      app.innerHTML = `
        <div class="telemetry-fallback-backdrop">
          <div class="telemetry-grid-overlay"></div>
          <div class="telemetry-orbital-banner">
            <div class="orbital-tag">ARES-01 • ORBITAL SATELLITE TELEMETRY MODE</div>
            <div class="orbital-sub">LIVE MARTIAN SURFACE SIMULATION ACTIVE</div>
          </div>
        </div>
      `;
    }
  }
}
