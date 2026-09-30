/**
 * FacilityConfig.js — Central configuration and data model for Colony Facility Inspector.
 * Prepared for clean decoupled data-driven architecture (Java OOP -> API/JSON -> Inspector).
 * Provides full master card metadata, visual previews, resource metrics, and performance charts.
 */

/**
 * ONE Centralized mapping between facility / structure type and background-removed image file.
 * Uses the exact real filenames inside /assets/structure icon/.
 */
export const STRUCTURE_IMAGE_MAP = {
  // Uppercase facility types
  LAUNCHING_PAD: '/assets/structure icon bg/launch centre.png',
  COMMAND_CORE: '/assets/structure icon bg/central command core.png',
  SOLAR_ARRAY: '/assets/structure icon bg/solar power array.png',
  CEA_GREENHOUSE: '/assets/structure icon bg/CEA greenhouse.png',
  RESEARCH_CENTRE: '/assets/structure icon bg/research centre.png',
  POWER_SYSTEM: '/assets/structure icon bg/power system.png',
  HABITAT: '/assets/structure icon bg/habitat.png',
  WATER_EXTRACTION: '/assets/structure icon bg/water extaration.png',
  AUTOMATED_MINING: '/assets/structure icon bg/automated mining.png',
  OXYGEN_GENERATION: '/assets/structure icon bg/oxygen generartion.png',
  STORAGE_DEPOT: '/assets/structure icon bg/storage centre.png',
  STORAGE: '/assets/structure icon bg/storage.png',

  // ID and alias mappings (for 3D scene node names, IDs, titles, and types)
  rocket: '/assets/structure icon bg/launch centre.png',
  central_hub: '/assets/structure icon bg/central command core.png',
  solar: '/assets/structure icon bg/solar power array.png',
  greenhouse: '/assets/structure icon bg/CEA greenhouse.png',
  research_lab: '/assets/structure icon bg/research centre.png',
  power: '/assets/structure icon bg/power system.png',
  habitat: '/assets/structure icon bg/habitat.png',
  water: '/assets/structure icon bg/water extaration.png',
  mining: '/assets/structure icon bg/automated mining.png',
  oxygen: '/assets/structure icon bg/oxygen generartion.png',
  storage_depot: '/assets/structure icon bg/storage centre.png',
  battery: '/assets/structure icon bg/storage.png',
  storage: '/assets/structure icon bg/storage.png'
};

/**
 * Resolves the matching background-removed structure image from /assets/structure icon bg/
 * based on selected facility id, type, title, name, or object.
 *
 * @param {string|object} facility - Facility ID, type name, title, or facility data object
 * @returns {string} Image path in /assets/structure icon bg/
 */
