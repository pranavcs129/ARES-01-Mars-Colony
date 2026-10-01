import * as THREE from 'three';
import { COLONY_STRUCTURES } from '../interaction/ColonyData.js';

/**
 * Curated Autopilot Director Tour Stops in canonical operational sequence:
 * Every stop is driven by its unique structure ID, resolving its real Three.js object,
 * world position, and telemetry title from the exact same source of truth.
 */
export const TOUR_STOP_IDS = [
  'rocket',          // Launching Pad
  'central_hub',      // Central Command Core
  'solar',            // Solar Power Array
  'greenhouse',       // CEA Greenhouse / Bio-Dome
  'research_lab',     // Research Centre
  'power',            // Power System
  'habitat',          // Habitat
  'water',            // Water Extraction
  'mining',           // Automated Mining
  'oxygen',           // Oxygen Generation
  'storage_depot'     // Storage Depot / Storage
];

/**
 * Bespoke camera framing parameters per structure:
 * Camera angle, distance multiplier, elevation, and subtle target Y offset
 * ensuring the selected facility is centered in the cinematic view.
 */
export const TOUR_FRAMING_CONFIG = {
  rocket: {
    angle: 0.75,
    distanceMult: 2.8,
    minDistance: 19.0,
    elevationMult: 0.95,
    minElevation: 5.5,
    targetYOffset: 2.2,
    duration: 9.0
  },
  central_hub: {
    angle: 1.15,
    distanceMult: 2.6,
    minDistance: 14.0,
    elevationMult: 0.85,
    minElevation: 4.2,
    targetYOffset: 1.2,
    duration: 8.5
  },
  solar: {
    angle: 2.45,
    distanceMult: 2.5,
    minDistance: 16.0,
    elevationMult: 0.90,
    minElevation: 5.0,
    targetYOffset: 0.8,
    duration: 8.5
  },
  greenhouse: {
    angle: 0.85,
    distanceMult: 2.6,
    minDistance: 14.0,
    elevationMult: 0.85,
    minElevation: 4.2,
    targetYOffset: 1.0,
    duration: 8.5
  },
  research_lab: {
    angle: 1.85,
    distanceMult: 2.7,
    minDistance: 14.0,
    elevationMult: 0.85,
    minElevation: 4.5,
    targetYOffset: 1.1,
    duration: 8.5
  },
  power: {
    angle: 3.25,
    distanceMult: 2.7,
    minDistance: 14.5,
    elevationMult: 0.90,
    minElevation: 4.8,
    targetYOffset: 1.2,
    duration: 8.5
  },
  habitat: {
    angle: 0.45,
    distanceMult: 2.7,
    minDistance: 15.0,
    elevationMult: 0.85,
    minElevation: 4.5,
    targetYOffset: 1.1,
    duration: 8.5
  },
  water: {
    angle: 2.15,
    distanceMult: 2.7,
    minDistance: 14.0,
    elevationMult: 0.85,
    minElevation: 4.5,
    targetYOffset: 1.0,
    duration: 8.5
  },
  mining: {
    angle: 0.95,
    distanceMult: 2.7,
    minDistance: 14.5,
    elevationMult: 0.90,
    minElevation: 4.8,
    targetYOffset: 1.2,
    duration: 8.5
  },
  oxygen: {
    angle: 2.85,
    distanceMult: 2.7,
    minDistance: 13.5,
    elevationMult: 0.85,
    minElevation: 4.2,
    targetYOffset: 1.0,
    duration: 8.5
  },
  storage_depot: {
    angle: 0.85,
    distanceMult: 2.7,
    minDistance: 13.5,
    elevationMult: 0.85,
    minElevation: 4.2,
    targetYOffset: 1.0,
    duration: 8.5
  }
};

/**
 * CinematicCameraController — Unified Dual-Mode Camera Engine.
 * Seamlessly manages:
 * 1. TACTICAL MODE: Classic 2.5D Orthographic RTS/Strategy view (WASD pan, Q/E rotate, zoom, focus)
 * 2. CINEMATIC MODE: Dynamic 3D Perspective camera (48° FOV) with free orbit, smooth dolly,
 *    and automated Cinematic Director Tour (sweeping drone flybys, low module tracking, sunrise sweeps).
 */
