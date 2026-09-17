import { appState } from '../services/state.js';
import { playFabService } from '../services/playfab.js';
import { soundSynth } from '../services/soundEffects.js';

export class Sidebar {
  constructor(container, { onOpenServerModal, onOpenServerSettingsModal, onOpenFriendsModal, onOpenSettingsModal, onOpenLegalModal, onOpenCreditsModal }) {
    this.container = container;
    this.callbacks = { onOpenServerModal, onOpenServerSettingsModal, onOpenFriendsModal, onOpenSettingsModal, onOpenLegalModal, onOpenCreditsModal };
    this.partnerProfiles = new Map();
    this.render();

    this.unsubscribe = appState.subscribe((state, key) => {
      if (key === 'navigation' || key === 'servers' || key === 'dms' || key === 'channel' || key === 'profileCache') {
        this.updateNavItems();
      }
      this.updateUserProfile();
    });
  }

  render() {
    const state = appState.getState();
    const user = playFabService.getCurrentUser() || { displayName: "User", avatarUrl: "" };

    this.container.innerHTML = `
      <div class="sidebar-composite" id="pulse-sidebar">
        <div class="server-rail">
          <button type="button" class="server-rail-btn ${state.activeContext === 'dm' ? 'active' : ''}" id="rail-dm-btn" title="Direct Messages">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          <button type="button" class="server-rail-btn ${state.activeContext === 'global' ? 'active' : ''}" id="rail-global-btn" title="Global Chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </button>
          
          <div class="rail-divider"></div>

          <div class="server-rail-list" id="rail-server-list"></div>

          <button type="button" class="server-rail-btn rail-add-btn" id="rail-add-server-btn" title="Add Server">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        <div class="sidebar-subpanel">
          <div class="sidebar-brand">
            <div class="brand-wrapper">
              <div class="brand-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div>
                <h1 class="brand-title" id="sidebar-context-title">PULSE</h1>
              </div>
            </div>
            <button type="button" class="icon-btn" id="sidebar-context-action-btn" title="Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>

          <div class="sidebar-scroll" id="sidebar-channel-or-dm-list"></div>

          <div class="sidebar-footer">
            <div class="sidebar-footer-user">
              <button class="user-profile-btn" id="sidebar-user-btn" title="User Settings">
                <div class="avatar-wrapper" style="position: relative;">
                  <div class="avatar" id="footer-user-avatar">
                    ${user.avatarUrl 
                      ? `<img src="${this.escapeHtml(user.avatarUrl)}" class="avatar-img" alt="" />`
                      : user.displayName.charAt(0).toUpperCase()
                    }
                  </div>
                  <div class="presence-badge-dot dot-${user.presence || 'online'}" id="footer-presence-dot"></div>
                </div>
                <div class="user-info-text" style="display: flex; flex-direction: column; overflow: hidden;">
                  <span class="user-display-name" id="footer-user-name">${this.escapeHtml(user.displayName)}</span>
                  <span class="user-status-text" id="footer-user-status" style="font-size: 10px; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${this.escapeHtml(user.statusMessage || user.presence || 'online')}</span>
                </div>
              </button>

              <button class="icon-btn" id="sidebar-sound-btn" title="${soundSynth.enabled ? 'Mute Sound' : 'Unmute Sound'}">
                <svg id="sound-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  ${soundSynth.enabled 
                    ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'
                    : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
                  }
                </svg>
              </button>
            </div>

            <div class="sidebar-footer-links">
              <button type="button" class="footer-link-btn" id="footer-shortcuts-btn">Keys</button>
              <span style="color: var(--border-medium); font-size: 10px;">•</span>
              <button type="button" class="footer-link-btn" id="footer-privacy-btn">Privacy</button>
              <span style="color: var(--border-medium); font-size: 10px;">•</span>
              <button type="button" class="footer-link-btn" id="footer-terms-btn">Terms</button>
              <span style="color: var(--border-medium); font-size: 10px;">•</span>
              <button type="button" class="footer-link-btn" id="footer-credits-btn">Credits</button>
              <span class="footer-version-tag" style="color: var(--text-muted); font-size: 11px; font-weight: 700; margin-left: auto;">5.5</span>
            </div>
          </div>
        </div>
      </div>
      <div class="sidebar-backdrop" id="sidebar-backdrop" style="display: none;"></div>
    `;

    this.attachEvents();
    this.updateNavItems();
  }

