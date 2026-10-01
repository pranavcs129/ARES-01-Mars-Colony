import * as THREE from 'three';
import { COLONY_STRUCTURES } from '../interaction/ColonyData.js';

/**
 * ColonyAnimator — Performance-Optimized Environmental & Facility Activity Controller.
 * Zero per-frame memory allocation.
 * 
 * Features:
 * - Emissive pulse modulation driven by real simulation operating levels.
 * - Subtle technical status indicators at each facility (nominal = invisible; degraded/event = subtle amber pulse).
 * - Solar panel tracking oscillation (slows and flattens during dust storm defense posture).
 * - Micrometeoroid impact subtle localized hull glint (0.65s fadeout).
 * - Power failure / water contamination / equipment failure activity throttling and dimming.
 * - Smooth, graceful recovery when events conclude.
 */
export class ColonyAnimator {
  constructor(scene, colonyRoot) {
    this.scene = scene;
    this.colonyRoot = colonyRoot;
    this.elapsed = 0;
    this.simulationManager = null;
    this.nightFactor = 0.0;

    // Cached animation targets
    this.emissivePulses = [];
    this.solarNode = null;
    this.solarBaseRotZ = 0;

    // Structure states & indicators
    this.facilityStates = {};
    this.indicatorsGroup = new THREE.Group();
    this.indicatorsGroup.name = 'FacilityStatusIndicators';

    // Shared indicator geometry (0.055 radius sphere)
    this.indicatorGeo = new THREE.SphereGeometry(0.055, 6, 6);

    // Micrometeoroid impact visual
    this.impactMesh = null;
    this.impactMat = null;
    this.impactTimer = 0.0;
    this.prevMeteoroidActive = false;

    this.init();
  }

  setSimulationManager(simulationManager) {
    this.simulationManager = simulationManager;
  }

  init() {
    this.setupFacilityStates();
    this.setupEmissivePulses();
    this.setupSolarTracking();
    this.setupMicrometeoroidVisual();
    this.scene.add(this.indicatorsGroup);
  }

