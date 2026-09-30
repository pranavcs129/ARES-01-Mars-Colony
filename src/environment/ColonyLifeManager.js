import * as THREE from 'three';

/**
 * ColonyLifeManager — Restrained NASA-style Environmental Activity.
 * Keeps the colony clean, authentic, and grounded:
 * - Removed cartoonish procedural rovers & floating drones
 * - Removed continuous glowing conduit lines across terrain
 * - Retains only 2 subtle, authentic aviation hazard beacon strobes mounted on tall structures:
 *   1. Starship Launchpad Gantry Mast (aviation red)
 *   2. Central Hub Communications Tower (aviation amber)
 */
export class ColonyLifeManager {
  constructor(scene, colonyRoot) {
    this.scene = scene;
    this.colonyRoot = colonyRoot;
    this.lifeGroup = new THREE.Group();
    this.lifeGroup.name = 'ColonyLifeAndActivity';
    this.elapsed = 0;

    this.beacons = [];

    this.initStructureBeacons();
    this.scene.add(this.lifeGroup);
  }

  // ─────────────────────────────────────────────────────────
  // RESTRAINED AVIATION HAZARD BEACONS
  // Exactly 2 physical navigation warning strobes mounted on genuine tall structures
  // ─────────────────────────────────────────────────────────
  initStructureBeacons() {
    const beaconDefs = [
      // 1. Central Hub Main Comm Tower (slow amber pulse)
      { pos: new THREE.Vector3(-0.2, 5.2, 0.2), color: 0xd97706, period: 1.8 },
      // 2. Starship Launch Gantry Top (aviation red)
      { pos: new THREE.Vector3(-8.8, 6.4, -4.5), color: 0xef4444, period: 1.5 }
    ];

    // Very small physical LED housing (radius 0.05)
    const geo = new THREE.SphereGeometry(0.055, 6, 6);

    beaconDefs.forEach(b => {
      const mat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.75
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(b.pos);

      this.beacons.push({
        mesh,
        mat,
        color: b.color,
        period: b.period
      });
      this.lifeGroup.add(mesh);
    });
  }

  /**
   * Updates subtle beacon strobes
   */
  update(delta = 0.016, isNight = false, isDustStorm = false) {
    this.elapsed += delta;
    const t = this.elapsed;

    // Slow, subtle, authentic aviation strobe pulse (short flash, long pause)
    this.beacons.forEach(b => {
      const cycle = (t / b.period) % 1.0;
      // Strobe flash only in the first 8% of the cycle
      const isFlash = cycle < 0.08;
      const baseOpacity = isNight ? 0.3 : 0.15;
      b.mat.opacity = isFlash ? (isNight ? 0.95 : 0.75) : baseOpacity;
      const scale = isFlash ? 1.25 : 1.0;
      b.mesh.scale.set(scale, scale, scale);
    });
  }

  dispose() {
    if (this.lifeGroup && this.scene) {
      this.scene.remove(this.lifeGroup);
    }
  }
}
