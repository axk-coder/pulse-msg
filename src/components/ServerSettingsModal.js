import { playFabService } from '../services/playfab.js';
import { appState } from '../services/state.js';

const ALL_PERMISSIONS = [
  { id: 'manage_server', label: 'Manage Server' },
  { id: 'manage_channels', label: 'Manage Channels' },
  { id: 'manage_roles', label: 'Manage Roles' },
  { id: 'manage_members', label: 'Manage Members' },
  { id: 'manage_messages', label: 'Manage Messages' },
  { id: 'mention_everyone', label: 'Mention Everyone' },
  { id: 'send_messages', label: 'Send Messages' },
  { id: 'attach_files', label: 'Attach Files' }
];

const CHANNEL_PERMISSIONS = [
  { id: 'view_channel', label: 'View Channel' },
  { id: 'send_messages', label: 'Send Messages' },
  { id: 'attach_files', label: 'Attach Files' },
  { id: 'mention_everyone', label: 'Mention Everyone' }
];

export class ServerSettingsModal {
  constructor(container, { onServerUpdated, onServerDeleted }) {
    this.container = container;
    this.callbacks = { onServerUpdated, onServerDeleted };
    this.isOpen = false;
    this.tab = 'profile';
    this.isLoading = false;
    this.error = null;
    this.success = null;
    this.editingRoleId = null;
    this.activeRoleId = null;
    this.editingChannelId = null;
    this.copyFeedback = false;
    this.render();
  }

  updateServerState(newServerData) {
    const current = appState.getState().activeServer || {};
    const merged = Object.assign({}, current, newServerData);
    if (!newServerData.members && current.members) merged.members = current.members;
    if (!newServerData.channels && current.channels) merged.channels = current.channels;
    appState.setActiveServer(merged);
    return merged;
  }