export class CinematicCameraController {
  constructor(container, options = {}) {
    this.container = container;

    // Active mode: 'tactical' | 'cinematic'
    this.mode = 'tactical';
    this.isTouring = false;
    this.tourShotIndex = 0;
    this.tourShotTime = 0;

    // Viewport dimensions
    this.cachedWidth = this.container.clientWidth || window.innerWidth || 800;
    this.cachedHeight = this.container.clientHeight || window.innerHeight || 600;

    // ─────────────────────────────────────────────────────────
    // 1. TACTICAL (ORTHOGRAPHIC) CAMERA PARAMETERS
    // ─────────────────────────────────────────────────────────
    this.elevation = options.elevation || Math.PI / 5.2;
    this.distance = 180;
    this.targetAzimuth = Math.PI / 4;
    this.currentAzimuth = this.targetAzimuth;
    this.rotationSpeed = Math.PI / 4;

    this.defaultTarget = new THREE.Vector3(-0.2, 0.5, -0.4);
    this.targetPosition = this.defaultTarget.clone();
    this.currentPosition = this.defaultTarget.clone();

    this.defaultFrustumSize = 24.0;
    this.minFrustumSize = 5.5;
    this.maxFrustumSize = 75.0;
    this.targetFrustumSize = this.defaultFrustumSize;
    this.frustumSize = this.defaultFrustumSize;
    this.panSpeed = 22;

    // ─────────────────────────────────────────────────────────
    // 2. CINEMATIC (PERSPECTIVE) CAMERA PARAMETERS
    // ─────────────────────────────────────────────────────────
    this.cinematicTarget = new THREE.Vector3(0, 0.8, 0);
    this.currentCinematicTarget = this.cinematicTarget.clone();
    this.cinematicDistance = 28.0;
    this.targetCinematicDistance = 28.0;
    this.cinematicAzimuth = 0.8;
    this.targetCinematicAzimuth = 0.8;
    this.cinematicElevation = 0.32; // Low dramatic angle (~18 degrees)
    this.targetCinematicElevation = 0.32;
    this.cameraSway = new THREE.Vector3();
    this._shotCamPos = new THREE.Vector3(); // Pre-allocated vector for tour keyframes

    // Shared Colony & Structure Tour State
    this.colonyRoot = null;
    this.structuresMap = null;
    this.tourStopIds = [...TOUR_STOP_IDS];
    this.activeTourStructure = null;
    this.currentTourShot = null;
    this.tourShots = [];

    // Interaction controls
    this.keys = {
      KeyW: false, KeyS: false, KeyA: false, KeyD: false,
      ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
      KeyQ: false, KeyE: false
    };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.isDirty = true;

    this.createCameras();
    this.setupEventListeners();
  }

