import * as THREE from 'three';

export class MarsTerrain {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'MarsEnvironment';

    this.createGround();
    this.createCraters();
    this.createScatterRocks();

    this.scene.add(this.group);
  }

  createGround() {
    // Large circular low-poly terrain bed
    const radius = 80;
    const segments = 48;
    const groundGeo = new THREE.CylinderGeometry(radius, radius * 1.05, 4, segments, 16);

    // Displace vertices on outer radius to create natural dunes/bedrock,
    // leaving central colony area (radius < 14) perfectly flat at Y = 0
    const pos = groundGeo.attributes.position;
    const colors = [];

    const baseColor = new THREE.Color(0xb55130);
    const dustColor = new THREE.Color(0xc9643d);
    const darkRockColor = new THREE.Color(0x8a361c);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const dist = Math.hypot(x, z);

      if (y > 0) { // Top surface
        if (dist > 14) {
          const factor = Math.min(1.0, (dist - 14) / 40);
          // Subtle low-poly undulation
          const noise = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 1.2
                      + Math.sin(x * 0.05 + z * 0.07) * 1.8;
          pos.setY(i, y + noise * factor);

          // Blend colors naturally
          const c = baseColor.clone();
          if (noise > 0.5) {
            c.lerp(dustColor, factor * 0.7);
          } else {
            c.lerp(darkRockColor, factor * 0.6);
          }
          colors.push(c.r, c.g, c.b);
        } else {
          // Flatten colony foundation area
          pos.setY(i, y);
          colors.push(baseColor.r, baseColor.g, baseColor.b);
        }
      } else {
        // Base rim
        colors.push(darkRockColor.r, darkRockColor.g, darkRockColor.b);
      }
    }

    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.08,
      flatShading: true
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -2; // Surface rests at Y = 0
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  createCraters() {
    // Subtle crater depressions around base perimeter
    const craterConfigs = [
      { x: -24, z: 18, radius: 6.5, depth: 1.2 },
      { x: 26, z: -16, radius: 5.0, depth: 0.9 },
      { x: 19, z: 22, radius: 4.2, depth: 0.8 },
      { x: -22, z: -20, radius: 5.8, depth: 1.1 }
    ];

    craterConfigs.forEach(cfg => {
      const ringGeo = new THREE.TorusGeometry(cfg.radius, cfg.radius * 0.28, 8, 20);
      ringGeo.rotateX(Math.PI / 2);

      // Flatten bottom of torus to make raised rim
      const pos = ringGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < 0) {
          pos.setY(i, y * 0.2);
        }
      }
      ringGeo.computeVertexNormals();

      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xc45e38,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true
      });

      const rim = new THREE.Mesh(ringGeo, rimMat);
      rim.position.set(cfg.x, 0.1, cfg.z);
      rim.receiveShadow = true;
      rim.castShadow = true;
      this.group.add(rim);

      // Crater inner bowl floor (darker)
      const bowlGeo = new THREE.CircleGeometry(cfg.radius * 0.9, 16);
      bowlGeo.rotateX(-Math.PI / 2);
      const bowlMat = new THREE.MeshStandardMaterial({
        color: 0x7a2c16,
        roughness: 0.98,
        metalness: 0.02,
        flatShading: true
      });
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      bowl.position.set(cfg.x, 0.02, cfg.z);
      bowl.receiveShadow = true;
      this.group.add(bowl);
    });
  }

  createScatterRocks() {
    const rockGeo = new THREE.DodecahedronGeometry(1, 0); // Low-poly faceted rock
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x9e4325,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });

    const darkRockMat = new THREE.MeshStandardMaterial({
      color: 0x6e2815,
      roughness: 0.9,
      metalness: 0.15,
      flatShading: true
    });

    // Rock clusters scattered naturally outside the central base foundation (dist > 13)
    const rockPositions = [
      // Cluster 1 (West/North-West)
      { x: -16, z: 12, s: 1.4 },
      { x: -17.5, z: 14, s: 0.8 },
      { x: -15, z: 15, s: 0.6 },
      { x: -19, z: 8, s: 1.1 },

      // Cluster 2 (East/North-East)
      { x: 18, z: 10, s: 1.6 },
      { x: 20, z: 8, s: 0.9 },
      { x: 16.5, z: 13, s: 0.7 },
      { x: 22, z: 14, s: 1.2 },

      // Cluster 3 (South-West)
      { x: -15, z: -14, s: 1.3 },
      { x: -17, z: -12, s: 0.9 },
      { x: -13.5, z: -16, s: 0.5 },

      // Cluster 4 (South-East near mining)
      { x: 17, z: -12, s: 1.5 },
      { x: 19, z: -15, s: 1.0 },
      { x: 15, z: -18, s: 0.8 },
      { x: 23, z: -8, s: 1.2 },

      // Cluster 5 (Far outskirts)
      { x: -28, z: 2, s: 2.2 },
      { x: 27, z: 3, s: 2.0 },
      { x: 3, z: -25, s: 1.8 },
      { x: -4, z: 27, s: 1.7 }
    ];

    rockPositions.forEach((r, idx) => {
      const mat = (idx % 3 === 0) ? darkRockMat : rockMat;
      const rock = new THREE.Mesh(rockGeo, mat);

      rock.position.set(r.x, r.s * 0.45, r.z);
      rock.scale.set(
        r.s * (0.8 + (idx % 4) * 0.1),
        r.s * (0.6 + (idx % 3) * 0.15),
        r.s * (0.9 + (idx % 5) * 0.1)
      );

      rock.rotation.set(
        (idx * 1.1) % Math.PI,
        (idx * 2.3) % Math.PI,
        (idx * 0.7) % Math.PI
      );

      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    });
  }
}
