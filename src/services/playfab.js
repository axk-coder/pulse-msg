import { appState } from './state.js';

export const PLAYFAB_TITLE_ID = "133616";
const PLAYFAB_API_BASE = `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Client`;

function getCookie(name) {
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  } catch {
    return null;
  }
}

function setCookie(name, value) {
  try {
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  } catch {}
}

function deleteCookie(name) {
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch {}
}

class PlayFabService {
  constructor() {
    this.sessionTicket = localStorage.getItem("pulse_session_ticket") || getCookie("axk_auth_ticket") || getCookie("pulse_session_ticket") || null;
    this.playFabId = localStorage.getItem("pulse_playfab_id") || getCookie("pulse_playfab_id") || null;
    this.currentUser = null;
    this.lastSendTimestamp = 0;
    this.userCache = new Map();
    this.serverCache = new Map();
    this.fileCache = new Map();
    this.fileInFlight = new Map();
    this.pendingRequests = 0;
    this.onSessionExpired = null;

    const storedUser = localStorage.getItem("pulse_user") || getCookie("pulse_user") || getCookie("axk_auth_user");
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch {
        this.currentUser = null;
      }
    }

    if (!this.sessionTicket || !this.currentUser) {
      const sharedSessionRaw = getCookie("axk_auth_session") || getCookie("pulse_shared_auth");
      if (sharedSessionRaw) {
        try {
          const parsed = JSON.parse(sharedSessionRaw);
          if (parsed && parsed.sessionTicket) {
            this.sessionTicket = parsed.sessionTicket;
            this.playFabId = parsed.playFabId || this.playFabId;
            this.currentUser = parsed.user || this.currentUser;
            if (this.sessionTicket) {
              localStorage.setItem("pulse_session_ticket", this.sessionTicket);
            }
            if (this.playFabId) {
              localStorage.setItem("pulse_playfab_id", this.playFabId);
            }
            if (this.currentUser) {
              localStorage.setItem("pulse_user", JSON.stringify(this.currentUser));
            }
          }
        } catch {}
      }
    }
  }

  isAuthenticated() {
    return !!(this.sessionTicket && this.currentUser);
  }

  getSessionTicket() {
    return this.sessionTicket;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  saveSession(sessionTicket, playFabId, userProfile) {
    this.sessionTicket = String(sessionTicket || "").trim();
    this.playFabId = String(playFabId || "").trim();
    this.currentUser = {
      playFabId: this.playFabId,
      username: String(userProfile.username || "").trim().slice(0, 32),
      displayName: String(userProfile.displayName || userProfile.username || "User").trim().slice(0, 32),
      email: String(userProfile.email || "").trim().slice(0, 100),
      avatarUrl: String(userProfile.avatarUrl || "").trim(),
      presence: String(userProfile.presence || "online").toLowerCase(),
      statusMessage: String(userProfile.statusMessage || "").slice(0, 128)
    };
    localStorage.setItem("pulse_session_ticket", this.sessionTicket);
    localStorage.setItem("pulse_playfab_id", this.playFabId);
    localStorage.setItem("pulse_user", JSON.stringify(this.currentUser));

    setCookie("pulse_session_ticket", this.sessionTicket);
    setCookie("pulse_playfab_id", this.playFabId);
    setCookie("pulse_user", JSON.stringify(this.currentUser));
    setCookie("axk_auth_ticket", this.sessionTicket);
    setCookie("axk_auth_session", JSON.stringify({
      sessionTicket: this.sessionTicket,
      playFabId: this.playFabId,
      user: this.currentUser
    }));

    if (this.playFabId) {
      this.userCache.set(this.playFabId, {
        displayName: this.currentUser.displayName,
        avatarUrl: this.currentUser.avatarUrl,
        presence: this.currentUser.presence,
        statusMessage: this.currentUser.statusMessage
      });
    }
  }

  clearSession() {
    this.sessionTicket = null;
    this.playFabId = null;
    this.currentUser = null;
    localStorage.removeItem("pulse_session_ticket");
    localStorage.removeItem("pulse_playfab_id");
    localStorage.removeItem("pulse_user");
    localStorage.removeItem("pulse_auth_store");
    deleteCookie("pulse_session_ticket");
    deleteCookie("pulse_playfab_id");
    deleteCookie("pulse_user");
    deleteCookie("pulse_auth_store");
    deleteCookie("axk_auth_ticket");
    deleteCookie("axk_auth_session");
    deleteCookie("axk_auth_store");
    deleteCookie("axk_auth_user");
    deleteCookie("pulse_shared_auth");
  }

  saveCredentials(identifier, password) {
    try {
      const payload = JSON.stringify({
        identifier: String(identifier || "").trim(),
        password: String(password || "")
      });
      localStorage.setItem("pulse_auth_store", payload);
      setCookie("pulse_auth_store", payload);
      setCookie("axk_auth_store", payload);
    } catch {}
  }

  getSavedCredentials() {
    try {
      const raw = localStorage.getItem("pulse_auth_store") || getCookie("axk_auth_store") || getCookie("pulse_auth_store");
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  async validateSession() {
    if (!this.sessionTicket) return false;
    try {
      const res = await this.post("GetAccountInfo", {}, true);
      return !!(res && res.AccountInfo);
    } catch (err) {
      return false;
    }
  }

  async tryAutoLogin() {
    if (this.sessionTicket && this.currentUser) {
      try {
        const valid = await this.validateSession();
        if (valid) return true;
      } catch {}
    }
    const creds = this.getSavedCredentials();
    if (creds && creds.identifier && creds.password) {
      try {
        await this.login(creds.identifier, creds.password);
        return true;
      } catch {}
    }
    return false;
  }

  async post(endpoint, payload, useAuth = false, attempt = 0) {
    const url = `${PLAYFAB_API_BASE}/${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "X-ReportErrorAsSuccess": "true"
    };

    if (useAuth && this.sessionTicket) {
      headers["X-Authentication"] = this.sessionTicket;
    }

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      if (attempt < 5) {
        await new Promise(r => setTimeout(r, Math.min(250 * Math.pow(2, attempt), 2000)));
        return await this.post(endpoint, payload, useAuth, attempt + 1);
      }
      throw networkErr;
    }

    if (!res.ok) {
      if ((res.status === 429 || res.status === 503 || res.status === 504) && attempt < 5) {
        await new Promise(r => setTimeout(r, Math.min(250 * Math.pow(2, attempt), 2000)));
        return await this.post(endpoint, payload, useAuth, attempt + 1);
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.code !== 200) {
      const errMessage = String(data.errorMessage || data.status || "PlayFab API Error");
      const errLower = errMessage.toLowerCase();
      const isRateLimit = data.code === 429 || data.code === 1199 || errLower.includes("rate limit") || errLower.includes("over limit") || errLower.includes("too many requests") || errLower.includes("throttle") || errLower.includes("concurrent");

      if (isRateLimit && attempt < 5) {
        await new Promise(r => setTimeout(r, Math.min(250 * Math.pow(2, attempt), 2000)));
        return await this.post(endpoint, payload, useAuth, attempt + 1);
      }

      if (useAuth && attempt === 0 && (data.code === 401 || errLower.includes("ticket") || errLower.includes("authenticated") || errLower.includes("expired") || data.errorCode === 1074)) {
        const reauthed = await this.tryAutoLogin();
        if (reauthed) {
          return await this.post(endpoint, payload, useAuth, attempt + 1);
        }
        if (typeof this.onSessionExpired === 'function') {
          this.onSessionExpired();
        }
      }
      const errorObj = new Error(errMessage);
      errorObj.playFabData = data;
      throw errorObj;
    }

    return data.data;
  }

  async register(username, email, password, displayName) {
    const cleanUsername = String(username || "").trim().slice(0, 32);
    const cleanPassword = String(password || "");
    const cleanEmail = String(email || "").trim().slice(0, 100);
    const cleanDisplayName = String(displayName || cleanUsername).trim().slice(0, 32);

    if (cleanUsername.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Valid email is required");
    }
    if (cleanPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const payload = {
      TitleId: PLAYFAB_TITLE_ID,
      Username: cleanUsername,
      Email: cleanEmail,
      Password: cleanPassword,
      RequireBothUsernameAndEmail: true,
      DisplayName: cleanDisplayName
    };

    const data = await this.post("RegisterPlayFabUser", payload, false);
    this.saveSession(data.SessionTicket, data.PlayFabId, {
      username: cleanUsername,
      displayName: cleanDisplayName,
      email: cleanEmail,
      avatarUrl: ""
    });
    this.saveCredentials(cleanUsername, cleanPassword);

    try {
      await this.updateDisplayName(cleanDisplayName);
    } catch {}

    return this.currentUser;
  }

  async login(emailOrUsername, password) {
    const cleanIdentifier = String(emailOrUsername || "").trim().slice(0, 100);
    const cleanPassword = String(password || "");

    if (!cleanIdentifier || !cleanPassword) {
      throw new Error("Identifier and password are required");
    }

    let endpoint = "LoginWithPlayFab";
    let payload = {
      TitleId: PLAYFAB_TITLE_ID,
      Password: cleanPassword,
      InfoRequestParameters: {
        GetPlayerProfile: true,
        ProfileConstraints: {
          ShowDisplayName: true,
          ShowAvatarUrl: true
        }
      }
    };

    if (cleanIdentifier.includes("@")) {
      endpoint = "LoginWithEmailAddress";
      payload.Email = cleanIdentifier;
    } else {
      payload.Username = cleanIdentifier;
    }

    const data = await this.post(endpoint, payload, false);
    
    let displayName = cleanIdentifier.includes("@") ? cleanIdentifier.split("@")[0] : cleanIdentifier;
    let avatarUrl = "";

    if (data.InfoResultPayload && data.InfoResultPayload.PlayerProfile) {
      if (data.InfoResultPayload.PlayerProfile.DisplayName) {
        displayName = data.InfoResultPayload.PlayerProfile.DisplayName;
      }
      if (data.InfoResultPayload.PlayerProfile.AvatarUrl) {
        avatarUrl = data.InfoResultPayload.PlayerProfile.AvatarUrl;
      }
    }

    this.saveSession(data.SessionTicket, data.PlayFabId, {
      username: cleanIdentifier.includes("@") ? cleanIdentifier.split("@")[0] : cleanIdentifier,
      displayName: displayName,
      email: cleanIdentifier.includes("@") ? cleanIdentifier : "",
      avatarUrl: avatarUrl
    });
    this.saveCredentials(cleanIdentifier, cleanPassword);

    return this.currentUser;
  }

  async sendPasswordReset(email) {
    const cleanEmail = String(email || "").trim().slice(0, 100);
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Please enter a valid email address");
    }

    const payload = {
      TitleId: PLAYFAB_TITLE_ID,
      Email: cleanEmail
    };

    return await this.post("SendAccountRecoveryEmail", payload, false);
  }

  async updateEmail(newEmail) {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    const cleanEmail = String(newEmail || "").trim().slice(0, 100);
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Please enter a valid email address");
    }

    const payload = {
      EmailAddress: cleanEmail
    };

    const data = await this.post("AddOrUpdateContactEmail", payload, true);
    if (this.currentUser) {
      this.currentUser.email = cleanEmail;
      localStorage.setItem("pulse_user", JSON.stringify(this.currentUser));
    }
    return data;
  }

  async updateDisplayName(displayName) {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    const cleanName = String(displayName || "").trim().slice(0, 32);
    if (!cleanName) throw new Error("Display name cannot be empty");

    let data = { DisplayName: cleanName };
    try {
      data = await this.post("UpdateUserTitleDisplayName", { DisplayName: cleanName }, true);
    } catch {}

    if (this.currentUser) {
      this.currentUser.displayName = data.DisplayName || cleanName;
      localStorage.setItem("pulse_user", JSON.stringify(this.currentUser));
      if (this.playFabId) {
        this.userCache.set(this.playFabId, {
          displayName: this.currentUser.displayName,
          avatarUrl: this.currentUser.avatarUrl || ""
        });
      }
    }

    try {
      await this.executeScript("updateUserProfile", { displayName: cleanName });
    } catch {}

    return data;
  }

  async syncCurrentUserProfile() {
    if (!this.sessionTicket || !this.currentUser) return;
    try {
      const data = await this.post("GetPlayerProfile", {
        PlayFabId: this.playFabId,
        ProfileConstraints: { ShowDisplayName: true, ShowAvatarUrl: true, ShowUsername: true }
      }, true);
      if (data && data.PlayerProfile) {
        const p = data.PlayerProfile;
        if (p.DisplayName) this.currentUser.displayName = p.DisplayName;
        if (p.AvatarUrl) this.currentUser.avatarUrl = p.AvatarUrl;
        if (p.Username) this.currentUser.username = p.Username;
      }
    } catch {}

    try {
      const readOnlyData = await this.post("GetUserReadOnlyData", {
        PlayFabId: this.playFabId,
        Keys: ["RankName", "RankColor", "RankPerms", "Rankhidden"]
      }, true);
      if (readOnlyData && readOnlyData.Data) {
        const d = readOnlyData.Data;
        const rName = d.RankName ? d.RankName.Value : "";
        const rColor = d.RankColor ? d.RankColor.Value : "";
        const rPermsRaw = d.RankPerms ? d.RankPerms.Value : "";
        const rHidden = d.Rankhidden ? (d.Rankhidden.Value === "true" || d.Rankhidden.Value === true) : false;
        let perms = {};
        if (rPermsRaw) {
          try { perms = JSON.parse(rPermsRaw); } catch {}
        }
        if (rName) {
          this.currentUser.appRank = {
            name: rName,
            color: rColor || "#ffffff",
            perms: perms,
            hidden: rHidden
          };
        }
      }
    } catch {}

    try {
      const cloudRes = await this.executeScript("getUserProfile", { userId: this.playFabId }, { silent: true });
      if (cloudRes && cloudRes.success && cloudRes.profile) {
        if (cloudRes.profile.displayName) this.currentUser.displayName = cloudRes.profile.displayName;
        if (cloudRes.profile.avatarUrl) this.currentUser.avatarUrl = cloudRes.profile.avatarUrl;
        if (cloudRes.profile.username) this.currentUser.username = cloudRes.profile.username;
        if (cloudRes.profile.presence) this.currentUser.presence = cloudRes.profile.presence;
        if (cloudRes.profile.statusMessage !== undefined) this.currentUser.statusMessage = cloudRes.profile.statusMessage;
        if (cloudRes.profile.appRank) this.currentUser.appRank = cloudRes.profile.appRank;
      }
    } catch {}

    localStorage.setItem("pulse_user", JSON.stringify(this.currentUser));
    if (this.playFabId) {
      this.userCache.set(this.playFabId, {
        displayName: this.currentUser.displayName,
        username: this.currentUser.username || "",
        avatarUrl: this.currentUser.avatarUrl || "",
        presence: this.currentUser.presence || "online",
        statusMessage: this.currentUser.statusMessage || "",
        appRank: this.currentUser.appRank || null
      });
    }
  }

  async updatePresence(presence, statusMessage = "") {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    const cleanPresence = ['online', 'idle', 'dnd', 'offline'].includes(String(presence).toLowerCase()) 
      ? String(presence).toLowerCase() 
      : 'online';
    const cleanStatusMessage = String(statusMessage || "").slice(0, 128);

    if (this.currentUser) {
      this.currentUser.presence = cleanPresence;
      this.currentUser.statusMessage = cleanStatusMessage;
      localStorage.setItem("pulse_user", JSON.stringify(this.currentUser));
      if (this.playFabId) {
        this.userCache.set(this.playFabId, {
          displayName: this.currentUser.displayName,
          username: this.currentUser.username || "",
          avatarUrl: this.currentUser.avatarUrl || "",
          presence: cleanPresence,
          statusMessage: cleanStatusMessage,
          appRank: this.currentUser.appRank || null
        });
      }
    }

    try {
      await this.executeScript("updateUserProfile", { 
        presence: cleanPresence, 
        statusMessage: cleanStatusMessage 
      });
    } catch {}

    return { presence: cleanPresence, statusMessage: cleanStatusMessage };
  }

  async updateAvatarUrl(avatarUrl) {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    const cleanUrl = String(avatarUrl || "").trim().slice(0, 150000);

    if (this.currentUser) {
      this.currentUser.avatarUrl = cleanUrl;
      localStorage.setItem("pulse_user", JSON.stringify(this.currentUser));
      if (this.playFabId) {
        this.userCache.set(this.playFabId, {
          displayName: this.currentUser.displayName,
          username: this.currentUser.username || "",
          avatarUrl: cleanUrl,
          presence: this.currentUser.presence || "online",
          statusMessage: this.currentUser.statusMessage || "",
          appRank: this.currentUser.appRank || null
        });
      }
    }

    if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
      try {
        await this.post("UpdateAvatarUrl", { ImageUrl: cleanUrl.slice(0, 500) }, true);
      } catch {}
    }

    try {
      await this.executeScript("updateUserProfile", { avatarUrl: cleanUrl });
    } catch {}

    return cleanUrl;
  }

  async uploadAvatar(file) {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    if (!file) throw new Error("No image file provided");
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    const rawDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const compressedDataUrl = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        const targetSize = Math.min(256, size);
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);
        let outUrl = '';
        try {
          outUrl = canvas.toDataURL('image/webp', 0.85);
        } catch {}
        if (!outUrl || !outUrl.startsWith('data:image/webp')) {
          try {
            outUrl = canvas.toDataURL('image/jpeg', 0.85);
          } catch {
            outUrl = rawDataUrl;
          }
        }
        resolve(outUrl);
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    });

    return await this.updateAvatarUrl(compressedDataUrl);
  }

  async resolveUser(playFabId, force = false) {
    if (!playFabId) return { displayName: "User", username: "", avatarUrl: "", presence: "offline", statusMessage: "", appRank: null };
    if (this.currentUser && this.currentUser.playFabId === playFabId) {
      return {
        displayName: this.currentUser.displayName,
        username: this.currentUser.username || "",
        avatarUrl: this.currentUser.avatarUrl || "",
        presence: this.currentUser.presence || "online",
        statusMessage: this.currentUser.statusMessage || "",
        appRank: this.currentUser.appRank || null,
        isFullProfile: true
      };
    }
    if (!force && this.userCache.has(playFabId)) {
      const cached = this.userCache.get(playFabId);
      if (cached && cached.isFullProfile) {
        return cached;
      }
    }

    let resolvedData = {
      playFabId: playFabId,
      displayName: "Member",
      username: "",
      avatarUrl: "",
      presence: "offline",
      statusMessage: "",
      appRank: null,
      isFullProfile: true
    };

    try {
      const cloudRes = await this.executeScript("getUserProfile", { userId: playFabId }, { silent: true });
      if (cloudRes && cloudRes.success && cloudRes.profile) {
        const p = cloudRes.profile;
        if (p.displayName) resolvedData.displayName = p.displayName;
        if (p.username) resolvedData.username = p.username;
        if (p.avatarUrl) resolvedData.avatarUrl = p.avatarUrl;
        if (p.presence) resolvedData.presence = p.presence;
        if (p.statusMessage !== undefined) resolvedData.statusMessage = p.statusMessage;
        if (p.appRank) resolvedData.appRank = p.appRank;
      }
    } catch {}

    if (!resolvedData.username || !resolvedData.appRank) {
      try {
        const res = await this.post("GetPlayerProfile", {
          PlayFabId: playFabId,
          ProfileConstraints: {
            ShowDisplayName: true,
            ShowAvatarUrl: true,
            ShowUsername: true
          }
        }, true);

        const profile = res && res.PlayerProfile ? res.PlayerProfile : {};
        if (profile.DisplayName && resolvedData.displayName === "Member") resolvedData.displayName = profile.DisplayName;
        if (profile.Username && !resolvedData.username) resolvedData.username = profile.Username;
        if (profile.AvatarUrl && !resolvedData.avatarUrl) resolvedData.avatarUrl = profile.AvatarUrl;
      } catch {}

      try {
        const readOnlyData = await this.post("GetUserReadOnlyData", {
          PlayFabId: playFabId,
          Keys: ["RankName", "RankColor", "RankPerms", "Rankhidden"]
        }, true);
        if (readOnlyData && readOnlyData.Data) {
          const d = readOnlyData.Data;
          const rName = d.RankName ? d.RankName.Value : "";
          const rColor = d.RankColor ? d.RankColor.Value : "";
          const rPermsRaw = d.RankPerms ? d.RankPerms.Value : "";
          const rHidden = d.Rankhidden ? (d.Rankhidden.Value === "true" || d.Rankhidden.Value === true) : false;
          let perms = {};
          if (rPermsRaw) {
            try { perms = JSON.parse(rPermsRaw); } catch {}
          }
          if (rName) {
            resolvedData.appRank = {
              name: rName,
              color: rColor || "#ffffff",
              perms: perms,
              hidden: rHidden
            };
          }
        }
      } catch {}
    }

    this.userCache.set(playFabId, resolvedData);
    return resolvedData;
  }

  async getFriendsList() {
    if (!this.sessionTicket) return [];
    try {
      const res = await this.post("GetFriendsList", {
        IncludeFacebookFriends: false,
        IncludeSteamFriends: false,
        ProfileConstraints: {
          ShowDisplayName: true,
          ShowAvatarUrl: true
        }
      }, true);

      const rawFriends = res.Friends || [];
      const confirmedFriends = [];
      const pendingIncoming = [];
      const pendingOutgoing = [];

      for (const f of rawFriends) {
        const prof = f.Profile || {};
        const tags = Array.isArray(f.Tags) ? f.Tags : [];
        const friendData = {
          playFabId: f.FriendPlayFabId,
          displayName: prof.DisplayName || f.TitleDisplayName || f.Username || "Friend",
          avatarUrl: prof.AvatarUrl || "",
          username: f.Username || "",
          tags: tags
        };

        const existingCached = this.userCache.get(friendData.playFabId);
        if (existingCached && existingCached.isFullProfile) {
          if (friendData.displayName) existingCached.displayName = friendData.displayName;
          if (friendData.avatarUrl) existingCached.avatarUrl = friendData.avatarUrl;
          if (friendData.username && !existingCached.username) existingCached.username = friendData.username;
        } else {
          this.userCache.set(friendData.playFabId, {
            displayName: friendData.displayName,
            avatarUrl: friendData.avatarUrl,
            username: friendData.username,
            presence: "offline",
            statusMessage: "",
            appRank: null,
            isFullProfile: false
          });
        }

        if (tags.includes("request_received")) {
          pendingIncoming.push({
            fromId: friendData.playFabId,
            fromName: friendData.displayName,
            fromAvatar: friendData.avatarUrl
          });
        }
        if (tags.includes("request_sent")) {
          pendingOutgoing.push(friendData);
        }
        confirmedFriends.push(friendData);
      }

      this._cachedIncomingRequests = pendingIncoming;
      this._cachedOutgoingRequests = pendingOutgoing;
      return confirmedFriends;
    } catch {
      return [];
    }
  }

  async addFriend(identifier) {
    return await this.sendFriendRequest(identifier);
  }

  async sendFriendRequest(target) {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    const cleanTarget = String(target || "").trim();
    if (!cleanTarget) throw new Error("Username or ID required");
    const res = await this.executeScript("sendFriendRequest", { target: cleanTarget });
    if (!res || !res.success) {
      throw new Error(res?.error || "Failed to send friend request");
    }
    return res;
  }

  async getFriendRequests() {
    if (this._cachedIncomingRequests) {
      return this._cachedIncomingRequests;
    }
    await this.getFriendsList();
    return this._cachedIncomingRequests || [];
  }

  async respondFriendRequest(fromId, action) {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    const res = await this.executeScript("respondFriendRequest", { fromId, action });
    if (!res || !res.success) {
      throw new Error(res?.error || "Failed to respond to request");
    }
    return res;
  }

  async removeFriend(friendPlayFabId) {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    try {
      await this.executeScript("removeFriend", { friendId: friendPlayFabId });
    } catch {}
    try {
      await this.post("RemoveFriend", { FriendPlayFabId: friendPlayFabId }, true);
    } catch {}
    return { success: true };
  }

  async deleteServer(serverId) {
    return await this.executeScript("deleteServer", { serverId });
  }

  async leaveServer(serverId) {
    return await this.executeScript("leaveServer", { serverId });
  }

  async executeScript(functionName, functionParameter = {}, options = {}, attempt = 0) {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    const isSilent = Boolean(options && options.silent);
    if (!isSilent && attempt === 0) {
      this.pendingRequests++;
      appState.setCloudScriptPending(true);
    }
    try {
      const payload = {
        FunctionName: functionName,
        FunctionParameter: functionParameter,
        GeneratePlayStreamEvent: false
      };
      const res = await this.post("ExecuteCloudScript", payload, true);
      if (res && res.FunctionResult) {
        if (res.FunctionResult.rateLimited || (res.FunctionResult.error && String(res.FunctionResult.error).toLowerCase().includes("rate limit"))) {
          if (attempt < 5) {
            await new Promise(r => setTimeout(r, Math.min(250 * Math.pow(2, attempt), 2000)));
            return await this.executeScript(functionName, functionParameter, options, attempt + 1);
          }
        }
        return res.FunctionResult;
      }
      return { success: false };
    } catch (err) {
      const errLower = String(err.message || "").toLowerCase();
      if ((errLower.includes("rate limit") || errLower.includes("too many requests") || errLower.includes("429")) && attempt < 5) {
        await new Promise(r => setTimeout(r, Math.min(250 * Math.pow(2, attempt), 2000)));
        return await this.executeScript(functionName, functionParameter, options, attempt + 1);
      }
      throw err;
    } finally {
      if (!isSilent && attempt === 0) {
        this.pendingRequests = Math.max(0, this.pendingRequests - 1);
        if (this.pendingRequests === 0) {
          appState.setCloudScriptPending(false);
        }
      }
    }
  }

  async getMessages(target, silent = true) {
    return await this.executeScript("getMessages", target, { silent });
  }

  async sendMessage(target, text) {
    const now = Date.now();
    if (now - this.lastSendTimestamp < 1000) {
      throw new Error("Sending too fast. Please wait a moment.");
    }
    this.lastSendTimestamp = now;

    const payload = Object.assign({}, target, {
      text: String(text || "").trim().slice(0, 2000)
    });

    return await this.executeScript("sendMessage", payload);
  }

  async editMessage(target, messageId, text) {
    const payload = Object.assign({}, target, {
      messageId: messageId,
      text: String(text || "").trim().slice(0, 2000)
    });
    return await this.executeScript("editMessage", payload);
  }

  async deleteMessage(target, messageId) {
    const payload = Object.assign({}, target, {
      messageId: messageId
    });
    return await this.executeScript("deleteMessage", payload);
  }

  async getUserServers(silent = true) {
    const res = await this.executeScript("getUserServers", {}, { silent });
    if (res && res.success && Array.isArray(res.servers)) {
      return res.servers;
    }
    return appState.getState().servers || [];
  }

  async createServer(name, iconUrl = "") {
    return await this.executeScript("createServer", { name, iconUrl });
  }

  async getServer(serverId, silent = true) {
    return await this.executeScript("getServer", { serverId }, { silent });
  }

  async resolveServer(serverId, force = false) {
    if (!serverId) return { id: "", name: "Pulse Server", iconUrl: "", memberCount: 0 };
    if (!this.serverCache) this.serverCache = new Map();
    if (!force && this.serverCache.has(serverId)) {
      return this.serverCache.get(serverId);
    }
    const knownServers = appState.getState().servers || [];
    const localMatch = knownServers.find(s => (s.serverId || s.id) === serverId);
    if (localMatch && !force) {
      const cached = {
        id: serverId,
        name: localMatch.name || "Pulse Server",
        iconUrl: localMatch.iconUrl || "",
        memberCount: (localMatch.members && typeof localMatch.members === 'object') ? Object.keys(localMatch.members).length : (Array.isArray(localMatch.memberIds) ? localMatch.memberIds.length : 0)
      };
      this.serverCache.set(serverId, cached);
      return cached;
    }

    const cached = { id: serverId, name: "Pulse Server", iconUrl: "", memberCount: 0 };
    try {
      const res = await this.getServer(serverId, true);
      if (res && res.success && res.server) {
        const s = res.server;
        cached.name = s.name || "Pulse Server";
        cached.iconUrl = s.iconUrl || "";
        const mCount = (s.members && typeof s.members === 'object') ? Object.keys(s.members).length : (Array.isArray(s.memberIds) ? s.memberIds.length : 0);
        cached.memberCount = mCount;
        this.serverCache.set(serverId, cached);
        return cached;
      }
    } catch {}
    this.serverCache.set(serverId, cached);
    return cached;
  }

  async saveServer(serverId, updateData) {
    return await this.executeScript("saveServer", Object.assign({ serverId }, updateData));
  }

  async joinServer(serverId) {
    return await this.executeScript("joinServer", { serverId });
  }

  async getUserDMs(silent = true) {
    const res = await this.executeScript("getUserDMs", {}, { silent });
    if (res && res.success && Array.isArray(res.dms)) {
      return res.dms;
    }
    return appState.getState().dms || [];
  }

  async createOrGetDM(partnerId) {
    return await this.executeScript("createOrGetDM", { partnerId });
  }

  async createGroupDM(name, memberIds) {
    return await this.executeScript("createGroupDM", { name, memberIds });
  }

  async manageGroupDM(dmId, action, extraParams = {}) {
    return await this.executeScript("manageGroupDM", Object.assign({ dmId, action }, extraParams));
  }

  async leaveGroupDM(dmId) {
    return await this.executeScript("leaveGroupDM", { dmId });
  }

  async removeDM(partnerId) {
    return await this.executeScript("removeDM", { partnerId });
  }

  async getGroupMeta(dmId, silent = true) {
    return await this.executeScript("getGroupMeta", { dmId }, { silent });
  }

  getCachedFile(fileId) {
    if (!fileId) return null;
    return this.fileCache.get(String(fileId).trim()) || null;
  }

  async uploadFile(file, onProgress) {
    if (!this.sessionTicket) throw new Error("Not authenticated");
    if (!file) throw new Error("No file selected");
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size exceeds 10MB limit");
    }

    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const chunkSize = 6000;
    const totalChunks = Math.ceil(base64Data.length / chunkSize);
    const uploadId = "upl_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

    let finalRes = null;
    for (let i = 0; i < totalChunks; i++) {
      if (typeof onProgress === 'function') {
        onProgress(i + 1, totalChunks);
      }
      const chunk = base64Data.slice(i * chunkSize, (i + 1) * chunkSize);
      const payload = {
        uploadId: uploadId,
        chunkIndex: i,
        totalChunks: totalChunks,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        chunkData: chunk
      };
      const res = await this.executeScript("uploadFileChunk", payload, { silent: true });
      if (!res || !res.success) {
        throw new Error(res?.error || `Upload failed on chunk ${i + 1}/${totalChunks}`);
      }
      if (i === totalChunks - 1) {
        finalRes = res;
      }
    }

    if (!finalRes || !finalRes.fileId) {
      throw new Error("Failed to finalize file upload");
    }

    this.fileCache.set(finalRes.fileId, {
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      data: base64Data
    });

    return finalRes;
  }

  async downloadFile(fileId) {
    const cleanId = String(fileId || "").trim();
    if (!cleanId) throw new Error("File ID required");

    if (this.fileCache.has(cleanId)) {
      return this.fileCache.get(cleanId);
    }

    if (this.fileInFlight.has(cleanId)) {
      return await this.fileInFlight.get(cleanId);
    }

    if (!this.sessionTicket) throw new Error("Not authenticated");

    const reqPromise = (async () => {
      try {
        const res = await this.executeScript("downloadFile", { fileId: cleanId }, { silent: true });
        if (!res || !res.success || !res.file) {
          throw new Error(res?.error || "File could not be found");
        }
        this.fileCache.set(cleanId, res.file);
        return res.file;
      } finally {
        this.fileInFlight.delete(cleanId);
      }
    })();

    this.fileInFlight.set(cleanId, reqPromise);
    return await reqPromise;
  }

  async getUserData(keys = []) {
    if (!this.sessionTicket) return {};
    try {
      const payload = Array.isArray(keys) && keys.length > 0 ? { Keys: keys } : {};
      const res = await this.post("GetUserData", payload, true);
      const dataObj = {};
      if (res && res.Data) {
        for (const [k, item] of Object.entries(res.Data)) {
          dataObj[k] = item?.Value || "";
        }
      }
      return dataObj;
    } catch {
      return {};
    }
  }

  async updateUserData(data, permission = "Private") {
    if (!this.sessionTicket || !data || typeof data !== "object") return false;
    try {
      const cleanData = {};
      for (const [k, v] of Object.entries(data)) {
        if (k && typeof k === "string") {
          cleanData[k] = typeof v === "string" ? v : JSON.stringify(v);
        }
      }
      await this.post("UpdateUserData", {
        Data: cleanData,
        Permission: permission
      }, true);
      return true;
    } catch {
      return false;
    }
  }

  async loadUserSettings() {
    const data = await this.getUserData(["pulse_user_settings", "void_user_settings", "pulse_theme"]);
    if (data) {
      const raw = data.pulse_user_settings || data.void_user_settings;
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
      if (data.pulse_theme) {
        return { theme: data.pulse_theme };
      }
    }
    return null;
  }

  async saveUserSettings(settings) {
    if (!settings || typeof settings !== "object") return false;
    const payload = JSON.stringify(settings);
    try {
      if (typeof setCookie === "function") {
        setCookie("pulse_user_settings", payload);
        if (settings.theme) setCookie("pulse_theme", settings.theme);
      }
    } catch {}

    try {
      window.postMessage({
        type: "PULSE_SETTINGS_SYNC",
        settings
      }, "*");
    } catch {}

    const dataObj = {
      pulse_user_settings: payload,
      void_user_settings: payload
    };
    if (settings.theme) dataObj.pulse_theme = settings.theme;

    return await this.updateUserData(dataObj, "Private");
  }

  async loadPulseSettings() {
    return await this.loadUserSettings();
  }

  async savePulseSettings(settings) {
    const current = (await this.loadUserSettings()) || {};
    const merged = Object.assign({}, current, settings);
    return await this.saveUserSettings(merged);
  }
}

export const playFabService = new PlayFabService();

