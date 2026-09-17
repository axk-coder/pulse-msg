import { playFabService } from './services/playfab.js';
import { pollingEngine } from './services/pollingEngine.js';
import { appState } from './services/state.js';
import { Sidebar } from './components/Sidebar.js';
import { ChatHeader } from './components/ChatHeader.js';
import { MessageList } from './components/MessageList.js';
import { MessageInput } from './components/MessageInput.js';
import { MemberList } from './components/MemberList.js';
import { AuthModal } from './components/AuthModal.js';
import { BanModal } from './components/BanModal.js';
import { ServerModal } from './components/ServerModal.js';
import { ServerSettingsModal } from './components/ServerSettingsModal.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { FriendsModal } from './components/FriendsModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { LegalModal } from './components/LegalModal.js';
import { CreditsModal } from './components/CreditsModal.js';

class PulseApp {
  constructor() {
    this.root = document.getElementById('app');
    this.isMemberListVisible = true;
    this.init();
  }

  async init() {
    const savedTheme = localStorage.getItem('pulse_theme') || 'onyx';
    document.documentElement.setAttribute('data-theme', savedTheme);

    this.root.innerHTML = `
      <div class="cloud-loading-bar" id="cloud-loading-bar"></div>
      <div class="pulse-layout" id="pulse-main-layout" style="display: none;">
        <aside id="sidebar-mount"></aside>
        <main class="chat-main" id="chat-mount">
          <div id="header-mount"></div>
          <div class="chat-body-layout">
            <div class="chat-stream-column">
              <div id="messages-mount" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;"></div>
              <div id="input-mount"></div>
            </div>
            <div id="members-mount"></div>
          </div>
        </main>
      </div>
      <div id="modal-mount"></div>
    `;

    this.mainLayout = document.getElementById('pulse-main-layout');
    const modalMount = document.getElementById('modal-mount');
    const authModalContainer = document.createElement('div');
    const banModalContainer = document.createElement('div');
    const serverModalContainer = document.createElement('div');
    const serverSettingsModalContainer = document.createElement('div');
    const userProfileModalContainer = document.createElement('div');
    const friendsModalContainer = document.createElement('div');
    const settingsModalContainer = document.createElement('div');
    const legalModalContainer = document.createElement('div');
    const creditsModalContainer = document.createElement('div');

    modalMount.appendChild(authModalContainer);
    modalMount.appendChild(banModalContainer);
    modalMount.appendChild(serverModalContainer);
    modalMount.appendChild(serverSettingsModalContainer);
    modalMount.appendChild(userProfileModalContainer);
    modalMount.appendChild(friendsModalContainer);
    modalMount.appendChild(settingsModalContainer);
    modalMount.appendChild(legalModalContainer);
    modalMount.appendChild(creditsModalContainer);

    this.legalModal = new LegalModal(legalModalContainer);
    this.creditsModal = new CreditsModal(creditsModalContainer);

    this.banModal = new BanModal(banModalContainer, {
      onSignOut: () => {
        playFabService.clearSession();
        this.mainLayout.style.display = 'none';
        this.authModal.open('login');
      }
    });

    this.authModal = new AuthModal(authModalContainer, {
      onAuthSuccess: () => {
        this.onAuthChanged();
      },
      onAccountBanned: (banData) => {
        this.mainLayout.style.display = 'none';
        this.banModal.open(banData);
      },
      onOpenLegal: (tab) => {
        if (tab === 'credits') this.creditsModal.open();
        else this.legalModal.open(tab);
      }
    });

    this.serverModal = new ServerModal(serverModalContainer, {
      onServerCreated: () => {
        pollingEngine.pollNow();
      },
      onServerUpdated: () => {
        pollingEngine.pollNow();
      }
    });

    this.serverSettingsModal = new ServerSettingsModal(serverSettingsModalContainer, {
      onServerUpdated: () => {
        pollingEngine.pollNow();
      },
      onServerDeleted: () => {
        pollingEngine.pollNow();
      }
    });

    this.userProfileModal = new UserProfileModal(userProfileModalContainer, {
      onOpenDM: (targetId) => {
        this.openDirectMessage(targetId);
      },
      onRoleUpdated: () => {
        pollingEngine.pollNow();
      }
    });

    this.friendsModal = new FriendsModal(friendsModalContainer, {
      onOpenDM: async (friendId) => {
        this.openDirectMessage(friendId);
      }
    });

    this.settingsModal = new SettingsModal(settingsModalContainer, {
      onLogout: () => {
        this.onAuthChanged();
        this.mainLayout.style.display = 'none';
        this.authModal.open('login');
      },
      onProfileUpdated: () => {
        appState.notify('profile');
      },
      onOpenLegal: (tab) => {
        this.legalModal.open(tab);
      },
      onOpenCredits: () => {
        this.creditsModal.open();
      }
    });

    const membersMount = document.getElementById('members-mount');
    this.memberList = new MemberList(membersMount, {
      onOpenDM: async (partnerId) => {
        this.openDirectMessage(partnerId);
      },
      onOpenServerSettings: () => {
        this.serverSettingsModal.open();
      },
      onOpenUserProfile: (userId) => {
        this.userProfileModal.open(userId);
      }
    });

    const sidebarMount = document.getElementById('sidebar-mount');
    this.sidebar = new Sidebar(sidebarMount, {
      onOpenServerModal: (tab) => this.serverModal.open(tab),
      onOpenServerSettingsModal: (tab, opts) => this.serverSettingsModal.open(tab, opts),
      onOpenFriendsModal: (tab) => this.friendsModal.open(tab),
      onOpenSettingsModal: (tab) => this.settingsModal.open(tab),
      onOpenLegalModal: (tab) => this.legalModal.open(tab),
      onOpenCreditsModal: () => this.creditsModal.open()
    });

    const headerMount = document.getElementById('header-mount');
    this.header = new ChatHeader(headerMount, {
      onToggleMemberList: () => {
        this.isMemberListVisible = !this.isMemberListVisible;
        membersMount.style.display = this.isMemberListVisible ? 'flex' : 'none';
      }
    });

    const messagesMount = document.getElementById('messages-mount');
    this.messageList = new MessageList(messagesMount, {
      onOpenUserProfile: (userId) => {
        this.userProfileModal.open(userId);
      },
      onOpenDM: (targetId) => {
        this.openDirectMessage(targetId);
      }
    });

    const inputMount = document.getElementById('input-mount');
    this.messageInput = new MessageInput(inputMount, {
      onRequireAuth: () => {
        this.mainLayout.style.display = 'none';
        this.authModal.open('login');
      }
    });

    let authed = playFabService.isAuthenticated();
    if (!authed) {
      authed = await playFabService.tryAutoLogin();
    }

    if (authed) {
      this.mainLayout.style.display = 'flex';
      await this.bootstrapData();
      pollingEngine.start();
    } else {
      this.mainLayout.style.display = 'none';
      this.authModal.open('login');
    }

    if (window.location.hash.includes('invite=')) {
      const inviteId = window.location.hash.split('invite=')[1]?.trim();
      if (inviteId && authed) {
        try {
          const joined = await playFabService.joinServer(inviteId);
          if (joined && joined.server) {
            appState.setActiveServer(joined.server);
            window.location.hash = '';
          }
        } catch {}
      }
    }

    const cloudBar = document.getElementById('cloud-loading-bar');
    appState.subscribe((state, key) => {
      if (key === 'cloudScriptPending' && cloudBar) {
        if (state.isPendingCloudScript) {
          cloudBar.classList.add('active');
        } else {
          cloudBar.classList.remove('active');
        }
      }
      if ((key === 'navigation' || key === 'channel') && playFabService.isAuthenticated()) {
        pollingEngine.pollNow();
      }
    });

    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 250);
    }
  }

  async openDirectMessage(partnerId) {
    if (!partnerId) return;
    const myId = playFabService.getCurrentUser()?.playFabId;
    let dmId = null;
    if (myId) {
      dmId = (myId < partnerId) ? `dm_${myId}_${partnerId}` : `dm_${partnerId}_${myId}`;
    }
    appState.setActiveDM({ dmId: dmId || `dm_${partnerId}`, partnerId });
    pollingEngine.pollNow();

    try {
      const res = await playFabService.createOrGetDM(partnerId);
      if (res && res.dmId) {
        appState.setActiveDM({ dmId: res.dmId, partnerId });
        const dms = await playFabService.getUserDMs();
        appState.setDMs(dms);
      }
    } catch {}
  }

  async bootstrapData() {
    try {
      await playFabService.syncCurrentUserProfile();
      appState.notify('profile');
      const [servers, dms, friends] = await Promise.all([
        playFabService.getUserServers(),
        playFabService.getUserDMs(),
        playFabService.getFriendsList()
      ]);
      appState.setServers(servers);
      appState.setDMs(dms);
      appState.setFriends(friends);

      const restored = appState.restoreLastContext();
      if (!restored) {
        if (servers.length > 0) {
          const sId = servers[0].serverId || servers[0].id;
          const sData = await playFabService.getServer(sId);
          if (sData && sData.server) {
            appState.setActiveServer(sData.server);
          }
        }
      } else if (appState.getState().activeContext === 'server' && appState.getState().activeServerId) {
        const sData = await playFabService.getServer(appState.getState().activeServerId);
        if (sData && sData.server) {
          appState.setActiveServer(sData.server);
        }
      }
    } catch {}
  }

  async onAuthChanged() {
    const user = playFabService.getCurrentUser();
    if (user && playFabService.isAuthenticated()) {
      this.mainLayout.style.display = 'flex';
      await this.bootstrapData();
      pollingEngine.start();
      pollingEngine.pollNow();
    } else {
      this.mainLayout.style.display = 'none';
      pollingEngine.stop();
    }
    appState.notify('auth');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PulseApp();
});
