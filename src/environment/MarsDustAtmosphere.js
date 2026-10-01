import * as THREE from 'three';

/**
 * MarsDustAtmosphere — Ultra-Lightweight, Physically Subtle Martian Atmospheric Haze.
 * - Restrained to 45 microscopic motes for delicate ambient depth without covering terrain or structures.
 * - Near-camera depth fade ensures particles never obstruct foreground view.
 * - Muted natural regolith color palette (eliminating harsh orange tint).
 * - Zero per-frame memory allocation.
 */
export class MarsDustAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 45; // Subtle, non-intrusive dust motes
    this.elapsed = 0;
    this.stormFactor = 0.0;

    this.initParticles();
  }

  initParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const randomOffsets = new Float32Array(this.particleCount * 4);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 85;
      positions[i * 3 + 1] = Math.random() * 12 + 0.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 85;

      randomOffsets[i * 4] = Math.random() * 0.3 + 0.7;    // Speed
      randomOffsets[i * 4 + 1] = Math.random() * 0.15 + 0.05; // Drift
      randomOffsets[i * 4 + 2] = Math.random() * 0.4 + 0.6;   // Size
      randomOffsets[i * 4 + 3] = Math.random() * Math.PI * 2; // Phase
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randomOffsets, 4));

    this.dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        stormFactor: { value: 0.0 },
        baseColor: { value: new THREE.Color(0x5a4236) },  // Muted natural regolith dust (no orange glare)
        stormColor: { value: new THREE.Color(0x643d2c) }  // Muted earthy storm copper
      },
      vertexShader: `
        attribute vec4 aRandom;
        uniform float time;
        uniform float stormFactor;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          float windSpeed = 1.2 + stormFactor * 8.0;
          float t = time * windSpeed * aRandom.x;

          pos.x += mod(t + aRandom.w * 35.0, 85.0) - 42.5;
          pos.z += mod(t * 0.3 + aRandom.w * 20.0, 85.0) - 42.5;
          pos.y += sin(time * 0.6 * aRandom.y + aRandom.w) * (0.2 + stormFactor * 0.8);
          pos.y = mod(pos.y, 14.0) + 0.4;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Physically subtle point size (0.5px to 1.8px) with distance attenuation
          float dist = max(0.1, -mvPosition.z);
          float baseSize = aRandom.z * (1.1 + stormFactor * 0.6);
          gl_PointSize = clamp(baseSize / dist * 35.0, 0.5, 1.8);

          // Distance-based depth fade: particles close to camera fade out completely
          float nearFade = smoothstep(6.0, 18.0, dist);
          vAlpha = clamp(1.0 - (pos.y / 14.0), 0.05, 0.5) * nearFade;
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 stormColor;
        uniform float stormFactor;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float d = length(coord);
          if (d > 0.5) discard;

          float soft = smoothstep(0.5, 0.1, d);
          vec3 col = mix(baseColor, stormColor, stormFactor);

          // Faint, non-distracting opacity (under 0.035 normal, under 0.075 storm)
          float alpha = soft * vAlpha * (0.035 + stormFactor * 0.075);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geo, this.dustMaterial);
    this.points.name = 'MarsDustParticles';
    this.scene.add(this.points);
  }

  update(delta = 0.016, isDustStorm = false) {
    this.elapsed += delta;

    const targetStorm = isDustStorm ? 1.0 : 0.0;
    this.stormFactor += (targetStorm - this.stormFactor) * Math.min(1.0, delta * 1.5);

    if (this.dustMaterial && this.dustMaterial.uniforms) {
      this.dustMaterial.uniforms.time.value = this.elapsed;
      this.dustMaterial.uniforms.stormFactor.value = this.stormFactor;
    }
  }

  dispose() {
    if (this.points && this.scene) {
      this.scene.remove(this.points);
    }
  }
}
