import { playFabService } from '../services/playfab.js';
import { appState } from '../services/state.js';

export class UserProfileModal {
  constructor(container, { onOpenDM, onRoleUpdated }) {
    this.container = container;
    this.callbacks = { onOpenDM, onRoleUpdated };
    this.isOpen = false;
    this.targetUserId = null;
    this.profile = null;
    this.isLoading = false;
    this.render();
  }

  async open(userId) {
    if (!userId) return;
    this.targetUserId = userId;
    this.isOpen = true;
    this.isLoading = true;
    this.profile = { displayName: "User", avatarUrl: "" };
    this.render();

    try {
      const p = await playFabService.resolveUser(userId, true);
      this.profile = p;
    } catch {
      this.profile = { displayName: "User", avatarUrl: "" };
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  close() {
    this.isOpen = false;
    this.targetUserId = null;
    this.profile = null;
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
    if (!this.isOpen || !this.targetUserId) {
      this.container.innerHTML = '';
      return;
    }

    const state = appState.getState();
    const server = state.activeContext === 'server' ? state.activeServer : null;
    const currentUserId = playFabService.getCurrentUser()?.playFabId;
    const isSelf = this.targetUserId === currentUserId;

    let canManageRoles = false;
    let isOwner = false;
    let myTopPos = Infinity;

    if (server) {
      isOwner = server.ownerId === currentUserId || (!server.ownerId && (server.id === currentUserId || server.serverId === currentUserId));
      if (isOwner) {
        canManageRoles = true;
        myTopPos = -1;
      } else if (server.members && server.members[currentUserId]) {
        const myRoles = server.members[currentUserId].roles || [];
        canManageRoles = myRoles.includes('role_admin') || (server.roles || []).some(r => myRoles.includes(r.id) && (r.permissions || []).includes('manage_roles'));
        myTopPos = this.getUserTopPosition(server, currentUserId);
      }
    }

    const memberData = (server && server.members && server.members[this.targetUserId]) ? server.members[this.targetUserId] : null;
    const assignedRoles = memberData ? (memberData.roles || []) : [];
    const displayName = this.profile?.displayName || "User";
    const initial = displayName.charAt(0).toUpperCase();

    const targetTopPos = server ? this.getUserTopPosition(server, this.targetUserId) : Infinity;
    const targetIsOwner = server && (this.targetUserId === server.ownerId || (!server.ownerId && (server.id === this.targetUserId || server.serverId === this.targetUserId)));
    const canModifyTarget = isOwner || (canManageRoles && !isSelf && !targetIsOwner && targetTopPos > myTopPos);

    const sortedRoles = server && Array.isArray(server.roles) ? server.roles.slice().sort((a, b) => (a.position ?? 999) - (b.position ?? 999)) : [];

    const assignableRoles = canModifyTarget ? sortedRoles.filter(r => {
      const rPos = r.position ?? 999;
      return isOwner || rPos > myTopPos;
    }) : [];

    this.container.innerHTML = `
      <div class="modal-overlay" id="user-profile-overlay">
        <div class="modal-card" style="max-width: 360px; padding: 0; overflow: hidden; background: var(--bg-modal); border: 1px solid var(--border-medium);">
          <div style="height: 80px; background: var(--bg-card-hover); position: relative;">
            <button type="button" id="close-user-profile-btn" style="position: absolute; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.5); border: none; color: #ffffff; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div style="padding: 0 20px 20px; position: relative;">
            <div style="position: relative; width: 64px; height: 64px; margin-top: -32px;">
              <div class="user-profile-avatar-circle" style="width: 64px; height: 64px; border-radius: 50%; background: var(--bg-card); border: 4px solid var(--bg-modal); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: var(--text-primary);">
                ${this.profile?.avatarUrl 
                  ? `<img src="${this.escapeHtml(this.profile.avatarUrl)}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />`
                  : initial
                }
              </div>
              <div class="presence-badge-dot dot-${this.profile?.presence || 'offline'}" style="bottom: 0px; right: 0px; width: 16px; height: 16px;"></div>
            </div>

            <div style="margin-top: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">${this.escapeHtml(displayName)}</h3>
                ${(this.profile?.appRank && !this.profile.appRank.hidden) ? `
                  <span class="app-rank-badge" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; background: rgba(255, 255, 255, 0.08); border: 1px solid ${this.escapeHtml(this.profile.appRank.color || '#ffffff')}; color: ${this.escapeHtml(this.profile.appRank.color || '#ffffff')};">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>${this.escapeHtml(this.profile.appRank.name)}</span>
                  </span>
                ` : ''}
              </div>
              <div style="font-size: 13px; color: var(--text-secondary); margin-top: 1px;">@${this.escapeHtml(this.profile?.username || displayName.toLowerCase().replace(/\s+/g, ''))}</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px; text-transform: capitalize;">${this.escapeHtml(this.profile?.presence || 'offline')}</div>
              ${this.profile?.statusMessage ? `
                <div style="margin-top: 8px; padding: 6px 10px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 12px; color: var(--text-primary);">
                  ${this.escapeHtml(this.profile.statusMessage)}
                </div>
              ` : ''}
            </div>

            ${!isSelf ? `
              <div style="margin-top: 16px;">
                <button type="button" class="form-btn-submit" id="btn-profile-dm" style="width: 100%; padding: 8px 0; font-size: 13px;">
                  Message
                </button>
              </div>
            ` : ''}

            ${server ? `
              <div style="margin-top: 20px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
                  Roles
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="profile-roles-container">
                  ${assignableRoles.length > 0 ? assignableRoles.map(r => {
                    const isAssigned = assignedRoles.includes(r.id);
                    return `
                      <button type="button" class="role-pill-toggle" data-role-id="${this.escapeHtml(r.id)}" style="padding: 4px 10px; font-size: 11px; border-radius: var(--radius-sm); border: 1px solid ${isAssigned ? 'var(--border-focus)' : 'var(--border-medium)'}; background: ${isAssigned ? 'var(--bg-active)' : 'var(--bg-card)'}; color: ${isAssigned ? 'var(--text-primary)' : 'var(--text-secondary)'}; cursor: pointer;">
                        ${isAssigned ? '✓ ' : '+ '}${this.escapeHtml(r.name)}
                      </button>
                    `;
                  }).join('') : sortedRoles.map(r => {
                    const isAssigned = assignedRoles.includes(r.id);
                    if (!isAssigned) return '';
                    return `
                      <span style="padding: 4px 10px; font-size: 11px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-card); color: var(--text-secondary);">
                        ${this.escapeHtml(r.name)}
                      </span>
                    `;
                  }).join('')}
                  ${assignedRoles.length === 0 && assignableRoles.length === 0 ? '<span style="font-size: 12px; color: var(--text-muted);">No roles</span>' : ''}
                </div>

                ${(canModifyTarget && !isSelf && !targetIsOwner) ? `
                  <div style="margin-top: 16px; display: flex; gap: 8px;">
                    <button type="button" class="form-btn-submit" id="btn-profile-ban" style="flex: 1; padding: 6px 0; font-size: 12px; background: transparent; border: 1px solid var(--border-medium); color: var(--text-muted);">
                      Ban Member
                    </button>
                  </div>
                ` : ''}
              </div>
            ` : ''}

          </div>
        </div>
      </div>
    `;

    this.attachEvents(server, canModifyTarget, isOwner, myTopPos);
  }

  attachEvents(server, canModifyTarget, isOwner, myTopPos) {
    const overlay = this.container.querySelector('#user-profile-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    const closeBtn = this.container.querySelector('#close-user-profile-btn');
    closeBtn?.addEventListener('click', () => this.close());

    const dmBtn = this.container.querySelector('#btn-profile-dm');
    dmBtn?.addEventListener('click', async () => {
      if (this.callbacks.onOpenDM) {
        this.close();
        this.callbacks.onOpenDM(this.targetUserId);
      }
    });

    if (canModifyTarget && server) {
      this.container.querySelectorAll('.role-pill-toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
          const rId = btn.dataset.roleId;
          const sId = server.id || server.serverId;
          const memberData = (server.members && server.members[this.targetUserId]) ? server.members[this.targetUserId] : { roles: [] };
          let roles = memberData.roles ? memberData.roles.slice() : [];

          if (roles.includes(rId)) {
            roles = roles.filter(x => x !== rId);
          } else {
            roles.push(rId);
          }

          if (!server.members) server.members = {};
          server.members[this.targetUserId] = { userId: this.targetUserId, roles };

          try {
            await playFabService.saveServer(sId, { assignMember: this.targetUserId, assignRoles: roles, assignRole: roles[0] || '' });
            appState.setActiveServer(server);
            this.render();
            if (this.callbacks.onRoleUpdated) this.callbacks.onRoleUpdated();
          } catch {}
        });
      });

      const banBtn = this.container.querySelector('#btn-profile-ban');
      banBtn?.addEventListener('click', async () => {
        const sId = server.id || server.serverId;
        try {
          await playFabService.saveServer(sId, { banMember: this.targetUserId });
          if (server.members && server.members[this.targetUserId]) {
            delete server.members[this.targetUserId];
          }
          appState.setActiveServer(server);
          this.close();
          if (this.callbacks.onRoleUpdated) this.callbacks.onRoleUpdated();
        } catch {}
      });
    }
  }
}
