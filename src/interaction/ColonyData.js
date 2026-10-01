import { STRUCTURE_IMAGE_MAP } from '../data/FacilityConfig.js';

/**
 * ColonyData — Registry of major colony structures identified directly from the GLB hierarchy.
 * Formatted for premium futuristic colony management interface (NASA / Frostpunk / Surviving Mars aesthetic).
 * Includes Resource Flow (Input -> Process -> Output), Efficiency, Activity, Colony Impact, and Telemetry.
 */
export const COLONY_STRUCTURES = {
  greenhouse: {
    id: 'greenhouse',
    type: 'CEA_GREENHOUSE',
    name: 'CEA BIO-DOME',
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
    image: STRUCTURE_IMAGE_MAP.CEA_GREENHOUSE
  },

  habitat: {
    id: 'habitat',
    type: 'HABITAT',
    name: 'HABITAT',
    sector: 'SECTOR ALPHA • HABITATION',
    title: 'HABITAT',
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
    image: STRUCTURE_IMAGE_MAP.HABITAT
  },

  power: {
    id: 'power',
    type: 'POWER_SYSTEM',
    name: 'POWER SYSTEM',
    sector: 'SECTOR EPSILON • ENERGY',
    title: 'POWER SYSTEM',
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
    image: STRUCTURE_IMAGE_MAP.POWER_SYSTEM
  },

  water: {
    id: 'water',
    type: 'WATER_EXTRACTION',
    name: 'WATER EXTRACTION',
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
    image: STRUCTURE_IMAGE_MAP.WATER_EXTRACTION
  },

  research_lab: {
    id: 'research_lab',
    type: 'RESEARCH_CENTRE',
    name: 'RESEARCH CENTRE',
    sector: 'SECTOR DELTA • SCIENCE',
    title: 'RESEARCH CENTRE',
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
    image: STRUCTURE_IMAGE_MAP.RESEARCH_CENTRE
  },

  rocket: {
    id: 'rocket',
    type: 'LAUNCHING_PAD',
    name: 'LAUNCHING PAD',
    sector: 'SECTOR ALPHA • LOGISTICS',
    title: 'LAUNCHING PAD',
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
    image: STRUCTURE_IMAGE_MAP.LAUNCHING_PAD
  },

  solar: {
    id: 'solar',
    type: 'SOLAR_ARRAY',
    name: 'SOLAR POWER ARRAY',
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
    image: STRUCTURE_IMAGE_MAP.SOLAR_ARRAY
  },

  central_hub: {
    id: 'central_hub',
    type: 'COMMAND_CORE',
    name: 'CENTRAL COMMAND CORE',
    sector: 'SECTOR ZERO • CORE COMMAND',
    title: 'CENTRAL COMMAND CORE',
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
    image: STRUCTURE_IMAGE_MAP.COMMAND_CORE
  },

  oxygen: {
    id: 'oxygen',
    type: 'OXYGEN_GENERATION',
    name: 'OXYGEN GENERATION',
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
    image: STRUCTURE_IMAGE_MAP.OXYGEN_GENERATION
  },

  battery: {
    id: 'battery',
    type: 'STORAGE',
    name: 'ENERGY STORAGE',
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
    image: STRUCTURE_IMAGE_MAP.STORAGE
  },

  storage_depot: {
    id: 'storage_depot',
    type: 'STORAGE_DEPOT',
    name: 'STORAGE DEPOT',
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
    image: STRUCTURE_IMAGE_MAP.STORAGE_DEPOT
  },

  mining: {
    id: 'mining',
    type: 'AUTOMATED_MINING',
    name: 'AUTOMATED MINING',
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
    image: STRUCTURE_IMAGE_MAP.AUTOMATED_MINING
  }
};
