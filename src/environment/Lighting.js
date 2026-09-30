import * as THREE from 'three';

/**
 * Lighting — Realistic, restrained Mars lighting with readable night mode.
 * Supports:
 * - Natural, balanced daylight with crisp shadows
 * - Soft golden dawn & dusk transitions
 * - Highly readable, atmospheric night (dark burgundy / muted brown regolith + cool celestial fill)
 *   ensuring terrain, dunes, and infrastructure are always clearly visible.
 */
export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    // 1. Hemisphere Light — Martian sky vs terrain regolith bounce
    this.hemiLight = new THREE.HemisphereLight(0xc88258, 0x42261a, 0.8);
    this.scene.add(this.hemiLight);

    // 2. Ambient Light — soft fill to prevent pitch-black shadows & keep terrain readable
    this.ambientLight = new THREE.AmbientLight(0x523326, 0.38);
    this.scene.add(this.ambientLight);

    // 3. Directional Sun / Celestial Light
    this.dirLight = new THREE.DirectionalLight(0xfff4ea, 2.25);
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

    // 4. Subtle secondary fill light (horizon bounce)
    this.fillLight = new THREE.DirectionalLight(0x8a5238, 0.25);
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

    const dist = 55;
    const lx = Math.cos(sunAzimuth * 0.8 + 0.6) * Math.max(0.15, Math.cos(sunElevation)) * dist;
    const ly = Math.max(3.0, Math.sin(sunElevation) * dist);
    const lz = Math.sin(sunAzimuth * 0.8 + 0.6) * Math.max(0.15, Math.cos(sunElevation)) * dist;

    this.dirLight.position.set(lx, ly, lz);

    if (isDustStorm) {
      // Dust Storm: Soft diffuse lighting, lower contrast, muted copper
      this.dirLight.intensity = 0.8;
      this.dirLight.color.setHex(0xc0683c);
      this.hemiLight.intensity = 0.55;
      this.hemiLight.color.setHex(0x8a4528);
      this.hemiLight.groundColor.setHex(0x351d14);
      this.ambientLight.intensity = 0.38;
      this.ambientLight.color.setHex(0x4a2a1e);
    } else if (sunElevation > 0.25) {
      // High Sol: Natural warm-white sunlight, crisp readable shadows
      this.dirLight.intensity = 2.25;
      this.dirLight.color.setHex(0xfff4ea);
      this.hemiLight.intensity = 0.8;
      this.hemiLight.color.setHex(0xc88258);
      this.hemiLight.groundColor.setHex(0x42261a);
      this.ambientLight.intensity = 0.38;
      this.ambientLight.color.setHex(0x523326);
    } else if (sunElevation > -0.05) {
      // Golden Hour / Sunset / Dawn: Gentle warm copper tones, longer shadows
      const t = Math.max(0, (sunElevation + 0.05) / 0.3);
      this.dirLight.intensity = 1.0 + t * 1.25;
      this.dirLight.color.setHex(0xf5a560);
      this.hemiLight.intensity = 0.5 + t * 0.3;
      this.hemiLight.color.setHex(0xb0653c);
      this.hemiLight.groundColor.setHex(0x321a12);
      this.ambientLight.intensity = 0.32 + t * 0.06;
      this.ambientLight.color.setHex(0x48291c);
    } else {
      // Martian Night: Atmospheric, readable night!
      // Dark burgundy / muted brown terrain + soft low-intensity ambient fill + cool celestial moonlight
      // Terrain and structures remain clearly visible (NOT black, NOT blood red).
      this.dirLight.intensity = 0.45;
      this.dirLight.color.setHex(0x788aa2); // Pale cool celestial moonlight
      this.hemiLight.intensity = 0.60;
      this.hemiLight.color.setHex(0x323a48);       // Cool night sky fill
      this.hemiLight.groundColor.setHex(0x241c18); // Dark burgundy/muted brown regolith
      this.ambientLight.intensity = 0.40;
      this.ambientLight.color.setHex(0x322c2a);   // Soft ambient fill ensuring terrain clarity
    }
  }
}
