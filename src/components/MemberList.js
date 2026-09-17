import { appState } from '../services/state.js';
import { playFabService } from '../services/playfab.js';

export class MemberList {
  constructor(container, { onOpenDM, onOpenServerSettings, onOpenUserProfile }) {
    this.container = container;
    this.callbacks = { onOpenDM, onOpenServerSettings, onOpenUserProfile };
    this.memberProfiles = new Map();
    this.currentGroupMeta = null;
    this.render();

    this.unsubscribe = appState.subscribe((state, key) => {
      if (key === 'navigation' || key === 'channel' || key === 'profileCache') {
        this.updateMembers();
      }
    });
  }

  render() {
    this.container.innerHTML = `
      <aside class="member-sidebar" id="member-sidebar">
        <div class="member-sidebar-header">
          <span class="member-count-title" id="member-list-title">Members</span>
        </div>
        <div class="member-list-scroll" id="member-list-scroll"></div>
      </aside>
    `;

    this.listContainer = this.container.querySelector('#member-list-scroll');
    this.titleEl = this.container.querySelector('#member-list-title');
    this.updateMembers();
  }

  async updateMembers() {
    const state = appState.getState();
    if (!this.listContainer) return;

    if (state.activeContext === 'dm' && state.activeDM && state.activeDM.isGroup) {
      this.container.style.display = 'flex';
      await this.renderGroupDMMembers(state.activeDM.dmId);
      return;
    }

    if (state.activeContext !== 'server' || !state.activeServer) {
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'flex';
    const server = state.activeServer;
    const membersMap = server.members || {};
    const rolesList = server.roles || [];
    const memberIds = Object.keys(membersMap);

    this.titleEl.textContent = `Members (${memberIds.length})`;

    for (const mId of memberIds) {
      if (!this.memberProfiles.has(mId)) {
        playFabService.resolveUser(mId).then(profile => {
          this.memberProfiles.set(mId, profile);
          this.renderMembersList(server, memberIds, rolesList);
        });
      }
    }

    this.renderMembersList(server, memberIds, rolesList);
  }

  async renderGroupDMMembers(gdmId) {
    const res = await playFabService.getGroupMeta(gdmId);
    if (!res || !res.group) return;
    const group = res.group;
    this.currentGroupMeta = group;

    const currentUserId = playFabService.getCurrentUser()?.playFabId;
    const isOwner = group.ownerId === currentUserId;
    const userEntry = (group.members || []).find(m => m.userId === currentUserId);
    const canManage = isOwner || (userEntry && userEntry.canManageMembers);

    const members = group.members || [];
    this.titleEl.textContent = `Members (${members.length}/10)`;

    for (const m of members) {
      if (!this.memberProfiles.has(m.userId)) {
        playFabService.resolveUser(m.userId).then(p => {
          this.memberProfiles.set(m.userId, p);
          this.renderGroupDMMembers(gdmId);
        });
      }
    }

    let html = '';

    if (canManage && members.length < 10) {
      const friends = appState.getState().friends || [];
      const nonMembers = friends.filter(f => !members.some(m => m.userId === f.FriendPlayFabId));
      if (nonMembers.length > 0) {
        html += `
          <div style="padding: 10px; border-bottom: 1px solid var(--border-subtle);">
            <div class="form-group" style="margin-bottom: 8px;">
              <select id="gdm-add-select" class="form-input" style="font-size: 12px; padding: 6px 10px;">
                <option value="">Select friend to add...</option>
                ${nonMembers.map(f => `
                  <option value="${this.escapeHtml(f.FriendPlayFabId)}">${this.escapeHtml(f.Username || f.FriendPlayFabId)}</option>
                `).join('')}
              </select>
            </div>
            <button type="button" class="form-btn-submit" id="gdm-add-btn" style="padding: 6px; font-size: 12px;">
              Add To Group
            </button>
          </div>
        `;
      }
    }

    members.forEach(m => {
      const profile = this.memberProfiles.get(m.userId) || { displayName: "User", avatarUrl: "" };
      const initial = profile.displayName.charAt(0).toUpperCase();
      const isMemberOwner = m.userId === group.ownerId;
      const isSelf = m.userId === currentUserId;

      let badge = 'Member';
      if (isMemberOwner) badge = 'Owner';
      else if (m.canManageMembers) badge = 'Manager';

      html += `
        <div class="member-row" style="padding: 8px 10px; flex-direction: column; align-items: stretch; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="member-avatar-box">
              ${profile.avatarUrl 
                ? `<img src="${this.escapeHtml(profile.avatarUrl)}" class="member-avatar-img" alt="" />`
                : `<div class="member-avatar-letter">${initial}</div>`
              }
            </div>
            <div class="member-info" style="flex: 1;">
              <span class="member-name">${this.escapeHtml(profile.displayName)}</span>
              <span class="member-role-badge">${badge}</span>
            </div>
          </div>

          ${(!isSelf && (isOwner || canManage)) ? `
            <div style="display: flex; gap: 6px; padding-left: 42px;">
              ${isOwner ? `
                <button type="button" class="footer-link-btn btn-gdm-transfer" data-user-id="${this.escapeHtml(m.userId)}" style="font-size: 11px;">
                  Transfer
                </button>
                <button type="button" class="footer-link-btn btn-gdm-toggle-perm" data-user-id="${this.escapeHtml(m.userId)}" data-perm="${m.canManageMembers ? 'true' : 'false'}" style="font-size: 11px;">
                  ${m.canManageMembers ? 'Remove Perm' : 'Give Perm'}
                </button>
              ` : ''}
              ${(canManage && !isMemberOwner) ? `
                <button type="button" class="footer-link-btn btn-gdm-remove" data-user-id="${this.escapeHtml(m.userId)}" style="font-size: 11px; color: #ff5555;">
                  Remove
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    });

    html += `
      <div style="padding: 16px 10px; margin-top: auto; border-top: 1px solid var(--border-subtle);">
        <button type="button" class="form-btn-submit" id="btn-leave-group-dm" style="width: 100%; padding: 7px; font-size: 12px; background: #2a2a2a; border-color: #444444; color: #ffffff;">
          Leave Group
        </button>
      </div>
    `;

    this.listContainer.innerHTML = html;

    const leaveGrpBtn = this.listContainer.querySelector('#btn-leave-group-dm');
    leaveGrpBtn?.addEventListener('click', async () => {
      try {
        await playFabService.leaveGroupDM(gdmId);
        const dms = await playFabService.getUserDMs();
        appState.setDMs(dms);
        appState.setActiveDM(null);
      } catch {}
    });

    const addBtn = this.listContainer.querySelector('#gdm-add-btn');
    addBtn?.addEventListener('click', async () => {
      const select = this.listContainer.querySelector('#gdm-add-select');
      const targetId = select ? select.value : '';
      if (targetId) {
        await playFabService.manageGroupDM(gdmId, 'addMember', { userId: targetId });
        this.renderGroupDMMembers(gdmId);
      }
    });

    const transferBtns = this.listContainer.querySelectorAll('.btn-gdm-transfer');
    transferBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-user-id');
        if (targetId) {
          await playFabService.manageGroupDM(gdmId, 'transferOwnership', { newOwnerId: targetId });
          this.renderGroupDMMembers(gdmId);
        }
      });
    });

    const permBtns = this.listContainer.querySelectorAll('.btn-gdm-toggle-perm');
    permBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-user-id');
        const currentPerm = btn.getAttribute('data-perm') === 'true';
        if (targetId) {
          await playFabService.manageGroupDM(gdmId, 'setMemberPerm', { userId: targetId, canManageMembers: !currentPerm });
          this.renderGroupDMMembers(gdmId);
        }
      });
    });

    const removeBtns = this.listContainer.querySelectorAll('.btn-gdm-remove');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-user-id');
        if (targetId) {
          await playFabService.manageGroupDM(gdmId, 'removeMember', { userId: targetId });
          const dms = await playFabService.getUserDMs();
          appState.setDMs(dms);
          this.renderGroupDMMembers(gdmId);
        }
      });
    });
  }

  renderMembersList(server, memberIds, rolesList) {
    if (!this.listContainer) return;
    const membersMap = server.members || {};
    const ownerId = server.ownerId || server.id || server.serverId;

    const sortedRoles = Array.isArray(rolesList) ? rolesList.slice().sort((a, b) => (a.position ?? 999) - (b.position ?? 999)) : [];

    const isBaseMemberRole = (r) => {
      if (!r) return true;
      const id = String(r.id || '').toLowerCase();
      const name = String(r.name || '').toLowerCase();
      return id === 'role_member' || id === 'none' || name === 'member' || name === 'members';
    };

    const isOwnerRole = (r) => {
      if (!r) return false;
      const id = String(r.id || '').toLowerCase();
      const name = String(r.name || '').toLowerCase();
      return id === 'role_owner' || id === 'owner' || name === 'owner';
    };

    const hoistedRoles = sortedRoles.filter(r => !isBaseMemberRole(r) && !isOwnerRole(r));

    const groupsMap = new Map();
    groupsMap.set('owner', { title: 'OWNER', role: { id: 'owner', name: 'Owner' }, members: [] });
    hoistedRoles.forEach(r => {
      groupsMap.set(r.id, { title: r.name.toUpperCase(), role: r, members: [] });
    });
    groupsMap.set('default_members', { title: 'MEMBERS', role: null, members: [] });

    memberIds.forEach(mId => {
      const mem = membersMap[mId] || {};
      const assigned = Array.isArray(mem.roles) ? mem.roles : (typeof mem.roles === 'string' ? [mem.roles] : []);
      const isOwner = mId === ownerId;

      let matchedRole = null;
      for (const r of hoistedRoles) {
        if (assigned.includes(r.id) || (r.name && assigned.some(a => String(a).toLowerCase() === r.name.toLowerCase()))) {
          matchedRole = r;
          break;
        }
      }

      if (isOwner) {
        if (matchedRole) {
          groupsMap.get(matchedRole.id).members.push({ mId, displayRole: matchedRole, isOwner: true });
        } else {
          groupsMap.get('owner').members.push({ mId, displayRole: { id: 'owner', name: 'Owner' }, isOwner: true });
        }
      } else if (matchedRole) {
        groupsMap.get(matchedRole.id).members.push({ mId, displayRole: matchedRole, isOwner: false });
      } else {
        const baseRole = sortedRoles.find(r => assigned.includes(r.id)) || null;
        groupsMap.get('default_members').members.push({ mId, displayRole: baseRole, isOwner: false });
      }
    });

    let html = '';

    groupsMap.forEach((groupData) => {
      const { title, members } = groupData;
      if (members.length === 0) return;

      html += `
        <div class="member-group-header">
          <span>${this.escapeHtml(title)} (${members.length})</span>
        </div>
      `;

      members.forEach(({ mId, displayRole, isOwner }) => {
        const profile = this.memberProfiles.get(mId) || { displayName: "Member", avatarUrl: "", presence: "offline", statusMessage: "" };
        const initial = profile.displayName.charAt(0).toUpperCase();
        const isSelf = playFabService.getCurrentUser()?.playFabId === mId;

        html += `
          <div class="member-row" data-user-id="${this.escapeHtml(mId)}">
            <div class="member-avatar-box" style="position: relative;">
              ${profile.avatarUrl 
                ? `<img src="${this.escapeHtml(profile.avatarUrl)}" class="member-avatar-img" alt="" />`
                : `<div class="member-avatar-letter">${initial}</div>`
              }
              <div class="presence-badge-dot dot-${profile.presence || 'offline'}"></div>
            </div>
            <div class="member-info" style="display: flex; flex-direction: column; overflow: hidden;">
              <div style="display: flex; align-items: center; gap: 4px; flex-wrap: nowrap;">
                <span class="member-name">${this.escapeHtml(profile.displayName)}</span>
                ${isOwner ? `<span class="member-role-badge" style="background: #252525; border-color: #555555; color: #ffffff; font-weight: 700;">★ Owner</span>` : ''}
                ${(!isOwner && displayRole && !isBaseMemberRole(displayRole)) ? `<span class="member-role-badge">${this.escapeHtml(displayRole.name)}</span>` : ''}
              </div>
              ${profile.statusMessage ? `<span class="member-status-message" style="font-size: 11px; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${this.escapeHtml(profile.statusMessage)}</span>` : ''}
            </div>
            ${!isSelf ? `
              <button type="button" class="member-dm-btn" data-user-id="${this.escapeHtml(mId)}" title="Direct Message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        `;
      });
    });

    this.listContainer.innerHTML = html;

    const dmBtns = this.listContainer.querySelectorAll('.member-dm-btn');
    dmBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-user-id');
        if (targetId) {
          this.callbacks.onOpenDM(targetId);
        }
      });
    });

    this.listContainer.querySelectorAll('.member-row').forEach(row => {
      row.style.cursor = 'pointer';
      row.addEventListener('click', (e) => {
        if (e.target.closest('.member-dm-btn')) return;
        const uId = row.dataset.userId;
        if (uId && this.callbacks.onOpenUserProfile) {
          this.callbacks.onOpenUserProfile(uId);
        }
      });
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}
