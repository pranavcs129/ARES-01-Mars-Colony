/**
 * ResourceManagementWindow — Visual Resource Flow & Allocation Control
 *
 * Visual, non-textual management interface:
 * - RESOURCE FLOW DIAGRAM: Central Resource Node → Connected Consuming Facility Nodes
 * - RESOURCE ALLOCATION: Compact interactive facility cards with steppers (100 / 75 / 50 / 25 / 0%)
 * - DYNAMIC BALANCE: Generation - Usage = Shortage / Balance + Live Savings Callout
 * - RECOVERY SOURCES: Visual cards for Backup Power, Emergency Reserve, and Solar Recovery
 * - COMPACT RECOVERY: Progress bar with active source contribution pills
 */

export class ResourceManagementWindow {
  constructor(container, simulationManager) {
    this.container = container;
    this.simulationManager = simulationManager;
    this.isOpen = false;

    // Create modal backdrop and window elements
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'rm-modal-backdrop';
    this.backdrop.id = 'resource-management-backdrop';
    this.backdrop.setAttribute('role', 'dialog');
    this.backdrop.setAttribute('aria-modal', 'true');
    this.backdrop.setAttribute('aria-hidden', 'true');

    this.windowEl = document.createElement('div');
    this.windowEl.className = 'rm-window-container ares-liquid-glass ares-glass-modal';
    this.backdrop.appendChild(this.windowEl);
    this.container.appendChild(this.backdrop);

    // Initialize layout skeleton once
    this.initLayout();
    this.bindPermanentEvents();

    // Listen to simulation ticks
    if (this.simulationManager) {
      this.simulationManager.addListener(() => {
        if (this.isOpen) {
          this.update();
        }
      });
    }
  }

  getIconSvg(type) {
    switch (type) {
      case 'alert':
        return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.85 3.2L1.85 15.38C1.5 16 1.95 16.8 2.7 16.8H17.3C18.05 16.8 18.5 16 18.15 15.38L11.15 3.2C10.78 2.56 9.22 2.56 8.85 3.2Z"/><line x1="10" y1="7.5" x2="10" y2="11.5"/><circle cx="10" cy="14.2" r="0.8" fill="currentColor"/></svg>`;
      case 'check':
        return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 10 8 14 16 6"/></svg>`;
      case 'shield':
        return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2L3 5v6c0 5 7 8 7 8s7-3 7-8V5l-7-3z"/></svg>`;
      case 'lock':
        return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="14" height="8" rx="2"/><path d="M7 11V7a3 3 0 0 1 6 0v4"/></svg>`;
      default:
        return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="6"/></svg>`;
    }
  }

