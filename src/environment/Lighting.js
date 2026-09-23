import * as THREE from 'three';

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    // 1. Hemisphere light — cheap ambient atmospheric fill
    const hemiLight = new THREE.HemisphereLight(0xf69c5e, 0x2c130b, 0.9);
    this.scene.add(hemiLight);

    // 2. Ambient light — soft fill to prevent pitch-black shadows
    const ambientLight = new THREE.AmbientLight(0x6b3524, 0.5);
    this.scene.add(ambientLight);

    // 3. One directional sun light with optimized shadow map
    const dirLight = new THREE.DirectionalLight(0xffeedb, 2.5);
    dirLight.position.set(35, 45, 25);
    dirLight.castShadow = true;

    // PERF: shadow map sized for colony buildings only (~25m footprint)
    // Reduced from 2048 to 1024 — still crisp for the isometric view
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 100;

    const span = 18; // Tightened frustum to cover only the colony core
    dirLight.shadow.camera.left = -span;
    dirLight.shadow.camera.right = span;
    dirLight.shadow.camera.top = span;
    dirLight.shadow.camera.bottom = -span;
    dirLight.shadow.bias = -0.001;

    this.scene.add(dirLight);

    // No fill light, no extra directional lights — keep it simple
  }
}
