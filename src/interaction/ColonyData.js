/**
 * ColonyData — Registry of major colony structures identified directly from the GLB hierarchy.
 * Formatted for premium futuristic colony management interface (NASA / Frostpunk / Surviving Mars aesthetic).
 * Includes Resource Flow (Input -> Process -> Output), Efficiency, Activity, Colony Impact, and Telemetry.
 */
export const COLONY_STRUCTURES = {
  greenhouse: {
    id: 'greenhouse',
    sector: 'SECTOR BETA • BIOSYSTEMS',
    title: 'CEA BIO-DOME',
    subtitle: 'Controlled Environment Agriculture',
    role: 'Food & Biomass Production',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    // Resource Flow: INPUT -> PROCESS -> OUTPUT
    resourceFlow: {
      inputs: [
        { name: 'WATER', amount: '420 L / Sol', role: 'Irrigation & Humidity', color: '#38bdf8', icon: 'water' },
        { name: 'POWER', amount: '8.4 kW', role: 'LED Grow Arrays', color: '#f59e0b', icon: 'power' }
      ],
      processName: 'BIO-DOME CEA',
      outputs: [
        { name: 'FOOD', amount: '1.24 kg / Sol', role: 'Caloric Yield', color: '#10b981', icon: 'food' },
        { name: 'OXYGEN', amount: '0.18 kg / Sol', role: 'Photosynthesis', color: '#34d399', icon: 'oxygen' }
      ]
    },
    // Efficiency
    efficiency: {
      overall: 91,
      breakdown: [
        { label: 'Power Grid', percent: 82 },
        { label: 'Water Loop', percent: 76 },
        { label: 'Biomass Yield', percent: 91 }
      ]
    },
    // Current Activity
    activity: {
      primary: 'Crop Cycle: Sol 214 • Phase 3',
      cycleStatus: 'Active Day Lighting',
      nextOutput: 'In 6 Sols'
    },
    // Colony Impact
    colonyImpact: [
      { label: 'Food Supply', value: '+12%', type: 'positive' },
      { label: 'Oxygen Support', value: '+3%', type: 'positive' },
      { label: 'Power Demand', value: '8.4 kW', type: 'neutral' }
    ],
    // Telemetry
    telemetry: [
      { label: 'Temperature', value: '22.0°C' },
      { label: 'Humidity', value: '64.5%' },
      { label: 'CO₂ Level', value: '1,200 ppm' },
      { label: 'Canopy Health', value: '98%' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M10 70 C 10 30, 90 30, 90 70 Z" stroke-dasharray="2 2" opacity="0.3"/>
      <path d="M20 70 C 20 40, 80 40, 80 70 Z" stroke-width="2"/>
      <line x1="50" y1="40" x2="50" y2="70"/>
      <line x1="32" y1="48" x2="38" y2="70"/>
      <line x1="68" y1="48" x2="62" y2="70"/>
      <circle cx="50" cy="54" r="5" stroke-width="1.5"/>
      <path d="M50 49 Q 53 45 55 49 Q 52 53 50 49" fill="currentColor" opacity="0.6"/>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  },

  habitat: {
    id: 'habitat',
    sector: 'SECTOR ALPHA • HABITATION',
    title: 'PRIMARY HABITAT',
    subtitle: 'Crew Quarters & Life Support',
    role: 'Living Quarters & Environmental Control',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'OXYGEN', amount: '18.2 kg / Sol', role: 'Atmospheric Mix', color: '#34d399', icon: 'oxygen' },
        { name: 'WATER', amount: '160 L / Sol', role: 'Potable & Hygiene', color: '#38bdf8', icon: 'water' },
        { name: 'POWER', amount: '14.5 kW', role: 'Life Support HVAC', color: '#f59e0b', icon: 'power' }
      ],
      processName: 'LIFE SUPPORT HAB',
      outputs: [
        { name: 'GRAYWATER', amount: '145 L / Sol', role: 'Recycling Return', color: '#93c5fd', icon: 'water' },
        { name: 'CO₂ EFFLUENT', amount: '14.8 kg / Sol', role: 'MOXIE / CEA Feed', color: '#fbbf24', icon: 'co2' }
      ]
    },
    efficiency: {
      overall: 98,
      breakdown: [
        { label: 'Life Support', percent: 99 },
        { label: 'Thermal HVAC', percent: 96 },
        { label: 'Atmosphere Reg', percent: 98 }
      ]
    },
    activity: {
      primary: 'Crew Quarters: 12 Active Colonists',
      cycleStatus: 'Shift Beta Rotation',
      nextOutput: '12 / 20 Berths'
    },
    colonyImpact: [
      { label: 'Population', value: '12 / 20', type: 'positive' },
      { label: 'Life Support', value: '100%', type: 'positive' },
      { label: 'Power Demand', value: '14.5 kW', type: 'neutral' }
    ],
    telemetry: [
      { label: 'Cabin Temp', value: '21.5°C' },
      { label: 'Pressure', value: '101.3 kPa' },
      { label: 'O₂ Mix', value: '21.2%' },
      { label: 'Radiation', value: '0.04 mSv/d' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="25" y="32" width="50" height="36" rx="18" stroke-width="2"/>
      <circle cx="38" cy="50" r="6"/>
      <circle cx="62" cy="50" r="6"/>
      <line x1="50" y1="32" x2="50" y2="68" stroke-dasharray="2 2" opacity="0.4"/>
      <line x1="12" y1="50" x2="25" y2="50" stroke-width="2"/>
      <line x1="75" y1="50" x2="88" y2="50" stroke-width="2"/>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  },

  power: {
    id: 'power',
    sector: 'SECTOR EPSILON • ENERGY',
    title: 'FISSION POWER STATION',
    subtitle: 'Kilowatt-Class Surface Reactor',
    role: 'Colony Baseload Power Generation',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'NOMINAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'COOLANT', amount: '14.2 L / s', role: 'Stirling Loop', color: '#38bdf8', icon: 'water' },
        { name: 'CONTROL', amount: '100% Nominal', role: 'Neutron Core', color: '#a78bfa', icon: 'shield' }
      ],
      processName: 'FISSION CORE',
      outputs: [
        { name: 'ELECTRICITY', amount: '32.0 kW (Net)', role: 'Colony Grid', color: '#f59e0b', icon: 'power' },
        { name: 'THERMAL', amount: '40.0 kWth', role: 'Hab District Heating', color: '#f87171', icon: 'heat' }
      ]
    },
    efficiency: {
      overall: 94,
      breakdown: [
        { label: 'Thermal Loop', percent: 96 },
        { label: 'Stirling Engine', percent: 92 },
        { label: 'Grid Feed', percent: 95 }
      ]
    },
    activity: {
      primary: 'Baseload Fission: 32.0 kW Output',
      cycleStatus: 'Continuous Stirling Cycle',
      nextOutput: '8.2 Yrs Fuel'
    },
    colonyImpact: [
      { label: 'Grid Power', value: '+42%', type: 'positive' },
      { label: 'Base Coverage', value: '100%', type: 'positive' },
      { label: 'Surplus Margin', value: '+10.6 kW', type: 'positive' }
    ],
    telemetry: [
      { label: 'Core Temp', value: '685 K' },
      { label: 'Current Load', value: '21.4 kW' },
      { label: 'Coolant Press', value: '1.82 MPa' },
      { label: 'Containment', value: '100% Sealed' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="35" y="30" width="30" height="38" rx="4" stroke-width="2"/>
      <circle cx="50" cy="49" r="8" stroke-dasharray="3 2"/>
      <line x1="20" y1="49" x2="35" y2="49" stroke-width="2"/>
      <line x1="65" y1="49" x2="80" y2="49" stroke-width="2"/>
      <line x1="30" y1="35" x2="20" y2="25"/>
      <line x1="70" y1="35" x2="80" y2="25"/>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  },

  water: {
    id: 'water',
    sector: 'SECTOR GAMMA • ISRU',
    title: 'WATER EXTRACTION',
    subtitle: 'Atmospheric Condenser & Well',
    role: 'Atmospheric & Regolith Water Recovery',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'ATMOS VAPOR', amount: '0.03 g / m³', role: 'Ambient Intake', color: '#93c5fd', icon: 'wind' },
        { name: 'POWER', amount: '7.2 kW', role: 'Chiller & Compressors', color: '#f59e0b', icon: 'power' }
      ],
      processName: 'CONDENSER WELL',
      outputs: [
        { name: 'POTABLE WATER', amount: '420 L / Sol', role: 'Reservoir Supply', color: '#38bdf8', icon: 'water' },
        { name: 'DRY REGOLITH', amount: '1.8 t / Sol', role: 'Byproduct Sift', color: '#a3a3a3', icon: 'minerals' }
      ]
    },
    efficiency: {
      overall: 88,
      breakdown: [
        { label: 'Condensation', percent: 86 },
        { label: 'RO Filtration', percent: 94 },
        { label: 'Pump Flow', percent: 88 }
      ]
    },
    activity: {
      primary: 'Regolith Sublimation: Well Phase 2',
      cycleStatus: 'Continuous Pumping',
      nextOutput: '420 L / Sol'
    },
    colonyImpact: [
      { label: 'Water Supply', value: '+35%', type: 'positive' },
      { label: 'Storage Reserve', value: '84% Full', type: 'positive' },
      { label: 'Power Demand', value: '7.2 kW', type: 'neutral' }
    ],
    telemetry: [
      { label: 'Chiller Temp', value: '278 K' },
      { label: 'Filter Delta', value: '0.12 bar' },
      { label: 'Pump Speed', value: '1,800 RPM' },
      { label: 'Purity Level', value: '99.8%' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="30" y="35" width="40" height="33" rx="4" stroke-width="2"/>
      <path d="M50 42 C 45 48, 43 52, 50 58 C 57 52, 55 48, 50 42 Z" fill="currentColor" opacity="0.5"/>
      <path d="M20 50 Q 25 45 30 50" stroke-width="2"/>
      <path d="M70 50 Q 75 55 80 50" stroke-width="2"/>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  },

  research_lab: {
    id: 'research_lab',
    sector: 'SECTOR DELTA • SCIENCE',
    title: 'RESEARCH FACILITY',
    subtitle: 'Astrobiology & Geology Lab',
    role: 'Geological & Biological Research',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'SAMPLES', amount: '4 Cores / Sol', role: 'Drill Return', color: '#c084fc', icon: 'science' },
        { name: 'POWER', amount: '6.8 kW', role: 'Spectrometers & Lab', color: '#f59e0b', icon: 'power' }
      ],
      processName: 'SCIENCE LAB',
      outputs: [
        { name: 'ASSAYS', amount: '14 Studies Logged', role: 'Mineral Telemetry', color: '#38bdf8', icon: 'data' },
        { name: 'DATA PACKETS', amount: '2.4 GB / Sol', role: 'Earth Relay Uplink', color: '#34d399', icon: 'wifi' }
      ]
    },
    efficiency: {
      overall: 93,
      breakdown: [
        { label: 'Spectrometry', percent: 96 },
        { label: 'Computation', percent: 90 },
        { label: 'Cleanroom Seal', percent: 99 }
      ]
    },
    activity: {
      primary: 'Regolith Assay: Core Sample #14',
      cycleStatus: 'Spectrometry Scan',
      nextOutput: 'In 2 Sols'
    },
    colonyImpact: [
      { label: 'Tech Progress', value: '+15%', type: 'positive' },
      { label: 'Resource Map', value: 'Active', type: 'positive' },
      { label: 'Power Demand', value: '6.8 kW', type: 'neutral' }
    ],
    telemetry: [
      { label: 'Cleanroom', value: 'ISO-1' },
      { label: 'Glovebox ΔP', value: '+25 Pa' },
      { label: 'Cryo Temp', value: '-80°C' },
      { label: 'Assigned Crew', value: '3 Scientists' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <polygon points="50,26 76,41 76,65 50,75 24,65 24,41" stroke-width="2"/>
      <line x1="50" y1="26" x2="50" y2="75" stroke-dasharray="2 2" opacity="0.4"/>
      <line x1="24" y1="41" x2="76" y2="65" opacity="0.2"/>
      <line x1="76" y1="41" x2="24" y2="65" opacity="0.2"/>
      <circle cx="50" cy="50" r="8" stroke-width="1.5"/>
      <line x1="5" y1="75" x2="95" y2="75" stroke-width="2"/>
    </svg>`
  },

  rocket: {
    id: 'rocket',
    sector: 'SECTOR ALPHA • LOGISTICS',
    title: 'LANDING ZONE',
    subtitle: 'Sub-Orbital Starship Platform',
    role: 'Surface Landing & Cargo Logistics',
    status: 'READY',
    statusClass: 'status-operational',
    condition: 'READY',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'GUIDANCE CH4', amount: 'Frequency Locked', role: 'Beacon Link', color: '#38bdf8', icon: 'wifi' },
        { name: 'POWER', amount: '4.5 kW', role: 'Cryo Pumps & Crane', color: '#f59e0b', icon: 'power' }
      ],
      processName: 'STARSHIP PAD',
      outputs: [
        { name: 'CARGO FLOW', amount: 'Payload Standby', role: 'Interplanetary', color: '#10b981', icon: 'cargo' },
        { name: 'PAD STATUS', amount: 'Clear (Pad-01)', role: 'Departure Ready', color: '#34d399', icon: 'check' }
      ]
    },
    efficiency: {
      overall: 99,
      breakdown: [
        { label: 'Pad Foundation', percent: 100 },
        { label: 'Cryo Manifold', percent: 98 },
        { label: 'Beacon Lock', percent: 100 }
      ]
    },
    activity: {
      primary: 'Platform Standby: Starship-01 Bay',
      cycleStatus: 'Guidance Beacon Active',
      nextOutput: 'Window Sol 220'
    },
    colonyImpact: [
      { label: 'Logistics Ready', value: '100%', type: 'positive' },
      { label: 'Earth Payload', value: 'Standby', type: 'positive' },
      { label: 'Power Demand', value: '4.5 kW', type: 'neutral' }
    ],
    telemetry: [
      { label: 'Surface Temp', value: '-48°C' },
      { label: 'Wind Velocity', value: '6.2 m/s' },
      { label: 'Pad Deflection', value: '0.01°' },
      { label: 'Cryo Line Temp', value: '98 K' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <ellipse cx="50" cy="65" rx="38" ry="8" stroke-width="1.5" stroke-dasharray="3 2"/>
      <path d="M50 18 L58 52 L42 52 Z" stroke-width="2"/>
      <line x1="50" y1="18" x2="50" y2="52" stroke-dasharray="2 2" opacity="0.4"/>
      <path d="M42 45 L34 56 L42 52 Z" fill="currentColor" opacity="0.3"/>
      <path d="M58 45 L66 56 L58 52 Z" fill="currentColor" opacity="0.3"/>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  },

  solar: {
    id: 'solar',
    sector: 'SECTOR EPSILON • ENERGY',
    title: 'SOLAR POWER ARRAY',
    subtitle: 'Photovoltaic Tracking Collectors',
    role: 'Diurnal Solar Energy Generation',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'SOLAR IRRADIANCE', amount: '590 W / m²', role: 'Martian Daylight', color: '#f59e0b', icon: 'sun' },
        { name: 'MOTOR POWER', amount: '0.8 kW', role: 'Dual-Axis Track', color: '#93c5fd', icon: 'power' }
      ],
      processName: 'SOLAR TRACKER',
      outputs: [
        { name: 'GRID FEED', amount: '185.0 kW (Peak)', role: 'Colony Main Bus', color: '#fbbf24', icon: 'power' },
        { name: 'BATTERY CHARGE', amount: '92.0 kW', role: 'Storage Depots', color: '#34d399', icon: 'battery' }
      ]
    },
    efficiency: {
      overall: 94,
      breakdown: [
        { label: 'Photoelectric', percent: 92 },
        { label: 'Sun Alignment', percent: 98 },
        { label: 'Inverter Output', percent: 94 }
      ]
    },
    activity: {
      primary: 'Sun-Tracking: Azimuth 142° locked',
      cycleStatus: 'Peak Solar Window',
      nextOutput: '6.4h Daylight'
    },
    colonyImpact: [
      { label: 'Day Power', value: '+58%', type: 'positive' },
      { label: 'Battery Charge', value: 'Active', type: 'positive' },
      { label: 'Tracking Load', value: '0.8 kW', type: 'neutral' }
    ],
    telemetry: [
      { label: 'Sun Elevation', value: '38.4°' },
      { label: 'Inverter Load', value: '74%' },
      { label: 'Azimuth Angle', value: '142°' },
      { label: 'Dust Layer', value: '2.1%' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <line x1="50" y1="45" x2="50" y2="70" stroke-width="3"/>
      <polygon points="20,40 50,30 80,40 50,50" stroke-width="2" fill="currentColor" fill-opacity="0.1"/>
      <line x1="35" y1="35" x2="35" y2="45"/>
      <line x1="65" y1="35" x2="65" y2="45"/>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  },

  central_hub: {
    id: 'central_hub',
    sector: 'SECTOR ZERO • CORE COMMAND',
    title: 'CENTRAL OPERATIONS',
    subtitle: 'Core Command & Deep-Space Relay',
    role: 'Colony Synchronization & Earth Comms',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'TELEMETRY', amount: 'All 12 Facilities', role: 'Automated Inflow', color: '#38bdf8', icon: 'data' },
        { name: 'POWER', amount: '9.2 kW', role: 'Quantum AI Core', color: '#f59e0b', icon: 'power' }
      ],
      processName: 'COMMAND HUB',
      outputs: [
        { name: 'COLONY SYNC', amount: 'Balanced (100%)', role: 'Autonomous Grid', color: '#10b981', icon: 'check' },
        { name: 'EARTH RELAY', amount: '14.2 min Latency', role: 'Deep-Space Link', color: '#34d399', icon: 'wifi' }
      ]
    },
    efficiency: {
      overall: 99,
      breakdown: [
        { label: 'Uptime Reliability', percent: 99.9 },
        { label: 'AI Processor', percent: 98 },
        { label: 'Comms Carrier', percent: 100 }
      ]
    },
    activity: {
      primary: 'Earth Telemetry: Relay Sat-3 Link',
      cycleStatus: 'Autonomous Grid Sync',
      nextOutput: 'Continuous'
    },
    colonyImpact: [
      { label: 'Colony Control', value: '100%', type: 'positive' },
      { label: 'Network Uptime', value: '99.98%', type: 'positive' },
      { label: 'Power Demand', value: '9.2 kW', type: 'neutral' }
    ],
    telemetry: [
      { label: 'Relay Latency', value: '14.2 min' },
      { label: 'Packet Drop', value: '0.00%' },
      { label: 'Clock Speed', value: '4.8 GHz' },
      { label: 'Core Temp', value: '42°C' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="50" cy="45" r="20" stroke-width="2"/>
      <circle cx="50" cy="45" r="8"/>
      <line x1="50" y1="20" x2="50" y2="10" stroke-width="2"/>
      <line x1="42" y1="12" x2="58" y2="12" stroke-width="1.5"/>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  },

  oxygen: {
    id: 'oxygen',
    sector: 'SECTOR GAMMA • ISRU',
    title: 'OXYGEN GENERATION',
    subtitle: 'MOXIE CO2 Electrolysis Plant',
    role: 'Atmospheric CO2 to O2 Electrolysis',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'CO₂ INFLOW', amount: '18.6 kg / Sol', role: 'Atmosphere Intake', color: '#fbbf24', icon: 'co2' },
        { name: 'POWER', amount: '11.2 kW', role: 'Electrolyzer Stack', color: '#f59e0b', icon: 'power' }
      ],
      processName: 'MOXIE PLANT',
      outputs: [
        { name: 'OXYGEN (O₂)', amount: '12.4 kg / Sol', role: '99.7% Pure Gas', color: '#34d399', icon: 'oxygen' },
        { name: 'CARBON MONOXIDE', amount: '6.2 kg / Sol', role: 'Byproduct Vent', color: '#a3a3a3', icon: 'wind' }
      ]
    },
    efficiency: {
      overall: 95,
      breakdown: [
        { label: 'Electrolysis', percent: 94 },
        { label: 'Compressor', percent: 96 },
        { label: 'Catalyst Stack', percent: 99 }
      ]
    },
    activity: {
      primary: 'Solid Oxide Electrolysis: Stack 1 & 2',
      cycleStatus: 'Continuous MOXIE Run',
      nextOutput: '12.4 kg / Sol'
    },
    colonyImpact: [
      { label: 'Oxygen Supply', value: '+65%', type: 'positive' },
      { label: 'Life Support Reserve', value: '94% Full', type: 'positive' },
      { label: 'Power Demand', value: '11.2 kW', type: 'neutral' }
    ],
    telemetry: [
      { label: 'Stack Temp', value: '1,073 K' },
      { label: 'Manifold Press', value: '2.14 MPa' },
      { label: 'Gas Purity', value: '99.7%' },
      { label: 'Cathode V', value: '1.42 V' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="38" cy="48" r="14" stroke-width="2"/>
      <circle cx="62" cy="48" r="14" stroke-width="2"/>
      <line x1="38" y1="48" x2="62" y2="48" stroke-width="3"/>
      <text x="34" y="52" fill="currentColor" font-size="10" font-family="monospace">O</text>
      <text x="58" y="52" fill="currentColor" font-size="10" font-family="monospace">O</text>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  },

  battery: {
    id: 'battery',
    category: 'POWER SYSTEMS',
    sector: 'SECTOR GAMMA • ENERGY',
    title: 'ENERGY STORAGE',
    subtitle: 'BATTERY STORAGE ARRAY',
    role: 'Grid Buffer & Nocturnal Reserves',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'SOLAR SURPLUS', amount: '84.0 kW', role: 'Daytime Inflow', color: '#fbbf24', icon: 'power' },
        { name: 'GRID CHARGE', amount: 'Active Link', role: 'Bus Balancing', color: '#f59e0b', icon: 'battery' }
      ],
      processName: 'POWER BANK',
      outputs: [
        { name: 'GRID BUFFER', amount: '480 kWh', role: '18.4 hr Night Buffer', color: '#38bdf8', icon: 'power' },
        { name: 'DISCHARGE STATUS', amount: 'Standby Buffer', role: 'Nocturnal Ready', color: '#34d399', icon: 'check' }
      ]
    },
    efficiency: {
      overall: 96,
      breakdown: [
        { label: 'Roundtrip Charge', percent: 95 },
        { label: 'Thermal Shield', percent: 98 },
        { label: 'Cell Balance', percent: 99 }
      ]
    },
    activity: {
      primary: 'Buffer Storage: 92% Reserve',
      cycleStatus: 'Standby for Night Sol',
      nextOutput: '18.4h Reserve'
    },
    colonyImpact: [
      { label: 'Night Grid', value: '100%', type: 'positive' },
      { label: 'Reserve Hours', value: '18.4 hrs', type: 'positive' },
      { label: 'Thermal Shield', value: 'Buried', type: 'positive' }
    ],
    telemetry: [
      { label: 'Bus Voltage', value: '400.2 V' },
      { label: 'Pack Temp', value: '294 K' },
      { label: 'State of Health', value: '99.2%' },
      { label: 'Active Cells', value: '128 / 128' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="25" y="32" width="50" height="36" rx="4" stroke-width="2"/>
      <line x1="38" y1="32" x2="38" y2="68" stroke-dasharray="2 2"/>
      <line x1="62" y1="32" x2="62" y2="68" stroke-dasharray="2 2"/>
      <rect x="42" y="26" width="16" height="6" rx="1" fill="currentColor" opacity="0.5"/>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  },

  storage_depot: {
    id: 'storage_depot',
    category: 'RESOURCE STORAGE',
    sector: 'SECTOR ZETA • LOGISTICS',
    title: 'STORAGE DEPOT',
    subtitle: 'COLONY RESOURCE STORAGE',
    role: 'Regolith Logistics & Spares Inventory',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'PROCESSED REGOLITH', amount: '3.2 t / Sol', role: 'Mining Inflow', color: '#a3a3a3', icon: 'minerals' },
        { name: 'POWER', amount: '2.1 kW', role: 'Climate & Crane', color: '#f59e0b', icon: 'power' }
      ],
      processName: 'STORAGE VAULT',
      outputs: [
        { name: 'CONSTRUCTION FEED', amount: '120 t Buffer', role: 'Fabrication Stock', color: '#fbbf24', icon: 'cargo' },
        { name: 'SPARES INVENTORY', amount: '412 Units', role: 'Modular Parts', color: '#38bdf8', icon: 'tools' }
      ]
    },
    efficiency: {
      overall: 92,
      breakdown: [
        { label: 'Airlock Seal', percent: 100 },
        { label: 'Gantry Crane', percent: 90 },
        { label: 'Climate Control', percent: 94 }
      ]
    },
    activity: {
      primary: 'Inventory Stacking: Bay 3 Active',
      cycleStatus: 'Airlock Sealed & Pressurized',
      nextOutput: '412 Units Stock'
    },
    colonyImpact: [
      { label: 'Parts Reserve', value: '64% Cap', type: 'positive' },
      { label: 'Feedstock Ready', value: '120 tons', type: 'positive' },
      { label: 'Power Demand', value: '2.1 kW', type: 'neutral' }
    ],
    telemetry: [
      { label: 'Internal Press', value: '98.2 kPa' },
      { label: 'Air Filter', value: 'Nominal' },
      { label: 'Crane State', value: 'Standby' },
      { label: 'Vault Temp', value: '14.2°C' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <polygon points="50,22 82,38 82,66 50,75 18,66 18,38" stroke-width="2"/>
      <line x1="50" y1="22" x2="50" y2="75"/>
      <line x1="18" y1="38" x2="50" y2="50"/>
      <line x1="82" y1="38" x2="50" y2="50"/>
      <line x1="5" y1="75" x2="95" y2="75" stroke-width="2"/>
    </svg>`
  },

  mining: {
    id: 'mining',
    sector: 'SECTOR ETA • EXTRACTION',
    title: 'AUTOMATED MINING',
    subtitle: 'Subsurface Borehole & Regolith Excavator',
    role: 'Raw Basalt & Metallic Ore Extraction',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    condition: 'OPTIMAL',
    conditionClass: 'condition-optimal',
    resourceFlow: {
      inputs: [
        { name: 'DRILL MOTOR', amount: '12.8 kW', role: 'Rotary Auger Drive', color: '#f59e0b', icon: 'power' },
        { name: 'COOLANT LUBE', amount: 'Recycled Loop', role: 'Bit Lubrication', color: '#38bdf8', icon: 'water' }
      ],
      processName: 'MINING AUGER',
      outputs: [
        { name: 'BASALT ORE', amount: '3.2 t / Sol', role: 'Crushed Regolith', color: '#fbbf24', icon: 'minerals' },
        { name: 'FERROUS OXIDES', amount: '0.8 t / Sol', role: 'Smelter Feedstock', color: '#f87171', icon: 'metal' }
      ]
    },
    efficiency: {
      overall: 89,
      breakdown: [
        { label: 'Excavation Rate', percent: 88 },
        { label: 'Ore Sorting', percent: 92 },
        { label: 'Motor Load', percent: 86 }
      ]
    },
    activity: {
      primary: 'Borehole Boring: Depth 8.4m',
      cycleStatus: 'Basalt Strata Drilling',
      nextOutput: '3.5h Hopper'
    },
    colonyImpact: [
      { label: 'Mineral Flow', value: '+100%', type: 'positive' },
      { label: 'Regolith Yield', value: '3.2 t / Sol', type: 'positive' },
      { label: 'Power Demand', value: '12.8 kW', type: 'neutral' }
    ],
    telemetry: [
      { label: 'Drill Depth', value: '8.4 meters' },
      { label: 'Bit Temp', value: '342 K' },
      { label: 'Torque Force', value: '180 Nm' },
      { label: 'Regolith Density', value: '1.65 g/cm³' }
    ],
    blueprintSvg: `<svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="1.5">
      <line x1="50" y1="20" x2="50" y2="70" stroke-width="3"/>
      <polygon points="50,74 42,62 58,62" fill="currentColor"/>
      <line x1="30" y1="35" x2="70" y2="35" stroke-width="2"/>
      <line x1="35" y1="45" x2="65" y2="45"/>
      <line x1="40" y1="55" x2="60" y2="55"/>
      <line x1="5" y1="70" x2="95" y2="70" stroke-width="2"/>
    </svg>`
  }
};
