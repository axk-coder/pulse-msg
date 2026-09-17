import { playFabService } from '../services/playfab.js';
import { appState } from '../services/state.js';

const TEMPLATES = [
  {
    id: 'custom',
    name: 'Custom Server',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    defaultName: 'My Server',
    channels: ['general']
  },
  {
    id: 'gaming',
    name: 'Gaming Hub',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="6"></rect></svg>`,
    defaultName: 'Gaming Squad',
    channels: ['general', 'lfg-team', 'clips-and-media']
  },
  {
    id: 'study',
    name: 'Study & Work',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    defaultName: 'Study Group',
    channels: ['general', 'resources', 'assignments']
  },
  {
    id: 'community',
    name: 'Friends & Hangout',
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    defaultName: 'The Lounge',
    channels: ['general', 'announcements', 'lounge']
  }
];

const PRESET_ICONS = [
  { id: 'server', label: 'Server', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>` },
  { id: 'gamepad', label: 'Gaming', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="6"></rect></svg>` },
  { id: 'shield', label: 'Shield', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>` },
  { id: 'compass', label: 'Compass', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>` },
  { id: 'terminal', label: 'Terminal', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>` },
  { id: 'crown', label: 'Crown', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"></path></svg>` },
  { id: 'planet', label: 'Planet', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="7"></circle><path d="M2 12c0 5.5 4.5 10 10 10s10-4.5 10-10"></path></svg>` }
];

export class ServerModal {
  constructor(container, { onServerCreated, onServerUpdated }) {
    this.container = container;
    this.callbacks = { onServerCreated, onServerUpdated };
    this.isOpen = false;
    this.tab = 'create';
    this.selectedTemplate = 'custom';
    this.serverName = '';
    this.iconUrl = '';
    this.selectedPresetIcon = null;
    this.starterChannels = ['general'];
    this.isLoading = false;
    this.error = null;
    this.success = null;
    this.handleKeyDown = (e) => {
      if (this.isOpen && e.key === 'Escape' && !this.isLoading) {
        this.close();
      }
    };
    window.addEventListener('keydown', this.handleKeyDown);
    this.render();
  }

  open(tab = 'create') {
    this.tab = tab === 'join' ? 'join' : 'create';
    this.isOpen = true;
    this.error = null;
    this.success = null;
    const user = playFabService.getCurrentUser();
    const defaultName = user && user.displayName ? `${user.displayName}'s Server` : 'My Server';
    this.selectedTemplate = 'custom';
    this.serverName = defaultName;
    this.iconUrl = '';
    this.selectedPresetIcon = null;
    this.starterChannels = ['general'];
    this.render();
  }

  close() {
    this.isOpen = false;
    this.render();
  }

  setTemplate(templateId) {
    const t = TEMPLATES.find(tpl => tpl.id === templateId);
    if (!t) return;
    this.selectedTemplate = templateId;
    this.serverName = t.defaultName;
    this.starterChannels = [...t.channels];
    this.render();
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  sanitizeUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (/^(https?:\/\/|data:image\/svg\+xml)/i.test(trimmed)) {
      return trimmed;
    }
    return '';
  }

  getPresetIconDataUrl(svgString) {
    const cleanSvg = svgString.replace('currentColor', '#ffffff');
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="64" height="64">${cleanSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
  }

  render() {
    if (!this.isOpen) {
      this.container.innerHTML = '';
      return;
    }

    const currentInitial = (this.serverName.trim().charAt(0) || 'S').toUpperCase();
    const effectiveIcon = this.selectedPresetIcon 
      ? this.getPresetIconDataUrl(this.selectedPresetIcon.svg)
      : this.sanitizeUrl(this.iconUrl);

    this.container.innerHTML = `
      <div class="modal-overlay" id="server-modal-overlay">
        <div class="modal-card server-create-modal" style="max-width: 520px;">
          <div class="modal-header">
            <div class="modal-title-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
              <h3 class="modal-title">${this.tab === 'create' ? 'Create Server' : 'Join Server'}</h3>
            </div>
            <button class="modal-close-btn" id="server-modal-close" type="button" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body" style="gap: 16px;">
            <div class="auth-tabs">
              <button type="button" class="auth-tab ${this.tab === 'create' ? 'active' : ''}" id="tab-srv-create">Create Server</button>
              <button type="button" class="auth-tab ${this.tab === 'join' ? 'active' : ''}" id="tab-srv-join">Join Server</button>
            </div>

            ${this.error ? `<div class="form-error-banner"><span>${this.escapeHtml(this.error)}</span></div>` : ''}
            ${this.success ? `<div class="server-success-banner"><span>${this.escapeHtml(this.success)}</span></div>` : ''}

            ${this.tab === 'create' ? `
              <div class="server-creation-flow">
                <div class="server-templates-row">
                  ${TEMPLATES.map(tpl => `
                    <button type="button" class="template-card-btn ${this.selectedTemplate === tpl.id ? 'active' : ''}" data-template="${tpl.id}">
                      <div class="template-icon">${tpl.iconSvg}</div>
                      <span class="template-label">${this.escapeHtml(tpl.name)}</span>
                    </button>
                  `).join('')}
                </div>

                <div class="server-preview-box">
                  <div class="server-preview-badge" id="server-preview-badge">
                    ${effectiveIcon ? `<img src="${this.escapeHtml(effectiveIcon)}" class="server-preview-img" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="server-preview-initial" style="display: none;">${this.escapeHtml(currentInitial)}</div>` : `<div class="server-preview-initial">${this.escapeHtml(currentInitial)}</div>`}
                  </div>
                  <div class="server-preview-details">
                    <span class="server-preview-title" id="server-preview-title-display">${this.escapeHtml(this.serverName || 'My Server')}</span>
                    <span class="server-preview-channels-count">${this.starterChannels.length} Channels</span>
                  </div>
                </div>

                <form id="create-server-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
                  <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <label class="form-label" for="new-server-name">Server Name</label>
                      <span class="form-char-count" id="server-name-char-count">${(this.serverName || '').length}/40</span>
                    </div>
                    <input type="text" id="new-server-name" class="form-input" placeholder="Server Name" value="${this.escapeHtml(this.serverName)}" required maxlength="40" ${this.isLoading ? 'disabled' : ''} autocomplete="off" />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Icon Presets</label>
                    <div class="icon-presets-row">
                      <button type="button" class="preset-icon-btn ${!this.selectedPresetIcon && !this.iconUrl ? 'active' : ''}" data-preset="none" title="Default Letter">
                        <span style="font-weight: 700; font-size: 14px;">${this.escapeHtml(currentInitial)}</span>
                      </button>
                      ${PRESET_ICONS.map(p => `
                        <button type="button" class="preset-icon-btn ${this.selectedPresetIcon?.id === p.id ? 'active' : ''}" data-preset="${p.id}" title="${p.label}">
                          ${p.svg}
                        </button>
                      `).join('')}
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="new-server-icon">Custom Icon URL</label>
                    <input type="url" id="new-server-icon" class="form-input" placeholder="https://example.com/icon.png" value="${this.escapeHtml(this.iconUrl)}" maxlength="500" ${this.isLoading ? 'disabled' : ''} />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Starter Channels</label>
                    <div class="starter-channels-list" id="starter-channels-list">
                      ${this.starterChannels.map((ch, idx) => `
                        <div class="starter-channel-pill">
                          <span class="channel-hash">#</span>
                          <span class="channel-pill-name">${this.escapeHtml(ch)}</span>
                          ${idx > 0 ? `<button type="button" class="channel-pill-del" data-remove-channel="${this.escapeHtml(ch)}">&times;</button>` : ''}
                        </div>
                      `).join('')}
                    </div>
                    <div class="add-starter-channel-row" style="margin-top: 8px; display: flex; gap: 8px;">
                      <input type="text" id="add-channel-input" class="form-input" placeholder="new-channel" maxlength="30" style="padding: 6px 10px; font-size: 12px;" />
                      <button type="button" class="btn-secondary" id="add-channel-btn" style="padding: 6px 12px; font-size: 12px; white-space: nowrap;">+ Add</button>
                    </div>
                  </div>

                  <button type="submit" class="form-btn-submit" id="create-srv-btn" ${this.isLoading ? 'disabled' : ''} style="margin-top: 6px;">
                    ${this.isLoading ? '<span class="spinner-sm"></span> Creating...' : 'Create Server'}
                  </button>
                </form>
              </div>
            ` : ''}

            ${this.tab === 'join' ? `
              <div class="server-join-flow">
                <form id="join-server-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
                  <div class="form-group">
                    <label class="form-label" for="join-server-id">Server ID or Invite Link</label>
                    <div style="display: flex; gap: 8px;">
                      <input type="text" id="join-server-id" class="form-input" placeholder="Enter server ID or paste invite link" required maxlength="256" ${this.isLoading ? 'disabled' : ''} autocomplete="off" />
                      <button type="button" class="btn-secondary" id="paste-invite-btn" style="padding: 8px 12px; font-size: 12px; white-space: nowrap;">Paste</button>
                    </div>
                  </div>
                  <button type="submit" class="form-btn-submit" id="join-srv-btn" ${this.isLoading ? 'disabled' : ''} style="margin-top: 6px;">
                    ${this.isLoading ? '<span class="spinner-sm"></span> Joining...' : 'Join Server'}
                  </button>
                </form>
              </div>
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
      if (e.target === overlay && !this.isLoading) this.close();
    });

    const closeBtn = this.container.querySelector('#server-modal-close');
    closeBtn?.addEventListener('click', () => {
      if (!this.isLoading) this.close();
    });

    const tabCreate = this.container.querySelector('#tab-srv-create');
    tabCreate?.addEventListener('click', () => {
      if (this.isLoading) return;
      this.tab = 'create';
      this.error = null;
      this.success = null;
      this.render();
    });

    const tabJoin = this.container.querySelector('#tab-srv-join');
    tabJoin?.addEventListener('click', () => {
      if (this.isLoading) return;
      this.tab = 'join';
      this.error = null;
      this.success = null;
      this.render();
    });

    if (this.tab === 'create') {
      const templateBtns = this.container.querySelectorAll('.template-card-btn');
      templateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tplId = btn.dataset.template;
          this.setTemplate(tplId);
        });
      });

      const nameInput = this.container.querySelector('#new-server-name');
      const charCount = this.container.querySelector('#server-name-char-count');
      const previewTitle = this.container.querySelector('#server-preview-title-display');
      const previewBadge = this.container.querySelector('#server-preview-badge');

      nameInput?.addEventListener('input', (e) => {
        this.serverName = e.target.value;
        if (charCount) charCount.textContent = `${this.serverName.length}/40`;
        if (previewTitle) previewTitle.textContent = this.serverName || 'My Server';
        
        const initialEl = previewBadge?.querySelector('.server-preview-initial');
        if (initialEl) {
          initialEl.textContent = (this.serverName.trim().charAt(0) || 'S').toUpperCase();
        }
      });

      const iconInput = this.container.querySelector('#new-server-icon');
      iconInput?.addEventListener('input', (e) => {
        this.iconUrl = e.target.value;
        this.selectedPresetIcon = null;
        this.updatePreviewImage();
      });

      const presetBtns = this.container.querySelectorAll('.preset-icon-btn');
      presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const presetId = btn.dataset.preset;
          if (presetId === 'none') {
            this.selectedPresetIcon = null;
            this.iconUrl = '';
            if (iconInput) iconInput.value = '';
          } else {
            const found = PRESET_ICONS.find(p => p.id === presetId);
            this.selectedPresetIcon = found || null;
            this.iconUrl = '';
            if (iconInput) iconInput.value = '';
          }
          this.render();
        });
      });

      const addChannelInput = this.container.querySelector('#add-channel-input');
      const addChannelBtn = this.container.querySelector('#add-channel-btn');

      const handleAddChannel = () => {
        if (!addChannelInput) return;
        let val = addChannelInput.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').slice(0, 30);
        if (val.startsWith('-')) val = val.slice(1);
        if (val.endsWith('-')) val = val.slice(0, -1);
        if (val && !this.starterChannels.includes(val)) {
          this.starterChannels.push(val);
          this.render();
        }
      };

      addChannelBtn?.addEventListener('click', handleAddChannel);
      addChannelInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddChannel();
        }
      });

      const delChannelBtns = this.container.querySelectorAll('.channel-pill-del');
      delChannelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.removeChannel;
          this.starterChannels = this.starterChannels.filter(c => c !== target);
          this.render();
        });
      });

      const createForm = this.container.querySelector('#create-server-form');
      createForm?.addEventListener('submit', async () => {
        const cleanName = String(this.serverName || '').trim().slice(0, 40);
        if (!cleanName) {
          this.error = 'Please enter a server name';
          this.render();
          return;
        }

        let finalIconUrl = this.sanitizeUrl(this.iconUrl);
        if (this.selectedPresetIcon) {
          finalIconUrl = this.getPresetIconDataUrl(this.selectedPresetIcon.svg);
        }

        this.isLoading = true;
        this.error = null;
        this.render();

        try {
          const res = await playFabService.createServer(cleanName, finalIconUrl);
          if (res && res.server) {
            let activeServer = res.server;

            if (this.starterChannels.length > 1) {
              const formattedChannels = this.starterChannels.map((cName, idx) => ({
                id: idx === 0 ? 'c_general' : `c_${Date.now()}_${idx}`,
                name: cName,
                type: 'text'
              }));
              try {
                const updated = await playFabService.saveServer(res.server.id, {
                  channels: formattedChannels
                });
                if (updated && updated.server) {
                  activeServer = Object.assign({}, res.server, updated.server);
                }
              } catch {}
            }

            appState.setActiveServer(activeServer);
            const servers = await playFabService.getUserServers();
            appState.setServers(servers);
            this.close();
            if (this.callbacks.onServerCreated) {
              this.callbacks.onServerCreated(activeServer);
            }
          } else {
            this.error = res?.error || 'Failed to create server';
            this.isLoading = false;
            this.render();
          }
        } catch (err) {
          this.error = err.message || 'Failed to create server';
          this.isLoading = false;
          this.render();
        }
      });
    }

    if (this.tab === 'join') {
      const joinForm = this.container.querySelector('#join-server-form');
      const pasteBtn = this.container.querySelector('#paste-invite-btn');
      const input = this.container.querySelector('#join-server-id');

      pasteBtn?.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (input && text) {
            input.value = text.trim();
            input.focus();
          }
        } catch {}
      });

      joinForm?.addEventListener('submit', async () => {
        let rawVal = input ? input.value.trim() : '';
        if (!rawVal) {
          this.error = 'Please enter a server ID or invite link';
          this.render();
          return;
        }

        if (rawVal.includes('invite=')) {
          rawVal = rawVal.split('invite=')[1].split('&')[0].trim();
        } else if (rawVal.includes('/server/')) {
          rawVal = rawVal.split('/server/')[1].split('/')[0].split('?')[0].trim();
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
            this.error = res?.error || 'Failed to join server';
            this.isLoading = false;
            this.render();
          }
        } catch (err) {
          this.error = err.message || 'Failed to join server';
          this.isLoading = false;
          this.render();
        }
      });
    }
  }

  updatePreviewImage() {
    const previewBadge = this.container.querySelector('#server-preview-badge');
    if (!previewBadge) return;
    const cleanUrl = this.sanitizeUrl(this.iconUrl);
    const initial = (this.serverName.trim().charAt(0) || 'S').toUpperCase();

    if (cleanUrl) {
      previewBadge.innerHTML = `
        <img src="${this.escapeHtml(cleanUrl)}" class="server-preview-img" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="server-preview-initial" style="display: none;">${this.escapeHtml(initial)}</div>
      `;
    } else {
      previewBadge.innerHTML = `<div class="server-preview-initial">${this.escapeHtml(initial)}</div>`;
    }
  }
}