export function getStructureImage(facility) {
  if (!facility) return STRUCTURE_IMAGE_MAP.CEA_GREENHOUSE;

  // If already an image path pointing to structure icon
  if (typeof facility === 'string' && (facility.startsWith('/assets/structure icon') || facility.startsWith('/assets/structure_icon'))) {
    return facility;
  }

  // If facility object passed
  if (typeof facility === 'object') {
    if (facility.image && typeof facility.image === 'string') return facility.image;
    // Check properties in priority order: type, id, title, name, subtitle
    const candidateKeys = [facility.type, facility.id, facility.title, facility.name, facility.subtitle];
    for (const cand of candidateKeys) {
      if (cand) {
        const found = getStructureImage(cand);
        if (found) return found;
      }
    }
  }

  // String lookup
  const raw = String(facility).trim();
  const upper = raw.toUpperCase().replace(/[\s\-_]+/g, '_');
  if (STRUCTURE_IMAGE_MAP[upper]) return STRUCTURE_IMAGE_MAP[upper];

  const lower = raw.toLowerCase();
  if (STRUCTURE_IMAGE_MAP[lower]) return STRUCTURE_IMAGE_MAP[lower];

  const clean = lower.replace(/[\s\-_]+/g, '');

  if (clean.includes('launch') || clean.includes('pad') || clean.includes('starship') || clean.includes('landing')) {
    return STRUCTURE_IMAGE_MAP.LAUNCHING_PAD;
  }
  if (clean.includes('command') || clean.includes('core') || clean.includes('hub')) {
    return STRUCTURE_IMAGE_MAP.COMMAND_CORE;
  }
  if (clean.includes('solar') || clean.includes('heliostat')) {
    return STRUCTURE_IMAGE_MAP.SOLAR_ARRAY;
  }
  if (clean.includes('greenhouse') || clean.includes('biodome') || clean.includes('cea') || clean.includes('agri')) {
    return STRUCTURE_IMAGE_MAP.CEA_GREENHOUSE;
  }
  if (clean.includes('research') || clean.includes('lab') || clean.includes('centre') || clean.includes('center') || clean.includes('science')) {
    return STRUCTURE_IMAGE_MAP.RESEARCH_CENTRE;
  }
  if (clean.includes('power') || clean.includes('fission') || clean.includes('reactor') || clean.includes('station')) {
    return STRUCTURE_IMAGE_MAP.POWER_SYSTEM;
  }
  if (clean.includes('hab') || clean.includes('quarter') || clean.includes('crew')) {
    return STRUCTURE_IMAGE_MAP.HABITAT;
  }
  if (clean.includes('water') || clean.includes('well') || clean.includes('extractor') || clean.includes('extract')) {
    return STRUCTURE_IMAGE_MAP.WATER_EXTRACTION;
  }
  if (clean.includes('mining') || clean.includes('auger') || clean.includes('excavat')) {
    return STRUCTURE_IMAGE_MAP.AUTOMATED_MINING;
  }
  if (clean.includes('oxygen') || clean.includes('moxie') || clean.includes('o2')) {
    return STRUCTURE_IMAGE_MAP.OXYGEN_GENERATION;
  }
  if (clean.includes('depot') || clean.includes('deposit')) {
    return STRUCTURE_IMAGE_MAP.STORAGE_DEPOT;
  }
  if (clean.includes('storage') || clean.includes('battery')) {
    return STRUCTURE_IMAGE_MAP.STORAGE;
  }

  return STRUCTURE_IMAGE_MAP.CEA_GREENHOUSE;
}

