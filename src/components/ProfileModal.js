import { playFabService } from '../services/playfab.js';
import { appState } from '../services/state.js';

export class ProfileModal {
  constructor(container, { onLogout, onProfileUpdated }) {
    this.container = container;
    this.callbacks = { onLogout, onProfileUpdated };
    this.isOpen = false;
    this.isLoading = false;
    this.message = null;
    this.error = null;
    this.render();
  }

  open() {
    this.isOpen = true;
    this.message = null;
    this.error = null;
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

    const user = playFabService.getCurrentUser() || { displayName: "User", playFabId: "", email: "" };

    this.container.innerHTML = `
      <div class="modal-overlay" id="profile-modal-overlay">
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header">
            <div class="modal-title-box">
              <h3 class="modal-title">Account Settings</h3>
            </div>
            <button class="modal-close-btn" id="profile-close-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
              <div style="width: 44px; height: 44px; border-radius: var(--radius-sm); background: #222222; border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #ffffff;">
                ${user.displayName.charAt(0).toUpperCase()}
              </div>
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: 15px; font-weight: 700;">${this.escapeHtml(user.displayName)}</span>
              </div>
            </div>

            ${this.message ? `
              <div style="padding: 8px 10px; border-radius: var(--radius-sm); font-size: 12px; background: #181818; border: 1px solid var(--border-medium); color: #ffffff;">
                ${this.escapeHtml(this.message)}
              </div>
            ` : ''}

            ${this.error ? `
              <div class="form-error-banner">
                <span>${this.escapeHtml(this.error)}</span>
              </div>
            ` : ''}

            <form id="profile-name-form" onsubmit="return false;">
              <div class="form-group">
                <label class="form-label" for="profile-display-name">Display Name</label>
                <input
                  type="text"
                  id="profile-display-name"
                  class="form-input"
                  value="${this.escapeHtml(user.displayName)}"
                  maxlength="32"
                  ${this.isLoading ? 'disabled' : ''}
                />
              </div>

              <button type="submit" class="form-btn-submit" id="save-name-btn" ${this.isLoading ? 'disabled' : ''}>
                ${this.isLoading ? 'Saving...' : 'Update Name'}
              </button>
            </form>

            <form id="profile-email-form" onsubmit="return false;" style="margin-top: 6px;">
              <div class="form-group">
                <label class="form-label" for="profile-email">Account Email</label>
                <input
                  type="email"
                  id="profile-email"
                  class="form-input"
                  value="${this.escapeHtml(user.email || '')}"
                  placeholder="name@example.com"
                  maxlength="100"
                  ${this.isLoading ? 'disabled' : ''}
                />
              </div>

              <button type="submit" class="form-btn-submit" id="save-email-btn" style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-medium);" ${this.isLoading ? 'disabled' : ''}>
                ${this.isLoading ? 'Saving...' : 'Change Email'}
              </button>
            </form>

            <div style="margin-top: 6px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
              <button type="button" class="form-btn-submit" id="logout-btn" style="background: transparent; border: 1px solid var(--border-medium); color: var(--text-secondary);">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const overlay = this.container.querySelector('#profile-modal-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    const closeBtn = this.container.querySelector('#profile-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    const nameForm = this.container.querySelector('#profile-name-form');
    nameForm?.addEventListener('submit', async () => {
      const input = this.container.querySelector('#profile-display-name');
      const newName = input ? input.value.trim().slice(0, 32) : '';
      if (!newName) return;

      this.isLoading = true;
      this.error = null;
      this.message = null;
      this.render();

      try {
        await playFabService.updateDisplayName(newName);
        this.message = 'Display name updated';
      } catch (e) {
        this.error = e.message || 'Failed to update name';
      } finally {
        this.isLoading = false;
        appState.notify('profile');
        if (this.callbacks.onProfileUpdated) {
          this.callbacks.onProfileUpdated();
        }
        this.render();
      }
    });

    const emailForm = this.container.querySelector('#profile-email-form');
    emailForm?.addEventListener('submit', async () => {
      const input = this.container.querySelector('#profile-email');
      const newEmail = input ? input.value.trim().slice(0, 100) : '';
      if (!newEmail || !newEmail.includes('@')) {
        this.error = 'Valid email is required';
        this.render();
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.message = null;
      this.render();

      try {
        await playFabService.updateEmail(newEmail);
        this.message = 'Contact email updated';
      } catch (e) {
        this.error = e.message || 'Failed to update email';
      } finally {
        this.isLoading = false;
        appState.notify('profile');
        if (this.callbacks.onProfileUpdated) {
          this.callbacks.onProfileUpdated();
        }
        this.render();
      }
    });

    const logoutBtn = this.container.querySelector('#logout-btn');
    logoutBtn?.addEventListener('click', () => {
      playFabService.clearSession();
      this.close();
      if (this.callbacks.onLogout) {
        this.callbacks.onLogout();
      }
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}
