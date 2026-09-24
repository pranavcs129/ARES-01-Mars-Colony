import * as THREE from 'three';

/**
 * MarsSky — Cinematic Martian Skydome, Atmospheric Scattering, Celestial Bodies & Dynamic Sun.
 * Creates an authentic Martian celestial sphere:
 * - Gradient atmospheric dome (rich copper/cinnabar horizon fading into twilight mauve and deep cosmic void)
 * - Distant procedural starfield with thousands of twinkling stars
 * - Martian Moons: Phobos (larger, irregular) and Deimos (smaller, distant)
 * - Dynamic Sun disc with warm corona halo, physically tracking the Sol time-of-day
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
    // Large hemisphere dome centered at colony origin
    const skyGeo = new THREE.SphereGeometry(450, 32, 24);

    // Custom gradient vertex/fragment shader for Mars atmospheric scattering
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x060205) },       // Deep space vacuum
        midColor: { value: new THREE.Color(0x280e12) },       // High Martian atmosphere
        horizonColor: { value: new THREE.Color(0xaf4320) },   // Warm Martian dust horizon
        sunColor: { value: new THREE.Color(0xffcca0) },       // Sun glow
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

          // Mars Atmospheric Gradient
          vec3 sky = mix(horizonColor, midColor, pow(elevation, 0.45));
          sky = mix(sky, topColor, pow(elevation, 1.6));

          // Forward Mie scattering sun glow in dusty atmosphere
          float cosTheta = dot(dir, normalize(sunPosition));
          if (cosTheta > 0.0) {
            float sunGlow = pow(cosTheta, 32.0) * 0.75 + pow(cosTheta, 6.0) * 0.35;
            sky += sunColor * sunGlow * clamp(sunPosition.y * 1.5 + 0.1, 0.0, 1.0);
          }

          // In heavy dust storm, atmosphere turns thick opaque copper-red
          vec3 stormSky = vec3(0.48, 0.16, 0.08);
          sky = mix(sky, stormSky, dustStormIntensity * 0.85);

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
    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const radius = 430;
    for (let i = 0; i < starCount; i++) {
      // Distribute stars on upper hemisphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15); // Above horizon

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Realistic subtle stellar spectral classes (warm white, pale blue, golden)
      const starType = Math.random();
      if (starType > 0.85) {
        colors[i * 3] = 0.75; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0; // Blue-white
      } else if (starType > 0.6) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.88; colors[i * 3 + 2] = 0.65; // Yellow-gold
      } else {
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.98; // White
      }

      sizes[i] = Math.random() * 1.8 + 0.8;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        starAlpha: { value: 1.0 }
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
          // Subtle twinkle
          float twinkle = sin(time * 2.0 + position.x * 0.05 + position.z * 0.05) * 0.3 + 0.7;
          vAlpha = twinkle;
          gl_PointSize = size * (240.0 / -mvPosition.z) * twinkle;
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
          float falloff = smoothstep(0.5, 0.0, dist);
          gl_FragColor = vec4(vColor, falloff * vAlpha * starAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starMesh = new THREE.Points(starGeo, starMat);
    this.starMat = starMat;
    this.skyGroup.add(this.starMesh);
  }

  initCelestialMoons() {
    this.moonGroup = new THREE.Group();

    // 1. Phobos — larger, closer, moves rapidly across the Martian sky
    const phobosGeo = new THREE.DodecahedronGeometry(3.6, 2);
    // Add subtle irregularity to simulate asteroid potato shape
    const pos = phobosGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const scale = 1.0 + Math.sin(vx * 1.5) * 0.12 - Math.cos(vz * 1.2) * 0.1;
      pos.setXYZ(i, vx * scale, vy * 0.88 * scale, vz * 1.15 * scale);
    }
    phobosGeo.computeVertexNormals();

    const phobosMat = new THREE.MeshStandardMaterial({
      color: 0x8a7f78,
      roughness: 0.95,
      metalness: 0.05,
      emissive: 0x14100e
    });

    this.phobos = new THREE.Mesh(phobosGeo, phobosMat);
    this.phobos.position.set(-160, 180, -220);
    this.moonGroup.add(this.phobos);

    // 2. Deimos — smaller, bright planetary point in the sky
    const deimosGeo = new THREE.SphereGeometry(1.4, 12, 12);
    const deimosMat = new THREE.MeshBasicMaterial({
      color: 0xd2c6bd
    });
    this.deimos = new THREE.Mesh(deimosGeo, deimosMat);
    this.deimos.position.set(220, 240, -180);
    this.moonGroup.add(this.deimos);

    this.skyGroup.add(this.moonGroup);
  }

  initSunDisc() {
    // Sun disc billboard with glowing corona
    const sunGeo = new THREE.PlaneGeometry(36, 36);

    // Generate high-resolution smooth radial gradient corona texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.12, 'rgba(255, 235, 200, 0.9)');
    grad.addColorStop(0.35, 'rgba(255, 180, 120, 0.45)');
    grad.addColorStop(0.7, 'rgba(230, 110, 50, 0.12)');
    grad.addColorStop(1, 'rgba(200, 80, 30, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

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

  /**
   * Updates sky dome, celestial bodies, and sun position based on simulation Sol hour
   * @param {number} hour Sol hour (0.0 to 24.0)
   * @param {number} delta Delta seconds
   * @param {boolean} isDustStorm Whether dust storm is active
   */
  update(hour = 12.0, delta = 0.016, isDustStorm = false) {
    this.elapsed += delta;

    // Martian solar angle: 0h = midnight, 6h = dawn, 12h = midday, 18h = dusk
    const solProgress = (hour / 24.0) * Math.PI * 2 - Math.PI / 2;
    const sunElevation = Math.sin(solProgress);
    const sunAzimuth = Math.cos(solProgress);

    const sunDist = 380;
    const sunX = Math.cos(sunAzimuth * 0.8 + 0.6) * Math.cos(Math.max(-0.2, sunElevation)) * sunDist;
    const sunY = Math.max(-50, Math.sin(sunElevation) * sunDist);
    const sunZ = Math.sin(sunAzimuth * 0.8 + 0.6) * Math.cos(Math.max(-0.2, sunElevation)) * sunDist;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunMesh.lookAt(0, 0, 0);

    // Update shader uniforms
    if (this.skyMat && this.skyMat.uniforms) {
      this.skyMat.uniforms.sunPosition.value.set(sunX, Math.max(0.01, sunY), sunZ).normalize();

      // Atmospheric color shifts based on sun elevation
      if (sunElevation > 0.25) {
        // High Sol: Crisp copper horizon, dark mauve zenith
        this.skyMat.uniforms.horizonColor.value.set(0xba4e26);
        this.skyMat.uniforms.midColor.value.set(0x35161c);
        this.skyMat.uniforms.topColor.value.set(0x060205);
        this.sunMesh.scale.setScalar(1.0);
        this.sunMesh.visible = true;
      } else if (sunElevation > -0.05) {
        // Golden Dawn / Dusk: Rich amber-gold glow, violet twilight
        this.skyMat.uniforms.horizonColor.value.set(0xdf6420);
        this.skyMat.uniforms.midColor.value.set(0x421528);
        this.skyMat.uniforms.topColor.value.set(0x0a040e);
        this.sunMesh.scale.setScalar(1.2);
        this.sunMesh.visible = true;
      } else {
        // Martian Night: Deep indigo-black celestial sky
        this.skyMat.uniforms.horizonColor.value.set(0x180a0e);
        this.skyMat.uniforms.midColor.value.set(0x0d050a);
        this.skyMat.uniforms.topColor.value.set(0x030104);
        this.sunMesh.visible = false;
      }

      // Smooth transition for dust storm intensity
      const targetDust = isDustStorm ? 1.0 : 0.0;
      this.skyMat.uniforms.dustStormIntensity.value +=
        (targetDust - this.skyMat.uniforms.dustStormIntensity.value) * Math.min(1.0, delta * 2.0);
    }

    // Star opacity: Visible at twilight/night, dimmed during bright midday
    if (this.starMat && this.starMat.uniforms) {
      this.starMat.uniforms.time.value = this.elapsed;
      const targetStarAlpha = Math.max(0.12, 1.0 - Math.max(0, sunElevation) * 1.3);
      this.starMat.uniforms.starAlpha.value = targetStarAlpha;
    }

    // Orbit Phobos across the sky
    if (this.phobos) {
      const phobosAngle = this.elapsed * 0.04;
      this.phobos.position.x = Math.sin(phobosAngle) * 260;
      this.phobos.position.y = 140 + Math.cos(phobosAngle) * 45;
      this.phobos.position.z = Math.cos(phobosAngle) * 240;
      this.phobos.rotation.y += delta * 0.08;
    }
  }
}
