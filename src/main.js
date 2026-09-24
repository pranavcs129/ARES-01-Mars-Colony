import { SceneManager } from './core/SceneManager.js';
import { CameraController } from './core/CameraController.js';
import { Lighting } from './environment/Lighting.js';
import { ColonyLoader } from './loaders/ColonyLoader.js';
import { ColonyAnimator } from './environment/ColonyAnimator.js';
import { InfoOverlay } from './ui/InfoOverlay.js';
import { InteractionManager } from './interaction/InteractionManager.js';
import { SimulationManager } from './simulation/SimulationManager.js';

async function bootstrap() {
  console.log('🚀 Initializing Ares-1 Mars Colony Simulation...');

  const appContainer = document.getElementById('app');
  const overlayContainer = document.getElementById('overlay');

  if (!appContainer || !overlayContainer) {
    console.error('Mount containers #app or #overlay not found!');
    return;
  }

  // 1. Initialize UI Overlay and Simulation Engine FIRST
  // This guarantees the HUD and Loading Screen are mounted instantly — zero blank screens!
  const overlay = new InfoOverlay(overlayContainer, null);
  const simulationManager = new SimulationManager();
  overlay.setSimulationManager(simulationManager);
  console.log('🪐 Colony Sol Simulation Manager active.');

  // Helper for 2D Command Mode simulation loop
  const startHeadlessLoop = () => {
    let lastTime = performance.now();
    const loop = (now) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      simulationManager.update(delta);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  // Check WebGL availability before attempting Three.js initialization
  if (!SceneManager.isWebGLAvailable()) {
    console.warn('⚠️ WebGL is not available. Presenting 2D Telemetry & Command Mode.');
    startHeadlessLoop();
    overlay.onLoadError('WebGL context is not supported or graphics acceleration is disabled.', {
      onCommandMode: startHeadlessLoop
    });
    return;
  }

  try {
    // 2. Initialize Scene & Renderer
    const sceneManager = new SceneManager(appContainer);

    // 3. Isometric 2.5D Camera Controller (framed around the GLB colony)
    const cameraController = new CameraController(appContainer);
    sceneManager.setCamera(cameraController.camera, cameraController);
    overlay.setCameraController(cameraController);

    // 4. Warm Mars Lighting Setup
    new Lighting(sceneManager.scene);

    // Register simulation manager with 3D render loop
    sceneManager.registerUpdatable(simulationManager);

    // 5. Start rendering loop
    sceneManager.start();
    console.log('✨ 3D Mars Scene rendering active.');

    // 6. Stream Colony GLB Model (defaults to /assets/mars_colony_base.glb with automatic fallback)
    const colonyLoader = new ColonyLoader(sceneManager.scene);

    const result = await colonyLoader.load(
      '/assets/mars_colony_base.glb',
      (percent) => {
        overlay.updateProgress(percent);
      }
    );

    overlay.onLoadComplete();
    console.log('✅ Mars Colony Model mounted & aligned successfully.');

    // 7. Initialize ambient colony animations
    const animator = new ColonyAnimator(sceneManager.scene, result.colony);
    sceneManager.registerUpdatable(animator);
    console.log('🌬️ Colony ambient animations active.');

    // 8. Initialize interactive structure selection
    // Enables hover highlight, click focus, telemetry info panel, and deselect.
    const interactionManager = new InteractionManager(
      sceneManager.scene,
      cameraController,
      appContainer,
      result.colony,
      {
        onSelect: (structure) => {
          overlay.showStructure(structure);
        },
        onDeselect: () => {
          overlay.hideStructure();
        },
        onHover: (structure, mouseX, mouseY) => {
          overlay.showHoverTooltip(structure, mouseX, mouseY);
        },
        onHoverOut: () => {
          overlay.hideHoverTooltip();
        }
      }
    );

    overlay.setInteractionManager(interactionManager);
    console.log('🎮 Colony structure interaction online.');

  } catch (err) {
    console.error('Fatal initialization error:', err);
    overlay.onLoadError(err.message, {
      onCommandMode: startHeadlessLoop
    });
  }
}

// Ensure execution triggers regardless of document readyState or HMR
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
