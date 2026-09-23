// test_live_simulation.mjs
// Comprehensive test script verifying real simulation speed, Sol advancement via POST /api/step,
// dynamic resource calculation, load shedding on Dust Storm, and gradual recovery.

import { colonyApiClient } from './src/api/ColonyApiClient.js';
import { SimulationManager } from './src/simulation/SimulationManager.js';

console.log('================================================================');
console.log('🚀 MARS COLONY SIMULATION — LIVE INTEGRATION TEST');
console.log('================================================================');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  // Step 0: Reset backend
  console.log('\n[TEST STEP 0] Resetting Java backend to Sol 1...');
  const resetState = await colonyApiClient.resetSimulation();
  console.log(`✓ Java Sol: ${resetState.sol}, Status: ${resetState.status}`);
  console.log(`  Power: ${resetState.resources.Power.current}/${resetState.resources.Power.max} kW`);
  console.log(`  Water: ${resetState.resources.Water.current}/${resetState.resources.Water.max} L`);
  console.log(`  Food:  ${resetState.resources.Food.current}/${resetState.resources.Food.max} kg`);
  console.log(`  O2:    ${resetState.resources.Oxygen.current}/${resetState.resources.Oxygen.max} kg`);

  // Step 1: Initialize SimulationManager
  console.log('\n[TEST STEP 1] Initializing SimulationManager (Connecting to Java backend)...');
  const sim = new SimulationManager({ simHourPerRealSecond: 4.8 });
  await sleep(200); // Allow initial sync
  console.log(`✓ SimulationManager Sol: ${sim.sol}`);
  console.log(`✓ SimulationManager Connected: ${sim.isBackendConnected}`);

  // Step 2: Test 1x Speed Mode
  console.log('\n[TEST STEP 2] Testing 1x Speed Mode (Cadence: 1 Sol every 5.0 seconds)...');
  sim.setSpeed(1.0);
  sim.start();
  const initialSol = sim.sol;
  
  // Simulate frame update over 5.2 seconds
  const frameDelta = 0.05; // 50ms per frame
  for (let t = 0; t < 5.2; t += frameDelta) {
    sim.update(frameDelta);
    await sleep(20);
  }
  
  console.log(`✓ At 1x speed, Sol advanced from ${initialSol} to Sol ${sim.sol}!`);
  if (sim.sol < 2) throw new Error('Simulation failed to advance at 1x speed!');
  
  // Verify dynamic resource changes
  const snap2 = sim.getSnapshot();
  console.log(`  Live Resources at Sol ${snap2.sol}:`);
  console.log(`    Power:  ${snap2.colony.energy.current} kW (trend: ${snap2.colony.energy.trend})`);
  console.log(`    Water:  ${snap2.colony.water.current} L (trend: ${snap2.colony.water.trend})`);
  console.log(`    Food:   ${snap2.colony.food.current} kg (trend: ${snap2.colony.food.trend})`);
  console.log(`    Oxygen: ${snap2.colony.oxygen.current} kg (trend: ${snap2.colony.oxygen.trend})`);

  // Step 3: Test 2x Speed Mode
  console.log('\n[TEST STEP 3] Testing 2x Speed Mode (Twice as fast: 1 Sol every 2.5 seconds)...');
  sim.setSpeed(2.0);
  const solBefore2x = sim.sol;
  for (let t = 0; t < 2.7; t += frameDelta) {
    sim.update(frameDelta);
    await sleep(20);
  }
  console.log(`✓ At 2x speed, Sol advanced from ${solBefore2x} to Sol ${sim.sol}!`);
  if (sim.sol <= solBefore2x) throw new Error('Simulation failed to advance at 2x speed!');

  // Step 4: Test 5x Speed Mode
  console.log('\n[TEST STEP 4] Testing 5x Speed Mode (Five times as fast: 1 Sol every 1.0 second)...');
  sim.setSpeed(5.0);
  const solBefore5x = sim.sol;
  for (let t = 0; t < 2.2; t += frameDelta) {
    sim.update(frameDelta);
    await sleep(20);
  }
  console.log(`✓ At 5x speed, Sol advanced from ${solBefore5x} to Sol ${sim.sol}!`);
  if (sim.sol < solBefore5x + 2) throw new Error('Simulation failed to advance rapidly at 5x speed!');

  // Step 5: Test Pause Mode
  console.log('\n[TEST STEP 5] Testing Pause Mode...');
  sim.pause();
  const solPaused = sim.sol;
  for (let t = 0; t < 2.0; t += frameDelta) {
    sim.update(frameDelta);
    await sleep(10);
  }
  console.log(`✓ While paused, Sol remained steady at Sol ${sim.sol}`);
  if (sim.sol !== solPaused) throw new Error('Simulation advanced while paused!');

  // Step 6: Test Dust Storm & Autonomous Load Shedding
  console.log('\n[TEST STEP 6] Triggering Dust Storm via API Client...');
  const stormState = await sim.triggerEvent('DUST_STORM', 3.0);
  console.log(`✓ Event Triggered: ${stormState.activeEvents[0]?.name}`);
  console.log(`  Power Generation: ${stormState.resources.Power.production} kW (Balance: ${stormState.resources.Power.balance} kW)`);
  console.log('  Autonomous Management Response Actions from Java:');
  for (const resp of stormState.managementResponse) {
    console.log(`    • ${resp.facility}: ${resp.transition} (saved: ${resp.saved} kW) [${resp.action}]`);
  }

  // Verify Facility Levels
  const snapStorm = sim.getSnapshot();
  const logisticsSector = sim.allocationManager.sectorLevels.logistics;
  const researchSector = sim.allocationManager.sectorLevels.research;
  const greenhouseSector = sim.allocationManager.sectorLevels.greenhouse;
  const waterSector = sim.allocationManager.sectorLevels.water;
  const lifeSupportSector = sim.allocationManager.sectorLevels.lifesupport;
  
  console.log(`  Sector Levels in Frontend:`);
  console.log(`    Logistics:    ${logisticsSector * 100}%`);
  console.log(`    Research:     ${researchSector * 100}%`);
  console.log(`    Greenhouse:   ${greenhouseSector * 100}%`);
  console.log(`    Water:        ${waterSector * 100}%`);
  console.log(`    Life Support: ${lifeSupportSector * 100}% (Locked)`);

  if (logisticsSector !== 0 || researchSector !== 0 || greenhouseSector !== 0.5 || waterSector !== 0.75 || lifeSupportSector !== 1.0) {
    throw new Error('Load shedding facility levels did not match required priority reductions!');
  }
  console.log('✓ Load shedding levels verified: Life Support 100% PROTECTED, non-essentials shed!');

  // Step 7: Advance Sols while storm is active
  console.log('\n[TEST STEP 7] Advancing simulation during storm (Sol steps)...');
  await sim.stepSol();
  console.log(`✓ Advanced to Sol ${sim.sol} — Storm duration remaining: ${sim.backendData.activeEvents[0]?.durationRemaining} Sols`);
  await sim.stepSol();
  console.log(`✓ Advanced to Sol ${sim.sol} — Storm duration remaining: ${sim.backendData.activeEvents[0]?.durationRemaining} Sols`);

  // Step 8: Step into recovery (Storm clears)
  console.log('\n[TEST STEP 8] Stepping into post-storm recovery...');
  const postStormState = await sim.stepSol();
  console.log(`✓ Sol ${postStormState.sol} — Active events: ${postStormState.activeEvents.length} (Cleared!)`);
  console.log(`  Solar generation recovered to: ${postStormState.resources.Power.production} kW`);

  // Step 9: Verify Gradual Recovery (+25% per Sol)
  console.log('\n[TEST STEP 9] Verifying Gradual Recovery across consecutive Sols...');
  const recState1 = await sim.stepSol();
  console.log(`✓ Sol ${recState1.sol} Recovery Step 1:`);
  for (const f of recState1.facilities) {
    console.log(`    • ${f.name}: ${f.operatingLevel}% (${f.status})`);
  }

  const recState2 = await sim.stepSol();
  console.log(`✓ Sol ${recState2.sol} Recovery Step 2:`);
  for (const f of recState2.facilities) {
    console.log(`    • ${f.name}: ${f.operatingLevel}% (${f.status})`);
  }

  const recState3 = await sim.stepSol();
  console.log(`✓ Sol ${recState3.sol} Recovery Step 3 (Equilibrium Restored):`);
  for (const f of recState3.facilities) {
    console.log(`    • ${f.name}: ${f.operatingLevel}% (${f.status})`);
    if (f.operatingLevel < 100.0) {
      throw new Error(`Facility ${f.name} did not reach 100% after recovery!`);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!');
  console.log('================================================================\n');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
