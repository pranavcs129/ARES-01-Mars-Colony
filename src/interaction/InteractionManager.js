import * as THREE from 'three';
import { COLONY_STRUCTURES } from './ColonyData.js';

export class InteractionManager {
  constructor(scene, cameraController, domElement, colonyRoot, callbacks = {}) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.domElement = domElement;
    this.colonyRoot = colonyRoot;

    this.onSelect = callbacks.onSelect || (() => {});
    this.onDeselect = callbacks.onDeselect || (() => {});
    this.onHover = callbacks.onHover || (() => {});
    this.onHoverOut = callbacks.onHoverOut || (() => {});

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Interaction state
    this.hoveredStructure = null;
    this.selectedStructure = null;

    // Cache flat list of selectable meshes (zero scene traversal per frame)
    this.structuresMap = new Map();
    this.selectableMeshes = [];

    // Pointer tracking for click vs drag detection
    this.pointerDownPos = { x: 0, y: 0 };
    this.pointerDownTime = 0;

    // Throttle pointermove
    this.lastPointerMoveTime = 0;

    this.init();
  }

  init() {
    this.buildSelectableCache();
    this.createHighlightVisuals();
    this.setupEventListeners();
  }

  /**
   * Builds cached flat list of selectable meshes once during initialization.
   * Traverses the GLB hierarchy once, extracts bounding box & world centers,
   * and attaches metadata directly to child meshes for O(1) identification.
   */
  buildSelectableCache() {
    this.selectableMeshes = [];
    this.structuresMap.clear();

    const children = this.colonyRoot.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const nodeName = child.name;

      if (!COLONY_STRUCTURES[nodeName]) continue;

      // Extract metadata from registry
      const meta = COLONY_STRUCTURES[nodeName];

      // Calculate structure world bounds
      child.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(child);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const radius = Math.max(1.8, Math.hypot(size.x, size.z) * 0.52);

      const structureData = {
        ...meta,
        node: child,
        worldCenter: center,
        box,
        size,
        radius
      };

      this.structuresMap.set(nodeName, structureData);

      // Collect all child meshes for fast raycasting
      child.traverse((descendant) => {
        if (descendant.isMesh) {
          descendant.userData.structure = structureData;
          descendant.userData.structureId = nodeName;
          this.selectableMeshes.push(descendant);
        }
      });
    }

    console.log(
      `%c🎯 InteractionManager initialized: ${this.structuresMap.size} structures, ${this.selectableMeshes.length} selectable meshes cached.`,
      'color: #38bdf8; font-weight: bold;'
    );
  }

  /**
   * Lightweight visual highlight system:
   * 1. Holographic Sci-Fi Ground Reticle: A dual-ring bracket projected at ground level.
   * 2. Selective Accent PointLight: Positioned directly above the structure for warm Mars illumination.
   * Zero expensive post-processing, zero material shader recompilation.
   */
  createHighlightVisuals() {
    this.highlightGroup = new THREE.Group();
    this.highlightGroup.name = 'InteractionHighlightGroup';
    this.highlightGroup.visible = false;

    // Outer telemetry ring
    const outerRingGeo = new THREE.RingGeometry(1.6, 1.78, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    this.outerRing.rotation.x = -Math.PI / 2;
    this.highlightGroup.add(this.outerRing);

    // Inner dashed accent ring
    const innerRingGeo = new THREE.RingGeometry(1.3, 1.38, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.innerRing = new THREE.Mesh(innerRingGeo, innerMat);
    this.innerRing.rotation.x = -Math.PI / 2;
    this.highlightGroup.add(this.innerRing);

    // 4 Corner Telemetry Brackets (Bracket Lines)
    const bracketMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    });

    this.bracketGroup = new THREE.Group();
    const cornerOffsets = [
      [-1, -1], [1, -1], [1, 1], [-1, 1]
    ];

    cornerOffsets.forEach(([cx, cz]) => {
      const pts = [
        new THREE.Vector3(cx * 1.5, 0.02, (cz * 1.5) - (cz * 0.4)),
        new THREE.Vector3(cx * 1.5, 0.02, cz * 1.5),
        new THREE.Vector3((cx * 1.5) - (cx * 0.4), 0.02, cz * 1.5)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, bracketMat);
      this.bracketGroup.add(line);
    });
    this.highlightGroup.add(this.bracketGroup);

    this.scene.add(this.highlightGroup);

    // Single dedicated highlight PointLight (attached ONLY when active to save fragment shader overhead)
    this.highlightLight = new THREE.PointLight(0xf59e0b, 0, 7.5, 1.4);
    this.highlightLight.castShadow = false; // Zero shadow overhead
    // Do NOT add to scene on init — attached conditionally in updateHighlightTransform
  }

  setupEventListeners() {
    this.boundOnPointerMove = this.handlePointerMove.bind(this);
    this.boundOnPointerDown = this.handlePointerDown.bind(this);
    this.boundOnPointerUp = this.handlePointerUp.bind(this);
    this.boundOnKeyDown = this.handleKeyDown.bind(this);

    // Cache DOM Rect to eliminate layout reflows on pointer moves
    this.domRect = this.domElement.getBoundingClientRect();
    this.boundUpdateDomRect = () => {
      this.domRect = this.domElement.getBoundingClientRect();
    };
    window.addEventListener('resize', this.boundUpdateDomRect);
    window.addEventListener('scroll', this.boundUpdateDomRect, { passive: true });

    window.addEventListener('pointermove', this.boundOnPointerMove, { passive: true });
    this.domElement.addEventListener('pointerdown', this.boundOnPointerDown, { passive: true });
    this.domElement.addEventListener('pointerup', this.boundOnPointerUp, { passive: true });
    window.addEventListener('keydown', this.boundOnKeyDown);
  }

  /**
   * Coarse-to-fine raycasting: tests 12 structure bounding spheres first
   * before testing detailed geometry primitives.
   */
  findHitStructure() {
    this.raycaster.setFromCamera(this.mouse, this.cameraController.camera);
    const ray = this.raycaster.ray;

    // Phase 1: Fast bounding sphere check on the 12 colony buildings
    let candidateMeshes = [];
    for (const [id, struct] of this.structuresMap.entries()) {
      if (!struct.boundingSphere) {
        struct.boundingSphere = new THREE.Sphere(struct.worldCenter, struct.radius);
      }
      if (ray.intersectsSphere(struct.boundingSphere)) {
        if (struct.node) {
          struct.node.traverse((child) => {
            if (child.isMesh) candidateMeshes.push(child);
          });
        }
      }
    }

    if (candidateMeshes.length === 0) return null;

    // Phase 2: Raycast only candidate structure meshes
    const intersects = this.raycaster.intersectObjects(candidateMeshes, false);
    if (intersects.length > 0) {
      return intersects[0].object.userData.structure || null;
    }
    return null;
  }

  handlePointerMove(e) {
    const now = performance.now();
    // Throttle to ~40-60 FPS for pointer raycasting
    if (now - this.lastPointerMoveTime < 18) return;
    this.lastPointerMoveTime = now;

    const rect = this.domRect || this.domElement.getBoundingClientRect();
    if (
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom
    ) {
      this.clearHover();
      return;
    }

    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const hitStructure = this.findHitStructure();

    if (hitStructure) {
      if (this.hoveredStructure !== hitStructure) {
        this.setHover(hitStructure, e.clientX, e.clientY);
      } else {
        this.onHover(hitStructure, e.clientX, e.clientY);
      }
      return;
    }

    this.clearHover();
  }

  setHover(structure, clientX, clientY) {
    this.hoveredStructure = structure;
    this.domElement.style.cursor = 'pointer';

    // If no structure is selected, show hover reticle and light
    if (!this.selectedStructure) {
      this.updateHighlightTransform(structure, 0.45, 1.2, 0xf59e0b);
    }

    this.onHover(structure, clientX, clientY);
  }

  clearHover() {
    if (!this.hoveredStructure) return;
    this.hoveredStructure = null;
    this.domElement.style.cursor = 'default';

    // If a structure is currently selected, keep highlight on it
    if (this.selectedStructure) {
      this.updateHighlightTransform(this.selectedStructure, 0.95, 2.4, 0xfbbf24);
    } else {
      this.hideHighlight();
    }

    this.onHoverOut();
  }

  handlePointerDown(e) {
    this.pointerDownPos.x = e.clientX;
    this.pointerDownPos.y = e.clientY;
    this.pointerDownTime = performance.now();
  }

  handlePointerUp(e) {
    // Left click only, ignore drags (mouse moved > 6px or held long with RMB)
    if (e.button !== 0) return;

    const deltaX = Math.abs(e.clientX - this.pointerDownPos.x);
    const deltaY = Math.abs(e.clientY - this.pointerDownPos.y);
    if (deltaX > 6 || deltaY > 6) {
      return; // Was camera drag pan
    }

    const rect = this.domRect || this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const hitStructure = this.findHitStructure();
    if (hitStructure) {
      this.selectStructure(hitStructure);
      return;
    }

    // Clicked empty terrain / background -> Deselect
    this.deselect();
  }

  handleKeyDown(e) {
    if (e.code === 'Escape') {
      if (this.selectedStructure) {
        this.deselect();
      }
    }
  }

  selectStructure(structure) {
    this.selectedStructure = structure;

    // Visual highlight in selected state
    this.updateHighlightTransform(structure, 0.95, 2.5, 0xfbbf24);

    // Smoothly focus camera toward structure without breaking controls
    this.cameraController.focusTarget(structure.worldCenter, 13.5);

    // Notify UI
    this.onSelect(structure);
  }

  deselect() {
    if (!this.selectedStructure && !this.hoveredStructure) return;

    this.selectedStructure = null;
    this.hideHighlight();

    // Notify UI
    this.onDeselect();
  }

  updateHighlightTransform(structure, ringOpacity, lightIntensity, lightColor) {
    const { worldCenter, radius } = structure;
    const groundY = Math.max(0.32, structure.box.min.y + 0.05);

    this.highlightGroup.visible = true;
    this.highlightGroup.position.set(worldCenter.x, groundY, worldCenter.z);

    // Scale reticle to fit structure radius
    const scaleFactor = radius / 1.7;
    this.highlightGroup.scale.set(scaleFactor, 1, scaleFactor);

    // Update opacity
    this.outerRing.material.opacity = ringOpacity;
    this.innerRing.material.opacity = ringOpacity * 0.75;

    // Conditionally attach point light only when structure is illuminated
    if (!this.highlightLight.parent) {
      this.scene.add(this.highlightLight);
    }
    this.highlightLight.position.set(worldCenter.x, worldCenter.y + 2.0, worldCenter.z);
    this.highlightLight.color.setHex(lightColor);
    this.highlightLight.intensity = lightIntensity;
  }

  hideHighlight() {
    this.highlightGroup.visible = false;
    this.highlightLight.intensity = 0;
    // Detach from scene when idle so shader programs skip point light computations
    if (this.highlightLight.parent) {
      this.scene.remove(this.highlightLight);
    }
  }

  dispose() {
    window.removeEventListener('pointermove', this.boundOnPointerMove);
    this.domElement.removeEventListener('pointerdown', this.boundOnPointerDown);
    this.domElement.removeEventListener('pointerup', this.boundOnPointerUp);
    window.removeEventListener('keydown', this.boundOnKeyDown);

    if (this.boundUpdateDomRect) {
      window.removeEventListener('resize', this.boundUpdateDomRect);
      window.removeEventListener('scroll', this.boundUpdateDomRect);
    }

    if (this.highlightGroup) {
      this.scene.remove(this.highlightGroup);
    }
    if (this.highlightLight && this.highlightLight.parent) {
      this.scene.remove(this.highlightLight);
    }
  }
}
