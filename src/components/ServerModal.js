import { playFabService } from '../services/playfab.js';
import { appState } from '../services/state.js';

export class ServerModal {
  constructor(container, { onServerCreated, onServerUpdated }) {
    this.container = container;
    this.callbacks = { onServerCreated, onServerUpdated };
    this.isOpen = false;
    this.tab = 'create';
    this.isLoading = false;
    this.error = null;
    this.success = null;
    this.render();
  }

  open(tab = 'create') {
    this.tab = tab === 'join' ? 'join' : 'create';
    this.isOpen = true;
    this.error = null;
    this.success = null;
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
      <div class="modal-overlay" id="server-modal-overlay">
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header">
            <div class="modal-title-box">
              <h3 class="modal-title">${this.tab === 'create' ? 'Create Server' : 'Join Server'}</h3>
            </div>
            <button class="modal-close-btn" id="server-modal-close" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="auth-tabs" style="margin-bottom: 16px;">
              <button type="button" class="auth-tab ${this.tab === 'create' ? 'active' : ''}" id="tab-srv-create">Create Server</button>
              <button type="button" class="auth-tab ${this.tab === 'join' ? 'active' : ''}" id="tab-srv-join">Join Server</button>
            </div>

            ${this.error ? `<div class="form-error-banner" style="margin-bottom: 12px;"><span>${this.escapeHtml(this.error)}</span></div>` : ''}
            ${this.success ? `<div style="padding: 8px 10px; background: #181818; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 12px; color: #ffffff;">${this.escapeHtml(this.success)}</div>` : ''}

            ${this.tab === 'create' ? `
              <form id="create-server-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
                <div class="form-group">
                  <label class="form-label" for="new-server-name">Server Name</label>
                  <input type="text" id="new-server-name" class="form-input" placeholder="Server Name" required maxlength="40" ${this.isLoading ? 'disabled' : ''} />
                </div>
                <div class="form-group">
                  <label class="form-label" for="new-server-icon">Server Icon URL</label>
                  <input type="url" id="new-server-icon" class="form-input" placeholder="https://example.com/icon.png" maxlength="500" ${this.isLoading ? 'disabled' : ''} />
                </div>
                <button type="submit" class="form-btn-submit" id="create-srv-btn" ${this.isLoading ? 'disabled' : ''}>
                  ${this.isLoading ? 'Creating...' : 'Create Server'}
                </button>
              </form>
            ` : ''}

            ${this.tab === 'join' ? `
              <form id="join-server-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
                <div class="form-group">
                  <label class="form-label" for="join-server-id">Server ID or Invite Link</label>
                  <input type="text" id="join-server-id" class="form-input" placeholder="Enter server ID or paste invite link" required maxlength="256" ${this.isLoading ? 'disabled' : ''} />
                </div>
                <button type="submit" class="form-btn-submit" id="join-srv-btn" ${this.isLoading ? 'disabled' : ''}>
                  ${this.isLoading ? 'Joining...' : 'Join Server'}
                </button>
              </form>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const overlay = this.container.querySelector('#server-modal-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    const closeBtn = this.container.querySelector('#server-modal-close');
    closeBtn?.addEventListener('click', () => this.close());

    const tabCreate = this.container.querySelector('#tab-srv-create');
    tabCreate?.addEventListener('click', () => {
      this.tab = 'create';
      this.error = null;
      this.success = null;
      this.render();
    });

    const tabJoin = this.container.querySelector('#tab-srv-join');
    tabJoin?.addEventListener('click', () => {
      this.tab = 'join';
      this.error = null;
      this.success = null;
      this.render();
    });

    const createForm = this.container.querySelector('#create-server-form');
    createForm?.addEventListener('submit', async () => {
      const nameInput = this.container.querySelector('#new-server-name');
      const iconInput = this.container.querySelector('#new-server-icon');
      const name = nameInput ? nameInput.value.trim() : '';
      const iconUrl = iconInput ? iconInput.value.trim() : '';
      if (!name) return;

      this.isLoading = true;
      this.error = null;
      this.render();

      try {
        const res = await playFabService.createServer(name, iconUrl);
        if (res && res.server) {
          appState.setActiveServer(res.server);
          const servers = await playFabService.getUserServers();
          appState.setServers(servers);
          this.close();
          if (this.callbacks.onServerCreated) {
            this.callbacks.onServerCreated(res.server);
          }
        } else {
          this.error = res?.error || 'Failed to create server';
        }
      } catch (err) {
        this.error = err.message || 'Failed to create server';
      } finally {
        this.isLoading = false;
        this.render();
      }
    });

    const joinForm = this.container.querySelector('#join-server-form');
    joinForm?.addEventListener('submit', async () => {
      const input = this.container.querySelector('#join-server-id');
      let rawVal = input ? input.value.trim() : '';
      if (!rawVal) return;

      if (rawVal.includes('invite=')) {
        rawVal = rawVal.split('invite=')[1].trim();
      }

      this.isLoading = true;
      this.error = null;
      this.render();

      try {
        const res = await playFabService.joinServer(rawVal);
        if (res && res.server) {
          appState.setActiveServer(res.server);
          const servers = await playFabService.getUserServers();
          appState.setServers(servers);
          this.close();
        } else {
          this.error = res.error || 'Failed to join server';
        }
      } catch (err) {
        this.error = err.message || 'Failed to join server';
      } finally {
        this.isLoading = false;
        this.render();
      }
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}
