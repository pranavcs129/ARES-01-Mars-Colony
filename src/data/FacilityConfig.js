/**
 * FacilityConfig.js — Central configuration and data model for Colony Facility Inspector.
 * Prepared for clean decoupled data-driven architecture (Java OOP -> API/JSON -> Inspector).
 * Provides full master card metadata, visual previews, resource metrics, and performance charts.
 */

export const FACILITY_CONFIG = {
  greenhouse: {
    id: 'greenhouse',
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
    nextValue: 'In 6 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gh-glass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.85"/>
            <stop offset="60%" stop-color="#059669" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#047857" stop-opacity="0.9"/>
          </linearGradient>
          <linearGradient id="gh-base" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#475569"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
        </defs>
        <!-- Ground foundation slab -->
        <polygon points="70,12 132,45 68,78 6,45" fill="url(#gh-base)" stroke="#64748b" stroke-width="1.2" opacity="0.9"/>
        <!-- Rear Bio-dome -->
        <g transform="translate(18, -4)">
          <path d="M42,28 C42,16 66,10 82,18 C98,26 102,40 102,46 L62,56 Z" fill="url(#gh-glass)" stroke="#e2e8f0" stroke-width="0.9"/>
          <path d="M42,28 C50,22 72,14 82,18" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>
          <path d="M52,35 C62,26 80,22 88,27" stroke="#ffffff" stroke-width="0.8" opacity="0.5"/>
        </g>
        <!-- Front Bio-dome -->
        <g transform="translate(-4, 10)">
          <path d="M42,28 C42,16 66,10 82,18 C98,26 102,40 102,46 L62,56 Z" fill="url(#gh-glass)" stroke="#e2e8f0" stroke-width="1.1"/>
          <!-- Vault ribs -->
          <path d="M42,28 C50,22 72,14 82,18" stroke="#ffffff" stroke-width="1.4" opacity="0.75"/>
          <path d="M52,35 C62,26 80,22 88,27" stroke="#ffffff" stroke-width="1" opacity="0.6"/>
          <path d="M62,42 C72,33 90,29 98,34" stroke="#ffffff" stroke-width="0.8" opacity="0.4"/>
          <!-- Entrance airlock block -->
          <polygon points="40,32 50,27 50,42 40,47" fill="#cbd5e1" stroke="#475569" stroke-width="0.8"/>
        </g>
      </svg>
    `
  },

  habitat: {
    id: 'habitat',
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
    nextValue: 'In 4 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hab-white" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc"/>
            <stop offset="60%" stop-color="#cbd5e1"/>
            <stop offset="100%" stop-color="#64748b"/>
          </linearGradient>
          <linearGradient id="hab-accent" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#0891b2"/>
          </linearGradient>
        </defs>
        <!-- Ground slab -->
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <!-- Central Primary Dome -->
        <circle cx="68" cy="42" r="22" fill="url(#hab-white)" stroke="#94a3b8" stroke-width="1"/>
        <circle cx="68" cy="42" r="16" fill="url(#hab-accent)" opacity="0.85"/>
        <circle cx="64" cy="38" r="6" fill="#ffffff" opacity="0.5"/>
        <!-- Satellite Modules -->
        <circle cx="38" cy="34" r="12" fill="url(#hab-white)" stroke="#94a3b8" stroke-width="1"/>
        <line x1="48" y1="38" x2="56" y2="40" stroke="#cbd5e1" stroke-width="4"/>
        <circle cx="98" cy="46" r="13" fill="url(#hab-white)" stroke="#94a3b8" stroke-width="1"/>
        <line x1="82" y1="44" x2="88" y2="45" stroke="#cbd5e1" stroke-width="4"/>
        <circle cx="58" cy="62" r="10" fill="url(#hab-white)" stroke="#94a3b8" stroke-width="1"/>
        <line x1="62" y1="54" x2="60" y2="58" stroke="#cbd5e1" stroke-width="3.5"/>
      </svg>
    `
  },

  power: {
    id: 'power',
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
    nextValue: 'In 14 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pwr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <!-- Reactor Housing -->
        <polygon points="50,28 78,16 94,26 66,38" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
        <polygon points="50,28 66,38 66,60 50,50" fill="#94a3b8"/>
        <polygon points="66,38 94,26 94,48 66,60" fill="#64748b"/>
        <!-- Glowing Core Core Conduit -->
        <circle cx="72" cy="30" r="7" fill="url(#pwr-grad)"/>
        <circle cx="72" cy="30" r="3.5" fill="#fef08a"/>
        <!-- Radiator Fins -->
        <line x1="98" y1="36" x2="114" y2="45" stroke="#f59e0b" stroke-width="2.5"/>
        <line x1="100" y1="42" x2="116" y2="51" stroke="#f59e0b" stroke-width="2.5"/>
        <line x1="102" y1="48" x2="118" y2="57" stroke="#f59e0b" stroke-width="2.5"/>
      </svg>
    `
  },

  water: {
    id: 'water',
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
    nextValue: 'In 9 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wat-cyl" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <!-- Rig Mast Structure -->
        <line x1="68" y1="18" x2="68" y2="58" stroke="#e2e8f0" stroke-width="3"/>
        <polygon points="68,16 62,32 74,32" fill="#38bdf8"/>
        <line x1="56" y1="52" x2="68" y2="30" stroke="#94a3b8" stroke-width="1.5"/>
        <line x1="80" y1="52" x2="68" y2="30" stroke="#94a3b8" stroke-width="1.5"/>
        <!-- Storage Condensation Tanks -->
        <rect x="36" y="38" width="14" height="20" rx="4" fill="url(#wat-cyl)" stroke="#7dd3fc" stroke-width="0.8"/>
        <rect x="86" y="38" width="14" height="20" rx="4" fill="url(#wat-cyl)" stroke="#7dd3fc" stroke-width="0.8"/>
        <!-- Conduit lines -->
        <path d="M50,48 Q60,54 68,54 T86,48" stroke="#38bdf8" stroke-width="1.4" fill="none"/>
      </svg>
    `
  },

  research_lab: {
    id: 'research_lab',
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
    nextValue: 'In 8 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="res-dish" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#c084fc"/>
            <stop offset="100%" stop-color="#7e22ce"/>
          </linearGradient>
        </defs>
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <!-- Lab Hexagonal Complex -->
        <polygon points="46,36 68,24 90,36 90,56 68,68 46,56" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
        <circle cx="68" cy="46" r="10" fill="url(#res-dish)" opacity="0.85"/>
        <!-- Uplink Dish on Gantry -->
        <ellipse cx="68" cy="22" rx="14" ry="7" fill="#e2e8f0" stroke="#a855f7" stroke-width="1.2"/>
        <line x1="68" y1="22" x2="68" y2="13" stroke="#c084fc" stroke-width="1.8"/>
        <circle cx="68" cy="12" r="2" fill="#f0abfc"/>
      </svg>
    `
  },

  rocket: {
    id: 'rocket',
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
    nextValue: 'In 12 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pad-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <!-- Circular Landing Pad Surface -->
        <ellipse cx="68" cy="50" rx="46" ry="24" fill="url(#pad-grad)" stroke="#f97316" stroke-width="1.4"/>
        <ellipse cx="68" cy="50" rx="30" ry="15" fill="none" stroke="#fdba74" stroke-width="0.9" stroke-dasharray="3 3"/>
        <circle cx="68" cy="50" r="6" fill="#f97316" opacity="0.3"/>
        <!-- Starship Rocket Vehicle -->
        <path d="M68,14 C65,22 62,38 62,50 L74,50 C74,38 71,22 68,14 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
        <polygon points="62,42 56,52 62,50" fill="#94a3b8"/>
        <polygon points="74,42 80,52 74,50" fill="#94a3b8"/>
        <path d="M66,50 L68,58 L70,50 Z" fill="#f97316" opacity="0.8"/>
      </svg>
    `
  },

  // Fallback / standard mappings for other colony structures
  solar: {
    id: 'solar',
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
    nextValue: 'In 5 Hours',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <!-- Solar Panels Array -->
        <g transform="translate(30, 20)">
          <polygon points="10,12 36,4 46,16 20,24" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>
          <line x1="20" y1="24" x2="20" y2="34" stroke="#94a3b8" stroke-width="2"/>
        </g>
        <g transform="translate(58, 28)">
          <polygon points="10,12 36,4 46,16 20,24" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>
          <line x1="20" y1="24" x2="20" y2="34" stroke="#94a3b8" stroke-width="2"/>
        </g>
      </svg>
    `
  },

  oxygen: {
    id: 'oxygen',
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
    nextValue: 'In 7 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <rect x="52" y="30" width="36" height="28" rx="4" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
        <circle cx="70" cy="44" r="8" fill="#10b981" opacity="0.8"/>
        <line x1="70" y1="22" x2="70" y2="30" stroke="#34d399" stroke-width="3"/>
      </svg>
    `
  },

  central_hub: {
    id: 'central_hub',
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
    nextValue: 'In 2 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <polygon points="68,20 96,36 96,56 68,72 40,56 40,36" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
        <circle cx="68" cy="46" r="12" fill="#06b6d4" opacity="0.85"/>
        <line x1="68" y1="20" x2="68" y2="10" stroke="#38bdf8" stroke-width="2"/>
      </svg>
    `
  },

  mining: {
    id: 'mining',
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
    nextValue: 'In 3 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <polygon points="50,42 74,28 92,38 68,52" fill="#d97706" stroke="#b45309" stroke-width="1"/>
        <line x1="72" y1="36" x2="108" y2="58" stroke="#f59e0b" stroke-width="4"/>
      </svg>
    `
  },

  storage_depot: {
    id: 'storage_depot',
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
    nextValue: 'In 5 Sols',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="depot-hull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <!-- Main Storage Hangar Body -->
        <polygon points="40,38 70,22 100,38 100,60 70,72 40,60" fill="url(#depot-hull)" stroke="#38bdf8" stroke-width="1.2"/>
        <line x1="70" y1="22" x2="70" y2="72" stroke="#7dd3fc" stroke-width="1.4"/>
        <line x1="40" y1="38" x2="70" y2="48" stroke="#7dd3fc" stroke-width="1"/>
        <line x1="100" y1="38" x2="70" y2="48" stroke="#7dd3fc" stroke-width="1"/>
        <!-- Gantry Crane Track -->
        <rect x="58" y="30" width="24" height="6" rx="1" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8"/>
        <!-- Cargo Pallets -->
        <polygon points="28,52 38,46 48,52 38,58" fill="#fbbf24" opacity="0.85"/>
        <polygon points="92,54 102,48 112,54 102,60" fill="#34d399" opacity="0.85"/>
      </svg>
    `
  },

  battery: {
    id: 'battery',
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
    nextValue: 'Continuous',
    previewSvg: `
      <svg viewBox="0 0 140 85" width="130" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bat-cell" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
        </defs>
        <polygon points="70,12 130,45 68,78 8,45" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <!-- Battery Enclosure Base -->
        <polygon points="42,32 78,20 102,32 66,48" fill="#334155" stroke="#64748b" stroke-width="1"/>
        <!-- Cell 1 -->
        <rect x="46" y="36" width="12" height="24" rx="2" fill="url(#bat-cell)" stroke="#fef08a" stroke-width="0.8"/>
        <line x1="52" y1="33" x2="52" y2="36" stroke="#fbbf24" stroke-width="2"/>
        <!-- Cell 2 -->
        <rect x="64" y="36" width="12" height="24" rx="2" fill="url(#bat-cell)" stroke="#fef08a" stroke-width="0.8"/>
        <line x1="70" y1="33" x2="70" y2="36" stroke="#fbbf24" stroke-width="2"/>
        <!-- Cell 3 -->
        <rect x="82" y="36" width="12" height="24" rx="2" fill="url(#bat-cell)" stroke="#fef08a" stroke-width="0.8"/>
        <line x1="88" y1="33" x2="88" y2="36" stroke="#fbbf24" stroke-width="2"/>
        <!-- Bus connector busbar -->
        <line x1="46" y1="32" x2="94" y2="32" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    `
  }
};

/**
 * Returns facility configuration data.
 * Can easily be swapped with `fetch('/api/facilities/' + id)` or Java backend.
 */
export function getFacilityProfile(id) {
  return FACILITY_CONFIG[id] || FACILITY_CONFIG['greenhouse'];
}
