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

  let overlay = null;

  try {
    // 1. Initialize Scene & Renderer
    const sceneManager = new SceneManager(appContainer);

    // 2. Isometric 2.5D Camera Controller (framed around the GLB colony)
    const cameraController = new CameraController(appContainer);
    sceneManager.setCamera(cameraController.camera, cameraController);

    // 3. Warm Mars Lighting Setup
    new Lighting(sceneManager.scene);

    // 4. Minimal Clean Header & Overlay
    overlay = new InfoOverlay(overlayContainer, cameraController);

    // 5. Initialize Sol Colony Simulation Engine
    const simulationManager = new SimulationManager();
    sceneManager.registerUpdatable(simulationManager);
    overlay.setSimulationManager(simulationManager);
    console.log('🪐 Colony Sol Simulation Manager active.');

    // 6. Start rendering loop
    sceneManager.start();
    console.log('✨ 3D Mars Scene rendering active.');

    // 7. Stream Complete Colony GLB Model
    const colonyLoader = new ColonyLoader(sceneManager.scene);

    const result = await colonyLoader.load(
      '/assets/mars_colony_full_detail_v10_enhanced.glb',
      (percent) => {
        if (overlay) {
          overlay.updateProgress(percent);
        }
      }
    );

    if (overlay) {
      overlay.onLoadComplete();
    }
    console.log('✅ Mars Colony Model mounted & aligned successfully.');

    // 8. Initialize ambient colony animations
    const animator = new ColonyAnimator(sceneManager.scene, result.colony);
    sceneManager.registerUpdatable(animator);
    console.log('🌬️ Colony ambient animations active.');

    // 9. Initialize interactive structure selection
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
    if (overlay) {
      overlay.onLoadError(err.message);
    }
  }
}

// Ensure execution triggers regardless of document readyState or HMR
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
