import { messageCache } from './messageCache.js';

class StateStore {
  constructor() {
    this.state = {
      activeContext: "dm",
      activeServerId: null,
      activeServer: null,
      activeChannelId: null,
      activeDM: null,
      servers: [],
      dms: [],
      friends: [],
      userProfiles: {},
      messages: {},
      unreadCounts: {},
      isPendingCloudScript: false,
      network: {
        mode: "HTTPS REST Polling",
        intervalSeconds: 1.0,
        status: "live",
        latencyMs: 0,
        lastPoll: null,
        isIdle: false,
        error: null
      },
      searchQuery: "",
      isMobileSidebarOpen: false
    };

    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(key) {
    this.listeners.forEach((fn) => fn(this.state, key));
  }

  setCloudScriptPending(isPending) {
    if (this.state.isPendingCloudScript !== !!isPending) {
      this.state.isPendingCloudScript = !!isPending;
      this.notify("cloudScriptPending");
    }
  }

  getStreamKey() {
    if (this.state.activeContext === "global") {
      return "global_chat";
    }
    if (this.state.activeContext === "dm" && this.state.activeDM) {
      return this.state.activeDM.dmId;
    }
    if (this.state.activeContext === "server" && this.state.activeServerId && this.state.activeChannelId) {
      return `srv_${this.state.activeServerId}_${this.state.activeChannelId}`;
    }
    return "none";
  }

  getTargetParam() {
    if (this.state.activeContext === "global") {
      return { isGlobal: true };
    }
    if (this.state.activeContext === "dm" && this.state.activeDM) {
      return {
        dmId: this.state.activeDM.dmId,
        partnerId: this.state.activeDM.partnerId,
        isGroup: !!this.state.activeDM.isGroup
      };
    }
    if (this.state.activeContext === "server" && this.state.activeServerId && this.state.activeChannelId) {
      return {
        serverId: this.state.activeServerId,
        channelId: this.state.activeChannelId
      };
    }
    return { isGlobal: true };
  }

  hydrateStreamMessages(streamKey) {
    if (!streamKey || streamKey === "none") return;
    if (!this.state.messages[streamKey] || this.state.messages[streamKey].length === 0) {
      const cached = messageCache.getCachedMessages(streamKey);
      if (cached && cached.length > 0) {
        this.state.messages[streamKey] = cached;
        this.notify("messages");
      }
    }
  }

  setServers(servers) {
    this.state.servers = Array.isArray(servers) ? servers : [];
    this.notify("servers");
  }

  persistActiveContext() {
    try {
      const payload = {
        activeContext: this.state.activeContext,
        activeServerId: this.state.activeServerId,
        activeChannelId: this.state.activeChannelId,
        activeDM: this.state.activeDM
      };
      localStorage.setItem("pulse_last_context", JSON.stringify(payload));
    } catch {}
  }

  restoreLastContext() {
    try {
      const raw = localStorage.getItem("pulse_last_context");
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !data.activeContext) return false;

      if (data.activeContext === "global") {
        this.setGlobalChat();
        return true;
      } else if (data.activeContext === "dm" && data.activeDM) {
        this.setActiveDM(data.activeDM);
        return true;
      } else if (data.activeContext === "server" && data.activeServerId) {
        this.state.activeContext = "server";
        this.state.activeServerId = data.activeServerId;
        this.state.activeChannelId = data.activeChannelId || "chat";
        this.state.activeDM = null;
        this.hydrateStreamMessages(this.getStreamKey());
        this.notify("navigation");
        return true;
      }
    } catch {}
    return false;
  }

  setGlobalChat() {
    this.state.activeContext = "global";
    this.state.activeServerId = null;
    this.state.activeServer = null;
    this.state.activeChannelId = null;
    this.state.activeDM = null;
    this.hydrateStreamMessages(this.getStreamKey());
    this.persistActiveContext();
    this.notify("navigation");
  }

