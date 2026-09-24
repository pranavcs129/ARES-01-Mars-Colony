import { SceneManager } from './core/SceneManager.js';
import { CinematicCameraController } from './core/CinematicCameraController.js';
import { Lighting } from './environment/Lighting.js';
import { MarsSky } from './environment/MarsSky.js';
import { MarsDustAtmosphere } from './environment/MarsDustAtmosphere.js';
import { ColonyLifeManager } from './environment/ColonyLifeManager.js';
import { ColonyLoader } from './loaders/ColonyLoader.js';
import { ColonyAnimator } from './environment/ColonyAnimator.js';
import { InfoOverlay } from './ui/InfoOverlay.js';
import { InteractionManager } from './interaction/InteractionManager.js';
import { SimulationManager } from './simulation/SimulationManager.js';

async function bootstrap() {
  console.log('🚀 Initializing Ares-1 Mars Colony Simulation [Cinematic Edition]...');

  const appContainer = document.getElementById('app');
  const overlayContainer = document.getElementById('overlay');

  if (!appContainer || !overlayContainer) {
    console.error('Mount containers #app or #overlay not found!');
    return;
  }

  // 1. Initialize UI Overlay and Simulation Engine FIRST
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
    // 2. Initialize Scene & Renderer with Post-Processing & Soft Shadows
    const sceneManager = new SceneManager(appContainer);

    // 3. Cinematic & Tactical Dual-Mode Camera Controller
    const cameraController = new CinematicCameraController(appContainer);
    sceneManager.setCamera(cameraController.camera, cameraController);
    overlay.setCameraController(cameraController);

    // 4. Dynamic Martian Lighting & Atmospheric Environment
    const lighting = new Lighting(sceneManager.scene);
    const sky = new MarsSky(sceneManager.scene);
    const dust = new MarsDustAtmosphere(sceneManager.scene);

    // Dynamic environmental updater tied to the Sol clock & weather events
    let lifeManager = null;
    const environmentSync = {
      update: (delta) => {
        const hour = simulationManager ? simulationManager.hour : 12.0;
        const isDustStorm = simulationManager
          ? simulationManager.eventManager.activeEvents.some(e => e.type === 'DUST_STORM')
          : false;

        sky.update(hour, delta, isDustStorm);
        lighting.update(hour, delta, isDustStorm);
        dust.update(delta, isDustStorm, lighting.dirLight.position.clone().normalize());

        if (lifeManager) {
          const isNight = hour < 5.8 || hour > 19.5;
          lifeManager.update(delta, isNight, isDustStorm);
        }

        sceneManager.setDustStormIntensity(isDustStorm ? 1.0 : 0.0);
      }
    };
    sceneManager.registerUpdatable(environmentSync);

    // Register simulation manager with 3D render loop
    sceneManager.registerUpdatable(simulationManager);

    // 5. Start rendering loop
    sceneManager.start();
    console.log('✨ 3D Mars Scene rendering active.');

    // 6. Stream Colony GLB Model
    const colonyLoader = new ColonyLoader(sceneManager.scene);

    const result = await colonyLoader.load(
      '/assets/mars_colony_full_detail_v10_enhanced.glb',
      (percent) => {
        overlay.updateProgress(percent);
      }
    );

    overlay.onLoadComplete();
    console.log('✅ Mars Colony Model mounted & aligned successfully.');

    // 7. Initialize Kinetic Colony Life (autonomous rovers, survey drones, beacon strobes)
    lifeManager = new ColonyLifeManager(sceneManager.scene, result.colony);

    // 8. Initialize ambient colony animations (solar panel tracking, emissive pulses)
    const animator = new ColonyAnimator(sceneManager.scene, result.colony);
    sceneManager.registerUpdatable(animator);
    console.log('🌬️ Colony ambient animations active.');

    // 9. Initialize interactive structure selection
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
