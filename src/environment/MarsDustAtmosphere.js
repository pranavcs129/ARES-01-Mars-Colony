import * as THREE from 'three';

/**
 * MarsDustAtmosphere — Ultra-Lightweight, Subtle Martian Atmospheric Haze.
 * Restrained to 55 microscopic motes for depth cueing without covering terrain or structures.
 * Zero per-frame memory allocation.
 */
export class MarsDustAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 55; // Extremely lightweight, subtle
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
        baseColor: { value: new THREE.Color(0x7c5844) },  // Muted natural regolith tan
        stormColor: { value: new THREE.Color(0x8a4c32) }  // Muted copper
      },
      vertexShader: `
        attribute vec4 aRandom;
        uniform float time;
        uniform float stormFactor;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          float windSpeed = 1.4 + stormFactor * 10.0;
          float t = time * windSpeed * aRandom.x;

          pos.x += mod(t + aRandom.w * 35.0, 85.0) - 42.5;
          pos.z += mod(t * 0.3 + aRandom.w * 20.0, 85.0) - 42.5;
          pos.y += sin(time * 0.7 * aRandom.y + aRandom.w) * (0.3 + stormFactor * 1.2);
          pos.y = mod(pos.y, 14.0) + 0.4;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Microscopic point size (0.8px to 2.2px) - zero blurry blobs
          float dist = -mvPosition.z;
          float baseSize = aRandom.z * (1.4 + stormFactor * 0.8);
          gl_PointSize = clamp(baseSize / dist * 50.0, 0.8, 2.2);

          vAlpha = clamp(1.0 - (pos.y / 14.0), 0.05, 0.6);
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

          // Faint, non-distracting opacity
          float alpha = soft * vAlpha * (0.06 + stormFactor * 0.14);
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
