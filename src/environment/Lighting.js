import * as THREE from 'three';

/**
 * Lighting — High-Fidelity Cinematic Diurnal Mars Lighting & Shadow Engine.
 * Supports:
 * - Dynamic Sun progression tracking Sol hour (Golden Dawn, High Sol, Blue Sunset, Night)
 * - Ground bounce light from Martian red regolith
 * - Dust storm solar attenuation & atmospheric diffusion
 * - Nighttime celestial ambient & colony illumination
 * - Optimized PCF soft shadow cascades
 */
export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    // 1. Hemisphere Light — Martian sky vs red regolith ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xf69c5e, 0x3d170e, 0.95);
    this.scene.add(this.hemiLight);

    // 2. Ambient Light — soft fill to prevent pitch-black shadows
    this.ambientLight = new THREE.AmbientLight(0x733420, 0.45);
    this.scene.add(this.ambientLight);

    // 3. Directional Sun Light
    this.dirLight = new THREE.DirectionalLight(0xffeedb, 2.6);
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

    // 4. Subtle secondary fill light (Martian horizon scatter)
    this.fillLight = new THREE.DirectionalLight(0xb85d38, 0.4);
    this.fillLight.position.set(-25, 15, -20);
    this.fillLight.castShadow = false;
    this.scene.add(this.fillLight);
  }

  /**
   * Updates lighting dynamically as the Sol clock advances
   * @param {number} hour Sol hour (0.0 to 24.0)
   * @param {number} delta Delta seconds
   * @param {boolean} isDustStorm Whether dust storm event is active
   */
  update(hour = 12.0, delta = 0.016, isDustStorm = false) {
    const solProgress = (hour / 24.0) * Math.PI * 2 - Math.PI / 2;
    const sunElevation = Math.sin(solProgress);
    const sunAzimuth = Math.cos(solProgress);

    // Directional light position following the solar arc
    const dist = 55;
    const lx = Math.cos(sunAzimuth * 0.8 + 0.6) * Math.max(0.15, Math.cos(sunElevation)) * dist;
    const ly = Math.max(3.0, Math.sin(sunElevation) * dist);
    const lz = Math.sin(sunAzimuth * 0.8 + 0.6) * Math.max(0.15, Math.cos(sunElevation)) * dist;

    this.dirLight.position.set(lx, ly, lz);

    // Color and intensity grading based on solar elevation
    if (isDustStorm) {
      // Dust Storm: Dimmest sun, eerie amber-red diffuse light
      this.dirLight.intensity = 0.6;
      this.dirLight.color.setHex(0xe65c28);
      this.hemiLight.intensity = 0.5;
      this.hemiLight.color.setHex(0x993d1a);
      this.hemiLight.groundColor.setHex(0x3a1208);
      this.ambientLight.intensity = 0.35;
      this.ambientLight.color.setHex(0x5e2210);
    } else if (sunElevation > 0.25) {
      // High Sol: Crisp white-gold illumination, deep shadows
      this.dirLight.intensity = 2.65;
      this.dirLight.color.setHex(0xffeedb);
      this.hemiLight.intensity = 0.95;
      this.hemiLight.color.setHex(0xf69c5e);
      this.hemiLight.groundColor.setHex(0x3d170e);
      this.ambientLight.intensity = 0.45;
      this.ambientLight.color.setHex(0x733420);
    } else if (sunElevation > -0.05) {
      // Dawn / Golden Hour / Twilight: Dramatic warm golden-copper tones
      const t = Math.max(0, (sunElevation + 0.05) / 0.3);
      this.dirLight.intensity = 0.8 + t * 1.6;
      this.dirLight.color.setHex(0xffa85c);
      this.hemiLight.intensity = 0.4 + t * 0.5;
      this.hemiLight.color.setHex(0xdf6420);
      this.hemiLight.groundColor.setHex(0x280e07);
      this.ambientLight.intensity = 0.25 + t * 0.2;
    } else {
      // Martian Night: Deep starlight / Phobos celestial illumination
      this.dirLight.intensity = 0.25;
      this.dirLight.color.setHex(0x5a6d88); // Cool celestial moonlight
      this.hemiLight.intensity = 0.35;
      this.hemiLight.color.setHex(0x282e3f);
      this.hemiLight.groundColor.setHex(0x120808);
      this.ambientLight.intensity = 0.2;
      this.ambientLight.color.setHex(0x1a1c28);
    }
  }
}
