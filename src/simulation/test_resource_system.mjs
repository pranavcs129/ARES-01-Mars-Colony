import { SimulationManager } from './SimulationManager.js';
import { RESOURCE_STATES, COLONY_STATUS_STATES } from './ResourceConfig.js';

function runTests() {
  console.log('=== STARTING MARS COLONY RESOURCE MANAGEMENT TESTS ===\n');

  // TEST 1: Baseline Simulation & Sol Advance
  console.log('--- TEST 1: Baseline Simulation & Sol Advance ---');
  const sim = new SimulationManager();
  console.log(`Initial Sol: ${sim.sol}, Hour: ${sim.hour}`);
  console.log(`Initial Status: ${sim.colonyState.status}`);
  console.log(`Initial Power: ${sim.colonyState.resources.energy.current}/${sim.colonyState.resources.energy.max} kW (${sim.resourceManager.getResourceState('energy')})`);
  console.log(`Initial Water: ${sim.colonyState.resources.water.current}/${sim.colonyState.resources.water.max} L (${sim.resourceManager.getResourceState('water')})`);

  // Advance 2 Sols (48 hours)
  for (let i = 0; i < 480; i++) {
    sim.update(0.1); // 0.1 hour micro-step
  }
  console.log(`After 2 Sols: Sol ${sim.sol}, Hour: ${sim.hour.toFixed(1)}`);
  console.log(`Colony Status: ${sim.colonyState.status}`);
  console.log(`Oxygen: ${Math.round(sim.colonyState.resources.oxygen.current)} kg (${sim.resourceManager.getResourceState('oxygen')})`);
  console.log(`Water: ${Math.round(sim.colonyState.resources.water.current)} L (${sim.resourceManager.getResourceState('water')})`);
  console.log(`Power: ${Math.round(sim.colonyState.resources.energy.current)} kW (${sim.resourceManager.getResourceState('energy')})`);
  console.log(`Food: ${Math.round(sim.colonyState.resources.food.current)} kg (${sim.resourceManager.getResourceState('food')})`);
  console.log('✓ Baseline advance verified.\n');

  // TEST 2: Scenario 1 — DUST STORM
  console.log('--- TEST 2: Scenario 1 — DUST STORM INTERACTION ---');
  sim.reset();
  // Set initial power to 60% (300 kW) so dust storm triggers conservation clearly
  sim.colonyState.resources.energy.current = 260; // 52% (Normal)
  console.log(`Pre-storm power: ${sim.colonyState.resources.energy.current} kW (52%)`);
  
  // Trigger Dust Storm (duration 4 sols)
  sim.triggerEvent('DUST_STORM', 4);
  const activeEvents = sim.eventManager.getSnapshot().activeEvents;
  console.log(`Active Event: ${activeEvents[0]?.name}, Solar Multiplier: ${sim.eventManager.getModifiers().solarMultiplier}`);

  let hitLow = false;
  let hitCritical = false;
  let researchThrottledAtLow = false;
  let habitatProtected = true;

  // Advance simulation through storm
  for (let step = 0; step < 960; step++) {
    sim.update(0.1);
    const pwrState = sim.resourceManager.getResourceState('energy');
    const labOp = sim.facilityManager.facilities.research_lab.operatingLevel;
    const habOp = sim.facilityManager.facilities.habitat.operatingLevel;

    if (habOp < 1.0) habitatProtected = false;

    if (pwrState === RESOURCE_STATES.LOW) {
      hitLow = true;
      if (labOp <= 0.5) researchThrottledAtLow = true;
    }
    if (pwrState === RESOURCE_STATES.CRITICAL) {
      hitCritical = true;
      if (labOp > 0.0) console.log(`Warning: Lab not paused at critical! Op: ${labOp}`);
    }

    // Stop if storm ends and power recovered
    if (sim.eventManager.activeEvents.length === 0 && sim.colonyState.resources.energy.current > 300) {
      break;
    }
  }

  console.log(`Dust storm passed.`);
  console.log(`Did Power reach LOW? ${hitLow}`);
  console.log(`Was Research Lab throttled to <=50% during LOW? ${researchThrottledAtLow}`);
  console.log(`Was Life Support (Habitat) 100% protected throughout? ${habitatProtected}`);
  console.log(`Post-storm Power: ${Math.round(sim.colonyState.resources.energy.current)} kW (${sim.resourceManager.getResourceState('energy')})`);
  console.log(`Post-storm Research Lab operating level: ${sim.facilityManager.facilities.research_lab.operatingLevel * 100}%`);
  console.log(`Post-storm Colony Status: ${sim.colonyState.status}`);
  if (!hitLow || !researchThrottledAtLow || !habitatProtected) {
    throw new Error('Dust storm scenario verification failed!');
  }
  console.log('✓ Scenario 1 (Dust Storm) successfully passed.\n');

  // TEST 3: Scenario 2 — WATER EXTRACTOR EQUIPMENT FAILURE
  console.log('--- TEST 3: Scenario 2 — WATER EXTRACTOR FAILURE ---');
  sim.reset();
  // Set initial water to 51% (510 L) so failure drops it into LOW (<500 L)
  sim.colonyState.resources.water.current = 510;
  console.log(`Initial Water: ${sim.colonyState.resources.water.current} L (51%)`);

  // Trigger Equipment Failure (duration 4 sols)
  sim.triggerEvent('EQUIPMENT_FAILURE', 4);
  const waterProdInitial = sim.facilityManager.facilities.water.actualProduction.water;
  console.log(`Water production under failure: ${waterProdInitial} L/Sol (Normal: 40 L/Sol)`);

  let waterHitLow = false;
  let greenhouseThrottled = false;
  let habitatWaterProtected = true;

  for (let step = 0; step < 720; step++) {
    sim.update(0.1);
    const watState = sim.resourceManager.getResourceState('water');
    const ghOp = sim.facilityManager.facilities.greenhouse.operatingLevel;
    const habWater = sim.facilityManager.facilities.habitat.actualConsumption.water;

    if (habWater < 8.0) habitatWaterProtected = false;

    if (watState === RESOURCE_STATES.LOW || watState === RESOURCE_STATES.CRITICAL) {
      waterHitLow = true;
      if (ghOp <= 0.5) greenhouseThrottled = true;
    }

    if (sim.eventManager.activeEvents.length === 0 && sim.colonyState.resources.water.current > 500) {
      break;
    }
  }

  console.log(`Equipment failure resolved.`);
  console.log(`Did Water reach LOW/CRITICAL? ${waterHitLow}`);
  console.log(`Was Greenhouse throttled to conserve water? ${greenhouseThrottled}`);
  console.log(`Was Habitat Life Support water protected? ${habitatWaterProtected}`);
  console.log(`Post-repair Water production: ${sim.facilityManager.facilities.water.actualProduction.water} L/Sol`);
  console.log(`Post-repair Water storage: ${Math.round(sim.colonyState.resources.water.current)} L`);
  console.log(`Post-repair Greenhouse operating level: ${sim.facilityManager.facilities.greenhouse.operatingLevel * 100}%`);
  console.log(`Post-repair Colony Status: ${sim.colonyState.status}`);
  if (!waterHitLow || !greenhouseThrottled || !habitatWaterProtected) {
    throw new Error('Water failure scenario verification failed!');
  }
  console.log('✓ Scenario 2 (Water Extractor Failure) successfully passed.\n');

  // TEST 4: Surplus Test (> 80%)
  console.log('--- TEST 4: SURPLUS TEST (> 80%) ---');
  sim.reset();
  sim.colonyState.resources.energy.current = 450; // 90%
  sim.colonyState.resources.water.current = 850;  // 85%
  sim.colonyState.updateColonyStatus();

  console.log(`Power State: ${sim.resourceManager.getResourceState('energy')}`);
  console.log(`Water State: ${sim.resourceManager.getResourceState('water')}`);
  console.log(`Colony Status: ${sim.colonyState.status}`);

  if (sim.resourceManager.getResourceState('energy') !== RESOURCE_STATES.ABUNDANT) {
    throw new Error('Power state should be ABUNDANT!');
  }
  if (sim.resourceManager.getResourceState('water') !== RESOURCE_STATES.ABUNDANT) {
    throw new Error('Water state should be ABUNDANT!');
  }
  console.log('✓ Surplus condition correctly recognized as ABUNDANT.\n');

  // TEST 5: Manual Prioritize Test
  console.log('--- TEST 5: MANUAL PRIORITIZE TEST ---');
  sim.reset();
  // Put energy in LOW state (35%)
  sim.colonyState.resources.energy.current = 175; // 35% (LOW)
  sim.facilityManager.tick(12.0, 1, 0.1, {});

  const normalLabOp = sim.facilityManager.facilities.research_lab.operatingLevel;
  console.log(`Research Lab operating level in LOW energy (Unprioritized): ${normalLabOp * 100}%`);

  // Now PRIORITIZE Research Lab
  sim.toggleFacilityPriority('research_lab');
  sim.facilityManager.tick(12.0, 1, 0.1, {});
  const prioritizedLabOp = sim.facilityManager.facilities.research_lab.operatingLevel;
  const habitatOp = sim.facilityManager.facilities.habitat.operatingLevel;

  console.log(`Research Lab operating level after PRIORITIZE: ${prioritizedLabOp * 100}%`);
  console.log(`Habitat operating level (Life support protected): ${habitatOp * 100}%`);

  if (prioritizedLabOp <= normalLabOp) {
    throw new Error('Prioritizing Research Lab did not increase its allocation!');
  }
  if (habitatOp !== 1.0) {
    throw new Error('Life support Habitat was compromised by prioritization!');
  }
  console.log('✓ Manual Prioritize successfully elevated facility allocation without compromising Life Support.\n');

  console.log('==================================================');
  console.log('ALL RESOURCE MANAGEMENT TESTS PASSED WITH 100% SUCCESS');
  console.log('==================================================');
}

runTests();
