export class BanModal {
  constructor(container, { onSignOut }) {
    this.container = container;
    this.callbacks = { onSignOut };
    this.isOpen = false;
    this.banData = null;
    this.render();
  }

  open(banData) {
    this.banData = banData || { reason: "Account suspended", expires: "Permanent" };
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.banData = null;
    this.render();
  }

  formatExpiry(expiryStr) {
    if (!expiryStr || expiryStr === "Permanent" || expiryStr === "Indefinite") {
      return "Permanent";
    }
    try {
      const d = new Date(expiryStr);
      if (isNaN(d.getTime())) return String(expiryStr);
      return d.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return String(expiryStr);
    }
  }

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  render() {
    if (!this.isOpen || !this.banData) {
      this.container.innerHTML = "";
      return;
    }

    const reason = this.banData.reason || "Violation of service terms";
    const expiresFormatted = this.formatExpiry(this.banData.expires);

    this.container.innerHTML = `
      <div class="modal-overlay" id="ban-modal-overlay">
        <div class="modal-card" style="max-width: 440px; border: 1px solid var(--border-medium); background: #121212;">
          <div class="modal-header">
            <div class="modal-title-box">
              <h3 class="modal-title">Account Suspended</h3>
            </div>
          </div>

          <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: #181818; border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 14px; display: flex; flex-direction: column; gap: 10px;">
              <div>
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); display: block; margin-bottom: 2px;">Reason</span>
                <span style="font-size: 13px; color: #ffffff; font-weight: 500;">${this.escapeHtml(reason)}</span>
              </div>
              <div style="border-top: 1px solid var(--border-light); padding-top: 8px;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); display: block; margin-bottom: 2px;">Ban Duration</span>
                <span style="font-size: 13px; color: #ffffff; font-weight: 500;">${this.escapeHtml(expiresFormatted)}</span>
              </div>
            </div>

            <button type="button" class="form-btn-submit" id="ban-signout-btn" style="background: var(--bg-tertiary); border: 1px solid var(--border-medium);">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    `;

    const signoutBtn = this.container.querySelector("#ban-signout-btn");
    signoutBtn?.addEventListener("click", () => {
      this.close();
      if (this.callbacks.onSignOut) {
        this.callbacks.onSignOut();
      }
    });
  }
}
