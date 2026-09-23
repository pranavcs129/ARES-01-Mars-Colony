/**
 * FacilityInspectorRenderer.js — Reusable NASA / Mission-Control Facility Inspector
 * Implements the exact master visual language from the Greenhouse Facility Card reference.
 * 100% data-driven, unified across all colony structures.
 */

import { getFacilityProfile } from '../data/FacilityConfig.js';

export class FacilityInspectorRenderer {
  /**
   * Returns category SVG icon
   */
  static getCategoryIconSvg(category) {
    switch ((category || '').toUpperCase()) {
      case 'AGRICULTURE':
        return `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3C7 3 4 7 4 12c3 0 7-1.5 8-5 1-3.5 1-4 1-4z"/><path d="M4 12c1-3 4-5 8-6"/></svg>`;
      case 'HABITATION':
        return `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 13h11M4 13V8a4 4 0 0 1 8 0v5M7 13v-3h2v3"/></svg>`;
      case 'POWER SYSTEMS':
        return `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 9h4l-1 5 5-7H8l1-5z"/></svg>`;
      case 'WATER SYSTEMS':
        return `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.2L11.5 7.2A4.2 4.2 0 1 1 4.5 7.2Z"/></svg>`;
      case 'RESEARCH':
        return `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h4M7 2v4L4 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2L9 6V2"/></svg>`;
      case 'LOGISTICS':
        return `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v12M8 2l5 3-5 3M4 14h8"/></svg>`;
      case 'RESOURCE STORAGE':
        return `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h12l-1 9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13L2 4z"/><path d="M1 4h14M6 7v3M10 7v3"/></svg>`;
      default:
        return `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/></svg>`;
    }
  }

  /**
   * Returns resource SVG icon
   */
  static getResourceIconSvg(icon) {
    switch (icon) {
      case 'water':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.2L11.5 7.2A4.2 4.2 0 1 1 4.5 7.2Z"/></svg>`;
      case 'energy':
      case 'power':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 9h4l-1 5 5-7H8l1-5z"/></svg>`;
      case 'food':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="2.2" x2="8" y2="13.8"/><path d="M4.5 4.5L8 7L11.5 4.5"/><path d="M4.5 7.5L8 10L11.5 7.5"/><path d="M5.5 10.5L8 12.5L10.5 10.5"/></svg>`;
      case 'oxygen':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(-45 8 8)"><circle cx="4.3" cy="8" r="2.7"/><circle cx="11.7" cy="8" r="2.7"/><line x1="6.7" y1="6.7" x2="9.3" y2="6.7"/><line x1="6.7" y1="9.3" x2="9.3" y2="9.3"/></g></svg>`;
      case 'thermal':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v11M5 5.5v5M11 5.5v5"/></svg>`;
      case 'filter':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><polygon points="2 3 14 3 9.5 8.5 9.5 13 6.5 14 6.5 8.5 2 3"/></svg>`;
      case 'grid':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="10" height="10" rx="1"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="8" y1="3" x2="8" y2="13"/></svg>`;
      case 'cargo':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="8" y1="3" x2="8" y2="13"/></svg>`;
      case 'tools':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2 2-3 3-2-2 3-3zM2 14l5-5-2-2-5 5v2h2z"/></svg>`;
      case 'shield':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2l6 3v4c0 4-6 6-6 6s-6-2-6-6V5l6-3z"/></svg>`;
      case 'battery':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="11" height="8" rx="1"/><line x1="14.5" y1="6.5" x2="14.5" y2="9.5"/></svg>`;
      case 'data':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="8" cy="4.5" rx="5" ry="2"/><path d="M3 4.5v3.5c0 1.1 2.2 2 5 2s5-.9 5-2V4.5"/><path d="M3 8v3.5c0 1.1 2.2 2 5 2s5-.9 5-2V8"/></svg>`;
      case 'comms':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13a9 9 0 0 1 12 0M4.5 13a5.5 5.5 0 0 1 7 0M7 13a1.5 1.5 0 0 1 2 0"/></svg>`;
      case 'fuel':
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13V4.5A1.5 1.5 0 0 1 4.5 3h5A1.5 1.5 0 0 1 11 4.5V13M3 13h8M11 6l2 2v4a1 1 0 0 1-2 0"/></svg>`;
      default:
        return `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5"/><circle cx="8" cy="8" r="1.5"/></svg>`;
    }
  }