  attachEvents() {
    const dmBtn = this.container.querySelector('#rail-dm-btn');
    dmBtn?.addEventListener('click', () => {
      appState.setActiveDM(null);
      appState.toggleMobileSidebar(false);
    });

    const globalBtn = this.container.querySelector('#rail-global-btn');
    globalBtn?.addEventListener('click', () => {
      appState.setGlobalChat();
      appState.toggleMobileSidebar(false);
    });

    const railAddBtn = this.container.querySelector('#rail-add-server-btn');
    railAddBtn?.addEventListener('click', () => {
      this.callbacks.onOpenServerModal('create');
    });

    const userBtn = this.container.querySelector('#sidebar-user-btn');
    userBtn?.addEventListener('click', () => {
      this.callbacks.onOpenSettingsModal('profile');
    });

    const actionBtn = this.container.querySelector('#sidebar-context-action-btn');
    actionBtn?.addEventListener('click', () => {
      const state = appState.getState();
      if (state.activeContext === 'server') {
        if (this.callbacks.onOpenServerSettingsModal) {
          this.callbacks.onOpenServerSettingsModal();
        }
      } else {
        this.callbacks.onOpenFriendsModal('list');
      }
    });

    const soundBtn = this.container.querySelector('#sidebar-sound-btn');
    soundBtn?.addEventListener('click', () => {
      const isNowEnabled = soundSynth.toggle();
      soundBtn.title = isNowEnabled ? 'Mute Sound' : 'Unmute Sound';
      const icon = this.container.querySelector('#sound-icon');
      if (icon) {
        icon.innerHTML = isNowEnabled 
          ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'
          : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
      }
    });

    const shortcutsBtn = this.container.querySelector('#footer-shortcuts-btn');
    shortcutsBtn?.addEventListener('click', () => this.callbacks.onOpenShortcutsModal?.());

    const privacyBtn = this.container.querySelector('#footer-privacy-btn');
    privacyBtn?.addEventListener('click', () => this.callbacks.onOpenLegalModal('privacy'));

    const termsBtn = this.container.querySelector('#footer-terms-btn');
    termsBtn?.addEventListener('click', () => this.callbacks.onOpenLegalModal('terms'));

    const creditsBtn = this.container.querySelector('#footer-credits-btn');
    creditsBtn?.addEventListener('click', () => this.callbacks.onOpenCreditsModal());

    const backdrop = this.container.querySelector('#sidebar-backdrop');
    backdrop?.addEventListener('click', () => appState.toggleMobileSidebar(false));
  }