  // ─────────────────────────────────────────────────────────
  // 1. FACILITY DISCOVERY & TECHNICAL STATUS INDICATORS
  // ─────────────────────────────────────────────────────────
  setupFacilityStates() {
    const knownKeys = Object.keys(COLONY_STRUCTURES);

    for (let i = 0; i < this.colonyRoot.children.length; i++) {
      const child = this.colonyRoot.children[i];
      const name = child.name;
      if (!name) continue;

      const matchedKey = knownKeys.find(k => k === name || name.startsWith(k));
      if (!matchedKey) continue;

      child.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(child);
      const center = box.getCenter(new THREE.Vector3());
      const roofY = Math.max(box.max.y + 0.12, center.y + 0.8);
      const indicatorPos = new THREE.Vector3(center.x, roofY, center.z);

      // Lightweight technical status LED (radius 0.055)
      const indicatorMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const indicatorMesh = new THREE.Mesh(this.indicatorGeo, indicatorMat);
      indicatorMesh.position.copy(indicatorPos);
      indicatorMesh.visible = false;
      this.indicatorsGroup.add(indicatorMesh);

      this.facilityStates[matchedKey] = {
        id: matchedKey,
        node: child,
        worldCenter: center,
        roofPos: indicatorPos,
        visualLevel: 1.0,
        indicatorMesh,
        indicatorMat,
        emissives: []
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2. EMISSIVE MATERIAL REGISTRATION (INDEXED BY FACILITY)
  // ─────────────────────────────────────────────────────────
  setupEmissivePulses() {
    const seen = new Set();

    this.colonyRoot.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (let i = 0; i < mats.length; i++) {
        const mat = mats[i];
        if (!mat || seen.has(mat.uuid)) continue;
        if (!mat.emissive) continue;
        if (mat.emissive.r === 0 && mat.emissive.g === 0 && mat.emissive.b === 0) continue;

        seen.add(mat.uuid);

        // Find facility ancestor
        let facilityId = null;
        let cur = child;
        while (cur && cur !== this.colonyRoot) {
          if (cur.name && this.facilityStates[cur.name]) {
            facilityId = cur.name;
            break;
          }
          cur = cur.parent;
        }

        const name = (mat.name || '').toLowerCase();
        let speed = 0.25;
        let amplitude = 0.08;
        let nightBoost = 0.20;

        if (name.includes('glass_teal') || name.includes('green_foliage') || name.includes('greenhouse')) {
          speed = 0.15;
          amplitude = 0.06;
          nightBoost = 0.40;
        } else if (name.includes('glass_blue_light') || name.includes('hab') || name.includes('window')) {
          speed = 0.2;
          amplitude = 0.05;
          nightBoost = 0.35;
        } else if (name.includes('danger_red') || name.includes('alert')) {
          speed = 0.5;
          amplitude = 0.15;
          nightBoost = 0.25;
        }

        const pulseData = {
          material: mat,
          baseIntensity: mat.emissiveIntensity || 1.0,
          phase: i * 1.8 + seen.size * 0.6,
          speed,
          amplitude,
          nightBoost,
          facilityId
        };

        this.emissivePulses.push(pulseData);

        if (facilityId && this.facilityStates[facilityId]) {
          this.facilityStates[facilityId].emissives.push(pulseData);
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // 3. SOLAR TRACKING NODE REGISTRATION
  // ─────────────────────────────────────────────────────────
  setupSolarTracking() {
    for (let i = 0; i < this.colonyRoot.children.length; i++) {
      const child = this.colonyRoot.children[i];
      if (child.name === 'solar') {
        this.solarNode = child;
        this.solarBaseRotZ = child.rotation.z || 0;
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // 4. MICROMETEOROID IMPACT PINPOINT GLINT
  // ─────────────────────────────────────────────────────────
  setupMicrometeoroidVisual() {
    const storageState = this.facilityStates['storage_depot'] || this.facilityStates['storage'];
    const pos = storageState ? storageState.roofPos : new THREE.Vector3(4.5, 3.2, 5.0);

    const impactGeo = new THREE.SphereGeometry(0.12, 6, 6);
    this.impactMat = new THREE.MeshBasicMaterial({
      color: 0xfff3e0,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.impactMesh = new THREE.Mesh(impactGeo, this.impactMat);
    this.impactMesh.position.copy(pos);
    this.impactMesh.visible = false;
    this.indicatorsGroup.add(this.impactMesh);
  }

  triggerMicrometeoroidImpact() {
    this.impactTimer = 0.65; // Brief 0.65s micro-glint
    if (this.impactMesh) {
      this.impactMesh.visible = true;
      this.impactMesh.scale.set(1.0, 1.0, 1.0);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 5. UPDATE — Called once per frame, driven by real simulation state
  // ─────────────────────────────────────────────────────────
  update(delta, nightFactor = null) {
    this.elapsed += delta;
    const t = this.elapsed;
    const nf = nightFactor !== null ? nightFactor : (this.nightFactor || 0.0);

    // 1. Read simulation state and active events
    const sim = this.simulationManager;
    const activeEvents = sim?.eventManager?.activeEvents || [];
    const isDustStorm = activeEvents.some(e => e.type === 'DUST_STORM');
    const isSolarFlare = activeEvents.some(e => e.type === 'SOLAR_FLARE');
    const isPowerEvent = activeEvents.some(e => e.type === 'POWER_FAILURE' || e.type === 'POWER_INTERRUPTION');
    const isWaterEvent = activeEvents.some(e => e.type === 'WATER_CONTAMINATION' || e.type === 'WATER_FAILURE');
    const equipEvent = activeEvents.find(e => e.type === 'EQUIPMENT_FAILURE');
    const meteoroidEvent = activeEvents.find(e => e.type === 'MICROMETEOROID_IMPACT');

    // Handle micrometeoroid trigger (fires once when event appears)
    if (meteoroidEvent && !this.prevMeteoroidActive) {
      this.triggerMicrometeoroidImpact();
    }
    this.prevMeteoroidActive = !!meteoroidEvent;

    // Update micrometeoroid glint animation (0.65s quick fadeout)
    if (this.impactTimer > 0) {
      this.impactTimer -= delta;
      const prog = Math.max(0.0, this.impactTimer / 0.65);
      this.impactMat.opacity = Math.sin(prog * Math.PI) * 0.95;
      const s = 1.0 + (1.0 - prog) * 0.9;
      this.impactMesh.scale.set(s, s, s);
      if (this.impactTimer <= 0) {
        this.impactMesh.visible = false;
      }
    }

    // 2. Update each facility's visual level and indicator LED
    const facilitiesData = sim?.facilityManager?.facilities || {};
    const colonyResources = sim?.colonyState?.resources || {};
    const isEnergyCritical = (colonyResources.energy?.current !== undefined && colonyResources.energy.current <= 15);

    for (const id in this.facilityStates) {
      const fac = this.facilityStates[id];
      const data = facilitiesData[id];

      // Operating level from real simulation state
      let targetLevel = data && data.operatingLevel !== undefined ? data.operatingLevel : 1.0;
      let condition = data?.condition || 'OPTIMAL';
      let status = data?.status || 'OPERATIONAL';

      // Event-driven modulations:
      if (isDustStorm && id === 'solar') {
        // Solar panels receive reduced solar input
        targetLevel = Math.min(targetLevel, 0.20);
      }

      if (isPowerEvent || isEnergyCritical) {
        // Non-essential facilities throttle down; essential life support (habitat, oxygen) stays protected if allocated
        const isProtectedLifeSupport = (id === 'habitat' || id === 'oxygen');
        if (!isProtectedLifeSupport && targetLevel > 0.4) {
          targetLevel = isPowerEvent ? 0.35 : 0.20;
        }
      }

      if (isWaterEvent && id === 'water') {
        targetLevel = Math.min(targetLevel, 0.50);
        condition = 'FILTRATION PURGE';
      }

      if (isSolarFlare && (id === 'research_lab' || id === 'central_hub' || id === 'habitat')) {
        targetLevel = Math.min(targetLevel, 0.65);
        condition = 'RAD CAUTION';
      }

      if (equipEvent) {
        const affected = equipEvent.modifiers?.facilityEfficiencyMod
          ? Object.keys(equipEvent.modifiers.facilityEfficiencyMod)[0]
          : 'water';
        if (id === affected) {
          targetLevel = Math.min(targetLevel, 0.40);
          condition = 'EQUIPMENT DEGRADED';
        }
      }

      if (meteoroidEvent && (id === 'storage_depot' || id === 'storage')) {
        targetLevel = Math.min(targetLevel, 0.70);
        condition = 'HULL PATCHING';
      }

      // Smooth visual level transition (smooth recovery after event ends)
      fac.visualLevel += (targetLevel - fac.visualLevel) * Math.min(1.0, delta * 2.5);
      const vLevel = fac.visualLevel;

      // Update emissive pulse materials under this facility
      for (let j = 0; j < fac.emissives.length; j++) {
        const ep = fac.emissives[j];
        const pulseSpeed = ep.speed * (0.2 + 0.8 * vLevel);
        const wave = Math.sin(t * pulseSpeed * 6.2832 + ep.phase);
        const nightGlow = nf * ep.nightBoost;
        ep.material.emissiveIntensity = ep.baseIntensity * vLevel * (1.0 + wave * ep.amplitude * vLevel + nightGlow);
      }

      // Update subtle world-space status LED indicator
      if (fac.indicatorMesh) {
        const isDegraded = vLevel < 0.88 || (condition !== 'OPTIMAL' && condition !== 'EXPANDED' && condition !== 'READY');
        if (isDegraded) {
          const isCritical = (vLevel <= 0.3) || status === 'OFFLINE' || condition.includes('CRITICAL') || condition.includes('DEGRADED');
          const pulseSpeed = isCritical ? 4.5 : 2.2;
          const pulse = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * pulseSpeed));
          fac.indicatorMat.color.setHex(isCritical ? 0xef4444 : 0xf59e0b);
          fac.indicatorMat.opacity = pulse;
          fac.indicatorMesh.visible = true;
        } else {
          if (fac.indicatorMesh.visible) {
            fac.indicatorMat.opacity = Math.max(0.0, fac.indicatorMat.opacity - delta * 2.0);
            if (fac.indicatorMat.opacity <= 0.01) {
              fac.indicatorMesh.visible = false;
            }
          }
        }
      }
    }

    // 3. Fallback for unassociated emissives (if any)
    for (let i = 0; i < this.emissivePulses.length; i++) {
      const ep = this.emissivePulses[i];
      if (!ep.facilityId || !this.facilityStates[ep.facilityId]) {
        const wave = Math.sin(t * ep.speed * 6.2832 + ep.phase);
        const nightGlow = nf * ep.nightBoost;
        ep.material.emissiveIntensity = ep.baseIntensity * (1.0 + wave * ep.amplitude + nightGlow);
      }
    }

    // 4. Solar tracking oscillation
    if (this.solarNode) {
      // In dust storms, panels lock into flat protective angle and oscillation slows by 75%
      const stormSpeed = isDustStorm ? 0.005 : 0.02;
      const stormAmp = isDustStorm ? 0.03 : 0.12;
      this.solarNode.rotation.z = this.solarBaseRotZ + Math.sin(t * stormSpeed) * stormAmp;
      this.solarNode.updateMatrix();
    }
  }

  dispose() {
    if (this.indicatorsGroup && this.scene) {
      this.scene.remove(this.indicatorsGroup);
    }
    if (this.indicatorGeo) {
      this.indicatorGeo.dispose();
    }
  }
}
