import { playFabService } from '../services/playfab.js';
import { appState } from '../services/state.js';
import { soundSynth } from '../services/soundEffects.js';

export class SettingsModal {
  constructor(container, { onLogout, onProfileUpdated, onOpenLegal, onOpenCredits }) {
    this.container = container;
    this.callbacks = { onLogout, onProfileUpdated, onOpenLegal, onOpenCredits };
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
        <div class="modal-card" style="max-width: 480px;">
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
            <div class="auth-tabs" style="margin-bottom: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
              <button type="button" class="auth-tab ${this.tab === 'profile' ? 'active' : ''}" id="tab-set-profile" style="padding: 8px 4px; font-size: 12px; justify-content: center;">Profile</button>
              <button type="button" class="auth-tab ${this.tab === 'account' ? 'active' : ''}" id="tab-set-account" style="padding: 8px 4px; font-size: 12px; justify-content: center;">Account</button>
              <button type="button" class="auth-tab ${this.tab === 'preferences' ? 'active' : ''}" id="tab-set-pref" style="padding: 8px 4px; font-size: 12px; justify-content: center;">Preferences</button>
              <button type="button" class="auth-tab ${this.tab === 'legal' ? 'active' : ''}" id="tab-set-legal" style="padding: 8px 4px; font-size: 12px; justify-content: center;">Policies</button>
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
                <div class="avatar-wrapper" id="settings-avatar-preview" style="width: 56px; height: 56px; min-width: 56px; position: relative;">
                  <div class="avatar" style="width: 100%; height: 100%;">
                    ${user.avatarUrl 
                      ? `<img src="${this.escapeHtml(user.avatarUrl)}" class="avatar-img" alt="" />`
                      : `<span style="font-size: 22px; font-weight: 700; color: #ffffff;">${user.displayName.charAt(0).toUpperCase()}</span>`
                    }
                  </div>
                  <div class="presence-badge-dot dot-${user.presence || 'online'}" style="width: 12px; height: 12px; bottom: 0; right: 0;"></div>
                </div>
                <div style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span id="settings-name-preview" style="font-size: 16px; font-weight: 700; color: #ffffff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${this.escapeHtml(user.displayName)}</span>
                    ${(user.appRank && !user.appRank.hidden) ? `
                      <span class="app-rank-badge" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; background: rgba(255, 255, 255, 0.08); border: 1px solid ${this.escapeHtml(user.appRank.color || '#ffffff')}; color: ${this.escapeHtml(user.appRank.color || '#ffffff')};">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span>${this.escapeHtml(user.appRank.name)}</span>
                      </span>
                    ` : ''}
                  </div>
                  <span style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">@${this.escapeHtml(user.username || user.displayName.toLowerCase().replace(/\s+/g, ''))}</span>
                  ${user.statusMessage ? `<span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${this.escapeHtml(user.statusMessage)}</span>` : ''}
                </div>
              </div>

              <form id="settings-profile-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
                <div class="form-group">
                  <label class="form-label" for="set-presence">Presence Status</label>
                  <select id="set-presence" class="form-input" style="background: var(--bg-card); color: #fff; border: 1px solid var(--border-medium); cursor: pointer;" ${this.isLoading ? 'disabled' : ''}>
                    <option value="online" ${(user.presence === 'online' || !user.presence) ? 'selected' : ''}>Online (Active)</option>
                    <option value="idle" ${user.presence === 'idle' ? 'selected' : ''}>Idle (Away)</option>
                    <option value="dnd" ${user.presence === 'dnd' ? 'selected' : ''}>Do Not Disturb</option>
                    <option value="offline" ${user.presence === 'offline' ? 'selected' : ''}>Invisible / Offline</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="set-status-msg">Status Message</label>
                  <input
                    type="text"
                    id="set-status-msg"
                    class="form-input"
                    placeholder="What's on your mind?"
                    value="${this.escapeHtml(user.statusMessage || '')}"
                    maxlength="128"
                    ${this.isLoading ? 'disabled' : ''}
                  />
                </div>

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

                <button type="submit" class="form-btn-submit" id="settings-save-profile-btn" ${this.isLoading ? 'disabled' : ''}>
                  ${this.isLoading ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </form>
            ` : ''}

            ${this.tab === 'account' ? `
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="padding: 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Account Handle</span>
                    <span style="font-size: 13px; font-weight: 600; color: #ffffff;">@${this.escapeHtml(user.username || user.displayName.toLowerCase().replace(/\s+/g, ''))}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Account Status</span>
                    <span style="font-size: 12px; font-weight: 700; color: #23a55a; background: rgba(35, 165, 90, 0.12); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(35, 165, 90, 0.3);">Active</span>
                  </div>
                </div>

                <form id="settings-account-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
                  <div class="form-group">
                    <label class="form-label" for="set-account-email">Account Email</label>
                    <input
                      type="email"
                      id="set-account-email"
                      class="form-input"
                      value="${this.escapeHtml(user.email || '')}"
                      placeholder="name@example.com"
                      maxlength="100"
                      required
                      ${this.isLoading ? 'disabled' : ''}
                    />
                  </div>

                  <button type="submit" class="form-btn-submit" id="settings-save-account-btn" ${this.isLoading ? 'disabled' : ''}>
                    ${this.isLoading ? 'Updating Email...' : 'Update Account Email'}
                  </button>
                </form>

                <div style="margin-top: 10px; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
                  <span style="font-size: 12px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 10px;">Session</span>
                  <button type="button" class="form-btn-submit" id="set-logout-btn" style="background: transparent; border: 1px solid var(--border-medium); color: var(--text-secondary);">
                    Sign Out
                  </button>
                </div>
              </div>
            ` : ''}

            ${this.tab === 'preferences' ? `
              <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 14px; font-weight: 600; color: #ffffff;">Audio Effects</span>
                    <span style="font-size: 11px; color: var(--text-muted);">Sound synth notifications on messages & alerts</span>
                  </div>
                  <button type="button" class="form-btn-submit" id="set-audio-toggle" style="width: auto; padding: 6px 14px; margin: 0; font-size: 12px;">
                    ${soundSynth.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 14px; font-weight: 600; color: #ffffff;">Color Scheme</span>
                    <span style="font-size: 11px; color: var(--text-muted);">Strict grayscale neutral dark interface</span>
                  </div>
                  <span style="font-size: 11px; font-weight: 700; color: #ffffff; background: #222222; padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border-medium);">Grayscale Dark</span>
                </div>
              </div>
            ` : ''}

            ${this.tab === 'legal' ? `
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                  <h4 style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">Network & Security Compliance</h4>
                  <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">This application is not designed, built, or intended to bypass any network blocks, organizational restrictions, or firewalls. Standard encrypted HTTPS protocols are utilized for all client data requests.</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
                  <button type="button" class="form-btn-submit" id="set-open-privacy-btn" style="background: var(--bg-card); border: 1px solid var(--border-medium); color: #ffffff; text-align: left; justify-content: flex-start; padding: 10px 14px; font-size: 13px;">
                    View Privacy Policy
                  </button>
                  <button type="button" class="form-btn-submit" id="set-open-terms-btn" style="background: var(--bg-card); border: 1px solid var(--border-medium); color: #ffffff; text-align: left; justify-content: flex-start; padding: 10px 14px; font-size: 13px;">
                    View Terms of Service
                  </button>
                  <button type="button" class="form-btn-submit" id="set-open-credits-btn" style="background: var(--bg-card); border: 1px solid var(--border-medium); color: #ffffff; text-align: left; justify-content: flex-start; padding: 10px 14px; font-size: 13px;">
                    View Credits
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

    const tabAccount = this.container.querySelector('#tab-set-account');
    tabAccount?.addEventListener('click', () => {
      this.tab = 'account';
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

    const tabLegal = this.container.querySelector('#tab-set-legal');
    tabLegal?.addEventListener('click', () => {
      this.tab = 'legal';
      this.error = null;
      this.message = null;
      this.render();
    });

    const avatarUrlInput = this.container.querySelector('#set-avatar-url');
    const avatarPreview = this.container.querySelector('#settings-avatar-preview .avatar');
    const nameInput = this.container.querySelector('#set-display-name');
    const namePreview = this.container.querySelector('#settings-name-preview');
    const presenceSelect = this.container.querySelector('#set-presence');
    const statusMsgInput = this.container.querySelector('#set-status-msg');

    avatarUrlInput?.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const user = playFabService.getCurrentUser() || { displayName: "User" };
      if (avatarPreview) {
        if (url) {
          avatarPreview.innerHTML = `<img src="${this.escapeHtml(url)}" class="avatar-img" onerror="this.style.display='none'" alt="" />`;
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
      const newPresence = presenceSelect ? presenceSelect.value : 'online';
      const newStatusMsg = statusMsgInput ? statusMsgInput.value.trim().slice(0, 128) : '';

      if (!newName) {
        this.error = 'Display name cannot be empty';
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
        if (newPresence !== (user.presence || 'online') || newStatusMsg !== (user.statusMessage || '')) {
          await playFabService.updatePresence(newPresence, newStatusMsg);
        }

        this.message = 'Profile changes saved successfully';
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

    const accountForm = this.container.querySelector('#settings-account-form');
    accountForm?.addEventListener('submit', async () => {
      const user = playFabService.getCurrentUser() || {};
      const emailInput = this.container.querySelector('#set-account-email');
      const newEmail = emailInput ? emailInput.value.trim().slice(0, 100) : '';

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
        if (newEmail !== (user.email || '')) {
          await playFabService.updateEmail(newEmail);
        }
        this.message = 'Account email updated successfully';
        if (this.callbacks.onProfileUpdated) {
          this.callbacks.onProfileUpdated();
        }
      } catch (e) {
        this.error = e.message || 'Failed to update email';
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

    const openPrivacyBtn = this.container.querySelector('#set-open-privacy-btn');
    openPrivacyBtn?.addEventListener('click', () => {
      this.close();
      if (this.callbacks.onOpenLegal) {
        this.callbacks.onOpenLegal('privacy');
      }
    });

    const openTermsBtn = this.container.querySelector('#set-open-terms-btn');
    openTermsBtn?.addEventListener('click', () => {
      this.close();
      if (this.callbacks.onOpenLegal) {
        this.callbacks.onOpenLegal('terms');
      }
    });

    const openCreditsBtn = this.container.querySelector('#set-open-credits-btn');
    openCreditsBtn?.addEventListener('click', () => {
      this.close();
      if (this.callbacks.onOpenCredits) {
        this.callbacks.onOpenCredits();
      }
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
