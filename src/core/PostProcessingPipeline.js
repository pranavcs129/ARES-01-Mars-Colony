import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * PostProcessingPipeline — Cinematic Bloom, Tone Mapping, and Color Grading.
 * Brings the Mars Colony to life with:
 * - Subtle, photorealistic bloom on emissive hydroponics, rovers, conduits, beacons, and sun glints
 * - Proper ACESFilmic tone mapping and sRGB output
 * - Graceful fallback to raw WebGL rendering if post-processing throws or underperforms
 */
export class PostProcessingPipeline {
  constructor(renderer, scene, camera, container) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.container = container;

    this.enabled = true;
    this.composer = null;
    this.isSupported = true;

    this.init();
  }

  init() {
    try {
      const width = this.container.clientWidth || window.innerWidth || 800;
      const height = this.container.clientHeight || window.innerHeight || 600;

      // Render target with half float type for HDR bloom buffer
      const renderTarget = new THREE.WebGLRenderTarget(width, height, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        colorSpace: THREE.SRGBColorSpace,
        depthBuffer: true,
        stencilBuffer: false
      });

      this.composer = new EffectComposer(this.renderer, renderTarget);
      // Downscale bloom pass slightly for smooth 60fps performance on all GPUs
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      this.composer.setSize(width, height);

      // 1. Base Scene Pass
      this.renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);

      // 2. Cinematic Unreal Bloom Pass
      // Resolution, strength, radius, threshold
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width * 0.5, height * 0.5),
        0.58, // Bloom strength (subtle, rich)
        0.35, // Bloom radius
        0.82  // Bloom threshold (only bright highlights bloom)
      );
      this.composer.addPass(this.bloomPass);

      // 3. Final Tone Mapping & Color Management Output Pass
      this.outputPass = new OutputPass();
      this.composer.addPass(this.outputPass);

      console.log('%c✨ Cinematic Post-Processing Pipeline online.', 'color: #f59e0b; font-weight: bold;');
    } catch (err) {
      console.warn('[PostProcessingPipeline] Post-processing initialization failed, falling back to standard render:', err.message);
      this.isSupported = false;
      this.enabled = false;
    }
  }

  setCamera(camera) {
    this.camera = camera;
    if (this.renderPass) {
      this.renderPass.camera = camera;
    }
  }

  setSize(width, height) {
    if (this.composer && this.isSupported) {
      this.composer.setSize(width, height);
      if (this.bloomPass) {
        this.bloomPass.resolution.set(width * 0.5, height * 0.5);
      }
    }
  }

  render() {
    if (this.enabled && this.isSupported && this.composer) {
      try {
        this.composer.render();
        return;
      } catch (err) {
        console.warn('[PostProcessingPipeline] Render error, disabling bloom:', err.message);
        this.enabled = false;
      }
    }

    // Direct fallback render
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
