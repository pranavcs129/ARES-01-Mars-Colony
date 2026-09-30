import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * PostProcessingPipeline — Restrained, realistic cinematic post-processing.
 * Features:
 * - Subtle, high-threshold bloom (0.92 threshold, 0.18 strength) strictly limited to
 *   genuinely bright emissives (greenhouse grow lights, beacon strobes).
 * - Zero glowing ground, zero glowing rocks, zero whole-colony halo.
 * - ACESFilmic tone mapping and sRGB output.
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

      const renderTarget = new THREE.WebGLRenderTarget(width, height, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        colorSpace: THREE.SRGBColorSpace,
        depthBuffer: true,
        stencilBuffer: false
      });

      this.composer = new EffectComposer(this.renderer, renderTarget);
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      this.composer.setSize(width, height);

      // 1. Base Scene Pass
      this.renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);

      // 2. Restrained Bloom Pass
      // Very high threshold (0.92) & low strength (0.18) so terrain and normal structures NEVER glow
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width * 0.5, height * 0.5),
        0.18, // Restrained bloom strength
        0.22, // Tight bloom radius
        0.92  // High threshold (only hot emissives glow)
      );
      this.composer.addPass(this.bloomPass);

      // 3. Final Tone Mapping & Color Management Output Pass
      this.outputPass = new OutputPass();
      this.composer.addPass(this.outputPass);

      console.log('%c✨ Restrained Post-Processing Pipeline online.', 'color: #10b981; font-weight: bold;');
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

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
