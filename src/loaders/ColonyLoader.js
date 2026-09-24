import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ColonyLoader {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.colony = null;
    this.inspectionData = null;
  }

  async load(primaryUrl = '/assets/mars_colony_base.glb', onProgress = null) {
    const fallbackUrls = [
      primaryUrl,
      '/assets/mars_colony_base.glb',
      '/assets/mars_colony_full_detail_v10_enhanced.glb'
    ].filter((u, i, arr) => arr.indexOf(u) === i);

    let lastError = null;

    for (let i = 0; i < fallbackUrls.length; i++) {
      const url = fallbackUrls[i];
      try {
        console.log(`[ColonyLoader] Attempting to load colony GLB (${i + 1}/${fallbackUrls.length}): ${url}`);
        const result = await this._loadSingleUrl(url, onProgress);
        return result;
      } catch (err) {
        lastError = err;
        console.warn(`[ColonyLoader] Failed loading ${url}:`, err.message);
      }
    }

    throw new Error(`All GLB model loading attempts failed. Last error: ${lastError?.message || 'Unknown'}`);
  }

  _loadSingleUrl(url, onProgress) {
    return new Promise((resolve, reject) => {
      // Approximate expected bytes if xhr.total is 0 or header missing
      const expectedBytes = url.includes('enhanced') ? 103746676 : 12763712;

      this.loader.load(
        url,
        (gltf) => {
          this.colony = gltf.scene;
          this.colony.name = 'MarsColonyEnvironment';

          // Step 1: Orient model from Z-up to Y-up
          this.colony.rotation.x = -Math.PI / 2;
          this.colony.position.set(0, 0, 0);
          this.colony.updateMatrixWorld(true);

          // Step 2: Performance-optimized shadow/material setup
          // Only colony building modules (nodes 1-12) cast shadows.
          // Terrain, rocks, and the base foundation do NOT cast shadows
          // (saves ~150 draw calls from shadow pass).
          const meshList = [];
          const materialSet = new Set();
          let totalVertices = 0;
          let totalTriangles = 0;

          // Names of nodes that should NOT cast shadows (terrain, rocks, foundation)
          const noShadowCastNames = new Set([
            'mars_terrain_expansion',
            'mars_rocks_small',
            'mars_rocks_mid',
            'mars_rocks_large',
            'mars_rocks_debris_scatter_0',
            'mars_rocks_debris_scatter_1',
            'mars_rocks_debris_scatter_2',
            'mars_rocks_debris_scatter_3'
          ]);

          this.colony.traverse((child) => {
            if (child.isMesh) {
              // Determine shadow behavior based on parent node
              const parentName = child.parent ? child.parent.name : '';
              const isEnvironment = noShadowCastNames.has(parentName) || noShadowCastNames.has(child.name);
              const isBaseFoundation = !child.parent || !child.parent.name || child.parent.name === 'MarsColonyEnvironment';

              if (isEnvironment || isBaseFoundation) {
                // Terrain, rocks, and base plate: receive shadows but do not cast
                child.castShadow = false;
                child.receiveShadow = true;
              } else {
                // Colony building modules: cast and receive shadows
                child.castShadow = true;
                child.receiveShadow = true;
              }

              // PERF: enable frustum culling on all meshes
              child.frustumCulled = true;

              // PERF: mark static meshes — prevents unnecessary matrix recalculation
              child.matrixAutoUpdate = false;

              meshList.push({
                name: child.name || 'unnamed_mesh',
                vertices: child.geometry && child.geometry.attributes.position ? child.geometry.attributes.position.count : 0
              });

              if (child.geometry && child.geometry.attributes.position) {
                totalVertices += child.geometry.attributes.position.count;
                if (child.geometry.index) {
                  totalTriangles += child.geometry.index.count / 3;
                } else {
                  totalTriangles += child.geometry.attributes.position.count / 3;
                }
              }

              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => materialSet.add(mat));
              } else if (child.material) {
                materialSet.add(child.material);
              }
            }
          });

          // Step 3: Compute final bounds for inspection
          const finalBox = new THREE.Box3().setFromObject(this.colony);
          const finalSize = finalBox.getSize(new THREE.Vector3());
          const finalCenter = finalBox.getCenter(new THREE.Vector3());

          const buildingNodes = [];
          this.colony.children.forEach(child => {
            if (child.name && !child.name.toLowerCase().includes('scene')) {
              buildingNodes.push(child.name);
            }
          });

          this.inspectionData = {
            modelName: url.split('/').pop(),
            finalDimensions: {
              width: Number(finalSize.x.toFixed(2)),
              height: Number(finalSize.y.toFixed(2)),
              depth: Number(finalSize.z.toFixed(2))
            },
            finalCenter: [
              Number(finalCenter.x.toFixed(2)),
              Number(finalCenter.y.toFixed(2)),
              Number(finalCenter.z.toFixed(2))
            ],
            meshCount: meshList.length,
            materialCount: materialSet.size,
            totalVertices,
            totalTriangles,
            buildingNodes
          };

          console.log('%c🚀 Colony loaded', 'color: #f59e0b; font-weight: bold;',
            `${meshList.length} meshes, ${materialSet.size} mats, ${totalTriangles.toLocaleString()} tris (${url})`);

          this.scene.add(this.colony);

          resolve({
            colony: this.colony,
            inspection: this.inspectionData
          });
        },
        (xhr) => {
          if (onProgress) {
            const total = xhr.total > 0 ? xhr.total : expectedBytes;
            const percent = Math.min(100, (xhr.loaded / total) * 100);
            onProgress(percent);
          }
        },
        (error) => {
          console.error(`Failed to load GLB from ${url}:`, error);
          reject(error);
        }
      );
    });
  }
}