export const FACILITY_CONFIG = {
  greenhouse: {
    id: 'greenhouse',
    type: 'CEA_GREENHOUSE',
    category: 'AGRICULTURE',
    title: 'CEA BIO-DOME',
    subtitle: 'Controlled Environment Agriculture',
    description: 'Producing food and biomass for the colony through hydroponic farming in a controlled environment.',
    sector: 'SECTOR BETA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 4',
    phaseSub: 'EXPANDED',
    accentColor: '#10b981',
    image: STRUCTURE_IMAGE_MAP.CEA_GREENHOUSE,
    metricPercent: 86,
    metricLabel: 'PRODUCTION RATE',
    graphLabel: 'OUTPUT (kg / Sol)',
    graphChange: '+12%',
    graphPoints: [110, 132, 118, 145, 126, 160, 148, 156],
    graphYLabels: ['200', '150', '100', '50', '0'],
    resources: [
      { name: 'WATER', value: '-20 L / Sol', type: 'Input', icon: 'water', color: '#38bdf8' },
      { name: 'ENERGY', value: '-6 kW', type: 'Input', icon: 'energy', color: '#f59e0b' },
      { name: 'FOOD', value: '+15 kg / Sol', type: 'Output', icon: 'food', color: '#10b981' },
      { name: 'OXYGEN', value: '+2 kg / Sol', type: 'Byproduct', icon: 'oxygen', color: '#34d399' }
    ],
    efficiency: 96,
    nextLabel: 'NEXT OUTPUT',
    nextValue: 'In 6 Sols'
  },

  habitat: {
    id: 'habitat',
    type: 'HABITAT',
    category: 'HABITATION',
    title: 'CREW HABITAT',
    subtitle: 'Life Support & Living Quarters',
    description: 'Pressurized habitat modules providing radiation shielding, atmospheric recirculation, and living quarters for active personnel.',
    sector: 'SECTOR ALPHA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 3',
    phaseSub: 'EXPANDED',
    accentColor: '#06b6d4',
    image: STRUCTURE_IMAGE_MAP.HABITAT,
    metricPercent: 94,
    metricLabel: 'HABITABILITY',
    graphLabel: 'OCCUPANCY & HEALTH',
    graphChange: '+5%',
    graphPoints: [78, 84, 88, 86, 92, 95, 93, 94],
    graphYLabels: ['100', '80', '60', '40', '0'],
    resources: [
      { name: 'OXYGEN', value: '-6 kg / Sol', type: 'Input', icon: 'oxygen', color: '#34d399' },
      { name: 'WATER', value: '-8 L / Sol', type: 'Input', icon: 'water', color: '#38bdf8' },
      { name: 'ENERGY', value: '-10 kW', type: 'Input', icon: 'energy', color: '#f59e0b' },
      { name: 'FOOD', value: '-5 kg / Sol', type: 'Input', icon: 'food', color: '#10b981' }
    ],
    efficiency: 98,
    nextLabel: 'CREW ROTATION',
    nextValue: 'In 4 Sols'
  },

  power: {
    id: 'power',
    type: 'POWER_SYSTEM',
    category: 'POWER SYSTEMS',
    title: 'FISSION POWER STATION',
    subtitle: 'Compact Nuclear Reactor Array',
    description: 'Continuous baseline thermal fission reactor delivering dependable, weather-independent electrical generation to the colony grid.',
    sector: 'SECTOR GAMMA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 3',
    phaseSub: 'ONLINE',
    accentColor: '#f59e0b',
    image: STRUCTURE_IMAGE_MAP.POWER_SYSTEM,
    metricPercent: 92,
    metricLabel: 'CORE OUTPUT',
    graphLabel: 'GENERATION (kW)',
    graphChange: '+8%',
    graphPoints: [26, 29, 31, 30, 32, 32, 32, 32],
    graphYLabels: ['40', '30', '20', '10', '0'],
    resources: [
      { name: 'ENERGY', value: '+32 kW', type: 'Output', icon: 'energy', color: '#f59e0b' },
      { name: 'WATER', value: '-4 L / Sol', type: 'Coolant', icon: 'water', color: '#38bdf8' },
      { name: 'THERMAL', value: '+18 kW', type: 'Byproduct', icon: 'thermal', color: '#fb923c' },
      { name: 'GRID LOAD', value: '84%', type: 'Utilization', icon: 'grid', color: '#e2e8f0' }
    ],
    efficiency: 94,
    nextLabel: 'NEXT SERVICE',
    nextValue: 'In 14 Sols'
  },

  water: {
    id: 'water',
    type: 'WATER_EXTRACTION',
    category: 'WATER SYSTEMS',
    title: 'WATER EXTRACTOR',
    subtitle: 'Subsurface Glacial Well & Purifier',
    description: 'Deep-regolith thermal mining drill extracting subterranean permafrost ice for automated chemical purification into potable water.',
    sector: 'SECTOR DELTA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 2',
    phaseSub: 'EXPANDED',
    accentColor: '#0284c7',
    image: STRUCTURE_IMAGE_MAP.WATER_EXTRACTION,
    metricPercent: 88,
    metricLabel: 'EXTRACTION RATE',
    graphLabel: 'PURIFIED WATER (L / Sol)',
    graphChange: '+15%',
    graphPoints: [22, 28, 35, 34, 39, 42, 40, 41],
    graphYLabels: ['50', '40', '30', '20', '0'],
    resources: [
      { name: 'WATER', value: '+40 L / Sol', type: 'Output', icon: 'water', color: '#38bdf8' },
      { name: 'ENERGY', value: '-8 kW', type: 'Input', icon: 'energy', color: '#f59e0b' },
      { name: 'MINERALS', value: '+3 kg / Sol', type: 'Byproduct', icon: 'minerals', color: '#cbd5e1' },
      { name: 'FILTER LIFE', value: '91%', type: 'Integrity', icon: 'filter', color: '#34d399' }
    ],
    efficiency: 89,
    nextLabel: 'NEXT FILTER SERVICE',
    nextValue: 'In 9 Sols'
  },

  research_lab: {
    id: 'research_lab',
    type: 'RESEARCH_CENTRE',
    category: 'RESEARCH',
    title: 'RESEARCH LABORATORY',
    subtitle: 'Astrobiology & Materials Science',
    description: 'Advanced analytical center examining Martian geological strata, synthetic biology, and atmospheric ISRU breakthroughs.',
    sector: 'SECTOR EPSILON',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 2',
    phaseSub: 'ANALYSIS',
    accentColor: '#a855f7',
    image: STRUCTURE_IMAGE_MAP.RESEARCH_CENTRE,
    metricPercent: 79,
    metricLabel: 'DISCOVERY RATE',
    graphLabel: 'RESEARCH POINTS (RP / Sol)',
    graphChange: '+18%',
    graphPoints: [10, 14, 18, 16, 21, 25, 23, 24],
    graphYLabels: ['30', '25', '20', '15', '0'],
    resources: [
      { name: 'ENERGY', value: '-4 kW', type: 'Input', icon: 'energy', color: '#f59e0b' },
      { name: 'WATER', value: '-1 L / Sol', type: 'Input', icon: 'water', color: '#38bdf8' },
      { name: 'DATA LINK', value: '+28 MB / Sol', type: 'Output', icon: 'data', color: '#a855f7' },
      { name: 'UPLINK', value: '100%', type: 'Optimal', icon: 'comms', color: '#34d399' }
    ],
    efficiency: 91,
    nextLabel: 'NEXT BREAKTHROUGH',
    nextValue: 'In 8 Sols'
  },

  rocket: {
    id: 'rocket',
    type: 'LAUNCHING_PAD',
    category: 'LOGISTICS',
    title: 'LANDING ZONE',
    subtitle: 'Starship Pad & Surface Cargo Port',
    description: 'Automated launch/landing pad equipped with LOX/CH4 fueling umbilicals, flame diverters, and rapid cargo handling cranes.',
    sector: 'SECTOR ZETA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 4',
    phaseSub: 'READY',
    accentColor: '#f97316',
    image: STRUCTURE_IMAGE_MAP.LAUNCHING_PAD,
    metricPercent: 100,
    metricLabel: 'PAD READINESS',
    graphLabel: 'CARGO CAPACITY (Tons)',
    graphChange: '+20%',
    graphPoints: [60, 68, 75, 80, 85, 92, 98, 100],
    graphYLabels: ['100', '75', '50', '25', '0'],
    resources: [
      { name: 'ENERGY', value: '-1 kW', type: 'Standby', icon: 'energy', color: '#f59e0b' },
      { name: 'PROPELLANT', value: '92%', type: 'Cryo Tanks', icon: 'fuel', color: '#f97316' },
      { name: 'CARGO BERTH', value: '4 / 4', type: 'Cleared', icon: 'cargo', color: '#34d399' },
      { name: 'COMMS LINK', value: 'Low Latency', type: 'Earth Relay', icon: 'comms', color: '#38bdf8' }
    ],
    efficiency: 100,
    nextLabel: 'NEXT SHIP ARRIVAL',
    nextValue: 'In 12 Sols'
  },

  solar: {
    id: 'solar',
    type: 'SOLAR_ARRAY',
    category: 'POWER SYSTEMS',
    title: 'SOLAR POWER ARRAY',
    subtitle: 'Photovoltaic Heliostat Farm',
    description: 'High-efficiency dual-axis tracking solar panels capturing Martian irradiance to supplement the primary power grid.',
    sector: 'SECTOR GAMMA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 3',
    phaseSub: 'TRACKING',
    accentColor: '#f59e0b',
    image: STRUCTURE_IMAGE_MAP.SOLAR_ARRAY,
    metricPercent: 88,
    metricLabel: 'PEAK SUNLIGHT',
    graphLabel: 'OUTPUT (kW)',
    graphChange: '+10%',
    graphPoints: [30, 36, 42, 45, 45, 42, 38, 35],
    graphYLabels: ['50', '40', '30', '20', '0'],
    resources: [
      { name: 'ENERGY', value: '+45 kW', type: 'Peak Daylight', icon: 'energy', color: '#f59e0b' },
      { name: 'DUST COAT', value: '4%', type: 'Clean', icon: 'filter', color: '#34d399' },
      { name: 'ALIGNMENT', value: '99%', type: 'Optimal', icon: 'grid', color: '#38bdf8' },
      { name: 'GRID DEMAND', value: '72%', type: 'Absorbed', icon: 'energy', color: '#e2e8f0' }
    ],
    efficiency: 92,
    nextLabel: 'DUSK SHUTOFF',
    nextValue: 'In 5 Hours'
  },

  oxygen: {
    id: 'oxygen',
    type: 'OXYGEN_GENERATION',
    category: 'LIFE SUPPORT',
    title: 'MOXIE OXYGEN PLANT',
    subtitle: 'CO2 Solid Oxide Electrolysis',
    description: 'Compresses ambient Martian CO2 atmosphere and electrochemically strips carbon monoxide to produce breathable O2.',
    sector: 'SECTOR ALPHA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 3',
    phaseSub: 'REFINING',
    accentColor: '#10b981',
    image: STRUCTURE_IMAGE_MAP.OXYGEN_GENERATION,
    metricPercent: 91,
    metricLabel: 'ELECTROLYSIS',
    graphLabel: 'O2 YIELD (kg / Sol)',
    graphChange: '+9%',
    graphPoints: [8, 9, 10, 11, 11, 12, 12, 12],
    graphYLabels: ['15', '12', '9', '6', '0'],
    resources: [
      { name: 'OXYGEN', value: '+12 kg / Sol', type: 'Output', icon: 'oxygen', color: '#34d399' },
      { name: 'ENERGY', value: '-6 kW', type: 'Input', icon: 'energy', color: '#f59e0b' },
      { name: 'CO2 INTAKE', value: '24 kg / Sol', type: 'Ambient', icon: 'co2', color: '#cbd5e1' },
      { name: 'PURITY', value: '99.8%', type: 'Medical Grade', icon: 'filter', color: '#10b981' }
    ],
    efficiency: 95,
    nextLabel: 'FILTER CYCLING',
    nextValue: 'In 7 Sols'
  },

  central_hub: {
    id: 'central_hub',
    type: 'COMMAND_CORE',
    category: 'OPERATIONS',
    title: 'CENTRAL COMMAND CORE',
    subtitle: 'Mission Telemetry & AI Systems',
    description: 'Central nerve center hosting planetary communication relays, environmental life-support computers, and colony AI supervisor.',
    sector: 'SECTOR EPSILON',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 4',
    phaseSub: 'ONLINE',
    accentColor: '#06b6d4',
    image: STRUCTURE_IMAGE_MAP.COMMAND_CORE,
    metricPercent: 99,
    metricLabel: 'GRID UPTIME',
    graphLabel: 'TELEMETRY LOAD',
    graphChange: '+3%',
    graphPoints: [95, 96, 98, 97, 99, 99, 99, 99],
    graphYLabels: ['100', '80', '60', '40', '0'],
    resources: [
      { name: 'ENERGY', value: '-3 kW', type: 'Input', icon: 'energy', color: '#f59e0b' },
      { name: 'AI UPTIME', value: '99.9%', type: 'Continuous', icon: 'data', color: '#06b6d4' },
      { name: 'COMM RELAY', value: 'Nominal', type: 'Direct Earth', icon: 'comms', color: '#34d399' },
      { name: 'GRID LATENCY', value: '1.2 ms', type: 'Local Fiber', icon: 'grid', color: '#e2e8f0' }
    ],
    efficiency: 99,
    nextLabel: 'AI SYNC CYCLE',
    nextValue: 'In 2 Sols'
  },

  mining: {
    id: 'mining',
    type: 'AUTOMATED_MINING',
    category: 'LOGISTICS',
    title: 'REGOLITH MINING AUGER',
    subtitle: 'Automated Excavation System',
    description: 'Autonomous continuous excavator harvesting Martian iron oxides and silicon-rich regolith for colony construction and 3D printing.',
    sector: 'SECTOR ZETA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 2',
    phaseSub: 'DIGGING',
    accentColor: '#d97706',
    image: STRUCTURE_IMAGE_MAP.AUTOMATED_MINING,
    metricPercent: 82,
    metricLabel: 'EXCAVATION YIELD',
    graphLabel: 'REGOLITH (Tons / Sol)',
    graphChange: '+14%',
    graphPoints: [18, 22, 26, 25, 29, 34, 32, 33],
    graphYLabels: ['40', '30', '20', '10', '0'],
    resources: [
      { name: 'ENERGY', value: '-5 kW', type: 'Input', icon: 'energy', color: '#f59e0b' },
      { name: 'REGOLITH', value: '+35 T / Sol', type: 'Output', icon: 'minerals', color: '#d97706' },
      { name: 'SILICON', value: '+8 T / Sol', type: 'Byproduct', icon: 'minerals', color: '#cbd5e1' },
      { name: 'AUGER BIT', value: '88%', type: 'Integrity', icon: 'filter', color: '#34d399' }
    ],
    efficiency: 88,
    nextLabel: 'BIN DUMP CYCLE',
    nextValue: 'In 3 Sols'
  },

  storage_depot: {
    id: 'storage_depot',
    type: 'STORAGE_DEPOT',
    category: 'RESOURCE STORAGE',
    title: 'STORAGE DEPOT',
    subtitle: 'COLONY RESOURCE STORAGE',
    description: 'Automated surface vault storing critical resources, regolith feedstock, water containers, and emergency replacement modules.',
    sector: 'SECTOR ZETA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 3',
    phaseSub: 'STORAGE BUFFER',
    accentColor: '#38bdf8',
    image: STRUCTURE_IMAGE_MAP.STORAGE_DEPOT,
    metricPercent: 78,
    metricLabel: 'STORED CAPACITY',
    graphLabel: 'STORED VOLUME (Tons)',
    graphChange: '+8%',
    graphPoints: [320, 340, 360, 375, 380, 385, 390, 392],
    graphYLabels: ['500', '400', '300', '200', '0'],
    resources: [
      { name: 'TOTAL CAPACITY', value: '500 Tons', type: 'Max Vault Volume', icon: 'cargo', color: '#38bdf8' },
      { name: 'STORED RESOURCES', value: '392 Tons', type: 'Active Buffer', icon: 'minerals', color: '#fbbf24' },
      { name: 'AVAILABLE CAPACITY', value: '108 Tons', type: 'Free Vault Bay', icon: 'filter', color: '#34d399' },
      { name: 'RESOURCE FLOW', value: '+3.2 T / Sol', type: 'Mining Inflow', icon: 'tools', color: '#cbd5e1' }
    ],
    efficiency: 94,
    nextLabel: 'INVENTORY AUDIT',
    nextValue: 'In 5 Sols'
  },

  battery: {
    id: 'battery',
    type: 'STORAGE',
    category: 'POWER SYSTEMS',
    title: 'ENERGY STORAGE',
    subtitle: 'BATTERY STORAGE ARRAY',
    description: 'Subsurface solid-state lithium-sulfur battery banks buffering daytime solar surges and providing uninterrupted power during Martian night.',
    sector: 'SECTOR GAMMA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 3',
    phaseSub: 'GRID BUFFER',
    accentColor: '#f59e0b',
    image: STRUCTURE_IMAGE_MAP.STORAGE,
    metricPercent: 96,
    metricLabel: 'CHARGE LEVEL',
    graphLabel: 'GRID BUFFER (kWh)',
    graphChange: '+5%',
    graphPoints: [420, 440, 460, 455, 470, 480, 475, 480],
    graphYLabels: ['500', '400', '300', '200', '0'],
    resources: [
      { name: 'CHARGE LEVEL', value: '96% (480 kWh)', type: 'Grid Buffer', icon: 'energy', color: '#f59e0b' },
      { name: 'TOTAL CAPACITY', value: '500 kWh', type: 'Solid-State Cells', icon: 'grid', color: '#38bdf8' },
      { name: 'BUFFER STATE', value: 'CHARGING / READY', type: 'Grid Balancing', icon: 'filter', color: '#34d399' },
      { name: 'BACKUP AVAILABILITY', value: '+25 kW Ready', type: 'Emergency Reserve', icon: 'shield', color: '#a78bfa' }
    ],
    efficiency: 96,
    nextLabel: 'CELL BALANCING',
    nextValue: 'Continuous'
  },

  storage: {
    id: 'storage',
    type: 'STORAGE',
    category: 'RESOURCE STORAGE',
    title: 'STORAGE',
    subtitle: 'COLONY BUFFER VAULT',
    description: 'Automated colony storage facility managing strategic reserves, structural components, and buffered supplies.',
    sector: 'SECTOR ZETA',
    status: 'OPERATIONAL',
    condition: 'OPTIMAL',
    phase: 'PHASE 3',
    phaseSub: 'STORAGE BUFFER',
    accentColor: '#38bdf8',
    image: STRUCTURE_IMAGE_MAP.STORAGE,
    metricPercent: 85,
    metricLabel: 'STORAGE LEVEL',
    graphLabel: 'BUFFER CAPACITY (%)',
    graphChange: '+6%',
    graphPoints: [70, 72, 75, 78, 80, 82, 84, 85],
    graphYLabels: ['100', '80', '60', '40', '0'],
    resources: [
      { name: 'SUPPLIES', value: '450 Tons', type: 'Buffer', icon: 'cargo', color: '#38bdf8' },
      { name: 'PARTS', value: '88% Stock', type: 'Modular', icon: 'tools', color: '#34d399' },
      { name: 'CAPACITY', value: '500 Tons', type: 'Max Vault', icon: 'filter', color: '#cbd5e1' },
      { name: 'ENERGY', value: '-2 kW', type: 'Climate', icon: 'energy', color: '#f59e0b' }
    ],
    efficiency: 95,
    nextLabel: 'AUDIT CYCLE',
    nextValue: 'In 3 Sols'
  }
};