  /**
   * Initializes the permanent layout skeleton once
   */
  initLayout() {
    this.windowEl.innerHTML = `
      <!-- HEADER -->
      <div class="rm-header">
        <div class="rm-header-top">
          <div class="rm-title-row">
            <span class="rm-title-icon">${this.getIconSvg('shield')}</span>
            <h2 id="rm-window-title" class="rm-title">COLONY RESOURCE MANAGEMENT</h2>
          </div>
          <button class="rm-close-btn" data-action="close-rm" title="Close Control Panel (Esc)">✕</button>
        </div>
        <div class="rm-submeta-bar">
          <span>ARES-01</span>
          <span>•</span>
          <span id="rm-sol-text">SOL 001</span>
          <span>•</span>
          <span>Status:</span>
          <span id="rm-meta-pill" class="rm-meta-pill status-normal">STABLE</span>
        </div>
      </div>

      <!-- SCROLLABLE BODY -->
      <div class="rm-body" id="rm-scroll-body">
        
        <!-- 1. COMPACT ACTIVE INCIDENT STRIP -->
        <div class="vrm-incident-strip" id="vrm-incident-strip">
          <div class="vrm-incident-left">
            <span class="vrm-incident-badge sev-nom" id="vrm-incident-badge">NOMINAL</span>
            <span class="vrm-incident-name" id="vrm-incident-name">NORMAL OPERATIONS</span>
            <span class="vrm-incident-dur" id="vrm-incident-dur">• CLEAR CONDITIONS</span>
          </div>
          <div class="vrm-incident-metrics">
            <div class="vrm-incident-metric-item">
              <span class="vrm-incident-metric-label">GENERATION</span>
              <span class="vrm-incident-metric-val nominal" id="vrm-metric-gen">120 kW (Nominal)</span>
            </div>
            <div class="vrm-incident-metric-item">
              <span class="vrm-incident-metric-label">SHORTAGE</span>
              <span class="vrm-incident-metric-val nominal" id="vrm-metric-shortage">0 kW</span>
            </div>
          </div>
        </div>

        <!-- 2. VISUAL RESOURCE-FLOW DIAGRAM (CENTER NODE → CONSUMERS) -->
        <div class="vrm-flow-diagram">
          <!-- Central Resource Node -->
          <div class="vrm-center-node" id="vrm-center-node">
            <div class="vrm-center-title" id="vrm-center-title">POWER</div>
            <div class="vrm-center-ratio" id="vrm-center-ratio"><b>60</b> / 100 kW AVAILABLE</div>
            <div class="vrm-center-shortage pos" id="vrm-center-shortage">
              <span>SHORTAGE:</span>
              <span id="vrm-center-shortage-val">0 kW ✓</span>
            </div>
          </div>

          <!-- Flow Connector SVG Lines -->
          <div class="vrm-branch-arrows">
            <svg viewBox="0 0 680 28" preserveAspectRatio="none">
              <!-- Center stem -->
              <line x1="340" y1="0" x2="340" y2="10" />
              <!-- Distribution bar -->
              <line x1="68" y1="10" x2="612" y2="10" />
              <!-- Vertical drops to 5 facility cards -->
              <line x1="68" y1="10" x2="68" y2="28" />
              <line x1="204" y1="10" x2="204" y2="28" />
              <line x1="340" y1="10" x2="340" y2="28" />
              <line x1="476" y1="10" x2="476" y2="28" />
              <line x1="612" y1="10" x2="612" y2="28" />
            </svg>
          </div>

          <!-- Branch Facility Nodes -->
          <div class="vrm-branches-row" id="vrm-branches-row">
            <!-- Populated dynamically: Life Support, Water, Greenhouse, Research, Logistics -->
          </div>
        </div>

        <!-- 3. MAIN WORKSPACE (TWO-COLUMN INTERACTIVE CONTROL) -->
        <div class="vrm-workspace-grid">
          
          <!-- LEFT COLUMN: COLONY RESPONSE (AUTOMATIC RESOURCE MANAGEMENT) -->
          <div class="vrm-panel">
            <div class="vrm-panel-header">
              <div>
                <span class="vrm-panel-title">COLONY RESPONSE</span>
                <span class="vrm-panel-sub">AUTOMATIC RESOURCE MANAGEMENT</span>
              </div>
              <span class="vrm-auto-badge">AUTO ACTIVE</span>
            </div>

            <!-- Affected Resource Shortage Box -->
            <div class="vrm-response-shortage-box" id="vrm-response-shortage-box">
              <div class="vrm-shortage-title-row">
                <span class="vrm-shortage-tag" id="vrm-shortage-tag">POWER SHORTAGE</span>
                <span class="vrm-shortage-amount neg" id="vrm-shortage-amount">−5 kW</span>
              </div>
              <div class="vrm-shortage-sub" id="vrm-shortage-sub">
                Autonomous load shedding engaged to maintain colony stability.
              </div>
            </div>

            <!-- Compact Facility Response Cards -->
            <div class="vrm-response-list" id="vrm-response-list">
              <!-- Populated dynamically with automatic colony response cards -->
            </div>
          </div>

          <!-- RIGHT COLUMN: DYNAMIC RESOURCE BALANCE & RECOVERY -->
          <div style="display: flex; flex-direction: column; gap: 0.9rem;">
            
            <!-- Dynamic Balance Panel -->
            <div class="vrm-panel">
              <div class="vrm-panel-header">
                <span class="vrm-panel-title" id="vrm-bal-title">POWER BALANCE</span>
                <span class="vrm-panel-sub">LIVE RESOURCE FLUX</span>
              </div>

              <div class="vrm-balance-card">
                <div class="vrm-bal-row">
                  <span>GENERATION:</span>
                  <span class="vrm-bal-val pos" id="vrm-bal-gen">+60 kW</span>
                </div>
                <div class="vrm-bal-row">
                  <span>USAGE:</span>
                  <span class="vrm-bal-val neg" id="vrm-bal-usage">-100 kW</span>
                </div>
                <div class="vrm-bal-divider"></div>
                <div class="vrm-bal-total-row is-balanced" id="vrm-bal-net-row">
                  <span id="vrm-bal-net-label">NET BALANCE:</span>
                  <span id="vrm-bal-net-val">0 kW ✓</span>
                </div>
              </div>

              <!-- Dynamic Savings Notification Callout -->
              <div class="vrm-savings-callout" id="vrm-savings-callout">
                <span class="vrm-savings-label" id="vrm-savings-label">SAVED VIA REDUCTIONS:</span>
                <span class="vrm-savings-val" id="vrm-savings-val">+0 kW</span>
              </div>
            </div>

            <!-- Recovery Sources Visual Cards -->
            <div class="vrm-panel">
              <div class="vrm-panel-header">
                <span class="vrm-panel-title">RECOVERY SOURCES</span>
                <span class="vrm-panel-sub">BOOST & RESTORATION</span>
              </div>

              <div class="vrm-recovery-sources-grid" id="vrm-recovery-sources-grid">
                <!-- Populated dynamically: Backup Power, Emergency Reserve, Solar Recovery -->
              </div>
            </div>

            <!-- Compact Recovery Progress Bar -->
            <div class="vrm-recovery-box">
              <div class="vrm-rec-header">
                <span class="vrm-rec-title" id="vrm-rec-title">POWER RECOVERY</span>
                <span class="vrm-rec-range" id="vrm-rec-range">320 kW → 450 kW</span>
              </div>
              <div class="vrm-rec-pills" id="vrm-rec-pills">
                <!-- Active boost pills e.g. [BACKUP +25 kW] -->
              </div>
              <div class="vrm-progress-track">
                <div class="vrm-progress-fill" id="vrm-rec-fill" style="width: 80%;"></div>
              </div>
              <div class="vrm-progress-meta">
                <span id="vrm-rec-pct">80% Restored</span>
                <span id="vrm-rec-status">STATUS: RECOVERING</span>
              </div>
            </div>

          </div>

        </div>

        <!-- 4. BOTTOM MISSION CONTROL STATUS BAR -->
        <div class="vrm-status-bar status-normal" id="vrm-status-bar">
          <div class="vrm-status-main">
            <span>COLONY STATUS:</span>
            <span class="vrm-status-val" id="vrm-status-val">STABLE</span>
          </div>
          <span class="vrm-status-sub" id="vrm-status-sub">All essential systems nominal. Balance restored.</span>
        </div>

        <!-- Discreet Quick Incident Triggers (for instant testing) -->
        <div class="vrm-test-row">
          <span class="vrm-test-label">Test Incidents:</span>
          <button class="vrm-test-btn" data-trigger="DUST_STORM">Dust Storm (Power -85%)</button>
          <button class="vrm-test-btn" data-trigger="EQUIPMENT_FAILURE">Water Pump Failure (-60%)</button>
          <button class="vrm-test-btn" data-trigger="POWER_INTERRUPTION">Grid Interruption (-35%)</button>
          <button class="vrm-test-btn" data-trigger="CLEAR_EVENTS">Clear Disasters</button>
        </div>

      </div>
    `;

    // Cache permanent DOM elements
    this.dom = {
      closeBtn: this.windowEl.querySelector('[data-action="close-rm"]'),
      solText: this.windowEl.querySelector('#rm-sol-text'),
      metaPill: this.windowEl.querySelector('#rm-meta-pill'),
      scrollBody: this.windowEl.querySelector('#rm-scroll-body'),

      // Incident Strip
      incidentStrip: this.windowEl.querySelector('#vrm-incident-strip'),
      incidentBadge: this.windowEl.querySelector('#vrm-incident-badge'),
      incidentName: this.windowEl.querySelector('#vrm-incident-name'),
      incidentDur: this.windowEl.querySelector('#vrm-incident-dur'),
      metricGen: this.windowEl.querySelector('#vrm-metric-gen'),
      metricShortage: this.windowEl.querySelector('#vrm-metric-shortage'),

      // Flow Diagram
      centerNode: this.windowEl.querySelector('#vrm-center-node'),
      centerTitle: this.windowEl.querySelector('#vrm-center-title'),
      centerRatio: this.windowEl.querySelector('#vrm-center-ratio'),
      centerShortage: this.windowEl.querySelector('#vrm-center-shortage'),
      centerShortageVal: this.windowEl.querySelector('#vrm-center-shortage-val'),
      branchesRow: this.windowEl.querySelector('#vrm-branches-row'),

      // Colony Response
      respShortageBox: this.windowEl.querySelector('#vrm-response-shortage-box'),
      respShortageTag: this.windowEl.querySelector('#vrm-shortage-tag'),
      respShortageAmount: this.windowEl.querySelector('#vrm-shortage-amount'),
      respShortageSub: this.windowEl.querySelector('#vrm-shortage-sub'),
      responseList: this.windowEl.querySelector('#vrm-response-list'),

      // Balance
      balTitle: this.windowEl.querySelector('#vrm-bal-title'),
      balGen: this.windowEl.querySelector('#vrm-bal-gen'),
      balUsage: this.windowEl.querySelector('#vrm-bal-usage'),
      balNetRow: this.windowEl.querySelector('#vrm-bal-net-row'),
      balNetLabel: this.windowEl.querySelector('#vrm-bal-net-label'),
      balNetVal: this.windowEl.querySelector('#vrm-bal-net-val'),
      savingsCallout: this.windowEl.querySelector('#vrm-savings-callout'),
      savingsLabel: this.windowEl.querySelector('#vrm-savings-label'),
      savingsVal: this.windowEl.querySelector('#vrm-savings-val'),

      // Recovery Sources
      recoverySourcesGrid: this.windowEl.querySelector('#vrm-recovery-sources-grid'),

      // Compact Recovery Progress
      recTitle: this.windowEl.querySelector('#vrm-rec-title'),
      recRange: this.windowEl.querySelector('#vrm-rec-range'),
      recPills: this.windowEl.querySelector('#vrm-rec-pills'),
      recFill: this.windowEl.querySelector('#vrm-rec-fill'),
      recPct: this.windowEl.querySelector('#vrm-rec-pct'),
      recStatus: this.windowEl.querySelector('#vrm-rec-status'),

      // Bottom Status
      statusBar: this.windowEl.querySelector('#vrm-status-bar'),
      statusVal: this.windowEl.querySelector('#vrm-status-val'),
      statusSub: this.windowEl.querySelector('#vrm-status-sub')
    };
  }

