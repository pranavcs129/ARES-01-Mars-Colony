import * as THREE from 'three';

/**
 * MarsSky — Restrained, realistic NASA-style Martian sky dome.
 * Features:
 * - Natural, silky atmospheric gradient:
 *   Horizon: warm dusty orange / muted copper
 *   Upper sky: desaturated dark mauve / brown
 *   Zenith: very dark muted blue-black
 * - Subtle, realistic-scale sun disc (no giant dominating fireball)
 * - Sparse, faint, cool-white background stars (completely invisible in daytime)
 * - Distant, low-brightness Phobos & Deimos rocky moons
 */
export class MarsSky {
  constructor(scene) {
    this.scene = scene;
    this.skyGroup = new THREE.Group();
    this.skyGroup.name = 'MarsAtmosphereAndSky';
    this.elapsed = 0;

    this.initSkyDome();
    this.initStarfield();
    this.initCelestialMoons();
    this.initSunDisc();

    this.scene.add(this.skyGroup);
  }

  initSkyDome() {
    const skyGeo = new THREE.SphereGeometry(450, 32, 24);

    // Subtle, gentle atmospheric scattering shader without hard bands or neon saturation
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0c0e14) },      // Very dark muted blue-black
        midColor: { value: new THREE.Color(0x322228) },      // Desaturated dark mauve / brown
        horizonColor: { value: new THREE.Color(0x9e5232) },  // Warm dusty orange / muted copper
        sunColor: { value: new THREE.Color(0xfde5c8) },      // Gentle sun highlight
        sunPosition: { value: new THREE.Vector3(0.5, 0.4, 0.3).normalize() },
        dustStormIntensity: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 sunColor;
        uniform vec3 sunPosition;
        uniform float dustStormIntensity;
        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float elevation = clamp(dir.y, 0.0, 1.0);

          // Silky smooth, restrained atmospheric transitions
          vec3 sky = mix(horizonColor, midColor, pow(elevation, 0.55));
          sky = mix(sky, topColor, pow(elevation, 1.45));

          // Tight, subtle sun glow (no giant sky-covering glare)
          float cosTheta = dot(dir, normalize(sunPosition));
          if (cosTheta > 0.0) {
            float sunGlow = pow(cosTheta, 64.0) * 0.28 + pow(cosTheta, 16.0) * 0.08;
            sky += sunColor * sunGlow * clamp(sunPosition.y * 1.2, 0.0, 1.0);
          }

          // Subtle muted copper shift during dust storms
          vec3 stormSky = vec3(0.38, 0.18, 0.11);
          sky = mix(sky, stormSky, dustStormIntensity * 0.75);

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMat = skyMat;
    this.skyGroup.add(this.skyMesh);
  }

  initStarfield() {
    // Sparse, quiet background starfield (260 faint cool-white stars)
    const starCount = 260;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const radius = 430;
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.75 + 0.25); // Well above horizon

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Cool-white / pale diamond stars (NO orange glowing particles)
      colors[i * 3] = 0.88;
      colors[i * 3 + 1] = 0.92;
      colors[i * 3 + 2] = 0.98;

      sizes[i] = Math.random() * 0.8 + 0.6; // Small, pinpoint stars
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        starAlpha: { value: 0.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float time;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(time * 1.5 + position.x * 0.02 + position.z * 0.02) * 0.15 + 0.85;
          vAlpha = twinkle;
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float starAlpha;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float falloff = smoothstep(0.5, 0.1, dist);
          gl_FragColor = vec4(vColor, falloff * vAlpha * starAlpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.starMesh = new THREE.Points(starGeo, starMat);
    this.starMat = starMat;
    this.skyGroup.add(this.starMesh);
  }

  initCelestialMoons() {
    this.moonGroup = new THREE.Group();

    // 1. Phobos — small, distant, muted rocky irregular asteroid
    const phobosGeo = new THREE.DodecahedronGeometry(0.85, 2);
    const pos = phobosGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const scale = 1.0 + Math.sin(vx * 2.0) * 0.08 - Math.cos(vz * 1.5) * 0.07;
      pos.setXYZ(i, vx * scale, vy * 0.85 * scale, vz * 1.1 * scale);
    }
    phobosGeo.computeVertexNormals();

    const phobosMat = new THREE.MeshStandardMaterial({
      color: 0x645e58,
      roughness: 0.98,
      metalness: 0.02,
      emissive: 0x080706
    });

    this.phobos = new THREE.Mesh(phobosGeo, phobosMat);
    this.phobos.position.set(-150, 180, -210);
    this.moonGroup.add(this.phobos);

    // 2. Deimos — tiny faint distant pinprick
    const deimosGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const deimosMat = new THREE.MeshBasicMaterial({
      color: 0x888890
    });
    this.deimos = new THREE.Mesh(deimosGeo, deimosMat);
    this.deimos.position.set(210, 240, -180);
    this.moonGroup.add(this.deimos);

    this.skyGroup.add(this.moonGroup);
  }

  initSunDisc() {
    // Subtle sun disc with restrained, tight corona (radius ~5m at 380m distance ≈ 0.4° diameter)
    const sunGeo = new THREE.PlaneGeometry(9, 9);

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.2, 'rgba(255, 245, 225, 0.7)');
    grad.addColorStop(0.5, 'rgba(240, 190, 150, 0.25)');
    grad.addColorStop(1, 'rgba(210, 140, 90, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const sunTexture = new THREE.CanvasTexture(canvas);

    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(150, 220, 120);
    this.skyGroup.add(this.sunMesh);
  }

  update(hour = 12.0, delta = 0.016, isDustStorm = false) {
    this.elapsed += delta;

    const solProgress = (hour / 24.0) * Math.PI * 2 - Math.PI / 2;
    const sunElevation = Math.sin(solProgress);
    const sunAzimuth = Math.cos(solProgress);

    const sunDist = 380;
    const sunX = Math.cos(sunAzimuth * 0.8 + 0.6) * Math.cos(Math.max(-0.2, sunElevation)) * sunDist;
    const sunY = Math.max(-50, Math.sin(sunElevation) * sunDist);
    const sunZ = Math.sin(sunAzimuth * 0.8 + 0.6) * Math.cos(Math.max(-0.2, sunElevation)) * sunDist;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunMesh.lookAt(0, 0, 0);

    if (this.skyMat && this.skyMat.uniforms) {
      this.skyMat.uniforms.sunPosition.value.set(sunX, Math.max(0.01, sunY), sunZ).normalize();

      if (sunElevation > 0.25) {
        // High Sol: Natural warm dusty orange horizon, dark mauve upper sky, dark blue-black zenith
        this.skyMat.uniforms.horizonColor.value.set(0x9e5232);
        this.skyMat.uniforms.midColor.value.set(0x322228);
        this.skyMat.uniforms.topColor.value.set(0x0c0e14);
        this.sunMesh.visible = true;
      } else if (sunElevation > -0.05) {
        // Dawn / Sunset: Gentle warm copper horizon, desaturated mauve
        this.skyMat.uniforms.horizonColor.value.set(0xb25d32);
        this.skyMat.uniforms.midColor.value.set(0x382028);
        this.skyMat.uniforms.topColor.value.set(0x090a10);
        this.sunMesh.visible = true;
      } else {
        // Martian Night: Quiet, dark burgundy-brown horizon, muted charcoal-mauve, cosmic dark void
        this.skyMat.uniforms.horizonColor.value.set(0x1e1616);
        this.skyMat.uniforms.midColor.value.set(0x121016);
        this.skyMat.uniforms.topColor.value.set(0x050609);
        this.sunMesh.visible = false;
      }

      const targetDust = isDustStorm ? 1.0 : 0.0;
      this.skyMat.uniforms.dustStormIntensity.value +=
        (targetDust - this.skyMat.uniforms.dustStormIntensity.value) * Math.min(1.0, delta * 2.0);
    }

    // Stars: Completely invisible during daylight, faint (max 0.32) during night
    if (this.starMat && this.starMat.uniforms) {
      this.starMat.uniforms.time.value = this.elapsed;
      const targetStarAlpha = sunElevation < 0 ? Math.min(0.32, -sunElevation * 0.45) : 0.0;
      this.starMat.uniforms.starAlpha.value = targetStarAlpha;
    }

    // Slow, distant celestial transit of Phobos
    if (this.phobos) {
      const phobosAngle = this.elapsed * 0.02;
      this.phobos.position.x = Math.sin(phobosAngle) * 260;
      this.phobos.position.y = 150 + Math.cos(phobosAngle) * 35;
      this.phobos.position.z = Math.cos(phobosAngle) * 240;
    }
  }

  dispose() {
    if (this.skyGroup && this.scene) {
      this.scene.remove(this.skyGroup);
    }
  }
}