  /**
   * Generates Donut Gauge HTML
   */
  static renderDonutGauge(percent, label, categoryIcon, accentColor) {
    const r = 36;
    const c = 2 * Math.PI * r;
    const strokeOffset = c * (1 - (percent / 100));

    return `
      <div class="f-donut-wrap">
        <svg class="f-donut-svg" viewBox="0 0 88 88" width="88" height="88">
          <circle class="f-donut-track" cx="44" cy="44" r="${r}" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="5"/>
          <circle class="f-donut-fill" cx="44" cy="44" r="${r}" fill="none" stroke="${accentColor}" stroke-width="5" stroke-linecap="round"
            stroke-dasharray="${c}" stroke-dashoffset="${strokeOffset}" transform="rotate(-90 44 44)"/>
        </svg>
        <div class="f-donut-content">
          <span class="f-donut-icon" style="color: ${accentColor};">${categoryIcon}</span>
          <span class="f-donut-val">${percent}<span class="f-donut-pct">%</span></span>
          <span class="f-donut-label">${label}</span>
        </div>
      </div>
    `;
  }

  /**
   * Generates Performance Line Graph HTML & SVG Curve
   */
  static renderPerformanceGraph(points, yLabels, label, change, accentColor, id) {
    const w = 170;
    const h = 50;
    const min = 0;
    const max = Math.max(...points, 100);

    const pts = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * w;
      const y = h - ((val - min) / (max - min)) * (h - 10) - 5;
      return { x, y };
    });

    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) * 0.5;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) * 0.5;
      const cp2y = p1.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const fillD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

    return `
      <div class="f-graph-wrap">
        <div class="f-graph-header">
          <span class="f-graph-title">${label}</span>
          <span class="f-graph-change" style="color: ${accentColor};">${change}</span>
        </div>
        <div class="f-graph-body">
          <div class="f-graph-y-axis">
            ${yLabels.map(l => `<span class="f-y-label">${l}</span>`).join('')}
          </div>
          <div class="f-graph-canvas-wrap">
            <svg class="f-graph-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
              <defs>
                <linearGradient id="f-graph-grad-${id}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <path d="${fillD}" fill="url(#f-graph-grad-${id})"/>
              <path d="${pathD}" fill="none" stroke="${accentColor}" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renders full master inspector HTML matching the reference greenhouse facility card
   * Accepts live simulation data override to show real-time allocation, condition, and priority.
   */
  static renderFacilityHtml(facilityId, liveData = null) {
    const p = getFacilityProfile(facilityId);
    const catIcon = this.getCategoryIconSvg(p.category);

    const status = liveData?.status || p.status;
    const condition = liveData?.condition || p.condition;
    const efficiency = liveData?.efficiency?.overall ?? p.efficiency;
    const isPrioritized = liveData?.isPrioritized || false;
    const metricPercent = liveData?.metricPercent !== undefined ? liveData.metricPercent : (p.metricPercent !== undefined ? p.metricPercent : efficiency);
    const metricLabel = liveData?.metricLabel || p.metricLabel;

    // Merge resources with live flows if available
    let resources = p.resources;
    if (liveData?.resources && Array.isArray(liveData.resources) && liveData.resources.length > 0) {
      resources = liveData.resources;
    } else if (liveData?.resourceFlow) {
      const liveItems = [];
      if (liveData.resourceFlow.inputs) {
        liveData.resourceFlow.inputs.forEach(inp => {
          liveItems.push({
            name: inp.name,
            value: inp.amount,
            type: inp.role || 'Input',
            icon: inp.icon || 'power',
            color: inp.color || '#f59e0b'
          });
        });
      }
      if (liveData.resourceFlow.outputs) {
        liveData.resourceFlow.outputs.forEach(out => {
          liveItems.push({
            name: out.name,
            value: out.amount,
            type: out.role || 'Output',
            icon: out.icon || 'food',
            color: out.color || '#10b981'
          });
        });
      }
      if (liveItems.length >= 2) {
        resources = liveItems.slice(0, 4);
      }
    }

    return `
      <div class="facility-master-card" data-facility-id="${p.id}">
        
        <!-- 1. HEADER -->
        <div class="f-card-header">
          <div class="f-header-left">
            <span class="f-category-icon" style="color: ${p.accentColor};" aria-hidden="true">${catIcon}</span>
            <span class="f-category-title">${p.category}</span>
          </div>
          <div class="f-header-right">
            <span class="f-sector-text">${p.sector}</span>
            <span class="f-status-dot" style="color: ${p.accentColor};" title="Status Nominal">●</span>
            <button class="f-close-btn" data-action="close-inspector" title="Close Inspector (Esc)">✕</button>
          </div>
        </div>

        <!-- 2. FACILITY HEADER & VISUAL PREVIEW -->
        <div class="f-hero-block">
          <div class="f-hero-info">
            <h2 class="f-title">${p.title}</h2>
            <div class="f-subtitle">${p.subtitle}</div>
            <p class="f-desc">${p.description}</p>
          </div>
          <div class="f-hero-preview" aria-hidden="true">
            ${p.previewSvg || ''}
          </div>
        </div>

        <!-- 3. STATUS ROW -->
        <div class="f-status-row">
          <div class="f-status-card">
            <div class="f-status-head">
              <span class="f-status-beacon" style="color: ${p.accentColor};">●</span>
              <span class="f-status-val" style="color: ${p.accentColor};">${status}</span>
            </div>
            <div class="f-status-sub">
              <span class="f-sub-lbl">CONDITION</span>
              <span class="f-sub-val">${condition}</span>
            </div>
          </div>

          <div class="f-status-card">
            <div class="f-status-head">
              <span class="f-phase-bars" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                  <line x1="3" y1="13" x2="3" y2="10"/>
                  <line x1="8" y1="13" x2="8" y2="6"/>
                  <line x1="13" y1="13" x2="13" y2="2"/>
                </svg>
              </span>
              <span class="f-status-val f-phase-title">${p.phase}</span>
            </div>
            <div class="f-status-sub">
              <span class="f-sub-lbl f-phase-desc">${p.phaseSub}</span>
            </div>
          </div>
        </div>

        <!-- 4. MAIN PERFORMANCE PANEL -->
        <div class="f-performance-panel">
          ${this.renderDonutGauge(metricPercent, metricLabel, catIcon, p.accentColor)}
          ${this.renderPerformanceGraph(p.graphPoints, p.graphYLabels, p.graphLabel, p.graphChange, p.accentColor, p.id)}
        </div>

        <!-- 5. FOUR RESOURCE CARDS (2x2 Grid) -->
        <div class="f-resources-grid">
          ${resources.map(r => `
            <div class="f-res-card" data-res-name="${r.name}">
              <div class="f-res-top">
                <span class="f-res-icon" style="color: ${r.color};" aria-hidden="true">${this.getResourceIconSvg(r.icon)}</span>
                <span class="f-res-name">${r.name}</span>
              </div>
              <div class="f-res-val">${r.value}</div>
              <div class="f-res-foot">
                <span class="f-res-dot" style="background: ${r.color};" aria-hidden="true"></span>
                <span class="f-res-type">${r.type}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 6. EFFICIENCY ROW -->
        <div class="f-efficiency-block">
          <div class="f-eff-top-row">
            <span class="f-eff-lbl">EFFICIENCY</span>
            <span class="f-eff-num">${efficiency}%</span>
          </div>
          <div class="f-eff-track">
            <div class="f-eff-bar" style="width: ${efficiency}%; background: ${p.accentColor};"></div>
          </div>
          <div class="f-next-row">
            <span class="f-next-lbl">${p.nextLabel}</span>
            <div class="f-next-timer">
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="8" cy="8" r="6"/>
                <line x1="8" y1="4.5" x2="8" y2="8"/>
                <line x1="8" y1="8" x2="10.5" y2="9.5"/>
              </svg>
              <span>${p.nextValue}</span>
            </div>
          </div>
        </div>

        <!-- 7. BOTTOM ACTIONS -->
        <div class="f-actions-row">
          <button class="f-btn btn-upgrade" data-action="upgrade-facility" title="Upgrade Facility Systems">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M8 13V3M4 7l4-4 4 4"/>
            </svg>
            <span>UPGRADE</span>
          </button>
          <button class="f-btn btn-maintenance" data-action="maint-facility" title="Schedule Preventative Maintenance">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12.5 9.5l-2-2 1-1-2.5-2.5a2.5 2.5 0 0 0-3.5 3.5l1 1-1 1 7 7 1-1-1-7z"/>
            </svg>
            <span>MAINTENANCE</span>
          </button>
          <button class="f-btn btn-prioritize ${isPrioritized ? 'is-prioritized' : ''}" data-action="prioritize-facility" title="Prioritize Resource Allocation">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 13V2l7 3.5L3 9"/>
            </svg>
            <span>${isPrioritized ? 'PRIORITIZED' : 'PRIORITIZE'}</span>
          </button>
        </div>

      </div>
    `;
  }
}
