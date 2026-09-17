import { playFabService } from '../services/playfab.js';
import { appState } from '../services/state.js';

export class FriendsModal {
  constructor(container, { onOpenDM }) {
    this.container = container;
    this.callbacks = { onOpenDM };
    this.isOpen = false;
    this.tab = 'list';
    this.isLoading = false;
    this.error = null;
    this.success = null;
    this.pendingRequests = [];
    this.render();
  }

  async open(tab = 'list') {
    this.tab = tab;
    this.isOpen = true;
    this.error = null;
    this.success = null;
    try {
      this.pendingRequests = await playFabService.getFriendRequests();
    } catch {}
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

    const state = appState.getState();
    const friends = state.friends || [];

    this.container.innerHTML = `
      <div class="modal-overlay" id="friends-modal-overlay">
        <div class="modal-card" style="max-width: 480px;">
          <div class="modal-header">
            <div class="modal-title-box">
              <h3 class="modal-title">Friends</h3>
            </div>
            <button class="modal-close-btn" id="friends-close-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="auth-tabs" style="margin-bottom: 12px;">
              <button type="button" class="auth-tab ${this.tab === 'list' ? 'active' : ''}" id="tab-fr-list">All Friends (${friends.length})</button>
              <button type="button" class="auth-tab ${this.tab === 'pending' ? 'active' : ''}" id="tab-fr-pending">Pending ${this.pendingRequests.length > 0 ? `(${this.pendingRequests.length})` : ''}</button>
              <button type="button" class="auth-tab ${this.tab === 'add' ? 'active' : ''}" id="tab-fr-add">Add Friend</button>
            </div>

            ${this.error ? `<div class="form-error-banner"><span>${this.escapeHtml(this.error)}</span></div>` : ''}
            ${this.success ? `<div style="padding: 8px 10px; background: #181818; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 10px;">${this.escapeHtml(this.success)}</div>` : ''}

            ${this.tab === 'list' ? `
              <div class="friends-list-container" style="max-height: 320px; overflow-y: auto;">
                ${friends.length === 0 ? `
                  <div style="text-align: center; padding: 24px 0; color: var(--text-muted); font-size: 13px;">
                    No friends added yet.
                  </div>
                ` : `
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    ${friends.map(f => `
                      <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: #222222; border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            ${f.avatarUrl 
                              ? `<img src="${this.escapeHtml(f.avatarUrl)}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />`
                              : `<span style="font-size: 13px; font-weight: 700; color: #ffffff;">${f.displayName.charAt(0).toUpperCase()}</span>`
                            }
                          </div>
                          <span style="font-weight: 600; font-size: 13px;">${this.escapeHtml(f.displayName)}</span>
                        </div>
                        <div style="display: flex; gap: 6px;">
                          <button type="button" class="form-btn-submit msg-friend-btn" data-friend-id="${this.escapeHtml(f.playFabId)}" style="width: auto; padding: 4px 10px; margin: 0; font-size: 12px;">Message</button>
                          <button type="button" class="footer-link-btn remove-friend-btn" data-friend-id="${this.escapeHtml(f.playFabId)}" style="color: var(--text-muted); font-size: 12px; padding: 4px 6px;">Remove</button>
                        </div>
                      </li>
                    `).join('')}
                  </ul>
                `}
              </div>
            ` : ''}

            ${this.tab === 'pending' ? `
              <div class="friends-list-container" style="max-height: 320px; overflow-y: auto;">
                ${this.pendingRequests.length === 0 ? `
                  <div style="text-align: center; padding: 24px 0; color: var(--text-muted); font-size: 13px;">
                    No pending friend requests.
                  </div>
                ` : `
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    ${this.pendingRequests.map(r => `
                      <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: #222222; border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            ${r.fromAvatar 
                              ? `<img src="${this.escapeHtml(r.fromAvatar)}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />`
                              : `<span style="font-size: 13px; font-weight: 700; color: #ffffff;">${(r.fromName || 'U').charAt(0).toUpperCase()}</span>`
                            }
                          </div>
                          <span style="font-weight: 600; font-size: 13px;">${this.escapeHtml(r.fromName || 'User')}</span>
                        </div>
                        <div style="display: flex; gap: 6px;">
                          <button type="button" class="form-btn-submit accept-req-btn" data-from-id="${this.escapeHtml(r.fromId)}" style="width: auto; padding: 4px 10px; margin: 0; font-size: 12px;">Accept</button>
                          <button type="button" class="footer-link-btn decline-req-btn" data-from-id="${this.escapeHtml(r.fromId)}" style="color: var(--text-muted); font-size: 12px; padding: 4px 6px;">Decline</button>
                        </div>
                      </li>
                    `).join('')}
                  </ul>
                `}
              </div>
            ` : ''}

            ${this.tab === 'add' ? `
              <form id="add-friend-form" onsubmit="return false;">
                <div class="form-group">
                  <label class="form-label" for="add-friend-input">Username or Email</label>
                  <input type="text" id="add-friend-input" class="form-input" placeholder="Enter username or email" required maxlength="100" ${this.isLoading ? 'disabled' : ''} />
                </div>
                <button type="submit" class="form-btn-submit" id="add-fr-btn" ${this.isLoading ? 'disabled' : ''}>
                  ${this.isLoading ? 'Sending Request...' : 'Send Friend Request'}
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
    const closeBtn = this.container.querySelector('#friends-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    const tabList = this.container.querySelector('#tab-fr-list');
    tabList?.addEventListener('click', () => {
      this.tab = 'list';
      this.error = null;
      this.success = null;
      this.render();
    });

    const tabPending = this.container.querySelector('#tab-fr-pending');
    tabPending?.addEventListener('click', async () => {
      this.tab = 'pending';
      this.error = null;
      this.success = null;
      try {
        this.pendingRequests = await playFabService.getFriendRequests();
      } catch {}
      this.render();
    });

    const tabAdd = this.container.querySelector('#tab-fr-add');
    tabAdd?.addEventListener('click', () => {
      this.tab = 'add';
      this.error = null;
      this.success = null;
      this.render();
    });

    const addForm = this.container.querySelector('#add-friend-form');
    addForm?.addEventListener('submit', async () => {
      const input = this.container.querySelector('#add-friend-input');
      const val = input ? input.value.trim() : '';
      if (!val) return;

      this.isLoading = true;
      this.error = null;
      this.success = null;
      this.render();

      try {
        await playFabService.sendFriendRequest(val);
        this.success = 'Friend request sent successfully';
        const friends = await playFabService.getFriendsList();
        appState.setFriends(friends);
        if (input) input.value = '';
      } catch (e) {
        this.error = e.message || 'Failed to send friend request';
      } finally {
        this.isLoading = false;
        this.render();
      }
    });

    const msgBtns = this.container.querySelectorAll('.msg-friend-btn');
    msgBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const friendId = btn.getAttribute('data-friend-id');
        if (friendId) {
          this.close();
          await this.callbacks.onOpenDM(friendId);
        }
      });
    });

    const acceptBtns = this.container.querySelectorAll('.accept-req-btn');
    acceptBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const fromId = btn.getAttribute('data-from-id');
        if (!fromId) return;

        try {
          await playFabService.respondFriendRequest(fromId, 'accept');
          const friends = await playFabService.getFriendsList();
          appState.setFriends(friends);
          this.pendingRequests = await playFabService.getFriendRequests();
          this.success = 'Friend request accepted';
          this.render();
        } catch (e) {
          this.error = e.message || 'Failed to accept request';
          this.render();
        }
      });
    });

    const declineBtns = this.container.querySelectorAll('.decline-req-btn');
    declineBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const fromId = btn.getAttribute('data-from-id');
        if (!fromId) return;

        try {
          await playFabService.respondFriendRequest(fromId, 'decline');
          const friends = await playFabService.getFriendsList();
          appState.setFriends(friends);
          this.pendingRequests = await playFabService.getFriendRequests();
          this.render();
        } catch (e) {
          this.error = e.message || 'Failed to decline request';
          this.render();
        }
      });
    });

    const removeBtns = this.container.querySelectorAll('.remove-friend-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const friendId = btn.getAttribute('data-friend-id');
        if (!friendId) return;

        try {
          await playFabService.removeFriend(friendId);
          const friends = await playFabService.getFriendsList();
          appState.setFriends(friends);
          this.render();
        } catch (e) {
          this.error = e.message || 'Failed to remove friend';
          this.render();
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
