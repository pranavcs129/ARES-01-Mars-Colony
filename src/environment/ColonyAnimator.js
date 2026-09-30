import * as THREE from 'three';

/**
 * ColonyAnimator — Performance-Optimized Environmental & Facility Emissive Controller.
 * Zero scene traversal during frame updates.
 * Modulates emissive intensities on cached materials:
 * - Daytime: subtle natural baseline
 * - Nighttime: soft, subtle interior window & hydroponic glow (Habitat warm amber, Greenhouse soft cyan)
 * - Zero extra lights or draw calls
 */
export class ColonyAnimator {
  constructor(scene, colonyRoot) {
    this.scene = scene;
    this.colonyRoot = colonyRoot;
    this.elapsed = 0;

    // Cached animation targets (populated once at init, never traversed again)
    this.emissivePulses = [];     // { material, baseIntensity, phase, speed, amplitude, nightBoost }
    this.solarNode = null;
    this.solarBaseRotZ = 0;

    this.init();
  }

  init() {
    this.setupEmissivePulses();
    this.setupSolarTracking();
  }

  // ─────────────────────────────────────────────────────────
  // EMISSIVE MATERIAL REGISTRATION (ONCE AT INIT)
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

        const name = (mat.name || '').toLowerCase();
        let speed = 0.25;
        let amplitude = 0.08; // Very subtle pulse (not distracting)
        let nightBoost = 0.20;

        if (name.includes('glass_teal') || name.includes('green_foliage') || name.includes('greenhouse')) {
          // Greenhouse: soft cyan/white interior growlight glow
          speed = 0.15;
          amplitude = 0.06;
          nightBoost = 0.40;
        } else if (name.includes('glass_blue_light') || name.includes('hab') || name.includes('window')) {
          // Habitat: soft warm interior window illumination
          speed = 0.2;
          amplitude = 0.05;
          nightBoost = 0.35;
        } else if (name.includes('danger_red') || name.includes('alert')) {
          // Critical indicator
          speed = 0.5;
          amplitude = 0.15;
          nightBoost = 0.25;
        }

        this.emissivePulses.push({
          material: mat,
          baseIntensity: mat.emissiveIntensity || 1.0,
          phase: i * 1.8 + seen.size * 0.6,
          speed,
          amplitude,
          nightBoost
        });
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // SOLAR TRACKING — single cached node reference
  // ─────────────────────────────────────────────────────────
  setupSolarTracking() {
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
  // UPDATE — Called once per frame. Lightweight float assignments.
  // ─────────────────────────────────────────────────────────
  update(delta, nightFactor = null) {
    this.elapsed += delta;
    const t = this.elapsed;
    const nf = nightFactor !== null ? nightFactor : (this.nightFactor || 0.0);

    // Emissive pulses: ~8 uniform float assignments total
    const pulses = this.emissivePulses;
    for (let i = 0; i < pulses.length; i++) {
      const ep = pulses[i];
      const wave = Math.sin(t * ep.speed * 6.2832 + ep.phase);
      const nightGlow = nf * ep.nightBoost;
      ep.material.emissiveIntensity = ep.baseIntensity * (1.0 + wave * ep.amplitude + nightGlow);
    }

    // Solar tracking oscillation: 1 rotation assignment
    if (this.solarNode) {
      this.solarNode.rotation.z = this.solarBaseRotZ + Math.sin(t * 0.02) * 0.12;
      this.solarNode.updateMatrix();
    }
  }
}
