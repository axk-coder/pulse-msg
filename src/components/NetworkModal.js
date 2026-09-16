import { appState } from '../services/state.js';

export class NetworkModal {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.render();

    this.unsubscribe = appState.subscribe((state, key) => {
      if (this.isOpen && key === 'network') {
        this.render();
      }
    });
  }

  open() {
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.render();
  }

  render() {
    if (!this.isOpen) {
      this.container.innerHTML = '';
      return;
    }

    const state = appState.getState();
    const network = state.network;

    this.container.innerHTML = `
      <div class="modal-overlay" id="network-modal-overlay">
        <div class="modal-card" style="max-width: 500px;">
          <div class="modal-header">
            <div class="modal-title-box">
              <h3 class="modal-title">Network & Firewall Status</h3>
            </div>
            <button class="modal-close-btn" id="network-close-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="network-diag-card">
              <div class="diag-item">
                <span class="diag-label">Network Compatibility</span>
                <span class="status-badge-ok">COMPLIANT</span>
              </div>
              <div class="diag-item">
                <span class="diag-label">WebSockets (ws:// / wss://)</span>
                <span class="status-badge-ok">DISABLED</span>
              </div>
              <div class="diag-item">
                <span class="diag-label">Transport Protocol</span>
                <span class="diag-val">HTTPS REST (Port 443)</span>
              </div>
              <div class="diag-item">
                <span class="diag-label">Poll Frequency</span>
                <span class="diag-val">${network.intervalSeconds}s (Pause on Idle)</span>
              </div>
              <div class="diag-item">
                <span class="diag-label">Latency</span>
                <span class="diag-val">${network.latencyMs || 0} ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const overlay = this.container.querySelector('#network-modal-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    const closeBtn = this.container.querySelector('#network-close-btn');
    closeBtn?.addEventListener('click', () => this.close());
  }
}
