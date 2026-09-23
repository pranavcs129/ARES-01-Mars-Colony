import * as THREE from 'three';

export class CameraController {
  constructor(container, options = {}) {
    this.container = container;

    // Classic 2.5D isometric elevation angle (~35 degrees)
    this.elevation = options.elevation || Math.PI / 5.2;
    this.distance = 180; // Depth buffer range for orthographic camera

    // Azimuth yaw angle (45 degrees strategy angle)
    this.targetAzimuth = Math.PI / 4;
    this.currentAzimuth = this.targetAzimuth;
    this.rotationSpeed = Math.PI / 4; // 45 deg per Q/E press

    // Focal look-at target centered on the colony structures
    this.defaultTarget = new THREE.Vector3(-0.2, 0.5, -0.4);
    this.targetPosition = this.defaultTarget.clone();
    this.currentPosition = this.defaultTarget.clone();

    // Zoom framing:
    // Colony footprint is ~23m x 14m. A frustum size of 24m gives prominent,
    // highly readable framing of all colony modules while showing the surrounding dunes.
    this.defaultFrustumSize = 24.0;
    this.minFrustumSize = 5.5;  // Zoom in to inspect individual buildings
    this.maxFrustumSize = 75.0; // Zoom out to view the full 150m Mars settlement landscape
    this.targetFrustumSize = this.defaultFrustumSize;
    this.frustumSize = this.defaultFrustumSize;

    // Pan speed
    this.panSpeed = 22;
    this.keys = {
      KeyW: false, KeyS: false, KeyA: false, KeyD: false,
      ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
      KeyQ: false, KeyE: false
    };

    // Drag pan state
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    // PERF: cached layout and dirty-tracking to avoid per-frame DOM layout reflows
    // and redundant camera matrix updates when stationary
    this.cachedWidth = this.container.clientWidth || window.innerWidth || 800;
    this.cachedHeight = this.container.clientHeight || window.innerHeight || 600;
    this.isDirty = true;

    this.createCamera();
    this.setupEventListeners();
  }

  createCamera() {
    this.cachedWidth = this.container.clientWidth || window.innerWidth || 800;
    this.cachedHeight = this.container.clientHeight || window.innerHeight || 600;
    const aspect = this.cachedWidth / this.cachedHeight;

    this.camera = new THREE.OrthographicCamera(
      (-this.frustumSize * aspect) / 2,
      (this.frustumSize * aspect) / 2,
      this.frustumSize / 2,
      -this.frustumSize / 2,
      0.1,
      1000
    );

    this.updateCameraPosition();
    this.isDirty = false;
  }

  setupEventListeners() {
    // Window resize (updates cached aspect ratio without per-frame DOM read)
    window.addEventListener('resize', () => {
      this.cachedWidth = this.container.clientWidth || window.innerWidth || 800;
      this.cachedHeight = this.container.clientHeight || window.innerHeight || 600;
      this.isDirty = true;
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (this.keys[e.code] !== undefined) {
        this.keys[e.code] = true;
        this.isDirty = true;
      }
      if (e.code === 'KeyQ') {
        this.targetAzimuth += this.rotationSpeed;
        this.isDirty = true;
      } else if (e.code === 'KeyE') {
        this.targetAzimuth -= this.rotationSpeed;
        this.isDirty = true;
      } else if (e.code === 'Space') {
        this.resetView();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keys[e.code] !== undefined) {
        this.keys[e.code] = false;
      }
    });

    // Smooth mouse wheel zoom
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.isDirty = true;
      const zoomFactor = 1 + Math.abs(e.deltaY) * 0.0012;
      if (e.deltaY > 0) {
        this.targetFrustumSize = Math.min(this.maxFrustumSize, this.targetFrustumSize * zoomFactor);
      } else {
        this.targetFrustumSize = Math.max(this.minFrustumSize, this.targetFrustumSize / zoomFactor);
      }
    }, { passive: false });

    // Drag to pan (Right-click, middle-click, or Left-click with Alt)
    this.container.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 1 || (e.button === 0 && e.altKey)) {
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

      const height = this.cachedHeight || 600;
      const worldScale = this.frustumSize / height;

      const sinA = Math.sin(this.currentAzimuth);
      const cosA = Math.cos(this.currentAzimuth);

      // Map screen delta onto ground plane X-Z
      const moveX = (-deltaX * -sinA + deltaY * -cosA) * worldScale;
      const moveZ = (-deltaX * cosA + deltaY * -sinA) * worldScale;

      this.targetPosition.x += moveX;
      this.targetPosition.z += moveZ;
      this.isDirty = true;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Prevent context menu on right click
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  resetView() {
    this.targetPosition.copy(this.defaultTarget);
    this.targetAzimuth = Math.PI / 4;
    this.targetFrustumSize = this.defaultFrustumSize;
    this.isDirty = true;
  }

  focusTarget(targetVector, frustumSize = 13.5) {
    if (!targetVector) return;
    this.targetPosition.set(targetVector.x, targetVector.y || 0.4, targetVector.z);
    this.targetFrustumSize = Math.max(this.minFrustumSize, Math.min(this.maxFrustumSize, frustumSize));
    this.isDirty = true;
  }

  unfocus() {
    this.targetPosition.copy(this.defaultTarget);
    this.targetFrustumSize = this.defaultFrustumSize;
    this.isDirty = true;
  }

  update(delta) {
    // 1. Process keyboard panning
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

      // Camera forward and right directions projected onto horizontal ground plane
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

    // PERF: if stationary and not dirty, skip projection matrix updates & lookAt
    if (!this.isDirty && posDiffSq < 0.00001 && azDiff < 0.0001 && frustumDiff < 0.001) {
      return;
    }

    // 2. Smooth damping interpolation
    const lerpRate = 1 - Math.exp(-12 * delta);
    this.currentPosition.lerp(this.targetPosition, lerpRate);
    this.currentAzimuth += (this.targetAzimuth - this.currentAzimuth) * lerpRate;

    const zoomLerp = 1 - Math.exp(-14 * delta);
    this.frustumSize += (this.targetFrustumSize - this.frustumSize) * zoomLerp;

    // Update camera projection without per-frame clientWidth reflow
    const aspect = (this.cachedWidth || 800) / (this.cachedHeight || 600);

    this.camera.left = (-this.frustumSize * aspect) / 2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.updateProjectionMatrix();

    // 3. Update position and orientation
    this.updateCameraPosition();

    // Settle dirty flag once movements converge
    if (posDiffSq < 0.00001 && azDiff < 0.0001 && frustumDiff < 0.001) {
      this.isDirty = false;
    }
  }

  updateCameraPosition() {
    const horizontalDist = this.distance * Math.cos(this.elevation);
    const height = this.distance * Math.sin(this.elevation);

    const camX = this.currentPosition.x + horizontalDist * Math.cos(this.currentAzimuth);
    const camZ = this.currentPosition.z + horizontalDist * Math.sin(this.currentAzimuth);
    const camY = this.currentPosition.y + height;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.currentPosition.x, this.currentPosition.y, this.currentPosition.z);
  }
}
