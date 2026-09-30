import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * DistantSandstormBoundary — Lightweight Distant Atmospheric Boundary Engine.
 * 
 * Purpose:
 * Uses the existing /assets/sandstorm/sandstorm.glb asset as a distant, realistic
 * atmospheric perimeter far outside the colony and playable terrain.
 * 
 * Key Characteristics:
 * - Load once, reuse. Zero per-frame object or geometry allocations.
 * - Sits outside the 150x150 colony terrain boundary (r >= 95).
 * - storm_ground_dust is disabled so the colony terrain is 100% uncovered.
 * - Low, wide profile (scaled down in height) blending smoothly into the horizon.
 * - Uses existing 'storm_swirl' animation via THREE.AnimationMixer for slow, majestic atmospheric drift.
 * - Camera zoom-aware: barely visible at normal colony view, seamlessly fades in when zooming out.
 * - Smooth day/sunset/night color grading matching the Martian environment without glowing at night.
 */
export class DistantSandstormBoundary {
  constructor(scene, cameraController) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.loader = new GLTFLoader();

    this.group = new THREE.Group();
    this.group.name = 'DistantSandstormBoundary';
    this.group.visible = false; // Initially hidden until loaded

    this.mixer = null;
    this.materials = [];
    this.centerPos = new THREE.Vector3(0, 0, 0);

    // Pre-allocated colors for zero-allocation diurnal grading
    this._currentColor = new THREE.Color();
    this.dayColor = new THREE.Color(0xb5785a);   // Warm muted Mars dust
    this.sunsetColor = new THREE.Color(0x9e583c); // Dusk copper
    this.nightColor = new THREE.Color(0x241d24);  // Deep muted dark mauve/brown

    this.isLoaded = false;
    this.loadAsset();
  }

  loadAsset() {
    const assetUrl = '/assets/sandstorm/sandstorm.glb';

    this.loader.load(
      assetUrl,
      (gltf) => {
        const stormModel = gltf.scene;

        // Convert Blender Z-up to Three.js Y-up (matching ColonyLoader)
        this.group.rotation.x = -Math.PI / 2;

        // Sits slightly below ground (Y = -2.5) so base skirt sinks beneath the horizon
        this.group.position.set(0, -2.5, 0);

        // Scale: Wide and low, irregular oval (X != Z) to avoid a computer-generated circle
        // Local X -> World X (1.42), Local Y -> World -Z (1.32), Local Z -> World Y height (0.50)
        this.group.scale.set(1.42, 1.32, 0.50);

        // Configure meshes and materials
        const baseOpacities = {
          storm_core_wall: 0.55,
          storm_roof: 0.35,
          storm_outer_skirt: 0.40,
          storm_layer_far: 0.45,
          storm_layer_mid: 0.38,
          storm_layer_haze: 0.28
        };

        stormModel.traverse((child) => {
          if (child.isMesh) {
            // NEVER cover colony terrain: Disable ground dust decal completely
            if (child.name === 'storm_ground_dust') {
              child.visible = false;
              return;
            }

            // Ensure distance boundary never casts shadows
            child.castShadow = false;
            child.receiveShadow = false;
            child.frustumCulled = true;

            const name = child.name || '';
            const baseOpacity = baseOpacities[name] || 0.40;

            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              if (mat) {
                mat.transparent = true;
                mat.depthWrite = false; // Prevents z-fighting and preserves foreground colony depth
                mat.depthTest = true;
                mat.userData.baseOpacity = baseOpacity;
                mat.opacity = baseOpacity;
                mat.color.copy(this.dayColor);
                this.materials.push(mat);
              }
            });

            child.renderOrder = -1;
          }
        });

        // Initialize slow atmospheric swirling animation if available in GLB
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(stormModel);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        this.group.add(stormModel);
        this.scene.add(this.group);
        this.isLoaded = true;
        this.group.visible = true;

        console.log('🌪️ Distant Sandstorm Boundary loaded & anchored successfully.');
      },
      undefined,
      (err) => {
        console.warn('[DistantSandstormBoundary] Failed to load sandstorm asset:', err.message);
      }
    );
  }

  /**
   * Updates distance-based zoom fade, diurnal coloring, and slow atmospheric rotation
   * @param {number} delta Frame delta seconds
   * @param {number} nightFactor Diurnal night factor (0.0=day, 0.5=sunset, 1.0=night)
   */
  update(delta = 0.016, nightFactor = 0.0) {
    if (!this.isLoaded) return;

    // 1. Advance baked GLB atmospheric swirl animation
    if (this.mixer) {
      this.mixer.update(delta * 0.85); // Gentle, majestic swirl rate
    }

    // 2. Very subtle global yaw drift (0.002 rad/s)
    this.group.rotation.z += delta * 0.002;

    // 3. Zoom-based visibility & opacity falloff
    // At normal colony view: barely visible / invisible
    // When zooming out: smoothly fades in as the distant boundary
    let zoomFactor = 0.0;
    const camera = this.cameraController ? this.cameraController.camera : null;

    if (camera && camera.isOrthographicCamera) {
      // Tactical Ortho Camera: default frustumSize is 24, max zoom-out is 75
      const fSize = this.cameraController.frustumSize || 24;
      zoomFactor = THREE.MathUtils.clamp((fSize - 18) / 36, 0.0, 1.0);
    } else if (camera) {
      // Perspective Camera: distance from colony center
      const dist = camera.position.distanceTo(this.centerPos);
      zoomFactor = THREE.MathUtils.clamp((dist - 24) / 45, 0.0, 1.0);
    } else {
      zoomFactor = 0.5;
    }

    if (zoomFactor <= 0.01) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;

    // 4. Diurnal color interpolation (Day -> Sunset -> Night)
    if (nightFactor < 0.5) {
      const t = nightFactor * 2.0; // 0.0 (day) to 1.0 (sunset)
      this._currentColor.lerpColors(this.dayColor, this.sunsetColor, t);
    } else {
      const t = (nightFactor - 0.5) * 2.0; // 0.0 (sunset) to 1.0 (night)
      this._currentColor.lerpColors(this.sunsetColor, this.nightColor, t);
    }

    // 5. Apply opacity & color without allocating memory
    const mats = this.materials;
    for (let i = 0; i < mats.length; i++) {
      const mat = mats[i];
      mat.opacity = mat.userData.baseOpacity * zoomFactor;
      mat.color.copy(this._currentColor);
    }
  }

  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    if (this.group && this.scene) {
      this.scene.remove(this.group);
    }
    this.materials = [];
  }
}
