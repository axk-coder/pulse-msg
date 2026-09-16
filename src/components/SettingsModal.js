import { playFabService } from '../services/playfab.js';
import { appState } from '../services/state.js';
import { soundSynth } from '../services/soundEffects.js';

export class SettingsModal {
  constructor(container, { onLogout, onProfileUpdated }) {
    this.container = container;
    this.callbacks = { onLogout, onProfileUpdated };
    this.isOpen = false;
    this.tab = 'profile';
    this.isLoading = false;
    this.message = null;
    this.error = null;
    this.render();
  }

  open(tab = 'profile') {
    this.tab = tab;
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

    const user = playFabService.getCurrentUser() || { displayName: "User", email: "", avatarUrl: "" };

    this.container.innerHTML = `
      <div class="modal-overlay" id="settings-modal-overlay">
        <div class="modal-card" style="max-width: 460px;">
          <div class="modal-header">
            <div class="modal-title-box">
              <h3 class="modal-title">Settings</h3>
            </div>
            <button class="modal-close-btn" id="settings-close-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="auth-tabs" style="margin-bottom: 16px;">
              <button type="button" class="auth-tab ${this.tab === 'profile' ? 'active' : ''}" id="tab-set-profile">Profile</button>
              <button type="button" class="auth-tab ${this.tab === 'preferences' ? 'active' : ''}" id="tab-set-pref">Preferences</button>
            </div>

            ${this.message ? `
              <div style="padding: 8px 12px; border-radius: var(--radius-sm); font-size: 13px; background: #181818; border: 1px solid var(--border-medium); color: #ffffff; margin-bottom: 14px;">
                ${this.escapeHtml(this.message)}
              </div>
            ` : ''}

            ${this.error ? `
              <div class="form-error-banner" style="margin-bottom: 14px;">
                <span>${this.escapeHtml(this.error)}</span>
              </div>
            ` : ''}

            ${this.tab === 'profile' ? `
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 18px; padding: 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                <div id="settings-avatar-preview" style="width: 56px; height: 56px; border-radius: var(--radius-sm); background: #222222; border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                  ${user.avatarUrl 
                    ? `<img src="${this.escapeHtml(user.avatarUrl)}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />`
                    : `<span style="font-size: 22px; font-weight: 700; color: #ffffff;">${user.displayName.charAt(0).toUpperCase()}</span>`
                  }
                </div>
                <div style="display: flex; flex-direction: column; overflow: hidden;">
                  <span id="settings-name-preview" style="font-size: 16px; font-weight: 700; color: #ffffff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${this.escapeHtml(user.displayName)}</span>
                </div>
              </div>

              <form id="settings-profile-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
                <div class="form-group">
                  <label class="form-label" for="set-avatar-url">Profile Picture URL</label>
                  <input
                    type="url"
                    id="set-avatar-url"
                    class="form-input"
                    placeholder="https://example.com/avatar.png"
                    value="${this.escapeHtml(user.avatarUrl || '')}"
                    maxlength="500"
                    ${this.isLoading ? 'disabled' : ''}
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="set-display-name">Display Name</label>
                  <input
                    type="text"
                    id="set-display-name"
                    class="form-input"
                    value="${this.escapeHtml(user.displayName)}"
                    maxlength="32"
                    required
                    ${this.isLoading ? 'disabled' : ''}
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="set-email">Account Email</label>
                  <input
                    type="email"
                    id="set-email"
                    class="form-input"
                    value="${this.escapeHtml(user.email || '')}"
                    placeholder="name@example.com"
                    maxlength="100"
                    required
                    ${this.isLoading ? 'disabled' : ''}
                  />
                </div>

                <button type="submit" class="form-btn-submit" id="settings-save-btn" ${this.isLoading ? 'disabled' : ''}>
                  ${this.isLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </form>

              <div style="margin-top: 18px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
                <button type="button" class="form-btn-submit" id="set-logout-btn" style="background: transparent; border: 1px solid var(--border-medium); color: var(--text-secondary);">
                  Sign Out
                </button>
              </div>
            ` : ''}

            ${this.tab === 'preferences' ? `
              <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                  <span>Audio Effects</span>
                  <button type="button" class="form-btn-submit" id="set-audio-toggle" style="width: auto; padding: 6px 14px; margin: 0;">
                    ${soundSynth.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const overlay = this.container.querySelector('#settings-modal-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    const closeBtn = this.container.querySelector('#settings-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    const tabProfile = this.container.querySelector('#tab-set-profile');
    tabProfile?.addEventListener('click', () => {
      this.tab = 'profile';
      this.error = null;
      this.message = null;
      this.render();
    });

    const tabPref = this.container.querySelector('#tab-set-pref');
    tabPref?.addEventListener('click', () => {
      this.tab = 'preferences';
      this.error = null;
      this.message = null;
      this.render();
    });

    const avatarUrlInput = this.container.querySelector('#set-avatar-url');
    const avatarPreview = this.container.querySelector('#settings-avatar-preview');
    const nameInput = this.container.querySelector('#set-display-name');
    const namePreview = this.container.querySelector('#settings-name-preview');

    avatarUrlInput?.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const user = playFabService.getCurrentUser() || { displayName: "User" };
      if (avatarPreview) {
        if (url) {
          avatarPreview.innerHTML = `<img src="${this.escapeHtml(url)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" alt="" />`;
        } else {
          avatarPreview.innerHTML = `<span style="font-size: 22px; font-weight: 700; color: #ffffff;">${user.displayName.charAt(0).toUpperCase()}</span>`;
        }
      }
    });

    nameInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (namePreview) {
        namePreview.textContent = val || "User";
      }
    });

    const profileForm = this.container.querySelector('#settings-profile-form');
    profileForm?.addEventListener('submit', async () => {
      const user = playFabService.getCurrentUser() || {};
      const newAvatarUrl = avatarUrlInput ? avatarUrlInput.value.trim() : '';
      const newName = nameInput ? nameInput.value.trim().slice(0, 32) : '';
      const emailInput = this.container.querySelector('#set-email');
      const newEmail = emailInput ? emailInput.value.trim().slice(0, 100) : '';

      if (!newName) {
        this.error = 'Display name cannot be empty';
        this.render();
        return;
      }
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
        if (newAvatarUrl !== (user.avatarUrl || '')) {
          await playFabService.updateAvatarUrl(newAvatarUrl);
        }
        if (newName !== (user.displayName || '')) {
          await playFabService.updateDisplayName(newName);
        }
        if (newEmail !== (user.email || '')) {
          await playFabService.updateEmail(newEmail);
        }

        this.message = 'Changes saved successfully';
        appState.notify('profileCache');
        if (this.callbacks.onProfileUpdated) {
          this.callbacks.onProfileUpdated();
        }
      } catch (e) {
        this.error = e.message || 'Failed to save changes';
      } finally {
        this.isLoading = false;
        this.render();
      }
    });

    const audioToggle = this.container.querySelector('#set-audio-toggle');
    audioToggle?.addEventListener('click', () => {
      const isEnabled = soundSynth.toggle();
      audioToggle.textContent = isEnabled ? 'Enabled' : 'Disabled';
    });

    const logoutBtn = this.container.querySelector('#set-logout-btn');
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
