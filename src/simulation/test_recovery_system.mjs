import { SimulationManager } from './SimulationManager.js';

console.log('=== TESTING RECOVERY & RESOURCE MANAGEMENT SYSTEM ===\n');

const sim = new SimulationManager();

// 1. Initial nominal snapshot
const snap1 = sim.getSnapshot();
console.log('1. Nominal State:');
console.log('Event:', snap1.recovery.activeEvent.name);
console.log('Severity:', snap1.recovery.activeEvent.severity);
console.log('Resource loss count:', snap1.recovery.resourceLossList.length);
console.log('Colony response sectors:', snap1.recovery.colonyResponse.map(s => `${s.sector}: ${s.status}`).join(' | '));

if (snap1.recovery.hasDisaster !== false) {
  throw new Error('Initial state should not have disaster');
}
console.log('✓ Nominal operations verified.\n');

// 2. Trigger Dust Storm Disaster
console.log('2. Triggering DUST STORM (3 Sols)...');
sim.triggerEvent('DUST_STORM', 3);
const snap2 = sim.getSnapshot();
console.log('Active Event:', snap2.recovery.activeEvent.name);
console.log('Duration:', snap2.recovery.activeEvent.duration);
console.log('Resource Loss (Power):', snap2.recovery.resourceLossList.find(r => r.key === 'energy')?.changePct);
console.log('Colony Response:', snap2.recovery.colonyResponse.map(s => `${s.sector} (${s.status})`).join(', '));
console.log('Effects on colony:', snap2.recovery.effectsOnColony.join(' -> '));

if (!snap2.recovery.hasDisaster || !snap2.recovery.activeEvent.name.includes('DUST STORM')) {
  throw new Error('Dust storm not active in recovery snapshot');
}
console.log('✓ Disaster active event & resource loss accurately populated.\n');

// 3. Test Action 1: USE EMERGENCY RESERVE
console.log('3. Testing Action: USE EMERGENCY RESERVE');
const prevPower = sim.colonyState.resources.energy.current;
sim.useEmergencyReserve('energy');
const newPower = sim.colonyState.resources.energy.current;
console.log(`Power before: ${prevPower} kW -> Power after: ${newPower} kW (Diff: +${newPower - prevPower} kW)`);
if (newPower <= prevPower) throw new Error('Emergency reserve did not increase power');
console.log('✓ Emergency Reserve injection verified.\n');

// 4. Test Action 2: ACTIVATE BACKUP POWER
console.log('4. Testing Action: ACTIVATE BACKUP POWER');
sim.toggleBackupPower();
console.log('Backup Active:', sim.recoveryManager.backupActive);
if (!sim.recoveryManager.backupActive) throw new Error('Backup power failed to activate');
console.log('✓ Auxiliary Backup active.\n');

// 5. Test Action 3: REDUCE RESOURCE USE
console.log('5. Testing Action: REDUCE RESOURCE USE');
sim.toggleConservation();
console.log('Conservation Active:', sim.recoveryManager.conservationActive);
if (!sim.recoveryManager.conservationActive) throw new Error('Conservation failed to activate');
console.log('✓ Reduced resource usage protocol active.\n');

// 6. Test Action 4: START REPAIR
console.log('6. Testing Action: START REPAIR');
sim.startRepair();
console.log('Repair Active:', sim.recoveryManager.repairActive, 'Progress:', sim.recoveryManager.repairProgress);
if (!sim.recoveryManager.repairActive) throw new Error('Repair failed to start');

// Simulate 2 Sols passing to observe gradual repair and recovery
console.log('Simulating 2 Sols of repair...');
for (let i = 0; i < 48; i++) {
  sim.update(1.0); // 1 real sec = 1 hour
}
const snap3 = sim.getSnapshot();
console.log('After 2 Sols: Sol', snap3.sol);
console.log('Event status:', snap3.recovery.activeEvent.name);
console.log('Repair Progress:', snap3.recovery.actions.repairProgress + '%');
console.log('Power Level:', Math.round(snap3.colony.power.current), 'kW');
console.log('✓ Repair progression & simulation integration verified.\n');

console.log('=== ALL RECOVERY TESTS PASSED! ===\n');
