export class LegalModal {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.tab = 'privacy';
    this.render();
  }

  open(tab = 'privacy') {
    this.tab = tab;
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

    this.container.innerHTML = `
      <div class="modal-overlay" id="legal-modal-overlay">
        <div class="modal-card" style="max-width: 540px;">
          <div class="modal-header">
            <div class="modal-title-box">
              <h3 class="modal-title">${this.tab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h3>
            </div>
            <button class="modal-close-btn" id="legal-close-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="auth-tabs" style="margin-bottom: 8px;">
              <button type="button" class="auth-tab ${this.tab === 'privacy' ? 'active' : ''}" id="legal-tab-privacy">
                Privacy Policy
              </button>
              <button type="button" class="auth-tab ${this.tab === 'terms' ? 'active' : ''}" id="legal-tab-terms">
                Terms of Service
              </button>
            </div>

            ${this.tab === 'privacy' ? `
              <div class="legal-section">
                <h4 class="legal-title">1. Information We Collect</h4>
                <p class="legal-text">Pulse collects account registration details including username, email address, and optional display name through PlayFab authentication. We do not sell or monetize personal data.</p>
              </div>
              <div class="legal-section">
                <h4 class="legal-title">2. Message Storage & Transmission</h4>
                <p class="legal-text">All messages are transmitted via encrypted HTTPS REST requests (TLS 1.2/1.3) through PlayFab CloudScript to a private data repository. No client-side tokens or credentials for third-party storage are exposed on the user's browser.</p>
              </div>
              <div class="legal-section">
                <h4 class="legal-title">3. Zero Socket Logging</h4>
                <p class="legal-text">Pulse does not maintain persistent WebSockets, WebRTC links, or tracking cookies. Inactive sessions automatically suspend polling to minimize network footprint.</p>
              </div>
              <div class="legal-section">
                <h4 class="legal-title">4. Network Policy & Firewall Compliance</h4>
                <p class="legal-text">This application is not designed, configured, or intended to bypass, circumvent, or evade any network blocks, organizational restrictions, or firewalls. All communications adhere to standard HTTPS web protocols.</p>
              </div>
              <div class="legal-section">
                <h4 class="legal-title">5. Data Retention</h4>
                <p class="legal-text">Channels retain the most recent 100 messages to balance performance and storage limits. Users can request account removal through PlayFab management.</p>
              </div>
            ` : `
              <div class="legal-section">
                <h4 class="legal-title">1. Acceptance of Terms</h4>
                <p class="legal-text">By using Pulse, you agree to comply with applicable network regulations, acceptable use guidelines, and these Terms of Service.</p>
              </div>
              <div class="legal-section">
                <h4 class="legal-title">2. Prohibited Conduct</h4>
                <p class="legal-text">Users may not engage in harassment, unauthorized automated scraping, rate-limit flooding, transmitting malicious payloads, or impersonating other users.</p>
              </div>
              <div class="legal-section">
                <h4 class="legal-title">3. No Circumvention</h4>
                <p class="legal-text">This application is not made or intended to bypass any network blocks, firewalls, content filters, or administrative restrictions. Users are responsible for complying with their local network and institution policies.</p>
              </div>
              <div class="legal-section">
                <h4 class="legal-title">4. Service Availability</h4>
                <p class="legal-text">Pulse is provided as-is without warranties. Network administrators retain authority over local area network access and firewall rules.</p>
              </div>
              <div class="legal-section">
                <h4 class="legal-title">5. Termination</h4>
                <p class="legal-text">Accounts violating these policies may be restricted or suspended by the administrator.</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const overlay = this.container.querySelector('#legal-modal-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    const closeBtn = this.container.querySelector('#legal-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    const privTab = this.container.querySelector('#legal-tab-privacy');
    privTab?.addEventListener('click', () => {
      this.tab = 'privacy';
      this.render();
    });

    const termsTab = this.container.querySelector('#legal-tab-terms');
    termsTab?.addEventListener('click', () => {
      this.tab = 'terms';
      this.render();
    });
  }
}
