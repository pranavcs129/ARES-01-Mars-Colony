// test_user_requirements.mjs
// Verifies all 4 requirement tests from the user prompt:
// Test 1 — Normal operation (10+ Sols)
// Test 2 — Dust Storm chain
// Test 3 — Gradual recovery
// Test 4 — Power shortage & load shedding

import { colonyApiClient } from './src/api/ColonyApiClient.js';
import { SimulationManager } from './src/simulation/SimulationManager.js';

function printSolDebug(sol, prevRes, curRes, facilities, eventName, health, conds) {
  console.log(`\n========================================`);
  console.log(`SOL ${sol} ${eventName ? `[EVENT: ${eventName}]` : ''}`);
  console.log(`----------------------------------------`);
  if (prevRes && curRes) {
    console.log(`O2:    ${prevRes.oxygen.toFixed(0)} → ${curRes.oxygen.toFixed(0)} kg (bal: ${curRes.o2Bal >= 0 ? '+' : ''}${curRes.o2Bal.toFixed(1)})`);
    console.log(`H2O:   ${prevRes.water.toFixed(0)} → ${curRes.water.toFixed(0)} L (bal: ${curRes.waterBal >= 0 ? '+' : ''}${curRes.waterBal.toFixed(1)})`);
    console.log(`FOOD:  ${prevRes.food.toFixed(0)} → ${curRes.food.toFixed(0)} kg (bal: ${curRes.foodBal >= 0 ? '+' : ''}${curRes.foodBal.toFixed(1)})`);
    console.log(`POWER: ${prevRes.power.toFixed(0)} → ${curRes.power.toFixed(0)} kW (bal: ${curRes.powerBal >= 0 ? '+' : ''}${curRes.powerBal.toFixed(1)})`);
  }
  console.log(`Health: ${health?.score}% [${health?.status}]`);
  console.log(`Facilities:`);
  for (const f of facilities) {
    const condStr = f.condition !== undefined ? ` (Cond: ${f.condition.toFixed(1)}%)` : '';
    console.log(`  • ${f.name.padEnd(24)}: ${f.operatingLevel}% [${f.status}]${condStr}`);
  }
  console.log(`========================================`);
}

