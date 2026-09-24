import * as THREE from 'three';
import { PostProcessingPipeline } from './PostProcessingPipeline.js';

export class SceneManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.cameraController = null;
    this.postProcessing = null;
    this.clock = new THREE.Clock();
    this.updatables = [];
    this.isRunning = false;

    this.init();
  }

  init() {
    // 1. Scene setup with rich Martian atmosphere
    this.scene = new THREE.Scene();
    // Use transparent/null background to allow the dynamic MarsSky skydome to render
    this.scene.background = null;

    // Atmospheric depth fog (warm Martian copper haze)
    this.defaultFogColor = new THREE.Color(0x943d1a);
    this.stormFogColor = new THREE.Color(0xb84218);
    this.scene.fog = new THREE.FogExp2(0x943d1a, 0.0022);

    // 2. WebGL Renderer
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;

    this.renderer = this.createRenderer(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.setSize(width, height);

    // High quality soft shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true; // Smooth real-time soft shadows

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Clear previous canvas
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

  createRenderer(width, height) {
    const attempts = [
      { antialias: true, powerPreference: 'high-performance', depth: true, stencil: false },
      { antialias: true, powerPreference: 'default', depth: true },
      { antialias: false, powerPreference: 'default', depth: true },
      { antialias: false, failIfMajorPerformanceCaveat: false }
    ];

    let lastError = null;
    for (let i = 0; i < attempts.length; i++) {
      try {
        const renderer = new THREE.WebGLRenderer(attempts[i]);
        return renderer;
      } catch (err) {
        lastError = err;
        console.warn(`[SceneManager] WebGL attempt ${i + 1} failed:`, err.message);
      }
    }

    throw new Error(
      lastError
        ? `WebGL context creation failed: ${lastError.message}`
        : 'WebGL is disabled or unsupported in this browser.'
    );
  }

  static isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  setCamera(camera, cameraController = null) {
    this.camera = camera;
    this.cameraController = cameraController;

    if (this.cameraController && !this.updatables.includes(this.cameraController)) {
      this.updatables.push(this.cameraController);
    }

    if (!this.postProcessing) {
      this.postProcessing = new PostProcessingPipeline(this.renderer, this.scene, this.camera, this.container);
    } else {
      this.postProcessing.setCamera(this.camera);
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

  /**
   * Sets atmospheric fog density and color for dust storms
   */
  setDustStormIntensity(intensity = 0.0) {
    if (!this.scene.fog) return;
    const clamped = Math.max(0.0, Math.min(1.0, intensity));
    this.scene.fog.density = 0.0022 + clamped * 0.009;
    this.scene.fog.color.lerpColors(this.defaultFogColor, this.stormFogColor, clamped);
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
    if (this.postProcessing) {
      this.postProcessing.setSize(width, height);
    }
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

      // Check active camera from cameraController if dual-camera is active
      if (this.cameraController && this.cameraController.camera && this.cameraController.camera !== this.camera) {
        this.camera = this.cameraController.camera;
        if (this.postProcessing) {
          this.postProcessing.setCamera(this.camera);
        }
      }

      for (let i = 0; i < this.updatables.length; i++) {
        this.updatables[i].update(delta);
      }

      if (this.postProcessing && this.postProcessing.enabled) {
        this.postProcessing.render();
      } else if (this.camera && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    requestAnimationFrame(animate);
  }

  stop() {
    this.isRunning = false;
  }
}
