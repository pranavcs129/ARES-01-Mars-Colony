/**
 * ColonyApiClient — Browser HTTP client connecting Three.js UI to Java OOP Backend.
 * Endpoint: http://localhost:8080/api/*
 *
 * Provides typed asynchronous access to:
 * - GET  /api/state
 * - POST /api/step (advance 1 Sol)
 * - POST /api/events/trigger (trigger disaster event)
 * - POST /api/reset (reset simulation)
 * - POST /api/recovery/backup (toggle auxiliary backup power)
 */

export class ColonyApiClient {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.isOnline = false;
    this.lastState = null;
    this.listeners = [];
  }

  onStateUpdate(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notify(state) {
    this.lastState = state;
    for (const cb of this.listeners) {
      try {
        cb(state);
      } catch (e) {
        console.error('Error in ColonyApiClient listener:', e);
      }
    }
  }

  /**
   * Fetch current colony state from Java backend
   */
  async fetchState() {
    try {
      const res = await fetch(`${this.baseUrl}/api/state`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.isOnline = true;
      this.notify(data);
      return data;
    } catch (err) {
      this.isOnline = false;
      console.warn('⚠️ [ColonyApiClient] Failed to connect to Java backend:', err.message);
      return null;
    }
  }

  /**
   * Advances simulation by 1 Sol in Java backend
   */
  async stepSol() {
    try {
      const res = await fetch(`${this.baseUrl}/api/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.isOnline = true;
      this.notify(data);
      return data;
    } catch (err) {
      this.isOnline = false;
      console.error('⚠️ [ColonyApiClient] stepSol failed:', err.message);
      return null;
    }
  }

  /**
   * Triggers an environmental or structural event in Java backend
   */
  async triggerEvent(type, duration = 2.0) {
    try {
      const res = await fetch(`${this.baseUrl}/api/events/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ type, duration })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.isOnline = true;
      this.notify(data);
      return data;
    } catch (err) {
      this.isOnline = false;
      console.error('⚠️ [ColonyApiClient] triggerEvent failed:', err.message);
      return null;
    }
  }

  /**
   * Resets simulation in Java backend to Sol 1 nominal
   */
  async resetSimulation() {
    try {
      const res = await fetch(`${this.baseUrl}/api/reset`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.isOnline = true;
      this.notify(data);
      return data;
    } catch (err) {
      this.isOnline = false;
      console.error('⚠️ [ColonyApiClient] reset failed:', err.message);
      return null;
    }
  }

  /**
   * Toggles auxiliary emergency backup power generator in Java backend
   */
  async toggleBackupPower() {
    try {
      const res = await fetch(`${this.baseUrl}/api/recovery/backup`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.isOnline = true;
      this.notify(data);
      return data;
    } catch (err) {
      this.isOnline = false;
      console.error('⚠️ [ColonyApiClient] toggleBackupPower failed:', err.message);
      return null;
    }
  }
}

export const colonyApiClient = new ColonyApiClient();