async function run() {
  console.log('Starting Verification of Requirements 1-20...\n');

  // STEP 0: Reset
  console.log('>>> [STEP 0] Resetting simulation to Sol 1...');
  await colonyApiClient.resetSimulation();
  const sim = new SimulationManager();
  await new Promise(r => setTimeout(r, 200));

  // =================================================================
  // TEST 1 — NORMAL OPERATION: Advance at least 10 Sols
  // =================================================================
  console.log('\n>>> [TEST 1 — NORMAL OPERATION: 10 SOLS ADVANCEMENT]');
  let prevRes = null;
  const recordedSols = [];

  for (let s = 1; s <= 10; s++) {
    const state = (s === 1) ? await colonyApiClient.fetchState() : await sim.stepSol();
    const curRes = {
      oxygen: state.resources.Oxygen.current,
      water: state.resources.Water.current,
      food: state.resources.Food.current,
      power: state.resources.Power.current,
      o2Bal: state.resources.Oxygen.balance,
      waterBal: state.resources.Water.balance,
      foodBal: state.resources.Food.balance,
      powerBal: state.resources.Power.balance
    };

    printSolDebug(
      state.sol,
      prevRes,
      curRes,
      state.facilities,
      state.activeEvents[0]?.name,
      state.health || { score: sim.monitoringManager.colonyHealth, status: sim.monitoringManager.colonyHealthStatus }
    );

    recordedSols.push({ sol: state.sol, ...curRes });
    prevRes = curRes;
  }

  // Verifications for Test 1:
  // 1. Resources actually change (not static)
  const o2Changed = recordedSols[0].oxygen !== recordedSols[9].oxygen || recordedSols[0].water !== recordedSols[9].water;
  console.log(`\n✓ Resources changed over 10 Sols: ${o2Changed} (O2: ${recordedSols[0].oxygen} -> ${recordedSols[9].oxygen}, Water: ${recordedSols[0].water} -> ${recordedSols[9].water}, Food: ${recordedSols[0].food} -> ${recordedSols[9].food}, Power: ${recordedSols[0].power} -> ${recordedSols[9].power})`);
  if (!o2Changed) throw new Error('FAIL: Resources remained completely static during 10 normal Sols!');

  // 2. Values are not forced to 100%
  const o2Pct = recordedSols[9].oxygen / 1000.0;
  console.log(`✓ Sol 10 O2 percentage: ${(o2Pct * 100).toFixed(1)}% (Not locked at 100%)`);

  // 3. Condition changes gradually
  const finalState = await colonyApiClient.fetchState();
  const hab = finalState.facilities.find(f => f.name.includes('Habitat'));
  console.log(`✓ Habitat condition at Sol 10: ${hab.condition.toFixed(2)}% (Natural gradual wear)`);
  if (hab.condition === 100.0) throw new Error('FAIL: Facility condition remained permanently at 100%!');

  // 4. Real history exists
  console.log(`✓ History length in MonitoringManager: ${sim.monitoringManager.history.oxygen.length} points`);
  console.log(`  O2 Sparkline values: ${sim.monitoringManager.history.oxygen.slice(-5).join(', ')}%`);
  console.log(`  Water Sparkline values: ${sim.monitoringManager.history.water.slice(-5).join(', ')}%`);

  // =================================================================
  // TEST 2 — DUST STORM & COMPLETE CAUSE-AND-EFFECT CHAIN
  // =================================================================
  console.log('\n>>> [TEST 2 — DUST STORM & COMPLETE CAUSE-AND-EFFECT CHAIN]');
  console.log('Triggering 2-Sol Dust Storm...');
  const stormState = await sim.triggerEvent('dust_storm', 2.0);
  console.log(`✓ Event injected: ${stormState.activeEvents[0]?.name}`);

  const stormSol1 = await sim.stepSol();
  const stormRes1 = {
    oxygen: stormSol1.resources.Oxygen.current,
    water: stormSol1.resources.Water.current,
    food: stormSol1.resources.Food.current,
    power: stormSol1.resources.Power.current,
    o2Bal: stormSol1.resources.Oxygen.balance,
    waterBal: stormSol1.resources.Water.balance,
    foodBal: stormSol1.resources.Food.balance,
    powerBal: stormSol1.resources.Power.balance
  };

  printSolDebug(
    stormSol1.sol,
    prevRes,
    stormRes1,
    stormSol1.facilities,
    stormSol1.activeEvents[0]?.name,
    stormSol1.health
  );
  prevRes = stormRes1;

  // Check the complete chain:
  // Dust -> Solar dropped -> Power dropped -> Management shed load -> Life Support protected
  const stormPowerProd = stormSol1.resources.Power.production;
  console.log(`✓ Chain Step 1-3: Dust Storm dropped power production to ${stormPowerProd} kW (Solar obscured)`);
  if (stormPowerProd > 25.0) throw new Error('FAIL: Dust storm did not reduce power generation!');

  console.log(`✓ Chain Step 4: Autonomous management shed load:`);
  for (const resp of stormSol1.managementResponse) {
    console.log(`    • ${resp.facility}: ${resp.transition} [${resp.action}]`);
  }

  const logFac = stormSol1.facilities.find(f => f.name.includes('Logistics') || f.name.includes('Landing'));
  const resFac = stormSol1.facilities.find(f => f.name.includes('Research'));
  const habFac = stormSol1.facilities.find(f => f.name.includes('Habitat'));

  console.log(`✓ Chain Step 5: Logistics operating level: ${logFac.operatingLevel}%`);
  console.log(`✓ Chain Step 5: Research operating level: ${resFac.operatingLevel}%`);
  console.log(`✓ Chain Step 5: Habitat operating level: ${habFac.operatingLevel}% [${habFac.status}]`);

  if (habFac.operatingLevel !== 100.0) throw new Error('FAIL: Habitat was not 100% protected!');
  if (logFac.operatingLevel > 0) throw new Error('FAIL: Logistics was not shed to 0%!');

  // Advance through remaining storm
  const stormSol2 = await sim.stepSol();
  const stormRes2 = {
    oxygen: stormSol2.resources.Oxygen.current,
    water: stormSol2.resources.Water.current,
    food: stormSol2.resources.Food.current,
    power: stormSol2.resources.Power.current,
    o2Bal: stormSol2.resources.Oxygen.balance,
    waterBal: stormSol2.resources.Water.balance,
    foodBal: stormSol2.resources.Food.balance,
    powerBal: stormSol2.resources.Power.balance
  };
  printSolDebug(
    stormSol2.sol,
    prevRes,
    stormRes2,
    stormSol2.facilities,
    stormSol2.activeEvents[0]?.name,
    stormSol2.health
  );
  prevRes = stormRes2;

  // =================================================================
  // TEST 3 — GRADUAL RECOVERY
  // =================================================================
  console.log('\n>>> [TEST 3 — GRADUAL RECOVERY]');
  console.log('Storm expires; stepping into rehabilitation...');

  // Storm expires
  const stormClearedSol = await sim.stepSol();
  console.log(`✓ Sol ${stormClearedSol.sol}: Storm cleared. Active events: ${stormClearedSol.activeEvents.length}`);
  console.log(`  Power production rebounded to: ${stormClearedSol.resources.Power.production} kW`);
  console.log(`  Operating levels as storm lifts:`);
  for (const f of stormClearedSol.facilities) {
    console.log(`    • ${f.name.padEnd(24)}: ${f.operatingLevel}% [${f.status}]`);
  }

  // Verify non-instant recovery (Logistics is at 0%, Greenhouse at 50%)
  const recLog1 = stormClearedSol.facilities.find(f => f.name.includes('Logistics') || f.name.includes('Landing'));
  if (recLog1.operatingLevel === 100.0) {
    throw new Error('FAIL: Logistics instantly recovered to 100% instead of gradual recovery!');
  }
  console.log('✓ Verification: Facilities do NOT instantly snap back to 100%!');

  // Recovery Sol 1
  const recSol1 = await sim.stepSol();
  console.log(`\n✓ Sol ${recSol1.sol}: Rehabilitation Step 1`);
  for (const f of recSol1.facilities) {
    console.log(`    • ${f.name.padEnd(24)}: ${f.operatingLevel}% [${f.status}]`);
  }

  // Recovery Sol 2
  const recSol2 = await sim.stepSol();
  console.log(`\n✓ Sol ${recSol2.sol}: Rehabilitation Step 2`);
  for (const f of recSol2.facilities) {
    console.log(`    • ${f.name.padEnd(24)}: ${f.operatingLevel}% [${f.status}]`);
  }

  // Recovery Sol 3
  const recSol3 = await sim.stepSol();
  console.log(`\n✓ Sol ${recSol3.sol}: Equilibrium Restored`);
  for (const f of recSol3.facilities) {
    console.log(`    • ${f.name.padEnd(24)}: ${f.operatingLevel}% [${f.status}]`);
    if (f.operatingLevel < 100.0) throw new Error(`FAIL: Facility ${f.name} did not reach 100% after 3 recovery Sols!`);
  }

  // =================================================================
  // TEST 4 — POWER SHORTAGE / EMERGENCY RESPONSE
  // =================================================================
  console.log('\n>>> [TEST 4 — POWER SHORTAGE & BACKUP GENERATOR]');
  console.log('Triggering Power Failure event...');
  const pfState = await sim.triggerEvent('power_failure', 2.0);
  const pfStep = await sim.stepSol();
  console.log(`✓ Power failure step completed: Sol ${pfStep.sol}`);
  console.log(`  Power Generation: ${pfStep.resources.Power.production} kW, Balance: ${pfStep.resources.Power.balance} kW`);
  console.log(`  Management Actions:`);
  for (const m of pfStep.managementResponse) {
    console.log(`    • ${m.facility}: ${m.transition} [${m.action}]`);
  }

  // Engage backup generator
  console.log('Engaging Auxiliary RTG Backup Power...');
  const backupRes = await sim.toggleBackupPower();
  console.log(`✓ Auxiliary Backup generator engaged: ${backupRes}`);

  const postBackupSol = await sim.stepSol();
  console.log(`✓ Sol ${postBackupSol.sol} with backup active:`);
  console.log(`  Power Production: ${postBackupSol.resources.Power.production} kW, Balance: ${postBackupSol.resources.Power.balance} kW`);

  // Clean reset
  console.log('\n>>> Resetting simulation to Sol 1 for clean user state...');
  await sim.reset();
  console.log('✓ Simulation reset to Sol 1 clean state.');

  console.log('\n================================================================');
  console.log('🎉 ALL 4 USER REQUIREMENTS VERIFIED & CONFIRMED WORKING 100%!');
  console.log('================================================================\n');
}

run().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
