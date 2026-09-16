import { appState } from '../services/state.js';
import { playFabService } from '../services/playfab.js';

export class ChatHeader {
  constructor(container, { onToggleMemberList }) {
    this.container = container;
    this.callbacks = { onToggleMemberList };
    this.partnerProfile = null;
    this.render();

    this.unsubscribe = appState.subscribe((state, key) => {
      if (key === 'navigation' || key === 'channel' || key === 'network') {
        this.updateHeader();
      }
    });
  }

  render() {
    this.container.innerHTML = `
      <header class="chat-header">
        <div class="chat-header-left">
          <button class="icon-btn mobile-menu-toggle" id="mobile-menu-btn" title="Toggle Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div class="header-channel-meta">
            <div class="header-channel-title" id="header-title">
              <span class="header-channel-hash" id="header-prefix">#</span>
              <span id="header-name">chat</span>
            </div>
          </div>
        </div>

        <div class="chat-header-right">
          <button class="sync-indicator-pill" id="sync-pill-btn" title="Network Status">
            <span class="sync-dot live" id="sync-dot-el"></span>
            <span id="sync-status-text">Live (1.0s)</span>
          </button>

          <div class="header-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="header-search-input" placeholder="Search..." maxlength="100" />
          </div>

          <button class="icon-btn" id="header-member-toggle" title="Toggle Member List">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </button>
        </div>
      </header>
    `;

    this.attachEvents();
    this.updateHeader();
  }

  attachEvents() {
    const menuBtn = this.container.querySelector('#mobile-menu-btn');
    menuBtn?.addEventListener('click', () => {
      appState.toggleMobileSidebar();
    });

    const memberBtn = this.container.querySelector('#header-member-toggle');
    memberBtn?.addEventListener('click', () => {
      if (this.callbacks.onToggleMemberList) {
        this.callbacks.onToggleMemberList();
      }
    });

    const searchInput = this.container.querySelector('#header-search-input');
    searchInput?.addEventListener('input', (e) => {
      appState.setSearchQuery(e.target.value);
    });
  }

  async updateHeader() {
    const state = appState.getState();
    const network = state.network;

    const prefixEl = this.container.querySelector('#header-prefix');
    const nameEl = this.container.querySelector('#header-name');
    const memberToggle = this.container.querySelector('#header-member-toggle');

    if (state.activeContext === 'global') {
      if (prefixEl) prefixEl.textContent = '#';
      if (nameEl) nameEl.textContent = 'global-chat';
      if (memberToggle) memberToggle.style.display = 'none';
    } else if (state.activeContext === 'server' && state.activeServer) {
      if (prefixEl) prefixEl.textContent = '#';
      if (nameEl) nameEl.textContent = state.activeChannelId || 'chat';
      if (memberToggle) memberToggle.style.display = 'flex';
    } else if (state.activeContext === 'dm' && state.activeDM) {
      if (prefixEl) prefixEl.textContent = '@';
      if (state.activeDM.isGroup) {
        if (nameEl) nameEl.textContent = state.activeDM.name || 'Group Chat';
        if (memberToggle) memberToggle.style.display = 'flex';
      } else {
        if (memberToggle) memberToggle.style.display = 'none';
        if (nameEl) {
          nameEl.textContent = 'User';
          playFabService.resolveUser(state.activeDM.partnerId).then(p => {
            nameEl.textContent = p.displayName;
          });
        }
      }
    } else {
      if (prefixEl) prefixEl.textContent = '';
      if (nameEl) nameEl.textContent = 'Friends';
      if (memberToggle) memberToggle.style.display = 'none';
    }

    const dotEl = this.container.querySelector('#sync-dot-el');
    const textEl = this.container.querySelector('#sync-status-text');

    if (dotEl && textEl) {
      dotEl.className = `sync-dot ${network.status}`;
      if (network.status === 'live') {
        textEl.textContent = `Live (${network.intervalSeconds}s)`;
      } else if (network.status === 'syncing') {
        textEl.textContent = 'Syncing...';
      } else if (network.status === 'paused') {
        textEl.textContent = 'Paused';
      } else if (network.status === 'error') {
        textEl.textContent = 'Retrying...';
      }
    }
  }
}
