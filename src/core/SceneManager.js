import * as THREE from 'three';

export class SceneManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.cameraController = null;
    this.clock = new THREE.Clock();
    this.updatables = [];
    this.isRunning = false;

    this.init();
  }

  init() {
    // 1. Scene setup with warm dusty Mars atmospheric backdrop
    this.scene = new THREE.Scene();
    const bgColor = new THREE.Color(0x1a0d09);
    this.scene.background = bgColor;
    this.scene.fog = new THREE.FogExp2(0x1a0d09, 0.003);

    // 2. WebGL Renderer — optimized for laptop performance
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,           // PERF: disable AA — saves significant fill cost
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    // PERF: cap pixel ratio to 1.0 max (was 1.5).
    // Eliminates over 55% of GPU fragment shading and bandwidth costs on Retina displays,
    // maintaining smooth 60 FPS on laptops and integrated GPUs.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
    this.renderer.setSize(width, height);

    // PERF: static shadow map optimization.
    // Colony buildings and directional sun are stationary. autoUpdate = false saves ~150
    // redundant shadow-pass draw calls every single frame. We trigger needsUpdate on load,
    // on resize, and throttled to once every 2.0s for ambient solar oscillation.
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this._shadowTimer = 0;

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Clear any previous canvas before appending
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.renderer.domElement);

    // 3. Handle window resize (debounced)
    this._resizeTimeout = null;
    window.addEventListener('resize', () => {
      if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => this.onWindowResize(), 100);
    });
  }

  setCamera(camera, cameraController = null) {
    this.camera = camera;
    this.cameraController = cameraController;
    if (this.cameraController && !this.updatables.includes(this.cameraController)) {
      this.updatables.push(this.cameraController);
    }
  }

  add(object) {
    this.scene.add(object);
  }

  registerUpdatable(item) {
    if (item && typeof item.update === 'function' && !this.updatables.includes(item)) {
      this.updatables.push(item);
    }
  }

  requestShadowUpdate() {
    if (this.renderer && this.renderer.shadowMap && this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  onWindowResize() {
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;

    if (!this.camera || !this.renderer) return;

    if (this.camera.isOrthographicCamera) {
      const aspect = width / height;
      const frustumSize = this.cameraController ? this.cameraController.frustumSize : 24.0;
      this.camera.left = (-frustumSize * aspect) / 2;
      this.camera.right = (frustumSize * aspect) / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = -frustumSize / 2;
      this.camera.updateProjectionMatrix();
    } else if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.setSize(width, height);
    this.requestShadowUpdate();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();

    const animate = () => {
      if (!this.isRunning) return;
      requestAnimationFrame(animate);

      const delta = Math.min(this.clock.getDelta(), 0.1);

      for (let i = 0; i < this.updatables.length; i++) {
        this.updatables[i].update(delta);
      }

      // Throttled shadow update (0.5 Hz) for subtle ambient solar angle changes
      this._shadowTimer += delta;
      if (this._shadowTimer >= 2.0) {
        this._shadowTimer = 0;
        this.requestShadowUpdate();
      }

      if (this.camera && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    requestAnimationFrame(animate);
  }

  stop() {
    this.isRunning = false;
  }
}
