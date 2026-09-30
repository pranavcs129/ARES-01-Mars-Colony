import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * DistantSandstormBoundary — Lightweight Distant Atmospheric Boundary Engine.
 * 
 * Purpose:
 * Positions the existing sandstorm.glb asset as a realistic, distant atmospheric dust front
 * encircling the outer perimeter of the Mars terrain.
 * 
 * Precise Terrain Bounds & Placement:
 * - Mars Terrain plate: [-75, 75] in X and Z (diameter 150, center at 0, 0, 0).
 * - Sandstorm Core Wall: sits just outside at radius 76 to 80 units.
 * - Sandstorm Outer Skirt: extends from 84 to 122 units, concealing the world boundary.
 * - Sandstorm Inner Haze: stands vertically at radius 58 to 61 units.
 * - Height: compressed to low & wide profile (span ~17 units, Y from -2.3 to 15.0).
 * - Ground Decals: storm_ground_dust is disabled so the colony terrain is 100% uncovered.
 * 
 * Camera Zoom States:
 * 1. Normal colony view (frustumSize 24): Storm is 100% off-screen.
 *    Result: COLONY -> LARGE AMOUNT OF NORMAL MARS TERRAIN.
 * 2. Medium zoom-out (frustumSize ~45): Faint inner haze wisps subtly appear in far corners.
 *    Result: COLONY -> OPEN MARS TERRAIN -> SUBTLE DISTANT SANDSTORM.
 * 3. Maximum zoom-out (frustumSize 75): Distant sandstorm wall is clearly visible framing the horizon.
 *    Result: COLONY -> OPEN MARS TERRAIN -> DISTANT SANDSTORM HORIZON.
 */
export class DistantSandstormBoundary {
  constructor(scene, cameraController) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.loader = new GLTFLoader();

    this.group = new THREE.Group();
    this.group.name = 'DistantSandstormBoundary';
    this.group.visible = false;

    this.mixer = null;
    this.materials = [];
    this.centerPos = new THREE.Vector3(0, 0, 0);

    // Diurnal color grading (textures unmultiplied in daytime, dimmed at night)
    this._currentColor = new THREE.Color(0xffffff);
    this.dayColor = new THREE.Color(0xffffff);     // Full natural texture colors
    this.sunsetColor = new THREE.Color(0xf6af88); // Warm sunset copper
    this.nightColor = new THREE.Color(0x3a282c);  // Muted dark mauve at night

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

        // Anchor slightly below ground (Y = -1.2) so the bottom skirt sinks into the terrain edge
        this.group.position.set(0, -1.2, 0);

        // Precise scale calculated from terrain bounds:
        // Local X -> World X (0.84) -> Core wall at radius 76 - 80 (just outside 75m terrain edge)
        // Local Y -> World -Z (0.80) -> Core wall at radius 76 - 80
        // Local Z -> World Y (0.40) -> Height span 17 units (low, wide atmospheric dust wall)
        this.group.scale.set(0.84, 0.80, 0.40);

        // Calibrated base opacities: core wall solid enough to block the void, inner haze soft
        const baseOpacities = {
          storm_core_wall: 0.88,
          storm_roof: 0.65,
          storm_outer_skirt: 0.72,
          storm_layer_far: 0.78,
          storm_layer_mid: 0.68,
          storm_layer_haze: 0.55
        };

        stormModel.traverse((child) => {
          if (child.isMesh) {
            // NEVER cover colony terrain: Disable ground decal plane completely
            if (child.name === 'storm_ground_dust') {
              child.visible = false;
              return;
            }

            child.castShadow = false;
            child.receiveShadow = false;
            child.frustumCulled = true;

            const name = child.name || '';
            const baseOpacity = baseOpacities[name] || 0.65;

            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
              if (mat) {
                mat.transparent = true;
                mat.depthWrite = false; // Foreground colony terrain always renders cleanly in front
                mat.depthTest = true;
                mat.side = THREE.DoubleSide; // Visible from both inside and outside cylinder
                mat.userData.baseOpacity = baseOpacity;
                mat.opacity = baseOpacity;
                mat.color.copy(this.dayColor);
                this.materials.push(mat);
              }
            });

            child.renderOrder = 1;
          }
        });

        // Advance GLB baked swirl animation using THREE.AnimationMixer
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(stormModel);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        this.group.add(stormModel);
        this.scene.add(this.group);
        this.isLoaded = true;

        console.log('🌪️ Distant Sandstorm Boundary aligned to outer terrain perimeter.');
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
      this.mixer.update(delta * 0.85);
    }

    // 2. Very subtle global yaw drift (0.0015 rad/s)
    this.group.rotation.z += delta * 0.0015;

    // 3. Zoom-based visibility & opacity falloff
    let zoomFactor = 0.0;
    const camera = this.cameraController ? this.cameraController.camera : null;

    if (camera && camera.isOrthographicCamera) {
      // Tactical Ortho Camera:
      // min: 5.5, default: 24.0, max: 75.0
      // Normal view (24): zoomFactor <= 0.05 (and storm is off-screen at r >= 58 vs view r <= 25)
      // Medium zoom (~45): zoomFactor = 0.60 (inner haze wisps subtly appear on horizon)
      // Wide/max zoom (60-75): zoomFactor = 1.0 (storm wall clearly visible encircling horizon)
      const fSize = this.cameraController.frustumSize || 24;
      zoomFactor = THREE.MathUtils.clamp((fSize - 22) / 38, 0.0, 1.0);
    } else if (camera) {
      // Perspective Camera (Cinematic mode):
      const dist = camera.position.distanceTo(this.centerPos);
      zoomFactor = THREE.MathUtils.clamp((dist - 20) / 32, 0.0, 1.0);
    } else {
      zoomFactor = 0.5;
    }

    // Hide completely when close to the colony
    if (zoomFactor <= 0.01) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;

    // 4. Diurnal color interpolation (Day -> Sunset -> Night)
    if (nightFactor < 0.5) {
      const t = nightFactor * 2.0;
      this._currentColor.lerpColors(this.dayColor, this.sunsetColor, t);
    } else {
      const t = (nightFactor - 0.5) * 2.0;
      this._currentColor.lerpColors(this.sunsetColor, this.nightColor, t);
    }

    // 5. Apply smooth opacity ramp and diurnal tint
    const mats = this.materials;
    const effectiveAlphaMultiplier = 0.35 + 0.65 * zoomFactor;
    for (let i = 0; i < mats.length; i++) {
      const mat = mats[i];
      mat.opacity = mat.userData.baseOpacity * effectiveAlphaMultiplier;
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
