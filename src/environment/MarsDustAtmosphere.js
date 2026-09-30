import * as THREE from 'three';

/**
 * MarsDustAtmosphere — Restrained, subtle atmospheric dust haze.
 * Avoids large blurry blobs, brush strokes, or translucent circles.
 * Uses fine, sparse micro-motes to give natural depth while keeping the colony
 * and terrain completely clear and visible.
 */
export class MarsDustAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 85; // Sparse, restrained count
    this.elapsed = 0;
    this.stormFactor = 0.0;

    this.initParticles();
  }

  initParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const randomOffsets = new Float32Array(this.particleCount * 4);

    // Distributed around the colony perimeter and low atmosphere
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = Math.random() * 14 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;

      randomOffsets[i * 4] = Math.random() * 0.35 + 0.65;  // Speed multiplier
      randomOffsets[i * 4 + 1] = Math.random() * 0.15 + 0.05; // Vertical drift
      randomOffsets[i * 4 + 2] = Math.random() * 0.4 + 0.6;   // Relative size
      randomOffsets[i * 4 + 3] = Math.random() * Math.PI * 2; // Phase
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randomOffsets, 4));

    // Shader for subtle, microscopic silicate dust specks
    this.dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        stormFactor: { value: 0.0 },
        baseColor: { value: new THREE.Color(0x8a6550) },  // Muted natural regolith tan
        stormColor: { value: new THREE.Color(0x9c5538) }  // Muted copper-brown
      },
      vertexShader: `
        attribute vec4 aRandom;
        uniform float time;
        uniform float stormFactor;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // Gentle laminar wind drift
          float windSpeed = 1.8 + stormFactor * 12.0;
          float t = time * windSpeed * aRandom.x;

          pos.x += mod(t + aRandom.w * 40.0, 90.0) - 45.0;
          pos.z += mod(t * 0.35 + aRandom.w * 25.0, 90.0) - 45.0;
          pos.y += sin(time * 0.8 * aRandom.y + aRandom.w) * (0.4 + stormFactor * 1.5);
          pos.y = mod(pos.y, 16.0) + 0.3;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Tiny sharp micro-mote size (strictly 1.0px to 2.8px) - NO large blobs
          float dist = -mvPosition.z;
          float baseSize = aRandom.z * (1.8 + stormFactor * 1.2);
          gl_PointSize = clamp(baseSize / dist * 60.0, 1.0, 2.8);

          // Subtle falloff near ground and top
          vAlpha = clamp(1.0 - (pos.y / 16.0), 0.1, 0.7);
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

          // Soft pinprick falloff
          float soft = smoothstep(0.5, 0.1, d);
          vec3 col = mix(baseColor, stormColor, stormFactor);

          // Restrained low opacity - never obscures terrain
          float alpha = soft * vAlpha * (0.09 + stormFactor * 0.18);
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