  open(tab = 'profile', options = {}) {
    this.tab = tab;
    this.isOpen = true;
    this.error = null;
    this.success = null;
    this.editingRoleId = options.roleId || null;
    this.editingChannelId = options.channelId || null;
    this.showCreateChannel = !!options.createChannel;
    this.copyFeedback = false;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.editingRoleId = null;
    this.editingChannelId = null;
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

  getSortedRoles(server) {
    const roles = Array.isArray(server.roles) ? server.roles.slice() : [];
    roles.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    return roles;
  }

  getUserTopPosition(server, userId) {
    if (!server || !server.members || !server.members[userId]) return Infinity;
    const myRoles = server.members[userId].roles || [];
    const allRoles = Array.isArray(server.roles) ? server.roles : [];
    let top = Infinity;
    for (const r of allRoles) {
      if (myRoles.includes(r.id)) {
        const pos = r.position ?? 999;
        if (pos < top) top = pos;
      }
    }
    return top;
  }

  render() {
    if (!this.isOpen) {
      this.container.innerHTML = '';
      return;
    }

    const state = appState.getState();
    const server = state.activeServer;

    if (!server) {
      this.container.innerHTML = '';
      this.isOpen = false;
      return;
    }

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
      userPerms.add('manage_members');
      userPerms.add('manage_messages');
    } else {
      for (const r of allRoles) {
        if (userRoles.includes(r.id) && Array.isArray(r.permissions)) {
          r.permissions.forEach(p => userPerms.add(p));
        }
      }
    }

    const canManageServer = isOwner || userRoles.includes('role_admin') || userPerms.has('manage_server');
    const canManageRoles = isOwner || userRoles.includes('role_admin') || userPerms.has('manage_roles');
    const canManageChannels = isOwner || userRoles.includes('role_admin') || userPerms.has('manage_channels');

    this.canManageServer = canManageServer;
    this.canManageRoles = canManageRoles;
    this.canManageChannels = canManageChannels;
    this.isOwner = isOwner;

    const sId = server.id || server.serverId;
    const inviteUrl = `${window.location.origin}${window.location.pathname}#invite=${sId}`;
    const membersList = Object.keys(server.members || {});
    const memberCount = membersList.length || 1;
    const sortedRoles = this.getSortedRoles(server);

    const editingRole = this.editingRoleId ? sortedRoles.find(r => r.id === this.editingRoleId) : null;
    const channels = Array.isArray(server.channels) ? server.channels : [];
    if (this.tab === 'channels' && !this.editingChannelId && channels.length > 0 && !this.showCreateChannel) {
      this.editingChannelId = channels[0].id;
    }
    const editingChannel = this.editingChannelId ? channels.find(c => c.id === this.editingChannelId) : null;

    this.container.innerHTML = `
      <div class="modal-overlay" id="srv-settings-overlay" style="padding: 0; background: rgba(0, 0, 0, 0.85); display: flex; align-items: stretch; justify-content: stretch;">
        <div class="discord-settings-wrapper" style="display: flex; width: 100vw; height: 100vh; background: var(--bg-primary); color: var(--text-primary); font-family: var(--font-main);">
          
          <div class="discord-settings-sidebar" style="width: 240px; background: var(--bg-secondary); border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column; padding: 24px 16px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; padding: 0 8px;">
              ${this.escapeHtml(server.name || 'Server')}
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
              ${['profile', 'channels', 'roles', 'members', 'invites'].map(t => {
                let label = t.charAt(0).toUpperCase() + t.slice(1);
                if (t === 'roles') label += ` (${sortedRoles.length})`;
                if (t === 'channels') label += ` (${channels.length})`;
                return `
                  <button type="button" class="discord-nav-btn ${this.tab === t ? 'active' : ''}" id="nav-${t}-btn" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; font-size: 13px; font-weight: 500; border-radius: var(--radius-sm); border: none; background: ${this.tab === t ? 'var(--bg-active)' : 'transparent'}; color: ${this.tab === t ? 'var(--text-primary)' : 'var(--text-secondary)'}; text-align: left; cursor: pointer;">
                    ${label}
                  </button>
                `;
              }).join('')}
            </div>

            <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px;">
              ${isOwner ? `
                <button type="button" id="btn-delete-server" style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 8px 12px; font-size: 13px; font-weight: 500; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--text-muted); cursor: pointer; text-align: left;">
                  <span>Delete Server</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              ` : `
                <button type="button" id="btn-leave-server" style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 8px 12px; font-size: 13px; font-weight: 500; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--text-muted); cursor: pointer; text-align: left;">
                  <span>Leave Server</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              `}
            </div>
          </div>

          <div class="discord-settings-main" style="flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 40px 48px; position: relative;">
            
            <div style="position: absolute; top: 24px; right: 32px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <button type="button" id="srv-settings-close-btn" style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-card); border: 1px solid var(--border-medium); color: var(--text-primary); display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <span style="font-size: 10px; font-weight: 700; color: var(--text-muted);">ESC</span>
            </div>

            ${this.error ? `<div class="form-error-banner" style="margin-bottom: 20px;"><span>${this.escapeHtml(this.error)}</span></div>` : ''}
            ${this.success ? `<div style="padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 20px; color: var(--text-primary);">${this.escapeHtml(this.success)}</div>` : ''}

            ${this.tab === 'profile' ? this.renderProfileTab(server, canManageServer, memberCount) : ''}
            ${this.tab === 'channels' ? this.renderChannelsTab(server, channels, editingChannel, canManageChannels, sortedRoles) : ''}
            ${this.tab === 'roles' ? this.renderRolesTab(server, sortedRoles, editingRole, canManageRoles, isOwner, currentUserId) : ''}
            ${this.tab === 'members' ? this.renderMembersTab(server, membersList, canManageServer, currentUserId) : ''}
            ${this.tab === 'invites' ? this.renderInvitesTab(inviteUrl) : ''}

          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderProfileTab(server, canManageServer, memberCount) {
    return `
      <div style="display: flex; gap: 40px; max-width: 860px;">
        <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 6px; color: var(--text-primary);">Server Profile</h2>
          </div>
          <form id="srv-profile-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group">
              <label class="form-label" for="srv-edit-name">Server Name</label>
              <input type="text" id="srv-edit-name" class="form-input" value="${this.escapeHtml(server.name || '')}" ${canManageServer ? 'required maxlength="40"' : 'disabled style="opacity: 0.6; cursor: not-allowed;"'} />
            </div>
            <div class="form-group">
              <label class="form-label" for="srv-edit-icon">Server Icon URL</label>
              <input type="url" id="srv-edit-icon" class="form-input" value="${this.escapeHtml(server.iconUrl || '')}" placeholder="https://example.com/icon.png" maxlength="500" ${canManageServer ? '' : 'disabled style="opacity: 0.6; cursor: not-allowed;"'} />
            </div>
            <div class="form-group">
              <label class="form-label" for="srv-edit-desc">Description</label>
              <textarea id="srv-edit-desc" class="form-input" rows="3" placeholder="Describe this server" maxlength="300" ${canManageServer ? '' : 'disabled style="opacity: 0.6; cursor: not-allowed;"'}>${this.escapeHtml(server.description || '')}</textarea>
            </div>
            ${canManageServer ? `
              <button type="submit" class="form-btn-submit" id="btn-save-srv-profile" style="width: auto; align-self: flex-start; padding: 8px 24px; font-size: 13px;">
                Save Changes
              </button>
            ` : ''}
          </form>
        </div>
        <div style="width: 280px; display: flex; flex-direction: column; gap: 12px;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Preview</span>
          <div style="background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-md);">
            <div style="height: 72px; background: var(--bg-card-hover); border-bottom: 1px solid var(--border-subtle);"></div>
            <div style="padding: 0 16px 16px; position: relative;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--bg-input); border: 3px solid var(--bg-card); margin-top: -26px; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: var(--text-primary);">
                ${server.iconUrl 
                  ? `<img src="${this.escapeHtml(server.iconUrl)}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />`
                  : (server.name || 'S').charAt(0).toUpperCase()
                }
              </div>
              <div style="margin-top: 10px;">
                <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary);" id="preview-server-name">${this.escapeHtml(server.name || 'Server')}</h4>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${memberCount} Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderRolesTab(server, sortedRoles, editingRole, canManageRoles, isOwner, currentUserId) {
    const myTopPos = isOwner ? -1 : this.getUserTopPosition(server, currentUserId);

    return `
      <div style="max-width: 860px; display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">Roles</h2>
          ${canManageRoles ? `
            <button type="button" class="form-btn-submit" id="btn-open-create-role" style="width: auto; padding: 6px 16px; font-size: 12px;">
              + Create Role
            </button>
          ` : ''}
        </div>

        ${canManageRoles ? `
          <div id="create-role-container" style="display: none; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 16px;">
            <form id="new-role-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
              <div class="form-group">
                <label class="form-label" for="new-role-title">Role Name</label>
                <input type="text" id="new-role-title" class="form-input" placeholder="e.g. Moderator" required maxlength="32" />
              </div>
              <div>
                <label class="form-label" style="margin-bottom: 8px;">Permissions</label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px; color: var(--text-secondary);">
                  ${ALL_PERMISSIONS.map(p => `
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" class="new-role-perm-cb" data-perm="${p.id}" ${p.id === 'send_messages' ? 'checked' : ''} />
                      ${p.label}
                    </label>
                  `).join('')}
                </div>
              </div>
              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="form-btn-submit" id="btn-cancel-create-role" style="width: auto; padding: 6px 14px; font-size: 12px; background: transparent; border: 1px solid var(--border-medium); color: var(--text-muted);">Cancel</button>
                <button type="submit" class="form-btn-submit" style="width: auto; padding: 6px 16px; font-size: 12px;">Save Role</button>
              </div>
            </form>
          </div>
        ` : ''}

        <div style="display: flex; gap: 16px; min-height: 300px;">
          <div style="width: 240px; display: flex; flex-direction: column; gap: 4px; border-right: 1px solid var(--border-subtle); padding-right: 16px;">
            ${sortedRoles.map((r, idx) => {
              const isActive = this.editingRoleId === r.id;
              const canEdit = canManageRoles && (isOwner || (r.position ?? 999) > myTopPos);
              return `
                <div style="display: flex; align-items: center; gap: 4px;">
                  ${(canManageRoles && canEdit) ? `
                    <div style="display: flex; flex-direction: column; gap: 1px;">
                      <button type="button" class="btn-role-move-up" data-role-id="${this.escapeHtml(r.id)}" style="background: none; border: none; color: ${idx === 0 ? 'var(--text-muted)' : 'var(--text-secondary)'}; cursor: ${idx === 0 ? 'default' : 'pointer'}; padding: 0; line-height: 1; font-size: 10px;" ${idx === 0 ? 'disabled' : ''}>▲</button>
                      <button type="button" class="btn-role-move-down" data-role-id="${this.escapeHtml(r.id)}" style="background: none; border: none; color: ${idx === sortedRoles.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)'}; cursor: ${idx === sortedRoles.length - 1 ? 'default' : 'pointer'}; padding: 0; line-height: 1; font-size: 10px;" ${idx === sortedRoles.length - 1 ? 'disabled' : ''}>▼</button>
                    </div>
                  ` : '<div style="width: 12px;"></div>'}
                  <button type="button" class="btn-select-role" data-role-id="${this.escapeHtml(r.id)}" style="flex: 1; display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; font-size: 13px; font-weight: ${isActive ? '600' : '500'}; border-radius: var(--radius-sm); border: 1px solid ${isActive ? 'var(--border-strong)' : 'transparent'}; background: ${isActive ? 'var(--bg-active)' : 'transparent'}; color: ${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'}; text-align: left; cursor: pointer;">
                    <span>${this.escapeHtml(r.name)}</span>
                    <span style="font-size: 10px; color: var(--text-muted);">${idx + 1}</span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
            ${editingRole ? this.renderRoleEditor(editingRole, canManageRoles, isOwner, myTopPos) : `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 14px;">
                Select a role to edit
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  renderRoleEditor(role, canManageRoles, isOwner, myTopPos) {
    const rolePos = role.position ?? 999;
    const canEdit = canManageRoles && (isOwner || rolePos > myTopPos);
    const isAdmin = role.id === 'role_admin';
    const perms = role.permissions || [];

    return `
      <div style="background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 20px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Edit Role — ${this.escapeHtml(role.name)}</h3>
          <span style="font-size: 11px; color: var(--text-muted); background: var(--bg-hover); padding: 2px 8px; border-radius: var(--radius-sm);">Position ${(role.position ?? 999) + 1}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-role-name">Role Name</label>
          <input type="text" id="edit-role-name" class="form-input" value="${this.escapeHtml(role.name)}" maxlength="32" ${canEdit ? '' : 'disabled style="opacity: 0.5;"'} />
        </div>

        <div>
          <label class="form-label" style="margin-bottom: 10px; display: block;">Permissions</label>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            ${ALL_PERMISSIONS.map(p => {
              const has = perms.includes(p.id);
              return `
                <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: ${has ? 'var(--bg-active)' : 'var(--bg-input)'}; border: 1px solid ${has ? 'var(--border-strong)' : 'var(--border-subtle)'}; border-radius: var(--radius-sm); font-size: 13px; color: ${has ? 'var(--text-primary)' : 'var(--text-muted)'}; cursor: ${canEdit ? 'pointer' : 'default'};">
                  <input type="checkbox" class="edit-role-perm-cb" data-perm="${p.id}" ${has ? 'checked' : ''} ${canEdit ? '' : 'disabled'} />
                  ${p.label}
                </label>
              `;
            }).join('')}
          </div>
        </div>

        ${canEdit ? `
          <div style="display: flex; gap: 8px; justify-content: space-between; margin-top: 8px;">
            ${!isAdmin ? `
              <button type="button" class="form-btn-submit" id="btn-delete-editing-role" style="width: auto; padding: 6px 14px; font-size: 12px; background: transparent; border: 1px solid var(--border-medium); color: var(--text-muted);">
                Delete Role
              </button>
            ` : '<div></div>'}
            <button type="button" class="form-btn-submit" id="btn-save-editing-role" style="width: auto; padding: 6px 20px; font-size: 12px;">
              Save Changes
            </button>
          </div>
        ` : `
          <div style="font-size: 12px; color: var(--text-muted); padding: 8px; background: var(--bg-input); border-radius: var(--radius-sm); text-align: center;">
            This role is above yours in the hierarchy
          </div>
        `}
      </div>
    `;
  }

  renderChannelsTab(server, channels, editingChannel, canManageChannels, sortedRoles) {
    return `
      <div style="max-width: 860px; display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">Channels</h2>
          ${canManageChannels ? `
            <button type="button" class="form-btn-submit" id="btn-open-create-channel" style="width: auto; padding: 6px 16px; font-size: 12px;">
              + Create Channel
            </button>
          ` : ''}
        </div>

        ${canManageChannels ? `
          <div id="create-channel-container" style="display: ${this.showCreateChannel ? 'block' : 'none'}; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 16px;">
            <form id="new-channel-form" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
              <div class="form-group">
                <label class="form-label" for="new-channel-name">Channel Name</label>
                <input type="text" id="new-channel-name" class="form-input" placeholder="e.g. announcements" required maxlength="30" style="text-transform: lowercase;" />
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Lowercase letters, numbers, hyphens, and underscores only</div>
              </div>
              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="form-btn-submit" id="btn-cancel-create-channel" style="width: auto; padding: 6px 14px; font-size: 12px; background: transparent; border: 1px solid var(--border-medium); color: var(--text-muted);">Cancel</button>
                <button type="submit" class="form-btn-submit" style="width: auto; padding: 6px 16px; font-size: 12px;">Create</button>
              </div>
            </form>
          </div>
        ` : ''}

        <div style="display: flex; gap: 16px; min-height: 300px;">
          <div style="width: 220px; display: flex; flex-direction: column; gap: 4px; border-right: 1px solid var(--border-subtle); padding-right: 16px;">
            ${channels.map((ch, idx) => {
              const isActive = this.editingChannelId === ch.id;
              return `
                <div style="display: flex; align-items: center; gap: 4px; width: 100%; border-radius: var(--radius-sm); background: ${isActive ? 'var(--bg-active)' : 'transparent'}; border: 1px solid ${isActive ? 'var(--border-strong)' : 'transparent'}; padding-right: 4px;">
                  <button type="button" class="btn-select-channel" data-channel-id="${this.escapeHtml(ch.id)}" style="display: flex; align-items: center; gap: 8px; flex: 1; padding: 8px 10px; font-size: 13px; font-weight: ${isActive ? '600' : '500'}; background: transparent; border: none; color: ${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'}; text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span style="color: var(--text-muted); font-size: 15px;">#</span>
                    <span>${this.escapeHtml(ch.name || ch.id)}</span>
                  </button>
                  ${canManageChannels ? `
                    <div style="display: flex; align-items: center; gap: 2px;">
                      ${idx > 0 ? `
                        <button type="button" class="icon-btn btn-settings-ch-up" data-channel-id="${this.escapeHtml(ch.id)}" title="Move Channel Up" style="padding: 2px; color: var(--text-muted);">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                            <polyline points="18 15 12 9 6 15"></polyline>
                          </svg>
                        </button>
                      ` : ''}
                      ${idx < channels.length - 1 ? `
                        <button type="button" class="icon-btn btn-settings-ch-down" data-channel-id="${this.escapeHtml(ch.id)}" title="Move Channel Down" style="padding: 2px; color: var(--text-muted);">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
            ${channels.length === 0 ? '<div style="font-size: 13px; color: var(--text-muted); padding: 8px;">No channels</div>' : ''}
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
            ${editingChannel ? this.renderChannelEditor(editingChannel, canManageChannels, sortedRoles, server) : `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 14px;">
                Select a channel to edit
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  renderChannelEditor(channel, canManageChannels, sortedRoles, server) {
    const isDefault = channel.id === 'chat';
    const overrides = (server.channelOverrides && server.channelOverrides[channel.id]) || {};

    return `
      <div style="background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 20px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);"># ${this.escapeHtml(channel.name || channel.id)}</h3>
          ${isDefault ? '<span style="font-size: 11px; color: var(--text-muted); background: var(--bg-hover); padding: 2px 8px; border-radius: var(--radius-sm);">Default</span>' : ''}
        </div>

        ${canManageChannels ? `
          <div class="form-group">
            <label class="form-label" for="edit-channel-name">Channel Name</label>
            <input type="text" id="edit-channel-name" class="form-input" value="${this.escapeHtml(channel.name || channel.id)}" maxlength="30" ${isDefault ? 'disabled style="opacity: 0.5;"' : ''} />
          </div>
        ` : ''}

        <div>
          <label class="form-label" style="margin-bottom: 12px; display: block;">Role Permission Overrides</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${sortedRoles.map(role => {
              const roleOverride = overrides[role.id] || {};
              return `
                <div style="background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">${this.escapeHtml(role.name)}</div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                    ${CHANNEL_PERMISSIONS.map(p => {
                      const val = roleOverride[p.id];
                      const stateLabel = val === true ? '✓' : val === false ? '✗' : '—';
                      const stateColor = val === true ? '#6f6' : val === false ? '#f66' : 'var(--text-muted)';
                      return `
                        <button type="button" class="ch-perm-toggle" data-role-id="${this.escapeHtml(role.id)}" data-perm="${p.id}" data-current="${val === true ? 'allow' : val === false ? 'deny' : 'inherit'}" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; font-size: 12px; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: ${canManageChannels ? 'pointer' : 'default'};" ${canManageChannels ? '' : 'disabled'}>
                          <span>${p.label}</span>
                          <span style="font-weight: 700; color: ${stateColor}; font-size: 13px;">${stateLabel}</span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
            ${sortedRoles.length === 0 ? '<div style="font-size: 12px; color: var(--text-muted);">No roles configured</div>' : ''}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">Click to cycle: Inherit (—) → Allow (✓) → Deny (✗)</div>
        </div>

        ${canManageChannels ? `
          <div style="display: flex; gap: 8px; justify-content: space-between; margin-top: 8px;">
            ${!isDefault ? `
              <button type="button" class="form-btn-submit" id="btn-delete-editing-channel" style="width: auto; padding: 6px 14px; font-size: 12px; background: transparent; border: 1px solid var(--border-medium); color: var(--text-muted);">
                Delete Channel
              </button>
            ` : '<div></div>'}
            <button type="button" class="form-btn-submit" id="btn-save-editing-channel" style="width: auto; padding: 6px 20px; font-size: 12px;">
              Save Changes
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderMembersTab(server, membersList, canManageServer, currentUserId) {
    return `
      <div style="max-width: 860px; display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">Server Members (${membersList.length})</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${membersList.map(mId => {
            const memberData = server.members[mId] || {};
            const memberRoles = memberData.roles || [];
            const isMemberOwner = mId === server.ownerId;
            return `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-input); border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--text-primary);">
                    ${mId.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${this.escapeHtml(mId)}</span>
                    ${isMemberOwner ? '<span style="margin-left: 6px; padding: 1px 6px; font-size: 10px; background: var(--bg-card-hover); border: 1px solid var(--border-medium); border-radius: 3px; color: var(--text-secondary);">Owner</span>' : ''}
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="display: flex; gap: 4px;">
                    ${memberRoles.map(rId => {
                      const rObj = (server.roles || []).find(r => r.id === rId);
                      return `<span style="padding: 2px 8px; font-size: 11px; background: var(--bg-card-hover); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-primary);">${this.escapeHtml(rObj ? rObj.name : rId)}</span>`;
                    }).join('')}
                  </div>
                  ${(!isMemberOwner && mId !== currentUserId && canManageServer) ? `
                    <button type="button" class="form-btn-submit btn-ban-member" data-member-id="${this.escapeHtml(mId)}" style="width: auto; padding: 4px 10px; font-size: 11px; background: transparent; border: 1px solid var(--border-medium); color: var(--text-muted);">
                      Ban
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderInvitesTab(inviteUrl) {
    return `
      <div style="max-width: 860px; display: flex; flex-direction: column; gap: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">Invites</h2>
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 20px; display: flex; flex-direction: column; gap: 14px;">
          <label class="form-label" style="font-size: 12px;">Server Invite Link</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" readonly id="invite-url-input" class="form-input" value="${this.escapeHtml(inviteUrl)}" style="background: var(--bg-input); color: var(--text-secondary); cursor: text;" />
            <button type="button" class="form-btn-submit" id="btn-copy-invite-link" style="width: auto; padding: 0 20px; font-size: 12px; white-space: nowrap;">
              ${this.copyFeedback ? 'Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const overlay = this.container.querySelector('#srv-settings-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    const closeBtn = this.container.querySelector('#srv-settings-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    ['profile', 'channels', 'roles', 'members', 'invites'].forEach(t => {
      const btn = this.container.querySelector(`#nav-${t}-btn`);
      btn?.addEventListener('click', () => {
        this.tab = t;
        this.error = null;
        this.success = null;
        if (t !== 'roles') this.editingRoleId = null;
        if (t !== 'channels') this.editingChannelId = null;
        this.render();
      });
    });

    const copyBtn = this.container.querySelector('#btn-copy-invite-link');
    copyBtn?.addEventListener('click', () => {
      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;
      const link = `${window.location.origin}${window.location.pathname}#invite=${sId}`;

      const fallback = (text) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-999999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(link).catch(() => fallback(link));
      } else {
        fallback(link);
      }

      this.copyFeedback = true;
      if (copyBtn) copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        this.copyFeedback = false;
        if (copyBtn) copyBtn.textContent = 'Copy Invite Link';
      }, 2000);
    });

    const profileForm = this.container.querySelector('#srv-profile-form');
    profileForm?.addEventListener('submit', async () => {
      if (!this.canManageServer) return;
      const nameInput = this.container.querySelector('#srv-edit-name');
      const iconInput = this.container.querySelector('#srv-edit-icon');
      const descInput = this.container.querySelector('#srv-edit-desc');
      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;

      const name = nameInput ? nameInput.value.trim() : '';
      const iconUrl = iconInput ? iconInput.value.trim() : '';
      const desc = descInput ? descInput.value.trim() : '';

      try {
        const res = await playFabService.saveServer(sId, { name, iconUrl, description: desc });
        if (res && res.server) {
          this.updateServerState(res.server);
          this.success = 'Server profile updated';
          this.render();
          if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
        } else {
          this.error = res?.error || 'Failed to update server profile';
          this.render();
        }
      } catch (err) {
        this.error = err.message;
        this.render();
      }
    });

    const openCreateRoleBtn = this.container.querySelector('#btn-open-create-role');
    const createRoleBox = this.container.querySelector('#create-role-container');
    openCreateRoleBtn?.addEventListener('click', () => {
      if (!this.canManageRoles) return;
      if (createRoleBox) {
        createRoleBox.style.display = createRoleBox.style.display === 'none' ? 'block' : 'none';
      }
    });

    const cancelCreateRoleBtn = this.container.querySelector('#btn-cancel-create-role');
    cancelCreateRoleBtn?.addEventListener('click', () => {
      if (createRoleBox) createRoleBox.style.display = 'none';
    });

    const newRoleForm = this.container.querySelector('#new-role-form');
    newRoleForm?.addEventListener('submit', async () => {
      if (!this.canManageRoles) return;
      const titleInput = this.container.querySelector('#new-role-title');
      const name = titleInput ? titleInput.value.trim() : '';
      if (!name) return;

      const perms = [];
      this.container.querySelectorAll('.new-role-perm-cb').forEach(cb => {
        if (cb.checked) perms.push(cb.dataset.perm);
      });

      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;

      const existing = Array.isArray(server.roles) ? server.roles : [];
      const maxPos = existing.reduce((m, r) => Math.max(m, r.position ?? 0), -1);

      const updatedRoles = existing.slice();
      updatedRoles.push({
        id: 'role_' + Date.now(),
        name: name,
        permissions: perms,
        position: maxPos + 1
      });

      try {
        const res = await playFabService.saveServer(sId, { roles: updatedRoles });
        if (res && res.server) {
          this.updateServerState(res.server);
          this.success = 'Role created';
          this.render();
          if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
        } else {
          this.error = res?.error || 'Failed to create role';
          this.render();
        }
      } catch (err) {
        this.error = err.message;
        this.render();
      }
    });

    this.container.querySelectorAll('.btn-select-role').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editingRoleId = btn.dataset.roleId;
        this.error = null;
        this.success = null;
        this.render();
      });
    });

    this.container.querySelectorAll('.btn-role-move-up').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!this.canManageRoles) return;
        await this.moveRole(btn.dataset.roleId, -1);
      });
    });

    this.container.querySelectorAll('.btn-role-move-down').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!this.canManageRoles) return;
        await this.moveRole(btn.dataset.roleId, 1);
      });
    });

    const saveEditBtn = this.container.querySelector('#btn-save-editing-role');
    saveEditBtn?.addEventListener('click', async () => {
      if (!this.canManageRoles || !this.editingRoleId) return;
      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;

      const nameInput = this.container.querySelector('#edit-role-name');
      const newName = nameInput ? nameInput.value.trim() : '';
      if (!newName) return;

      const newPerms = [];
      this.container.querySelectorAll('.edit-role-perm-cb').forEach(cb => {
        if (cb.checked) newPerms.push(cb.dataset.perm);
      });

      const updatedRoles = (server.roles || []).map(r => {
        if (r.id === this.editingRoleId) {
          return { ...r, name: newName, permissions: newPerms };
        }
        return r;
      });

      try {
        const res = await playFabService.saveServer(sId, { roles: updatedRoles });
        if (res && res.server) {
          this.updateServerState(res.server);
          this.success = 'Role updated';
          this.render();
          if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
        } else {
          this.error = res?.error || 'Failed to update role';
          this.render();
        }
      } catch (err) {
        this.error = err.message;
        this.render();
      }
    });

    const deleteEditBtn = this.container.querySelector('#btn-delete-editing-role');
    deleteEditBtn?.addEventListener('click', async () => {
      if (!this.canManageRoles || !this.editingRoleId) return;
      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;

      const updatedRoles = (server.roles || []).filter(r => r.id !== this.editingRoleId);
      try {
        const res = await playFabService.saveServer(sId, { roles: updatedRoles });
        if (res && res.server) {
          this.editingRoleId = null;
          this.updateServerState(res.server);
          this.success = 'Role deleted';
          this.render();
          if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
        }
      } catch (err) {
        this.error = err.message;
        this.render();
      }
    });

    const openCreateChBtn = this.container.querySelector('#btn-open-create-channel');
    const createChBox = this.container.querySelector('#create-channel-container');
    openCreateChBtn?.addEventListener('click', () => {
      if (!this.canManageChannels) return;
      if (createChBox) {
        createChBox.style.display = createChBox.style.display === 'none' ? 'block' : 'none';
      }
    });

    const cancelCreateChBtn = this.container.querySelector('#btn-cancel-create-channel');
    cancelCreateChBtn?.addEventListener('click', () => {
      if (createChBox) createChBox.style.display = 'none';
    });

    const newChForm = this.container.querySelector('#new-channel-form');
    newChForm?.addEventListener('submit', async () => {
      if (!this.canManageChannels) return;
      const nameInput = this.container.querySelector('#new-channel-name');
      const rawName = nameInput ? nameInput.value.trim() : '';
      const chName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
      if (!chName) return;

      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;

      try {
        const res = await playFabService.saveServer(sId, { newChannel: chName });
        if (res && res.server) {
          this.editingChannelId = chName;
          this.updateServerState(res.server);
          this.success = 'Channel created';
          this.render();
          if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
        }
      } catch (err) {
        this.error = err.message;
        this.render();
      }
    });

    const reorderSettingsChannel = async (targetId, direction) => {
      const state = appState.getState();
      const server = state.activeServer;
      if (!server || !this.canManageChannels) return;
      const sId = server.id || server.serverId;
      const currentList = Array.isArray(server.channels) ? [...server.channels] : [];
      const idx = currentList.findIndex(c => (typeof c === 'object' ? c.id : c) === targetId);
      if (idx === -1) return;
      const targetIndex = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIndex < 0 || targetIndex >= currentList.length) return;

      const temp = currentList[idx];
      currentList[idx] = currentList[targetIndex];
      currentList[targetIndex] = temp;

      const merged = Object.assign({}, server, { channels: currentList });
      this.updateServerState(merged);
      this.render();

      try {
        const res = await playFabService.saveServer(sId, { channels: currentList });
        if (res && res.server) {
          this.updateServerState(res.server);
          if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
        }
      } catch {}
    };

    this.container.querySelectorAll('.btn-settings-ch-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chId = btn.getAttribute('data-channel-id');
        if (chId) reorderSettingsChannel(chId, 'up');
      });
    });

    this.container.querySelectorAll('.btn-settings-ch-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chId = btn.getAttribute('data-channel-id');
        if (chId) reorderSettingsChannel(chId, 'down');
      });
    });

    this.container.querySelectorAll('.btn-select-channel').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editingChannelId = btn.dataset.channelId;
        this.error = null;
        this.success = null;
        this.render();
      });
    });

    this.container.querySelectorAll('.ch-perm-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.canManageChannels) return;
        const current = btn.dataset.current;
        let next = 'allow';
        if (current === 'allow') next = 'deny';
        else if (current === 'deny') next = 'inherit';

        btn.dataset.current = next;
        const span = btn.querySelector('span:last-child');
        if (span) {
          span.textContent = next === 'allow' ? '✓' : next === 'deny' ? '✗' : '—';
          span.style.color = next === 'allow' ? '#6f6' : next === 'deny' ? '#f66' : '#666';
        }
      });
    });

    const saveEditChBtn = this.container.querySelector('#btn-save-editing-channel');
    saveEditChBtn?.addEventListener('click', async () => {
      if (!this.canManageChannels || !this.editingChannelId) return;
      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;

      const editNameInput = this.container.querySelector('#edit-channel-name');
      const newNameRaw = editNameInput ? editNameInput.value.trim() : '';
      const newName = newNameRaw.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);

      const allOverrides = Object.assign({}, server.channelOverrides || {});
      const chOverrides = {};

      this.container.querySelectorAll('.ch-perm-toggle').forEach(btn => {
        const rId = btn.dataset.roleId;
        const perm = btn.dataset.perm;
        const cur = btn.dataset.current;
        if (!chOverrides[rId]) chOverrides[rId] = {};
        if (cur === 'allow') chOverrides[rId][perm] = true;
        else if (cur === 'deny') chOverrides[rId][perm] = false;
      });

      const cleanChOverrides = {};
      for (const rKey in chOverrides) {
        if (Object.keys(chOverrides[rKey]).length > 0) {
          cleanChOverrides[rKey] = chOverrides[rKey];
        }
      }

      allOverrides[this.editingChannelId] = cleanChOverrides;

      const updatePayload = { channelOverrides: allOverrides };
      if (newName && newName !== this.editingChannelId && this.editingChannelId !== 'chat') {
        updatePayload.renameChannel = { oldName: this.editingChannelId, newName: newName };
      }

      try {
        const res = await playFabService.saveServer(sId, updatePayload);
        if (res && res.server) {
          if (updatePayload.renameChannel) {
            this.editingChannelId = newName;
          }
          this.updateServerState(res.server);
          this.success = 'Channel settings saved';
          this.render();
          if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
        }
      } catch (err) {
        this.error = err.message;
        this.render();
      }
    });

    const deleteEditChBtn = this.container.querySelector('#btn-delete-editing-channel');
    deleteEditChBtn?.addEventListener('click', async () => {
      if (!this.canManageChannels || !this.editingChannelId || this.editingChannelId === 'chat') return;
      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;

      try {
        const res = await playFabService.saveServer(sId, { deleteChannel: this.editingChannelId });
        if (res && res.server) {
          this.editingChannelId = null;
          this.updateServerState(res.server);
          this.success = 'Channel deleted';
          this.render();
          if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
        }
      } catch (err) {
        this.error = err.message;
        this.render();
      }
    });

    this.container.querySelectorAll('.btn-ban-member').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!this.canManageServer) return;
        const memberId = btn.dataset.memberId;
        const state = appState.getState();
        const server = state.activeServer;
        if (!server || !memberId) return;
        const sId = server.id || server.serverId;

        try {
          const res = await playFabService.saveServer(sId, { banMember: memberId });
          if (res && res.server) {
            this.updateServerState(res.server);
            this.render();
            if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
          }
        } catch (err) {
          this.error = err.message;
          this.render();
        }
      });
    });

    const deleteServerBtn = this.container.querySelector('#btn-delete-server');
    deleteServerBtn?.addEventListener('click', async () => {
      if (!this.isOwner) return;
      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;

      try {
        await playFabService.deleteServer(sId);
        this.close();
        appState.setActiveDM(null);
        if (this.callbacks.onServerDeleted) this.callbacks.onServerDeleted();
      } catch (err) {
        this.error = err.message;
        this.render();
      }
    });

    const leaveServerBtn = this.container.querySelector('#btn-leave-server');
    leaveServerBtn?.addEventListener('click', async () => {
      const state = appState.getState();
      const server = state.activeServer;
      if (!server) return;
      const sId = server.id || server.serverId;

      try {
        await playFabService.leaveServer(sId);
        this.close();
        appState.setActiveDM(null);
        if (this.callbacks.onServerDeleted) this.callbacks.onServerDeleted();
      } catch (err) {
        this.error = err.message;
        this.render();
      }
    });
  }

  async moveRole(roleId, direction) {
    const state = appState.getState();
    const server = state.activeServer;
    if (!server) return;
    const sId = server.id || server.serverId;

    const roles = this.getSortedRoles(server);
    const idx = roles.findIndex(r => r.id === roleId);
    if (idx < 0) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= roles.length) return;

    const tmp = roles[idx];
    roles[idx] = roles[targetIdx];
    roles[targetIdx] = tmp;

    const updatedRoles = roles.map((r, i) => ({ ...r, position: i }));

    try {
      const res = await playFabService.saveServer(sId, { roles: updatedRoles });
      if (res && res.server) {
        this.updateServerState(res.server);
        this.render();
        if (this.callbacks.onServerUpdated) this.callbacks.onServerUpdated();
      }
    } catch (err) {
      this.error = err.message;
      this.render();
    }
  }
}