  async updateNavItems() {
    const state = appState.getState();
    const serverRail = this.container.querySelector('#rail-server-list');
    const titleEl = this.container.querySelector('#sidebar-context-title');
    const panelScroll = this.container.querySelector('#sidebar-channel-or-dm-list');
    const railDmBtn = this.container.querySelector('#rail-dm-btn');
    const railGlobalBtn = this.container.querySelector('#rail-global-btn');

    if (railDmBtn) {
      railDmBtn.classList.toggle('active', state.activeContext === 'dm');
    }
    if (railGlobalBtn) {
      railGlobalBtn.classList.toggle('active', state.activeContext === 'global');
    }

    if (serverRail) {
      serverRail.innerHTML = (state.servers || []).map(s => {
        const sId = s.serverId || s.id;
        const initial = (s.name || 'S').charAt(0).toUpperCase();
        const isActive = state.activeContext === 'server' && state.activeServerId === sId;
        const content = s.iconUrl 
          ? `<img src="${this.escapeHtml(s.iconUrl)}" alt="" style="width: 100%; height: 100%; border-radius: inherit; object-fit: cover;" />`
          : `<span>${this.escapeHtml(initial)}</span>`;

        return `
          <button type="button" class="server-rail-btn ${isActive ? 'active' : ''}" data-server-id="${this.escapeHtml(sId)}" title="${this.escapeHtml(s.name)}">
            ${content}
          </button>
        `;
      }).join('');

      const sBtns = serverRail.querySelectorAll('.server-rail-btn');
      sBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
          const sId = btn.getAttribute('data-server-id');
          if (sId) {
            const currentServers = appState.getState().servers || [];
            const cachedServer = currentServers.find(s => (s.serverId || s.id) === sId) || { id: sId, serverId: sId, name: 'Server', channels: [{ id: 'chat', name: 'chat' }] };
            appState.setActiveServer(cachedServer);
            appState.toggleMobileSidebar(false);
            try {
              const res = await playFabService.getServer(sId);
              if (res && res.server) {
                const current = appState.getState().activeServer;
                const updated = Object.assign({}, current, res.server);
                appState.setActiveServer(updated);
              }
            } catch {}
          }
        });
      });
    }

    if (state.activeContext === 'global') {
      if (titleEl) titleEl.textContent = 'Global Chat';

      if (panelScroll) {
        panelScroll.innerHTML = `
          <div class="nav-section">
            <div class="nav-section-title">
              <span>Public</span>
            </div>
            <ul class="channel-list">
              <li class="channel-item active">
                <div class="channel-item-left">
                  <span class="channel-hash">#</span>
                  <span>global-chat</span>
                </div>
              </li>
            </ul>
          </div>
        `;
      }
    } else if (state.activeContext === 'server' && state.activeServer) {
      const server = state.activeServer;
      if (titleEl) titleEl.textContent = server.name;

      const currentUserId = playFabService.getCurrentUser()?.playFabId;
      const isOwner = server.ownerId === currentUserId || (!server.ownerId && (server.id === currentUserId || server.serverId === currentUserId));
      const memberRecord = (server.members && server.members[currentUserId]) ? server.members[currentUserId] : null;
      const userRoles = (memberRecord && Array.isArray(memberRecord.roles)) ? memberRecord.roles : [];
      const allRoles = Array.isArray(server.roles) ? server.roles : [];

      const userPerms = new Set();
      if (isOwner) {
        userPerms.add('manage_server');
        userPerms.add('manage_channels');
        userPerms.add('manage_roles');
        userPerms.add('send_messages');
      } else {
        for (const r of allRoles) {
          if (userRoles.includes(r.id) && Array.isArray(r.permissions)) {
            r.permissions.forEach(p => userPerms.add(p));
          }
        }
      }

      const canManageChannels = isOwner || userRoles.includes('role_admin') || userPerms.has('manage_channels');
      const sId = server.id || server.serverId;

      const visibleChannels = (server.channels || []).filter(ch => {
        if (isOwner || userRoles.includes('role_admin')) return true;
        const overrides = (server.channelOverrides && server.channelOverrides[ch.id]) || {};
        let explicitAllow = false;
        let explicitDeny = false;
        for (const rId of userRoles) {
          if (overrides[rId]) {
            if (overrides[rId].view_channel === true) explicitAllow = true;
            if (overrides[rId].view_channel === false) explicitDeny = true;
          }
        }
        if (explicitAllow) return true;
        if (explicitDeny) return false;
        return true;
      });

      if (visibleChannels.length > 0 && !visibleChannels.some(c => c.id === state.activeChannelId)) {
        state.activeChannelId = visibleChannels[0].id;
        appState.persistActiveContext();
      }

      if (panelScroll) {
        panelScroll.innerHTML = `
          <div class="nav-section">
            <div class="nav-section-title" style="display: flex; justify-content: space-between; align-items: center;">
              <span>Channels</span>
              ${canManageChannels ? `
                <button type="button" class="icon-btn add-channel-mini-btn" title="Create Channel">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              ` : ''}
            </div>
            <ul class="channel-list">
              ${visibleChannels.map((ch, chIdx) => `
                <li class="channel-item ${state.activeChannelId === ch.id ? 'active' : ''}" data-channel-id="${this.escapeHtml(ch.id)}" style="display: flex; align-items: center; justify-content: space-between;">
                  <div class="channel-item-left" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span class="channel-hash">#</span>
                    <span>${this.escapeHtml(ch.name || ch.id)}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 2px;">
                    ${canManageChannels ? `
                      ${chIdx > 0 ? `
                        <button type="button" class="icon-btn btn-channel-up-mini" data-channel-id="${this.escapeHtml(ch.id)}" title="Move Channel Up" style="opacity: 0.6; padding: 2px;">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                            <polyline points="18 15 12 9 6 15"></polyline>
                          </svg>
                        </button>
                      ` : ''}
                      ${chIdx < visibleChannels.length - 1 ? `
                        <button type="button" class="icon-btn btn-channel-down-mini" data-channel-id="${this.escapeHtml(ch.id)}" title="Move Channel Down" style="opacity: 0.6; padding: 2px;">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      ` : ''}
                      <button type="button" class="icon-btn btn-channel-settings-mini" data-channel-id="${this.escapeHtml(ch.id)}" title="Channel Settings & Permissions" style="opacity: 0.6; padding: 2px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                      </button>
                    ` : ''}
                    ${(canManageChannels && ch.id !== 'chat') ? `
                      <button type="button" class="icon-btn btn-delete-channel-mini" data-channel-id="${this.escapeHtml(ch.id)}" title="Delete Channel" style="opacity: 0.6; padding: 2px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    ` : ''}
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        `;

        const addChBtn = panelScroll.querySelector('.add-channel-mini-btn');
        addChBtn?.addEventListener('click', () => {
          if (!canManageChannels) return;
          if (this.callbacks.onOpenServerSettingsModal) {
            this.callbacks.onOpenServerSettingsModal('channels', { createChannel: true });
          }
        });

        const reorderChannel = async (targetId, direction) => {
          const currentList = Array.isArray(server.channels) ? [...server.channels] : [];
          const idx = currentList.findIndex(c => (typeof c === 'object' ? c.id : c) === targetId);
          if (idx === -1) return;
          const targetIndex = direction === 'up' ? idx - 1 : idx + 1;
          if (targetIndex < 0 || targetIndex >= currentList.length) return;

          const temp = currentList[idx];
          currentList[idx] = currentList[targetIndex];
          currentList[targetIndex] = temp;

          const current = appState.getState().activeServer;
          appState.setActiveServer({ ...current, channels: currentList });

          try {
            const res = await playFabService.saveServer(sId, { channels: currentList });
            if (res && res.server) {
              const merged = Object.assign({}, current, res.server, { channels: res.server.channels || currentList });
              appState.setActiveServer(merged);
            }
          } catch {}
        };

        panelScroll.querySelectorAll('.btn-channel-up-mini').forEach(upBtn => {
          upBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!canManageChannels) return;
            const chId = upBtn.getAttribute('data-channel-id');
            if (chId) reorderChannel(chId, 'up');
          });
        });

        panelScroll.querySelectorAll('.btn-channel-down-mini').forEach(downBtn => {
          downBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!canManageChannels) return;
            const chId = downBtn.getAttribute('data-channel-id');
            if (chId) reorderChannel(chId, 'down');
          });
        });

        panelScroll.querySelectorAll('.btn-channel-settings-mini').forEach(setBtn => {
          setBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!canManageChannels) return;
            const chId = setBtn.getAttribute('data-channel-id');
            if (chId && this.callbacks.onOpenServerSettingsModal) {
              this.callbacks.onOpenServerSettingsModal('channels', { channelId: chId });
            }
          });
        });

        panelScroll.querySelectorAll('.btn-delete-channel-mini').forEach(delBtn => {
          delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!canManageChannels) return;
            const delChId = delBtn.getAttribute('data-channel-id');
            if (delChId && delChId !== 'chat') {
              const res = await playFabService.saveServer(sId, { deleteChannel: delChId });
              if (res && res.server) {
                const current = appState.getState().activeServer;
                appState.setActiveServer({ ...current, ...res.server, members: current?.members || {}, channels: res.server.channels || current?.channels || [] });
                if (state.activeChannelId === delChId) {
                  appState.setActiveChannel('chat');
                }
                this.updateNavItems();
              }
            }
          });
        });

        const chItems = panelScroll.querySelectorAll('.channel-item');
        chItems.forEach(item => {
          item.addEventListener('click', (e) => {
            if (e.target.closest('.icon-btn')) return;
            const chId = item.getAttribute('data-channel-id');
            if (chId) {
              appState.setActiveChannel(chId);
              appState.toggleMobileSidebar(false);
            }
          });
        });
      }
    } else {
      if (titleEl) titleEl.textContent = 'Direct Messages';

      if (panelScroll) {
        const dms = state.dms || [];

        for (const dm of dms) {
          if (!dm.isGroup && dm.partnerId && !this.partnerProfiles.has(dm.partnerId)) {
            playFabService.resolveUser(dm.partnerId).then(p => {
              this.partnerProfiles.set(dm.partnerId, p);
              this.updateNavItems();
            });
          }
        }

        panelScroll.innerHTML = `
          <div class="nav-section">
            <button type="button" class="channel-item friends-nav-btn ${!state.activeDM ? 'active' : ''}" style="width: 100%; text-align: left; margin-bottom: 8px;">
              <div class="channel-item-left">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Friends</span>
              </div>
            </button>

            <div class="nav-section-title" style="display: flex; justify-content: space-between; align-items: center;">
              <span>Direct Messages</span>
              <button type="button" class="icon-btn add-group-mini-btn" title="New Group DM">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
            <ul class="channel-list">
              ${dms.length === 0 ? `
                <li style="padding: 8px 12px; font-size: 12px; color: var(--text-muted);">No messages yet</li>
              ` : dms.map(dm => {
                const isActive = state.activeDM && state.activeDM.dmId === dm.dmId;
                if (dm.isGroup) {
                  const gName = dm.name || "Group Chat";
                  return `
                    <li class="channel-item dm-item ${isActive ? 'active' : ''}" data-dm-id="${this.escapeHtml(dm.dmId)}" data-is-group="true" data-name="${this.escapeHtml(gName)}">
                      <div class="channel-item-left">
                        <div class="dm-avatar-mini" style="display: flex; align-items: center; justify-content: center;">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <span>${this.escapeHtml(gName)}</span>
                      </div>
                    </li>
                  `;
                }

                const partnerProfile = this.partnerProfiles.get(dm.partnerId) || { displayName: "User", avatarUrl: "", presence: "offline", statusMessage: "" };
                const initial = partnerProfile.displayName.charAt(0).toUpperCase();

                return `
                  <li class="channel-item dm-item ${isActive ? 'active' : ''}" data-dm-id="${this.escapeHtml(dm.dmId)}" data-partner-id="${this.escapeHtml(dm.partnerId)}">
                    <div class="channel-item-left">
                      <div class="dm-avatar-mini" style="position: relative;">
                        ${partnerProfile.avatarUrl 
                          ? `<img src="${this.escapeHtml(partnerProfile.avatarUrl)}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />`
                          : initial
                        }
                        <div class="presence-badge-dot dot-${partnerProfile.presence || 'offline'}"></div>
                      </div>
                      <div style="display: flex; flex-direction: column; overflow: hidden;">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(partnerProfile.displayName)}</span>
                        ${partnerProfile.statusMessage ? `<span style="font-size: 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(partnerProfile.statusMessage)}</span>` : ''}
                      </div>
                    </div>
                  </li>
                `;
              }).join('')}
            </ul>
          </div>
        `;

        const friendsBtn = panelScroll.querySelector('.friends-nav-btn');
        friendsBtn?.addEventListener('click', () => {
          appState.setActiveDM(null);
        });

        const addGrpBtn = panelScroll.querySelector('.add-group-mini-btn');
        addGrpBtn?.addEventListener('click', () => {
          this.callbacks.onOpenFriendsModal('group');
        });

        const dmItems = panelScroll.querySelectorAll('.dm-item');
        dmItems.forEach(item => {
          item.addEventListener('click', () => {
            const dmId = item.getAttribute('data-dm-id');
            const isGroup = item.getAttribute('data-is-group') === 'true';
            if (isGroup) {
              const name = item.getAttribute('data-name');
              appState.setActiveDM({ dmId, isGroup: true, name });
            } else {
              const partnerId = item.getAttribute('data-partner-id');
              if (dmId && partnerId) {
                appState.setActiveDM({ dmId, partnerId });
              }
            }
            appState.toggleMobileSidebar(false);
          });
        });
      }
    }
  }

  updateUserProfile() {
    const user = playFabService.getCurrentUser() || { displayName: "User", avatarUrl: "", presence: "online", statusMessage: "" };
    const nameEl = this.container.querySelector('#footer-user-name');
    const avatarEl = this.container.querySelector('#footer-user-avatar');
    const statusEl = this.container.querySelector('#footer-user-status');
    const presenceDot = this.container.querySelector('#footer-presence-dot');

    if (nameEl) nameEl.textContent = user.displayName;
    if (statusEl) statusEl.textContent = user.statusMessage || user.presence || 'online';
    if (presenceDot) {
      presenceDot.className = `presence-badge-dot dot-${user.presence || 'online'}`;
    }
    if (avatarEl) {
      if (user.avatarUrl) {
        avatarEl.innerHTML = `<img src="${this.escapeHtml(user.avatarUrl)}" class="avatar-img" alt="" />`;
      } else {
        avatarEl.textContent = user.displayName.charAt(0).toUpperCase();
      }
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}