  setActiveServer(server) {
    this.state.activeContext = "server";
    this.state.activeServer = server;
    this.state.activeServerId = server ? (server.id || server.serverId) : null;
    this.state.activeDM = null;

    if (server && Array.isArray(server.channels) && server.channels.length > 0) {
      this.state.activeChannelId = server.channels[0].id;
    } else {
      this.state.activeChannelId = null;
    }

    this.hydrateStreamMessages(this.getStreamKey());
    this.persistActiveContext();
    this.notify("navigation");
  }

  setActiveChannel(channelId) {
    this.state.activeChannelId = channelId;
    this.hydrateStreamMessages(this.getStreamKey());
    this.persistActiveContext();
    this.notify("channel");
  }

  setActiveDM(dm) {
    this.state.activeContext = "dm";
    this.state.activeDM = dm;
    this.state.activeServerId = null;
    this.state.activeServer = null;
    this.state.activeChannelId = null;
    this.hydrateStreamMessages(this.getStreamKey());
    this.persistActiveContext();
    this.notify("navigation");
  }

  setReplyingTo(reply) {
    this.state.replyingTo = reply;
    this.notify("reply");
  }

  clearReplyingTo() {
    this.state.replyingTo = null;
    this.notify("reply");
  }

  setFriends(friends) {
    this.state.friends = Array.isArray(friends) ? friends : [];
    this.notify("friends");
  }

  setDMs(dms) {
    this.state.dms = Array.isArray(dms) ? dms : [];
    this.notify("dms");
  }

  setUserProfile(playFabId, profile) {
    if (!playFabId) return;
    this.state.userProfiles[playFabId] = profile;
    this.notify("profileCache");
  }

  setMessages(streamKey, messages) {
    if (!Array.isArray(messages)) return;
    const sanitized = messages
      .filter(m => m && typeof m === 'object' && typeof m.text === 'string')
      .map(m => ({
        id: String(m.id || Date.now() + Math.random()),
        senderId: String(m.senderId || ""),
        text: String(m.text || "").slice(0, 2000),
        timestamp: m.timestamp || new Date().toISOString(),
        isEdited: !!m.isEdited,
        replyTo: (m.replyTo && typeof m.replyTo === 'object') ? {
          id: String(m.replyTo.id || ""),
          senderId: String(m.replyTo.senderId || ""),
          text: String(m.replyTo.text || "").slice(0, 200)
        } : null
      }));

    this.state.messages[streamKey] = sanitized;
    messageCache.setCachedMessages(streamKey, sanitized);
    this.notify("messages");
  }

  addMessage(streamKey, message) {
    if (!this.state.messages[streamKey]) {
      this.state.messages[streamKey] = [];
    }
    const cleanMsg = {
      id: String(message.id || Date.now() + Math.random()),
      senderId: String(message.senderId || ""),
      text: String(message.text || "").slice(0, 2000),
      timestamp: message.timestamp || new Date().toISOString(),
      isEdited: !!message.isEdited,
      replyTo: (message.replyTo && typeof message.replyTo === 'object') ? {
        id: String(message.replyTo.id || ""),
        senderId: String(message.replyTo.senderId || ""),
        text: String(message.replyTo.text || "").slice(0, 200)
      } : null
    };

    const exists = this.state.messages[streamKey].some((m) => m.id === cleanMsg.id);
    if (!exists) {
      this.state.messages[streamKey].push(cleanMsg);
      messageCache.setCachedMessages(streamKey, this.state.messages[streamKey]);
      this.notify("messages");
    }
  }

  setNetworkStatus(updates) {
    Object.assign(this.state.network, updates);
    this.notify("network");
  }

  setSearchQuery(q) {
    this.state.searchQuery = String(q || "").toLowerCase().slice(0, 100);
    this.notify("search");
  }

  toggleMobileSidebar(open) {
    this.state.isMobileSidebarOpen = typeof open === "boolean" ? open : !this.state.isMobileSidebarOpen;
    this.notify("sidebar");
  }
}

export const appState = new StateStore();
