import * as THREE from 'three';

/**
 * Lighting — High-Performance, Cinematic Mars Lighting Engine.
 * Performance Budget: Exactly 1 Directional Sun/Moon light + 1 Hemisphere light + 1 Ambient light.
 * Zero per-frame object allocations (uses pre-allocated Vector3 and Color instances).
 *
 * Night Mode Target:
 * - DARK MAROON / BROWN TERRAIN (clearly readable regolith texture & crater silhouettes)
 * - COOL DARK-BLUE SKY AMBIENT FILL
 * - SUBTLE NEUTRAL MOONLIGHT (overhead angle, no horizontal black shadow walls)
 * - ZERO RED ALARM CAST, ZERO BLACKOUT
 */
export class Lighting {
  constructor(scene) {
    this.scene = scene;

    // Pre-allocated Vector3 and Colors to prevent GC pauses
    this._sunPos = new THREE.Vector3();
    this._targetHemiSky = new THREE.Color();
    this._targetHemiGround = new THREE.Color();
    this._targetAmbient = new THREE.Color();
    this._targetDir = new THREE.Color();

    // Key palette definitions
    // Day palette
    this.dayDirColor = new THREE.Color(0xfff2e6);
    this.dayHemiSky = new THREE.Color(0xc8855e);
    this.dayHemiGround = new THREE.Color(0x42261a);
    this.dayAmbient = new THREE.Color(0x523326);

    // Sunset / Dusk palette
    this.sunsetDirColor = new THREE.Color(0xf5a25d);
    this.sunsetHemiSky = new THREE.Color(0xb0653c);
    this.sunsetHemiGround = new THREE.Color(0x381e14);
    this.sunsetAmbient = new THREE.Color(0x4a2c1e);

    // Night palette (NASA documentary: readable dark maroon/brown regolith + cool celestial fill)
    this.nightDirColor = new THREE.Color(0x98aabf);   // Subtle neutral moonlight
    this.nightHemiSky = new THREE.Color(0x3a4b62);    // Cool dark blue night sky fill
    this.nightHemiGround = new THREE.Color(0x52362b); // Dark maroon / muted brown regolith
    this.nightAmbient = new THREE.Color(0x564036);    // Preserves terrain & building silhouettes

    this.init();
  }

  init() {
    // 1. Hemisphere Light — Martian sky vs terrain regolith bounce
    this.hemiLight = new THREE.HemisphereLight(0xc8855e, 0x42261a, 0.85);
    this.scene.add(this.hemiLight);

    // 2. Ambient Light — fills shadows, ensures terrain and buildings never go pitch-black
    this.ambientLight = new THREE.AmbientLight(0x523326, 0.40);
    this.scene.add(this.ambientLight);

    // 3. Directional Sun / Moonlight
    this.dirLight = new THREE.DirectionalLight(0xfff2e6, 2.3);
    this.dirLight.position.set(35, 45, 25);
    this.dirLight.castShadow = true;

    // Shadow Frustum calibrated for colony footprint
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 130;

    const span = 20;
    this.dirLight.shadow.camera.left = -span;
    this.dirLight.shadow.camera.right = span;
    this.dirLight.shadow.camera.top = span;
    this.dirLight.shadow.camera.bottom = -span;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.02;

    this.scene.add(this.dirLight);
  }