/**
 * Returns facility configuration data.
 * Can easily be swapped with `fetch('/api/facilities/' + id)` or Java backend.
 */
export function getFacilityProfile(id) {
  if (!id) return FACILITY_CONFIG.greenhouse;

  if (typeof id === 'object') {
    return getFacilityProfile(id.id || id.type || id.title || id.name);
  }

  const raw = String(id).trim().toLowerCase();
  if (FACILITY_CONFIG[raw]) return FACILITY_CONFIG[raw];

  const norm = raw.replace(/[\s\-_]+/g, '');

  for (const [k, v] of Object.entries(FACILITY_CONFIG)) {
    if (k.replace(/[\s\-_]+/g, '') === norm) return v;
    if (v.title && v.title.toLowerCase().replace(/[\s\-_]+/g, '') === norm) return v;
    if (v.type && v.type.toLowerCase().replace(/[\s\-_]+/g, '') === norm) return v;
  }

  if (norm.includes('launch') || norm.includes('pad') || norm.includes('starship') || norm.includes('landing')) return FACILITY_CONFIG.rocket;
  if (norm.includes('command') || norm.includes('core') || norm.includes('hub')) return FACILITY_CONFIG.central_hub;
  if (norm.includes('solar') || norm.includes('heliostat')) return FACILITY_CONFIG.solar;
  if (norm.includes('greenhouse') || norm.includes('biodome') || norm.includes('cea') || norm.includes('agri')) return FACILITY_CONFIG.greenhouse;
  if (norm.includes('research') || norm.includes('lab') || norm.includes('centre') || norm.includes('center') || norm.includes('science')) return FACILITY_CONFIG.research_lab;
  if (norm.includes('fission') || norm.includes('power') || norm.includes('reactor') || norm.includes('station')) return FACILITY_CONFIG.power;
  if (norm.includes('hab') || norm.includes('quarter') || norm.includes('crew')) return FACILITY_CONFIG.habitat;
  if (norm.includes('water') || norm.includes('well') || norm.includes('extractor') || norm.includes('extract')) return FACILITY_CONFIG.water;
  if (norm.includes('mining') || norm.includes('auger') || norm.includes('excavat')) return FACILITY_CONFIG.mining;
  if (norm.includes('oxygen') || norm.includes('moxie') || norm.includes('o2')) return FACILITY_CONFIG.oxygen;
  if (norm.includes('deposit') || norm.includes('depot')) return FACILITY_CONFIG.storage_depot;
  if (norm.includes('battery') || norm.includes('storage')) return FACILITY_CONFIG.storage;

  return FACILITY_CONFIG[id] || FACILITY_CONFIG.greenhouse;
}
