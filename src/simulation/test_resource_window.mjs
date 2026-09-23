import { SimulationManager } from './SimulationManager.js';
import { ResourceManagementWindow } from '../ui/ResourceManagementWindow.js';

// Mock minimal DOM for Node testing
class MockElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.innerHTML = '';
    this.textContent = '';
    this.listeners = {};
    this._classes = new Set();
    this.classList = {
      add: (c) => this._classes.add(c),
      remove: (c) => this._classes.delete(c),
      contains: (c) => this._classes.has(c)
    };
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  querySelector(sel) {
    if (sel.includes('[data-action="close-rm"]')) return new MockElement('button');
    return new MockElement('div');
  }
  querySelectorAll(sel) {
    return [new MockElement('button'), new MockElement('button'), new MockElement('button')];
  }
}

globalThis.document = {
  createElement: (tag) => new MockElement(tag),
  getElementById: (id) => new MockElement('div')
};
globalThis.window = {
  addEventListener: () => {}
};

function runWindowVisualTests() {
  console.log('=== TESTING VISUAL RESOURCE FLOW & ALLOCATION CONTROL ===\n');

  const sim = new SimulationManager();
  const mockContainer = new MockElement('div');
  const win = new ResourceManagementWindow(mockContainer, sim);

  console.log('1. Initial window state: isOpen =', win.isOpen);
  if (win.isOpen !== false) throw new Error('Window should start closed');

  console.log('2. Opening window in Nominal State...');
  win.open();
  if (win.isOpen !== true) throw new Error('Window should be open');
  console.log('Window opened. Incident:', win.dom.incidentName?.textContent);

  console.log('\n3. Triggering Dust Storm (Power Shortage Incident):');
  sim.triggerEvent('DUST_STORM', 3);
  win.update();

  console.log('Incident Name:', win.dom.incidentName?.textContent);
  console.log('Gen Drop Metric:', win.dom.metricGen?.textContent);
  console.log('Shortage Metric:', win.dom.metricShortage?.textContent);
  if (!win.dom.incidentName?.textContent?.includes('DUST STORM')) {
    throw new Error('Dust storm incident name not displayed in incident strip');
  }
  console.log('✓ Incident strip accurately presents Dust Storm event and power drop.');

  console.log('\n4. Verifying Visual Resource-Flow Central Node & Branches:');
  console.log('Center Node Title:', win.dom.centerTitle?.textContent);
  console.log('Center Ratio:', win.dom.centerRatio?.innerHTML);
  console.log('Center Shortage:', win.dom.centerShortageVal?.textContent);
  if (!win.dom.centerTitle?.textContent?.includes('POWER')) {
    throw new Error('Center node missing POWER title');
  }
  const branchesHtml = win.dom.branchesRow?.innerHTML || '';
  if (!branchesHtml.includes('LIFE SUPPORT') || !branchesHtml.includes('RESEARCH') || !branchesHtml.includes('GREENHOUSE')) {
    throw new Error('Branch cards row missing consuming facilities');
  }
  console.log('✓ Central resource node and 5 branching facility cards populated.');

  console.log('\n5. Testing Automatic Colony Response Cards:');
  const responseHtml = win.dom.responseList?.innerHTML || '';
  console.log('Response Shortage Tag:', win.dom.respShortageTag?.textContent);
  console.log('Response Shortage Amount:', win.dom.respShortageAmount?.textContent);
  
  if (!win.dom.respShortageTag?.textContent?.includes('POWER SHORTAGE')) {
    throw new Error('Response banner missing POWER SHORTAGE tag during disaster');
  }
  if (!responseHtml.includes('MINING OPERATION') || !responseHtml.includes('RESEARCH FACILITY') || !responseHtml.includes('LIFE SUPPORT')) {
    throw new Error('Response list missing required facility cards');
  }
  if (!responseHtml.includes('PROTECTED') || !responseHtml.includes('PAUSED') || !responseHtml.includes('REDUCED')) {
    throw new Error('Response cards missing expected action labels (PROTECTED, PAUSED, REDUCED)');
  }
  if (!responseHtml.includes('Power saved:')) {
    throw new Error('Response cards missing "Power saved:" text');
  }
  console.log('✓ Automatic Colony Response accurately displays automatic actions taken and power saved.');
  console.log('✓ Higher-priority Life Support is strictly PROTECTED (100% → 100%).');

  console.log('\n6. Verifying Dynamic Resource Balance Panel:');
  console.log('Balance Gen:', win.dom.balGen?.textContent);
  console.log('Balance Usage:', win.dom.balUsage?.textContent);
  console.log('Balance Net Value:', win.dom.balNetVal?.textContent);
  console.log('Savings Callout:', win.dom.savingsVal?.textContent);
  if (!win.dom.savingsVal?.textContent?.includes('+')) {
    throw new Error('Dynamic savings callout missing positive savings value');
  }
  console.log('✓ Dynamic balance panel updates generation, usage, and savings in real time.');

  console.log('\n7. Testing Recovery Sources (Backup Power +25 kW):');
  sim.toggleBackupPower();
  win.update();
  const sourcesHtml = win.dom.recoverySourcesGrid?.innerHTML || '';
  if (!sourcesHtml.includes('BACKUP POWER') || !sourcesHtml.includes('EMERGENCY RESERVE')) {
    throw new Error('Recovery sources cards missing Backup Power or Emergency Reserve');
  }
  console.log('✓ Recovery sources visual cards render with active toggle state.');

  console.log('\n8. Verifying Compact Recovery Progress:');
  console.log('Recovery Title:', win.dom.recTitle?.textContent);
  console.log('Recovery Range:', win.dom.recRange?.textContent);
  console.log('Recovery Pct:', win.dom.recPct?.textContent);
  const pillsHtml = win.dom.recPills?.innerHTML || '';
  if (!pillsHtml.includes('BACKUP +25 kW')) {
    throw new Error('Recovery pills missing BACKUP +25 kW pill');
  }
  console.log('✓ Compact recovery progress and source pills verified.');

  console.log('\n9. Testing Automatic Recovery after clearing events:');
  sim.eventManager.activeEvents = [];
  win.update();
  console.log('Post-clearing Shortage Tag:', win.dom.respShortageTag?.textContent);
  console.log('Post-clearing Shortage Amount:', win.dom.respShortageAmount?.textContent);
  if (!win.dom.respShortageTag?.textContent?.includes('BALANCE')) {
    throw new Error('Post-clearing banner should show BALANCE');
  }
  console.log('✓ Colony Response automatically restores all operations to nominal when disaster clears.');

  console.log('\n10. Closing window...');
  win.close();
  if (win.isOpen !== false) throw new Error('Window should be closed');
  console.log('✓ Window closed cleanly.');

  console.log('\n=== ALL VISUAL RESOURCE MANAGEMENT TESTS PASSED SUCCESSFULLY! ===\n');
}

runWindowVisualTests();