  createCameras() {
    const aspect = this.cachedWidth / this.cachedHeight;

    // Tactical Orthographic Camera
    this.orthoCamera = new THREE.OrthographicCamera(
      (-this.frustumSize * aspect) / 2,
      (this.frustumSize * aspect) / 2,
      this.frustumSize / 2,
      -this.frustumSize / 2,
      0.1,
      1000
    );

    // Cinematic Perspective Camera
    this.perspCamera = new THREE.PerspectiveCamera(48, aspect, 0.2, 1200);

    // Active camera pointer
    this.camera = this.orthoCamera;
    this.updateTacticalCamera();
    this.updateCinematicCamera();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.cachedWidth = this.container.clientWidth || window.innerWidth || 800;
      this.cachedHeight = this.container.clientHeight || window.innerHeight || 600;
      this.updateProjections();
      this.isDirty = true;
    });

    window.addEventListener('keydown', (e) => {
      if (this.keys[e.code] !== undefined) {
        this.keys[e.code] = true;
        this.isDirty = true;
      }
      if (e.code === 'KeyQ') {
        if (this.mode === 'tactical') this.targetAzimuth += this.rotationSpeed;
        else this.targetCinematicAzimuth += 0.45;
        this.isDirty = true;
      } else if (e.code === 'KeyE') {
        if (this.mode === 'tactical') this.targetAzimuth -= this.rotationSpeed;
        else this.targetCinematicAzimuth -= 0.45;
        this.isDirty = true;
      } else if (e.code === 'Space') {
        this.resetView();
      } else if (e.code === 'KeyC') {
        // Toggle Cinematic Mode hotkey
        this.toggleMode();
      } else if (e.code === 'KeyT') {
        // Toggle Cinematic Tour
        this.toggleTour();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keys[e.code] !== undefined) {
        this.keys[e.code] = false;
      }
    });

    // Mouse Wheel Zoom
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.isDirty = true;

      if (this.mode === 'tactical') {
        const zoomFactor = 1 + Math.abs(e.deltaY) * 0.0012;
        if (e.deltaY > 0) {
          this.targetFrustumSize = Math.min(this.maxFrustumSize, this.targetFrustumSize * zoomFactor);
        } else {
          this.targetFrustumSize = Math.max(this.minFrustumSize, this.targetFrustumSize / zoomFactor);
        }
      } else {
        // Cinematic perspective zoom (dolly distance)
        const dollyDelta = e.deltaY * 0.035;
        this.targetCinematicDistance = THREE.MathUtils.clamp(
          this.targetCinematicDistance + dollyDelta,
          5.0,
          65.0
        );
      }
    }, { passive: false });

    // Drag to Pan or Orbit
    this.container.addEventListener('mousedown', (e) => {
      // Right-click, middle-click, or left-click with Alt (or left-click drag in cinematic mode)
      if (e.button === 2 || e.button === 1 || (e.button === 0 && (e.altKey || this.mode === 'cinematic'))) {
        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.dragStart.x;
      const deltaY = e.clientY - this.dragStart.y;
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      this.isDirty = true;

      if (this.mode === 'tactical') {
        const height = this.cachedHeight || 600;
        const worldScale = this.frustumSize / height;
        const sinA = Math.sin(this.currentAzimuth);
        const cosA = Math.cos(this.currentAzimuth);

        const moveX = (-deltaX * -sinA + deltaY * -cosA) * worldScale;
        const moveZ = (-deltaX * cosA + deltaY * -sinA) * worldScale;

        this.targetPosition.x += moveX;
        this.targetPosition.z += moveZ;
      } else {
        // Cinematic free orbit
        if (this.isTouring) this.isTouring = false; // User drag cancels auto tour
        this.targetCinematicAzimuth += deltaX * 0.005;
        this.targetCinematicElevation = THREE.MathUtils.clamp(
          this.targetCinematicElevation - deltaY * 0.0035,
          0.04,
          1.35
        );
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateProjections() {
    const aspect = this.cachedWidth / this.cachedHeight;

    this.orthoCamera.left = (-this.frustumSize * aspect) / 2;
    this.orthoCamera.right = (this.frustumSize * aspect) / 2;
    this.orthoCamera.top = this.frustumSize / 2;
    this.orthoCamera.bottom = -this.frustumSize / 2;
    this.orthoCamera.updateProjectionMatrix();

    this.perspCamera.aspect = aspect;
    this.perspCamera.updateProjectionMatrix();
  }

  setMode(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;

    if (this.mode === 'cinematic') {
      this.camera = this.perspCamera;
      // Initialize cinematic focus on colony center or current target
      this.currentCinematicTarget.copy(this.currentPosition);
      this.cinematicTarget.copy(this.currentPosition);
    } else {
      this.camera = this.orthoCamera;
      this.isTouring = false;
    }

    this.updateProjections();
    this.isDirty = true;
    console.log(`[CameraController] Switched to ${this.mode.toUpperCase()} mode.`);
  }

  toggleMode() {
    this.setMode(this.mode === 'tactical' ? 'cinematic' : 'tactical');
    return this.mode;
  }

  setColony(colonyRoot, structuresMap = null) {
    this.colonyRoot = colonyRoot;
    this.structuresMap = structuresMap;
    this.buildTourShots();
  }

  buildTourShots() {
    this.tourShots = [];
    for (let i = 0; i < this.tourStopIds.length; i++) {
      const id = this.tourStopIds[i];
      const struct = this.resolveStructure(id);
      if (struct) {
        const shot = this.buildShotFromStructure(struct);
        this.tourShots.push(shot);
      }
    }
    if (this.tourShots.length > 0 && !this.activeTourStructure) {
      this.activeTourStructure = this.tourShots[0].structure;
      this.currentTourShot = this.tourShots[0];
    }
  }

  resolveStructure(id) {
    // 1. Check cached structuresMap (from InteractionManager)
    if (this.structuresMap && this.structuresMap.has(id)) {
      const data = this.structuresMap.get(id);
      return {
        id: data.id || id,
        name: data.name || data.title,
        type: data.type || (data.category || id.toUpperCase()),
        object: data.object || data.node,
        position: data.position || data.worldCenter,
        box: data.box,
        radius: data.radius || 3.0
      };
    }

    // 2. Check alias mapping if not directly found
    const aliases = {
      storage_depot: ['storage_depot', 'storage', 'battery'],
      rocket: ['rocket', 'launch', 'lander'],
      central_hub: ['central_hub', 'hub', 'command'],
      research_lab: ['research_lab', 'science', 'lab'],
      power: ['power', 'nuclear', 'fission']
    };

    if (aliases[id] && this.structuresMap) {
      for (const alias of aliases[id]) {
        if (this.structuresMap.has(alias)) {
          const data = this.structuresMap.get(alias);
          const meta = COLONY_STRUCTURES[id] || COLONY_STRUCTURES[alias] || {};
          return {
            id: id,
            name: meta.name || meta.title || data.name || data.title,
            type: meta.type || data.type || id.toUpperCase(),
            object: data.object || data.node,
            position: data.position || data.worldCenter,
            box: data.box,
            radius: data.radius || 3.0
          };
        }
      }
    }

    // 3. Fallback: Search colonyRoot children directly
    if (this.colonyRoot && this.colonyRoot.children) {
      const child = this.colonyRoot.children.find(c => c.name === id || (c.name && c.name.startsWith(id)));
      if (child) {
        child.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(child);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const radius = Math.max(1.8, Math.hypot(size.x, size.z) * 0.52);
        const meta = COLONY_STRUCTURES[id] || {};
        return {
          id: id,
          name: meta.name || meta.title || id.toUpperCase().replace('_', ' '),
          type: meta.type || id.toUpperCase(),
          object: child,
          position: center,
          box,
          radius
        };
      }
    }

    return null;
  }

  buildShotFromStructure(struct) {
    const framing = TOUR_FRAMING_CONFIG[struct.id] || {
      angle: 0.85,
      distanceMult: 2.6,
      minDistance: 14.0,
      elevationMult: 0.85,
      minElevation: 4.2,
      targetYOffset: 1.0,
      duration: 8.5
    };

    const target = new THREE.Vector3(
      struct.position.x,
      struct.position.y + framing.targetYOffset,
      struct.position.z
    );

    const dist = Math.max(framing.minDistance, struct.radius * framing.distanceMult);
    const height = Math.max(framing.minElevation, struct.radius * framing.elevationMult);

    return {
      id: struct.id,
      name: struct.name,
      type: struct.type,
      object: struct.object,
      position: struct.position,
      target: target,
      angle: framing.angle,
      distance: dist,
      height: height,
      duration: framing.duration || 8.5,
      structure: struct
    };
  }

  prepareTourShot(targetIndex) {
    if (!this.tourStopIds || this.tourStopIds.length === 0) return false;

    const totalStops = this.tourStopIds.length;
    let attempts = 0;
    let resolved = null;
    let idx = targetIndex % totalStops;
    if (idx < 0) idx += totalStops;

    while (attempts < totalStops) {
      const structureId = this.tourStopIds[idx];
      resolved = this.resolveStructure(structureId);
      if (resolved && resolved.object && resolved.position) {
        break;
      }
      console.warn(`[Autopilot Tour] Structure '${structureId}' cannot be resolved. Skipping shot.`);
      idx = (idx + 1) % totalStops;
      attempts++;
    }

    if (!resolved || attempts >= totalStops) {
      console.error('[Autopilot Tour] No valid structures resolved for tour.');
      return false;
    }

    this.tourShotIndex = idx;
    this.tourShotTime = 0;
    this.activeTourStructure = resolved;
    this.currentTourShot = this.buildShotFromStructure(resolved);

    // Keep legacy tourShots array in sync for external telemetry
    this.tourShots[this.tourShotIndex] = this.currentTourShot;
    return true;
  }

  advanceTourShot() {
    this.tourShotTime = 0;
    const nextIndex = (this.tourShotIndex + 1) % this.tourStopIds.length;
    this.prepareTourShot(nextIndex);
  }

  getActiveTourStructure() {
    return this.activeTourStructure;
  }

  getActiveTourShot() {
    return this.currentTourShot;
  }

  toggleTour() {
    if (this.mode !== 'cinematic') {
      this.setMode('cinematic');
    }
    this.isTouring = !this.isTouring;
    this.tourShotTime = 0;
    if (this.isTouring) {
      this.prepareTourShot(this.tourShotIndex);
    }
    return this.isTouring;
  }

  resetView() {
    if (this.mode === 'tactical') {
      this.targetPosition.copy(this.defaultTarget);
      this.targetAzimuth = Math.PI / 4;
      this.targetFrustumSize = this.defaultFrustumSize;
    } else {
      this.cinematicTarget.copy(this.defaultTarget);
      this.targetCinematicAzimuth = 0.8;
      this.targetCinematicElevation = 0.32;
      this.targetCinematicDistance = 28.0;
      this.isTouring = false;
    }
    this.isDirty = true;
  }

  focusTarget(targetVector, frustumSize = 13.5) {
    if (!targetVector) return;

    if (this.mode === 'tactical') {
      this.targetPosition.set(targetVector.x, targetVector.y || 0.4, targetVector.z);
      this.targetFrustumSize = Math.max(this.minFrustumSize, Math.min(this.maxFrustumSize, frustumSize));
    } else {
      this.cinematicTarget.set(targetVector.x, (targetVector.y || 0.4) + 0.5, targetVector.z);
      this.targetCinematicDistance = 14.0;
      this.isTouring = false;
    }
    this.isDirty = true;
  }

  unfocus() {
    this.resetView();
  }

  update(delta) {
    if (this.mode === 'tactical') {
      this.updateTactical(delta);
    } else {
      this.updateCinematic(delta);
    }
  }

  updateTactical(delta) {
    // Process keyboard navigation
    let moveForward = 0;
    let moveRight = 0;

    if (this.keys.KeyW || this.keys.ArrowUp) moveForward += 1;
    if (this.keys.KeyS || this.keys.ArrowDown) moveForward -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) moveRight += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) moveRight -= 1;

    if (moveForward !== 0 || moveRight !== 0) {
      this.isDirty = true;
      const length = Math.hypot(moveForward, moveRight);
      moveForward /= length;
      moveRight /= length;

      const sinA = Math.sin(this.currentAzimuth);
      const cosA = Math.cos(this.currentAzimuth);

      const forwardX = -cosA;
      const forwardZ = -sinA;
      const rightX = -sinA;
      const rightZ = cosA;

      const speed = this.panSpeed * (this.frustumSize / this.defaultFrustumSize) * delta;
      this.targetPosition.x += (forwardX * moveForward + rightX * moveRight) * speed;
      this.targetPosition.z += (forwardZ * moveForward + rightZ * moveRight) * speed;
    }

    const posDiffSq = this.currentPosition.distanceToSquared(this.targetPosition);
    const azDiff = Math.abs(this.targetAzimuth - this.currentAzimuth);
    const frustumDiff = Math.abs(this.targetFrustumSize - this.frustumSize);

    if (!this.isDirty && posDiffSq < 0.00001 && azDiff < 0.0001 && frustumDiff < 0.001) {
      return;
    }

    // Smooth damping
    const lerpRate = 1 - Math.exp(-12 * delta);
    this.currentPosition.lerp(this.targetPosition, lerpRate);
    this.currentAzimuth += (this.targetAzimuth - this.currentAzimuth) * lerpRate;

    const zoomLerp = 1 - Math.exp(-14 * delta);
    this.frustumSize += (this.targetFrustumSize - this.frustumSize) * zoomLerp;

    this.updateProjections();
    this.updateTacticalCamera();

    if (posDiffSq < 0.00001 && azDiff < 0.0001 && frustumDiff < 0.001) {
      this.isDirty = false;
    }
  }

  updateTacticalCamera() {
    const horizontalDist = this.distance * Math.cos(this.elevation);
    const height = this.distance * Math.sin(this.elevation);

    const camX = this.currentPosition.x + horizontalDist * Math.cos(this.currentAzimuth);
    const camZ = this.currentPosition.z + horizontalDist * Math.sin(this.currentAzimuth);
    const camY = this.currentPosition.y + height;

    this.orthoCamera.position.set(camX, camY, camZ);
    this.orthoCamera.lookAt(this.currentPosition.x, this.currentPosition.y, this.currentPosition.z);
  }

  updateCinematic(delta) {
    // 1. Process Tour Keyframe interpolation
    if (this.isTouring) {
      if (!this.currentTourShot || !this.activeTourStructure) {
        this.prepareTourShot(this.tourShotIndex);
      }

      this.tourShotTime += delta;
      const duration = this.currentTourShot?.duration || 8.5;

      if (this.tourShotTime >= duration) {
        this.advanceTourShot();
      }

      if (this.currentTourShot && this.currentTourShot.position) {
        const progress = Math.min(1.0, this.tourShotTime / duration);
        // Smooth sinusoidal shot drift around structure
        const drift = (progress - 0.5) * 0.22;
        const curAngle = this.currentTourShot.angle + drift;
        const dX = Math.sin(curAngle) * this.currentTourShot.distance;
        const dZ = Math.cos(curAngle) * this.currentTourShot.distance;
        const dY = this.currentTourShot.height + Math.sin(progress * Math.PI) * 0.35;

        this._shotCamPos.set(
          this.currentTourShot.position.x + dX,
          this.currentTourShot.position.y + dY,
          this.currentTourShot.position.z + dZ
        );

        this.perspCamera.position.lerp(this._shotCamPos, Math.min(1.0, delta * 2.0));
        this.currentCinematicTarget.lerp(this.currentTourShot.target, Math.min(1.0, delta * 2.5));
        this.perspCamera.lookAt(this.currentCinematicTarget);
      }
      return;
    }

    // 2. Keyboard panning in Cinematic mode
    let moveForward = 0;
    let moveRight = 0;

    if (this.keys.KeyW || this.keys.ArrowUp) moveForward += 1;
    if (this.keys.KeyS || this.keys.ArrowDown) moveForward -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) moveRight += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) moveRight -= 1;

    if (moveForward !== 0 || moveRight !== 0) {
      const length = Math.hypot(moveForward, moveRight);
      moveForward /= length;
      moveRight /= length;

      const sinA = Math.sin(this.cinematicAzimuth);
      const cosA = Math.cos(this.cinematicAzimuth);

      const fX = -cosA;
      const fZ = -sinA;
      const rX = -sinA;
      const rZ = cosA;

      const spd = 16.0 * delta;
      this.cinematicTarget.x += (fX * moveForward + rX * moveRight) * spd;
      this.cinematicTarget.z += (fZ * moveForward + rZ * moveRight) * spd;
    }

    // 3. Smooth damping of orbit angles & distance
    const damp = 1 - Math.exp(-10 * delta);
    this.cinematicAzimuth += (this.targetCinematicAzimuth - this.cinematicAzimuth) * damp;
    this.cinematicElevation += (this.targetCinematicElevation - this.cinematicElevation) * damp;
    this.cinematicDistance += (this.targetCinematicDistance - this.cinematicDistance) * damp;
    this.currentCinematicTarget.lerp(this.cinematicTarget, damp);

    this.updateCinematicCamera();
  }

  updateCinematicCamera() {
    const hDist = this.cinematicDistance * Math.cos(this.cinematicElevation);
    const vDist = this.cinematicDistance * Math.sin(this.cinematicElevation);

    const cx = this.currentCinematicTarget.x + hDist * Math.cos(this.cinematicAzimuth);
    const cz = this.currentCinematicTarget.z + hDist * Math.sin(this.cinematicAzimuth);
    const cy = this.currentCinematicTarget.y + vDist;

    this.perspCamera.position.set(cx, cy, cz);
    this.perspCamera.lookAt(
      this.currentCinematicTarget.x,
      this.currentCinematicTarget.y,
      this.currentCinematicTarget.z
    );
  }
}
