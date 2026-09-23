import * as THREE from 'three';

/**
 * ColonyAnimator — PERFORMANCE-OPTIMIZED version.
 * 
 * REMOVED: 16 PointLights (was the #1 performance killer — each point light
 * forces Three.js to recompile fragment shaders with NUM_POINT_LIGHTS=16,
 * making every lit fragment extremely expensive).
 * 
 * REMOVED: Dust particle system (was updating 80×3=240 floats + buffer
 * upload every frame).
 * 
 * KEPT: Emissive material pulses (zero GPU cost, just a float assignment).
 * KEPT: Solar oscillation (1 rotation assignment per frame).
 * 
 * REMOVED: Mining vibration (was setting position every frame, forcing
 * matrix recalculation on a mesh with 5028 verts).
 * 
 * All node references are cached at init time — zero scene traversal
 * during update().
 */
export class ColonyAnimator {
  constructor(scene, colonyRoot) {
    this.scene = scene;
    this.colonyRoot = colonyRoot;
    this.elapsed = 0;

    // Cached animation targets (populated once at init, never traversed again)
    this.emissivePulses = [];     // { material, baseIntensity, phase, speed, amplitude }
    this.solarNode = null;
    this.solarBaseRotZ = 0;

    this.init();
  }

  init() {
    this.setupEmissivePulses();
    this.setupSolarTracking();

    console.log('%c🔧 ColonyAnimator (optimized)', 'color: #10b981; font-weight: bold;', {
      emissivePulses: this.emissivePulses.length,
      solarTracking: !!this.solarNode,
      pointLights: 0,
      dustParticles: 0
    });
  }

  // ─────────────────────────────────────────────────────────
  // EMISSIVE MATERIAL PULSES
  // Zero GPU cost — just modifies emissiveIntensity (a uniform float).
  // Materials are collected ONCE at init, cached in a flat array.
  // ─────────────────────────────────────────────────────────
  setupEmissivePulses() {
    const seen = new Set();

    this.colonyRoot.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (let i = 0; i < mats.length; i++) {
        const mat = mats[i];
        if (!mat || seen.has(mat.uuid)) continue;
        if (!mat.emissive) continue;
        if (mat.emissive.r === 0 && mat.emissive.g === 0 && mat.emissive.b === 0) continue;

        seen.add(mat.uuid);

        const name = mat.name || '';
        let speed = 0.3;
        let amplitude = 0.15;

        if (name.includes('glass_teal') || name.includes('green_foliage')) {
          speed = 0.2; amplitude = 0.2;
        } else if (name.includes('glass_blue_light')) {
          speed = 0.4; amplitude = 0.12;
        } else if (name.includes('glass_blue_deep')) {
          speed = 0.15; amplitude = 0.1;
        } else if (name.includes('glass_dark')) {
          speed = 0.25; amplitude = 0.18;
        } else if (name.includes('danger_red')) {
          speed = 0.7; amplitude = 0.25;
        }

        this.emissivePulses.push({
          material: mat,
          baseIntensity: mat.emissiveIntensity || 1.0,
          phase: i * 2.1 + seen.size * 0.7, // deterministic stagger
          speed,
          amplitude
        });
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // SOLAR TRACKING — single cached node reference
  // ─────────────────────────────────────────────────────────
  setupSolarTracking() {
    // Direct children lookup — no full traversal
    for (let i = 0; i < this.colonyRoot.children.length; i++) {
      const child = this.colonyRoot.children[i];
      if (child.name === 'solar') {
        this.solarNode = child;
        this.solarBaseRotZ = child.rotation.z || 0;
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // UPDATE — called once per frame. Extremely lightweight.
  // No scene traversal. No buffer uploads. No light updates.
  // Just float assignments to cached material references.
  // ─────────────────────────────────────────────────────────
  update(delta) {
    this.elapsed += delta;
    const t = this.elapsed;

    // Emissive pulses: ~8 float assignments total
    const pulses = this.emissivePulses;
    for (let i = 0; i < pulses.length; i++) {
      const ep = pulses[i];
      const wave = Math.sin(t * ep.speed * 6.2832 + ep.phase); // 6.2832 = 2π
      ep.material.emissiveIntensity = ep.baseIntensity * (1.0 + wave * ep.amplitude);
    }

    // Solar oscillation: 1 rotation assignment
    if (this.solarNode) {
      this.solarNode.rotation.z = this.solarBaseRotZ + Math.sin(t * 0.02) * 0.12;
      this.solarNode.updateMatrix(); // manual update since matrixAutoUpdate is false
    }
  }
}
