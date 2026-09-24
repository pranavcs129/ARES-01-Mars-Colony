import * as THREE from 'three';

/**
 * MarsDustAtmosphere — Airborne silicate dust motes, atmospheric wind drift, and Dust Storm tempest FX.
 * Operates a single performant BufferGeometry particle system with instanced/shader motion,
 * avoiding per-frame buffer uploads while providing cinematic swirling dust streams and intense storm mechanics.
 */
export class MarsDustAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 650;
    this.elapsed = 0;
    this.stormFactor = 0.0; // 0.0 (calm breeze) to 1.0 (violent sandstorm)

    this.initParticles();
  }

  initParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const randomOffsets = new Float32Array(this.particleCount * 4); // x, y, z speeds + phase

    // Spawn volume around colony footprint (120m x 25m x 120m)
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 110;
      positions[i * 3 + 1] = Math.random() * 22 + 0.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 110;

      randomOffsets[i * 4] = Math.random() * 0.4 + 0.6; // Speed multiplier
      randomOffsets[i * 4 + 1] = Math.random() * 0.3 + 0.1; // Vertical drift
      randomOffsets[i * 4 + 2] = Math.random() * 0.5 + 0.5; // Scale
      randomOffsets[i * 4 + 3] = Math.random() * Math.PI * 2; // Phase
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randomOffsets, 4));

    // Particle Shader for shimmering silicate dust
    this.dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        stormFactor: { value: 0.0 },
        sunDirection: { value: new THREE.Vector3(0.5, 0.7, 0.4).normalize() },
        baseColor: { value: new THREE.Color(0xd97736) },
        stormColor: { value: new THREE.Color(0xb93815) }
      },
      vertexShader: `
        attribute vec4 aRandom;
        uniform float time;
        uniform float stormFactor;
        varying float vAlpha;
        varying float vGlow;

        void main() {
          vec3 pos = position;

          // Horizontal drift speed increases dramatically with stormFactor
          float windSpeed = 3.5 + stormFactor * 32.0;
          float t = time * windSpeed * aRandom.x;

          // Wind flows along primary Martian prevailing wind axis (X-Z angle)
          pos.x += mod(t + aRandom.w * 50.0, 110.0) - 55.0;
          pos.z += mod(t * 0.4 + aRandom.w * 30.0, 110.0) - 55.0;

          // Gentle vertical bobbing & turbulence
          pos.y += sin(time * 1.5 * aRandom.y + aRandom.w) * (1.2 + stormFactor * 4.0);
          pos.y = mod(pos.y, 24.0) + 0.4;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Shimmer and scale
          float dist = -mvPosition.z;
          float baseSize = aRandom.z * (14.0 + stormFactor * 26.0);
          gl_PointSize = clamp(baseSize / dist * 100.0, 2.0, 36.0);

          vAlpha = clamp(1.0 - (pos.y / 24.0), 0.2, 0.85);
          vGlow = 0.5 + 0.5 * sin(time * 3.0 + aRandom.w);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 stormColor;
        uniform float stormFactor;
        varying float vAlpha;
        varying float vGlow;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float d = length(coord);
          if (d > 0.5) discard;

          // Soft radial falloff for dust particle
          float soft = smoothstep(0.5, 0.05, d);
          vec3 col = mix(baseColor, stormColor, stormFactor);
          col += vec3(0.2, 0.1, 0.05) * vGlow; // Solar glint

          float alpha = soft * vAlpha * (0.35 + stormFactor * 0.45);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geo, this.dustMaterial);
    this.points.name = 'MarsDustParticles';
    this.scene.add(this.points);
  }

  /**
   * Updates dust simulation, wind vectors, and storm intensity
   */
  update(delta = 0.016, isDustStorm = false, sunDir = null) {
    this.elapsed += delta;

    // Smooth storm factor damping
    const targetStorm = isDustStorm ? 1.0 : 0.0;
    this.stormFactor += (targetStorm - this.stormFactor) * Math.min(1.0, delta * 1.5);

    if (this.dustMaterial && this.dustMaterial.uniforms) {
      this.dustMaterial.uniforms.time.value = this.elapsed;
      this.dustMaterial.uniforms.stormFactor.value = this.stormFactor;

      if (sunDir) {
        this.dustMaterial.uniforms.sunDirection.value.copy(sunDir);
      }
    }
  }
}
