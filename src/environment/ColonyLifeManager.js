import * as THREE from 'three';

/**
 * ColonyLifeManager — Kinetic activity, autonomous rovers, survey drones, and beacon strobes.
 * Adds dynamic life and mechanical motion to the settlement:
 * - 2 Autonomous robotic Mars rovers (rocker-bogie wheel movement, rotating sensor masts, headlights)
 * - 1 Autonomous survey quad-drone surveying solar panels and bio-dome
 * - Tower hazard beacon strobes (aviation red & amber flashers)
 * - Power conduit kinetic pulses connecting energy sectors
 */
export class ColonyLifeManager {
  constructor(scene, colonyRoot) {
    this.scene = scene;
    this.colonyRoot = colonyRoot;
    this.lifeGroup = new THREE.Group();
    this.lifeGroup.name = 'ColonyLifeAndActivity';
    this.elapsed = 0;

    this.rovers = [];
    this.beacons = [];
    this.conduits = [];

    this.initRovers();
    this.initSurveyDrone();
    this.initBeaconStrobes();
    this.initPowerConduits();

    this.scene.add(this.lifeGroup);
  }

  // ─────────────────────────────────────────────────────────
  // AUTONOMOUS MARS ROVERS
  // ─────────────────────────────────────────────────────────
  initRovers() {
    // Shared materials
    const roverChassisMat = new THREE.MeshStandardMaterial({
      color: 0xdedede,
      roughness: 0.35,
      metalness: 0.8
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x222225,
      roughness: 0.8,
      metalness: 0.2
    });
    const headlightMat = new THREE.MeshBasicMaterial({
      color: 0xfff0c0
    });
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b
    });

    const createRoverMesh = (scale = 1.0) => {
      const rover = new THREE.Group();

      // Main body chassis
      const bodyGeo = new THREE.BoxGeometry(0.7 * scale, 0.35 * scale, 1.1 * scale);
      const body = new THREE.Mesh(bodyGeo, roverChassisMat);
      body.position.y = 0.38 * scale;
      body.castShadow = true;
      body.receiveShadow = true;
      rover.add(body);

      // Gold foil insulation / scientific instrument top deck
      const foilGeo = new THREE.BoxGeometry(0.55 * scale, 0.1 * scale, 0.65 * scale);
      const foilMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.3,
        metalness: 0.85
      });
      const foil = new THREE.Mesh(foilGeo, foilMat);
      foil.position.set(0, 0.6 * scale, -0.1 * scale);
      rover.add(foil);

      // Sensor Mast with Mastcam head
      const mastGeo = new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.55 * scale, 8);
      const mast = new THREE.Mesh(mastGeo, roverChassisMat);
      mast.position.set(0.18 * scale, 0.72 * scale, 0.28 * scale);
      rover.add(mast);

      const camHeadGeo = new THREE.BoxGeometry(0.16 * scale, 0.1 * scale, 0.14 * scale);
      const camHead = new THREE.Mesh(camHeadGeo, roverChassisMat);
      camHead.position.set(0.18 * scale, 1.0 * scale, 0.28 * scale);
      rover.add(camHead);
      rover.camHead = camHead;

      // Dual front headlights
      const hlGeo = new THREE.SphereGeometry(0.05 * scale, 8, 8);
      const hlL = new THREE.Mesh(hlGeo, headlightMat);
      hlL.position.set(-0.25 * scale, 0.38 * scale, 0.58 * scale);
      const hlR = new THREE.Mesh(hlGeo, headlightMat);
      hlR.position.set(0.25 * scale, 0.38 * scale, 0.58 * scale);
      rover.add(hlL);
      rover.add(hlR);

      // Amber flasher beacon on top of mast
      const flasherGeo = new THREE.SphereGeometry(0.04 * scale, 6, 6);
      const flasher = new THREE.Mesh(flasherGeo, beaconMat);
      flasher.position.set(0.18 * scale, 1.08 * scale, 0.28 * scale);
      rover.add(flasher);
      rover.flasher = flasher;

      // 6 Wheels (3 per side)
      rover.wheels = [];
      const wheelGeo = new THREE.CylinderGeometry(0.16 * scale, 0.16 * scale, 0.12 * scale, 12);
      wheelGeo.rotateZ(Math.PI / 2);

      const xOffsets = [-0.48 * scale, 0.48 * scale];
      const zOffsets = [-0.42 * scale, 0, 0.42 * scale];

      xOffsets.forEach(x => {
        zOffsets.forEach(z => {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.position.set(x, 0.16 * scale, z);
          wheel.castShadow = true;
          rover.add(wheel);
          rover.wheels.push(wheel);
        });
      });

      return rover;
    };

    // Rover 1: Heavy Hauler (between Mining Excavator and Storage Depot)
    const rover1 = createRoverMesh(0.9);
    rover1.waypoints = [
      new THREE.Vector3(-6.5, 0.05, 5.0),
      new THREE.Vector3(-4.0, 0.05, 2.5),
      new THREE.Vector3(0.5, 0.05, 1.2),
      new THREE.Vector3(4.8, 0.05, 1.5),
      new THREE.Vector3(4.5, 0.05, 4.2),
      new THREE.Vector3(1.0, 0.05, 3.8),
      new THREE.Vector3(-3.5, 0.05, 4.8)
    ];
    rover1.currentWpIndex = 0;
    rover1.speed = 1.35;
    rover1.position.copy(rover1.waypoints[0]);
    this.rovers.push(rover1);
    this.lifeGroup.add(rover1);

    // Rover 2: Exploration Scout (perimeter loop around Solar Array and Habitat)
    const rover2 = createRoverMesh(0.75);
    rover2.waypoints = [
      new THREE.Vector3(7.5, 0.05, -3.0),
      new THREE.Vector3(5.0, 0.05, -6.5),
      new THREE.Vector3(0.0, 0.05, -7.5),
      new THREE.Vector3(-5.5, 0.05, -5.0),
      new THREE.Vector3(-4.0, 0.05, -1.5),
      new THREE.Vector3(2.5, 0.05, -2.5)
    ];
    rover2.currentWpIndex = 0;
    rover2.speed = 1.6;
    rover2.position.copy(rover2.waypoints[0]);
    this.rovers.push(rover2);
    this.lifeGroup.add(rover2);
  }

  // ─────────────────────────────────────────────────────────
  // SURVEY QUAD-DRONE
  // ─────────────────────────────────────────────────────────
  initSurveyDrone() {
    this.drone = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.35, 0.12, 0.35);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.drone.add(body);

    // Camera gimbal
    const camGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const camMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cam = new THREE.Mesh(camGeo, camMat);
    cam.position.set(0, -0.08, 0.12);
    this.drone.add(cam);

    // 4 Rotors
    this.rotors = [];
    const rotorGeo = new THREE.BoxGeometry(0.4, 0.01, 0.04);
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });

    const armOffsets = [
      [-0.24, 0.06, -0.24],
      [0.24, 0.06, -0.24],
      [-0.24, 0.06, 0.24],
      [0.24, 0.06, 0.24]
    ];

    armOffsets.forEach(([x, y, z]) => {
      const rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(x, y, z);
      this.drone.add(rotor);
      this.rotors.push(rotor);
    });

    // Drone navigation light
    const navLightGeo = new THREE.SphereGeometry(0.04, 6, 6);
    this.droneNavLightMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const navLight = new THREE.Mesh(navLightGeo, this.droneNavLightMat);
    navLight.position.set(0, 0.08, 0);
    this.drone.add(navLight);

    this.drone.position.set(0, 4.2, 0);
    this.droneBaseY = 4.2;
    this.lifeGroup.add(this.drone);
  }

  // ─────────────────────────────────────────────────────────
  // SYNCHRONIZED BEACON STROBES
  // ─────────────────────────────────────────────────────────
  initBeaconStrobes() {
    const beaconPositions = [
      { pos: new THREE.Vector3(0.0, 5.2, 0.2), color: 0xff3b30 },   // Central Hub Comm Tower
      { pos: new THREE.Vector3(-8.8, 6.4, -4.5), color: 0xffcc00 }, // Launch Pad Gantry
      { pos: new THREE.Vector3(6.2, 3.8, 4.2), color: 0xff3b30 },   // Science Lab Antenna
      { pos: new THREE.Vector3(-6.2, 4.1, 5.8), color: 0xff9500 }   // Mining Rig Mast
    ];

    const geo = new THREE.SphereGeometry(0.12, 8, 8);

    beaconPositions.forEach(b => {
      const mat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(b.pos);
      this.beacons.push({ mesh, mat, baseColor: b.color });
      this.lifeGroup.add(mesh);
    });
  }

  // ─────────────────────────────────────────────────────────
  // ENERGY CONDUIT PULSES
  // ─────────────────────────────────────────────────────────
  initPowerConduits() {
    // Curved glowing lines linking Power Station -> Hub -> Habitat
    const pointsA = [
      new THREE.Vector3(-4.8, 0.15, -4.2),
      new THREE.Vector3(-2.5, 0.18, -2.1),
      new THREE.Vector3(-0.2, 0.2, 0.0)
    ];
    const curveA = new THREE.CatmullRomCurve3(pointsA);

    const pointsB = [
      new THREE.Vector3(5.2, 0.15, -3.8),
      new THREE.Vector3(2.5, 0.18, -1.8),
      new THREE.Vector3(-0.2, 0.2, 0.0)
    ];
    const curveB = new THREE.CatmullRomCurve3(pointsB);

    [curveA, curveB].forEach(curve => {
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.04, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      this.conduits.push(tube);
      this.lifeGroup.add(tube);
    });
  }

  /**
   * Updates all kinetic colony life (rovers, drone, beacons, conduits)
   */
  update(delta = 0.016, isNight = false, isDustStorm = false) {
    this.elapsed += delta;
    const t = this.elapsed;

    // 1. Update Rovers along Waypoints
    this.rovers.forEach(rover => {
      const targetWp = rover.waypoints[rover.currentWpIndex];
      const dir = new THREE.Vector3().subVectors(targetWp, rover.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist < 0.25) {
        // Advance to next waypoint
        rover.currentWpIndex = (rover.currentWpIndex + 1) % rover.waypoints.length;
      } else {
        dir.normalize();
        rover.position.addScaledVector(dir, rover.speed * delta);

        // Smooth yaw rotation toward direction of travel
        const targetAngle = Math.atan2(dir.x, dir.z);
        rover.rotation.y += (targetAngle - rover.rotation.y) * Math.min(1.0, delta * 5.0);

        // Rotate wheels
        if (rover.wheels) {
          rover.wheels.forEach(w => {
            w.rotation.x += rover.speed * delta * 5.0;
          });
        }
      }

      // Rotate camera mast back and forth (scientific scanning)
      if (rover.camHead) {
        rover.camHead.rotation.y = Math.sin(t * 1.5) * 0.45;
      }

      // Flasher beacon pulse
      if (rover.flasher) {
        const flash = (Math.sin(t * 8.0) > 0.4) ? 1.0 : 0.2;
        rover.flasher.scale.setScalar(flash > 0.5 ? 1.4 : 1.0);
      }
    });

    // 2. Update Survey Quad-Drone
    if (this.drone) {
      // Gentle patrol orbit around central settlement
      const orbitSpeed = 0.25;
      const radius = 6.2;
      this.drone.position.x = Math.sin(t * orbitSpeed) * radius;
      this.drone.position.z = Math.cos(t * orbitSpeed) * radius + 0.5;
      // Realistic hovering altitude oscillation
      this.drone.position.y = this.droneBaseY + Math.sin(t * 2.2) * 0.35;

      // Drone bank angle in direction of flight
      this.drone.rotation.y = t * orbitSpeed + Math.PI / 2;
      this.drone.rotation.z = Math.sin(t * 2.0) * 0.08;

      // Spin rotors at high RPM
      if (this.rotors) {
        this.rotors.forEach((r, idx) => {
          r.rotation.y += (idx % 2 === 0 ? 1 : -1) * delta * 45.0;
        });
      }

      // Drone beacon flash
      if (this.droneNavLightMat) {
        this.droneNavLightMat.color.setHex((Math.sin(t * 6.0) > 0.3) ? 0x10b981 : 0x054d2e);
      }
    }

    // 3. Update Synchronized Beacon Strobes
    const beaconPulse = Math.sin(t * 4.5);
    const isBeaconOn = beaconPulse > 0.65;
    this.beacons.forEach(b => {
      b.mat.opacity = isBeaconOn ? 1.0 : 0.15;
      b.mesh.scale.setScalar(isBeaconOn ? 1.6 : 1.0);
    });

    // 4. Update Conduit Energy Flow
    this.conduits.forEach((tube, idx) => {
      const pulse = 0.35 + 0.4 * Math.sin(t * 3.0 + idx * 1.5);
      tube.material.opacity = pulse;
    });
  }
}