  /**
   * Binds permanent event listeners ONCE using event delegation
   */
  bindPermanentEvents() {
    // 1. Close Button (0ms instant response)
    if (this.dom.closeBtn) {
      this.dom.closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
      this.dom.closeBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
    }

    // 2. Backdrop click
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
    });

    // 3. Prevent scroll propagation to 3D scene
    this.windowEl.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    this.windowEl.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });

    // 4. Action Delegations
    this.windowEl.addEventListener('click', (e) => {
      // Recovery Action: BACKUP POWER
      const backupBtn = e.target.closest('[data-action="backup-power"]');
      if (backupBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (this.simulationManager) {
          this.simulationManager.toggleBackupPower();
          this.update();
        }
        return;
      }

      // Recovery Action: EMERGENCY RESERVE
      const reserveBtn = e.target.closest('[data-action="emergency-reserve"]');
      if (reserveBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (this.simulationManager) {
          const rec = this.simulationManager.recoveryManager;
          const targetRes = (rec?.getRecoveryState()?.activeEvent?.type === 'EQUIPMENT_FAILURE') ? 'water' : 'energy';
          this.simulationManager.useEmergencyReserve(targetRes);
          this.update();
        }
        return;
      }

      // Test Triggers
      const triggerBtn = e.target.closest('[data-trigger]');
      if (triggerBtn) {
        e.preventDefault();
        e.stopPropagation();
        const type = triggerBtn.getAttribute('data-trigger');
        if (this.simulationManager) {
          if (type === 'CLEAR_EVENTS') {
            if (this.simulationManager.eventManager?.activeEvents) {
              this.simulationManager.eventManager.activeEvents.clear();
            }
            if (this.simulationManager.eventManager) {
              this.simulationManager.eventManager.activeEvent = null;
            }
            this.simulationManager.resetSectorLevels();
            this.simulationManager.facilityManager.tick(this.simulationManager.resourceManager);
          } else if (type) {
            this.simulationManager.triggerEvent(type, 3);
          }
          this.update();
        }
        return;
      }
    });

    // 5. Esc key closes window
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.backdrop.classList.add('active');
    this.backdrop.setAttribute('aria-hidden', 'false');
    this.update();
  }

  close() {
    this.isOpen = false;
    this.backdrop.classList.remove('active');
    this.backdrop.setAttribute('aria-hidden', 'true');
  }

  /**
   * Surgical in-place updates without resetting scroll position
   */
  update() {
    if (!this.isOpen || !this.simulationManager) return;

    const snapshot = this.simulationManager.getSnapshot();
    const rec = snapshot.recovery;
    if (!rec) return;

    const unit = rec.unit || 'kW';
    const resName = (rec.resName || 'Power').toUpperCase();
    const hasDisaster = rec.hasDisaster;
    const ev = rec.activeEvent;
    const htm = rec.howToManage;
    const bal = rec.balance;
    const sectors = rec.sectors || [];

    // Header Sol & Status Pill
    if (this.dom.solText) this.dom.solText.textContent = snapshot.solString;
    if (this.dom.metaPill) {
      this.dom.metaPill.className = `rm-meta-pill ${rec.statusClass}`;
      this.dom.metaPill.textContent = rec.recoveryStatus;
    }

    // ==========================================
    // 1. TOP INCIDENT STRIP
    // ==========================================
    if (this.dom.incidentStrip) {
      if (hasDisaster) {
        this.dom.incidentStrip.className = 'vrm-incident-strip has-disaster';
        if (this.dom.incidentBadge) {
          this.dom.incidentBadge.className = `vrm-incident-badge ${ev.severity === 'HIGH' ? 'sev-high' : 'sev-mod'}`;
          this.dom.incidentBadge.textContent = `${ev.severity}`;
        }
        if (this.dom.incidentName) {
          this.dom.incidentName.textContent = ev.name;
        }
        if (this.dom.incidentDur) {
          this.dom.incidentDur.textContent = `• ${ev.duration}`;
        }
        if (this.dom.metricGen) {
          this.dom.metricGen.className = 'vrm-incident-metric-val drop';
          this.dom.metricGen.textContent = ev.generationDrop || `-${htm.shortage} ${unit}`;
        }
        if (this.dom.metricShortage) {
          this.dom.metricShortage.className = 'vrm-incident-metric-val shortage';
          this.dom.metricShortage.textContent = `-${htm.shortage} ${unit}`;
        }
      } else {
        this.dom.incidentStrip.className = 'vrm-incident-strip';
        if (this.dom.incidentBadge) {
          this.dom.incidentBadge.className = 'vrm-incident-badge sev-nom';
          this.dom.incidentBadge.textContent = 'NOMINAL';
        }
        if (this.dom.incidentName) {
          this.dom.incidentName.textContent = 'NORMAL OPERATIONS';
        }
        if (this.dom.incidentDur) {
          this.dom.incidentDur.textContent = '• CLEAR CONDITIONS';
        }
        if (this.dom.metricGen) {
          this.dom.metricGen.className = 'vrm-incident-metric-val nominal';
          this.dom.metricGen.textContent = `${htm.available} ${unit} (Nominal)`;
        }
        if (this.dom.metricShortage) {
          this.dom.metricShortage.className = 'vrm-incident-metric-val nominal';
          this.dom.metricShortage.textContent = `0 ${unit}`;
        }
      }
    }

    // ==========================================
    // 2. VISUAL RESOURCE-FLOW DIAGRAM
    // ==========================================
    // Central Resource Node
    if (this.dom.centerTitle) this.dom.centerTitle.textContent = resName;
    if (this.dom.centerRatio) {
      this.dom.centerRatio.innerHTML = `<b>${htm.available}</b> / ${htm.required} ${unit} AVAILABLE`;
    }

    if (this.dom.centerNode) {
      if (htm.remainingShortage > 0) {
        this.dom.centerNode.className = 'vrm-center-node is-shortage';
      } else {
        this.dom.centerNode.className = 'vrm-center-node is-stable';
      }
    }

    if (this.dom.centerShortage && this.dom.centerShortageVal) {
      if (htm.remainingShortage > 0) {
        this.dom.centerShortage.className = 'vrm-center-shortage neg';
        this.dom.centerShortageVal.textContent = `-${htm.remainingShortage} ${unit}`;
      } else {
        this.dom.centerShortage.className = 'vrm-center-shortage pos';
        this.dom.centerShortageVal.textContent = `0 ${unit} ✓`;
      }
    }

    // Branching Facility Nodes
    if (this.dom.branchesRow) {
      const branchSig = sectors.map(s => `${s.name}:${s.currentDraw}:${s.levelPct}:${s.isProtected}`).join('|');
      if (this._lastBranchSig !== branchSig) {
        this._lastBranchSig = branchSig;
        this.dom.branchesRow.innerHTML = sectors.map(s => {
          let cardClass = '';
          if (s.isProtected) cardClass = 'is-protected';
          else if (s.levelPct === 0) cardClass = 'is-paused';
          else if (s.levelPct < 100) cardClass = 'is-reduced';

          const pctText = s.isProtected ? '100% 🔒' : `${s.levelPct}%`;

          return `
            <div class="vrm-branch-card ${cardClass}">
              <span class="vrm-branch-name">${s.name}</span>
              <span class="vrm-branch-draw">${s.currentDraw} ${unit}</span>
              <span class="vrm-branch-pct">${pctText}</span>
            </div>
          `;
        }).join('');
      }
    }

    // ==========================================
    // 3. COLONY RESPONSE (AUTOMATIC RESOURCE MANAGEMENT)
    // ==========================================
    if (this.dom.respShortageTag && this.dom.respShortageAmount) {
      if (hasDisaster && htm.shortage > 0) {
        if (this.dom.respShortageBox) this.dom.respShortageBox.className = 'vrm-response-shortage-box has-shortage';
        this.dom.respShortageTag.textContent = `${resName.toUpperCase()} SHORTAGE`;
        this.dom.respShortageAmount.className = 'vrm-shortage-amount neg';
        this.dom.respShortageAmount.textContent = `−${htm.shortage} ${unit}`;
        if (this.dom.respShortageSub) {
          this.dom.respShortageSub.textContent = `Autonomous load shedding engaged to maintain colony stability and protect life support.`;
        }
      } else {
        if (this.dom.respShortageBox) this.dom.respShortageBox.className = 'vrm-response-shortage-box is-balanced';
        this.dom.respShortageTag.textContent = `${resName.toUpperCase()} BALANCE`;
        this.dom.respShortageAmount.className = 'vrm-shortage-amount pos';
        this.dom.respShortageAmount.textContent = `0 ${unit} SHORTAGE ✓`;
        if (this.dom.respShortageSub) {
          this.dom.respShortageSub.textContent = 'All sectors operating at nominal levels. No active shortages.';
        }
      }
    }

    if (this.dom.responseList) {
      const responses = (htm.responses || []).filter(r => r.action !== 'NOMINAL');
      const respSig = responses.map(r => `${r.name}:${r.action}:${r.transitionText}:${r.savedText}`).join('|');
      if (this._lastRespSig !== respSig) {
        this._lastRespSig = respSig;
        this.dom.responseList.innerHTML = responses.map(r => {
          return `
            <div class="vrm-response-card is-${r.actionClass}">
              <div class="vrm-resp-top">
                <span class="vrm-resp-name">${r.name}</span>
                <span class="vrm-resp-badge badge-${r.actionClass}">${r.action}</span>
              </div>
              <div class="vrm-resp-body">
                <span class="vrm-resp-transition">${r.transitionText}</span>
                <span class="vrm-resp-saved">${r.savedText}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // ==========================================
    // 4. DYNAMIC RESOURCE BALANCE (RIGHT COLUMN)
    // ==========================================
    if (this.dom.balTitle) this.dom.balTitle.textContent = `${resName} BALANCE`;
    if (this.dom.balGen) this.dom.balGen.textContent = `+${bal.afterGen} ${unit}`;
    if (this.dom.balUsage) this.dom.balUsage.textContent = `-${bal.afterCons} ${unit}`;

    if (this.dom.balNetRow && this.dom.balNetLabel && this.dom.balNetVal) {
      if (bal.finalBal < 0) {
        this.dom.balNetRow.className = 'vrm-bal-total-row is-shortage';
        this.dom.balNetLabel.textContent = 'SHORTAGE:';
        this.dom.balNetVal.textContent = `${bal.finalBal} ${unit}`;
      } else {
        this.dom.balNetRow.className = 'vrm-bal-total-row is-balanced';
        this.dom.balNetLabel.textContent = 'BALANCE:';
        this.dom.balNetVal.textContent = `+${bal.finalBal} ${unit} ✓`;
      }
    }

    // Dynamic Savings Callout
    if (this.dom.savingsVal) {
      const netGain = htm.totalSaved + (rec.actions.backupActive ? 25 : 0);
      if (netGain > 0) {
        this.dom.savingsVal.textContent = `+${netGain} ${unit} (${htm.totalSaved} Saved + ${rec.actions.backupActive ? 25 : 0} Backup)`;
      } else {
        this.dom.savingsVal.textContent = `+0 ${unit}`;
      }
    }

    // ==========================================
    // 5. RECOVERY SOURCE CARDS
    // ==========================================
    const recOptions = rec.recoveryOptions || [];
    if (this.dom.recoverySourcesGrid) {
      const recOptSig = recOptions.map(o => `${o.title}:${o.boost}:${o.active}:${o.actionText}`).join('|');
      if (this._lastRecOptSig !== recOptSig) {
        this._lastRecOptSig = recOptSig;
        this.dom.recoverySourcesGrid.innerHTML = recOptions.map(opt => {
          let actionElement = '';
          if (opt.actionKey) {
            const btnClass = opt.active ? 'is-active-btn' : '';
            actionElement = `
              <button class="vrm-source-btn ${btnClass}" data-action="${opt.actionKey}">
                ${opt.actionText}
              </button>
            `;
          } else {
            actionElement = `<span class="vrm-source-tag">${opt.actionText}</span>`;
          }

          return `
            <div class="vrm-source-card ${opt.active ? 'is-active' : ''}">
              <div class="vrm-source-left">
                <span class="vrm-source-title">${opt.title}</span>
                <span class="vrm-source-boost">${opt.boost}</span>
              </div>
              ${actionElement}
            </div>
          `;
        }).join('');
      }
    }

    // ==========================================
    // 6. COMPACT RECOVERY PROGRESS
    // ==========================================
    const recovery = rec.recovery;
    if (recovery) {
      if (this.dom.recTitle) this.dom.recTitle.textContent = `${resName} RECOVERY`;
      if (this.dom.recRange) {
        this.dom.recRange.textContent = `${recovery.current} ${unit} → ${recovery.target} ${unit}`;
      }

      if (this.dom.recPills) {
        const pills = [];
        if (rec.actions.backupActive) pills.push('<span class="vrm-rec-pill is-active">BACKUP +25 kW</span>');
        if (htm.totalSaved > 0) pills.push(`<span class="vrm-rec-pill is-active">SAVED +${htm.totalSaved} ${unit}</span>`);
        if (rec.actions.reserveDrawn?.energy > 0 || rec.actions.reserveDrawn?.water > 0) {
          const resVal = (rec.actions.reserveDrawn.energy || 0) + (rec.actions.reserveDrawn.water || 0);
          pills.push(`<span class="vrm-rec-pill is-active">RESERVE +${resVal} ${unit}</span>`);
        }
        if (pills.length === 0) {
          pills.push('<span class="vrm-rec-pill">NATURAL RECOVERY</span>');
        }
        const pillsSig = pills.join('|');
        if (this._lastPillsSig !== pillsSig) {
          this._lastPillsSig = pillsSig;
          this.dom.recPills.innerHTML = pills.join('');
        }
      }

      if (this.dom.recFill) {
        this.dom.recFill.style.width = `${recovery.progressPct}%`;
      }
      if (this.dom.recPct) {
        this.dom.recPct.textContent = `${recovery.progressPct}% Restored`;
      }
      if (this.dom.recStatus) {
        this.dom.recStatus.textContent = `STATUS: ${recovery.status}`;
      }
    }

    // ==========================================
    // 7. BOTTOM MISSION CONTROL STATUS BAR
    // ==========================================
    if (this.dom.statusBar) {
      this.dom.statusBar.className = `vrm-status-bar ${rec.statusClass}`;
    }
    if (this.dom.statusVal) {
      this.dom.statusVal.textContent = rec.recoveryStatus;
    }
    if (this.dom.statusSub) {
      if (rec.recoveryStatus === 'STABLE') {
        this.dom.statusSub.textContent = 'All essential systems nominal. Balance restored.';
      } else if (rec.recoveryStatus === 'RECOVERING') {
        this.dom.statusSub.textContent = 'Recovery protocol active. Reductions & backup securing life support.';
      } else {
        this.dom.statusSub.textContent = 'Active deficit. Adjust facility allocations to eliminate shortage.';
      }
    }
  }
}