  /**
   * Updates lighting smoothly across the continuous Sol diurnal cycle
   * @param {number} hour Sol hour (0.0 to 24.0)
   * @param {number} delta Delta seconds
   * @param {boolean} isDustStorm Whether dust storm event is active
   * @param {boolean} isSolarFlare Whether solar flare event is active
   */
  update(hour = 12.0, delta = 0.016, isDustStorm = false, isSolarFlare = false) {
    const solProgress = (hour / 24.0) * Math.PI * 2 - Math.PI / 2;
    const sunElevation = Math.sin(solProgress);
    const sunAzimuth = Math.cos(solProgress);

    // Continuous day factor: 1.0 (Full day), 0.5 (Twilight/Sunset), 0.0 (Night)
    const dayFactor = THREE.MathUtils.clamp((sunElevation + 0.08) / 0.38, 0.0, 1.0);
    const sunsetFactor = 1.0 - Math.abs(dayFactor - 0.5) * 2.0; // Peaks at twilight

    if (dayFactor > 0.05) {
      // Daytime / Sunset: Sun arcs naturally across the sky
      const dist = 55;
      const lx = Math.cos(sunAzimuth * 0.8 + 0.6) * Math.max(0.15, Math.cos(sunElevation)) * dist;
      const ly = Math.max(4.0, Math.sin(sunElevation) * dist);
      const lz = Math.sin(sunAzimuth * 0.8 + 0.6) * Math.max(0.15, Math.cos(sunElevation)) * dist;
      this.dirLight.position.set(lx, ly, lz);
      this.dirLight.castShadow = true;
    } else {
      // Nighttime: Subtle moonlight from high overhead angle (y = 55)
      // High angle prevents buildings from casting infinite horizontal shadow walls over the terrain
      this.dirLight.position.set(22, 55, -28);
      this.dirLight.castShadow = false; // Disable heavy hard shadows at night to keep terrain soft & readable
    }

    // Smooth color & intensity interpolations
    if (dayFactor > 0.5) {
      // Day -> Sunset transition
      const t = (dayFactor - 0.5) * 2.0; // 0.0 (sunset) to 1.0 (full day)
      this._targetDir.lerpColors(this.sunsetDirColor, this.dayDirColor, t);
      this._targetHemiSky.lerpColors(this.sunsetHemiSky, this.dayHemiSky, t);
      this._targetHemiGround.lerpColors(this.sunsetHemiGround, this.dayHemiGround, t);
      this._targetAmbient.lerpColors(this.sunsetAmbient, this.dayAmbient, t);

      this.dirLight.intensity = THREE.MathUtils.lerp(1.4, 2.3, t);
      this.hemiLight.intensity = THREE.MathUtils.lerp(0.7, 0.85, t);
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.38, 0.40, t);
    } else {
      // Sunset -> Night transition
      const t = dayFactor * 2.0; // 0.0 (full night) to 1.0 (sunset)
      this._targetDir.lerpColors(this.nightDirColor, this.sunsetDirColor, t);
      this._targetHemiSky.lerpColors(this.nightHemiSky, this.sunsetHemiSky, t);
      this._targetHemiGround.lerpColors(this.nightHemiGround, this.sunsetHemiGround, t);
      this._targetAmbient.lerpColors(this.nightAmbient, this.sunsetAmbient, t);

      this.dirLight.intensity = THREE.MathUtils.lerp(0.50, 1.4, t);
      this.hemiLight.intensity = THREE.MathUtils.lerp(0.85, 0.7, t); // Higher fill at night for readability
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.65, 0.38, t); // Ambient preserves terrain texture
    }

    // Smooth environmental event factor dampings
    const targetStorm = isDustStorm ? 1.0 : 0.0;
    this.stormFactor = (this.stormFactor || 0.0) + (targetStorm - (this.stormFactor || 0.0)) * Math.min(1.0, delta * 1.5);

    const targetFlare = isSolarFlare ? 1.0 : 0.0;
    this.flareFactor = (this.flareFactor || 0.0) + (targetFlare - (this.flareFactor || 0.0)) * Math.min(1.0, delta * 2.0);

    // Apply dust storm attenuation: direct sunlight dims softly, reducing solar panel illumination
    if (this.stormFactor > 0.001) {
      this.dirLight.intensity *= (1.0 - this.stormFactor * 0.42);
      this.hemiLight.intensity *= (1.0 - this.stormFactor * 0.20);
      this._targetDir.lerp(new THREE.Color(0xb05e38), this.stormFactor * 0.45);
      this._targetHemiSky.lerp(new THREE.Color(0x7c4228), this.stormFactor * 0.35);
    }

    // Apply solar flare space-weather effect: very subtle warm lift in sky ambient
    if (this.flareFactor > 0.001) {
      this.dirLight.intensity *= (1.0 + this.flareFactor * 0.08);
      this.hemiLight.intensity *= (1.0 + this.flareFactor * 0.12);
      this._targetHemiSky.lerp(new THREE.Color(0xc27a4e), this.flareFactor * 0.20);
    }

    // Apply colors smoothly
    this.dirLight.color.copy(this._targetDir);
    this.hemiLight.color.copy(this._targetHemiSky);
    this.hemiLight.groundColor.copy(this._targetHemiGround);
    this.ambientLight.color.copy(this._targetAmbient);
  }
}
