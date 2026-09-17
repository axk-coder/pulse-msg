import { appState } from '../services/state.js';
import { playFabService } from '../services/playfab.js';
import { pollingEngine } from '../services/pollingEngine.js';

export class MessageList {
  constructor(container, { onOpenUserProfile, onOpenDM } = {}) {
    this.container = container;
    this.callbacks = { onOpenUserProfile, onOpenDM };
    this.shouldAutoScroll = true;
    this.resolvedProfiles = new Map();
    this.activeFriendsTab = 'all';
    this.selectedGroupFriends = new Set();
    this.groupNameInput = '';
    this.addFriendInput = '';
    this.statusMessage = null;
    this.pendingRequests = [];
    this.lastSnapshot = '';
    this.render();

    this.unsubscribe = appState.subscribe((state, key) => {
      if (key === 'messages' || key === 'navigation' || key === 'channel' || key === 'search' || key === 'profileCache' || key === 'friends' || key === 'cloudScriptPending') {
        this.updateMessages();
      }
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="messages-container" id="messages-stream"></div>
      <button class="scroll-bottom-btn" id="scroll-bottom-btn" style="display: none;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        <span>Latest</span>
      </button>
    `;

    this.streamEl = this.container.querySelector('#messages-stream');
    this.scrollBtn = this.container.querySelector('#scroll-bottom-btn');

    this.attachEvents();
    this.updateMessages();
  }

  attachEvents() {
    this.streamEl.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.streamEl;
      const atBottom = scrollHeight - scrollTop - clientHeight < 60;
      this.shouldAutoScroll = atBottom;

      if (!atBottom) {
        this.scrollBtn.style.display = 'flex';
      } else {
        this.scrollBtn.style.display = 'none';
      }
    });

    this.scrollBtn.addEventListener('click', () => {
      this.scrollToBottom(true);
    });
  }

  scrollToBottom(smooth = false) {
    if (!this.streamEl) return;
    this.streamEl.scrollTo({
      top: this.streamEl.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    this.scrollBtn.style.display = 'none';
  }

  formatTime(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  formatDateHeader(isoString) {
    try {
      const date = new Date(isoString);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      }
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return 'Today';
    }
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

  formatMentions(text) {
    return this.formatMessageWithEmbeds(text).textHtml;
  }

  formatMessageWithEmbeds(rawText) {
    if (!rawText) return { textHtml: '', embedsHtml: '' };
    const embeds = [];
    const handledUrls = new Set();
    const text = String(rawText);
    let escaped = this.escapeHtml(text);

    escaped = escaped.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (m, lang, code) => {
      return `<pre class="message-code-block"><code>${code}</code></pre>`;
    });
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="message-inline-code">$1</code>');
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    escaped = escaped.replace(/(@[a-zA-Z0-9_-]+)/g, '<span class="message-mention" style="background: rgba(255, 255, 255, 0.14); color: #ffffff; padding: 1px 6px; border-radius: 4px; font-weight: 600;">$1</span>');

    const fileRegex = /pulse:\/\/file\/(file_[0-9]+_[0-9]+)(?:\?([^\s<>"'`]+))?/gi;
    let fileMatch;
    while ((fileMatch = fileRegex.exec(text)) !== null) {
      const fId = fileMatch[1];
      const queryStr = fileMatch[2] || '';
      if (!handledUrls.has(fId)) {
        handledUrls.add(fId);
        let fName = 'File Attachment';
        let fSize = 0;
        let fType = 'application/octet-stream';
        if (queryStr) {
          try {
            const params = new URLSearchParams(queryStr);
            if (params.get('name')) fName = decodeURIComponent(params.get('name'));
            if (params.get('size')) fSize = parseInt(params.get('size'), 10) || 0;
            if (params.get('type')) fType = decodeURIComponent(params.get('type'));
          } catch {}
        }

        let sizeFormatted = '';
        if (fSize > 0) {
          if (fSize >= 1024 * 1024) sizeFormatted = (fSize / (1024 * 1024)).toFixed(1) + ' MB';
          else sizeFormatted = Math.max(1, Math.round(fSize / 1024)) + ' KB';
        }

        const isImage = fType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fName);

        embeds.push(`
          <div class="discord-file-embed" data-file-id="${this.escapeHtml(fId)}">
            <div class="discord-file-content">
              <div class="discord-file-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
              </div>
              <div class="discord-file-info">
                <span class="discord-file-name" title="${this.escapeHtml(fName)}">${this.escapeHtml(fName)}</span>
                ${sizeFormatted ? `<span class="discord-file-size">${sizeFormatted}</span>` : ''}
              </div>
              <button type="button" class="btn-download-file" data-file-id="${this.escapeHtml(fId)}" data-file-name="${this.escapeHtml(fName)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download</span>
              </button>
            </div>
            ${isImage ? `
              <div class="file-image-preview" data-file-id="${this.escapeHtml(fId)}" style="margin-top: 8px; max-height: 280px; overflow: hidden; border-radius: 4px; display: none;">
                <img src="" alt="${this.escapeHtml(fName)}" style="max-width: 100%; max-height: 280px; object-fit: contain; display: block;" />
              </div>
            ` : ''}
          </div>
        `);
      }
    }

    const inviteRegex = /(?:pulse:\/\/invite\/|https?:\/\/[^\s]+\/invite\/|discord\.gg\/|\b)(srv_[0-9]+_[0-9]+)\b/gi;
    let inviteMatch;
    while ((inviteMatch = inviteRegex.exec(text)) !== null) {
      const srvId = inviteMatch[1];
      if (!handledUrls.has(srvId)) {
        handledUrls.add(srvId);
        embeds.push(`
          <div class="discord-invite-card" data-server-id="${this.escapeHtml(srvId)}">
            <div class="discord-invite-badge">YOU'VE BEEN INVITED TO JOIN A SERVER</div>
            <div class="discord-invite-body">
              <div class="discord-invite-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="discord-invite-info">
                <div class="discord-invite-title">Pulse Server</div>
                <div class="discord-invite-meta">
                  <span class="presence-badge-dot dot-online"></span>
                  <span>${this.escapeHtml(srvId)}</span>
                </div>
              </div>
              <button type="button" class="btn-join-embed-server" data-server-id="${this.escapeHtml(srvId)}">
                Join Server
              </button>
            </div>
          </div>
        `);
      }
    }

    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
    let ytMatch;
    while ((ytMatch = ytRegex.exec(text)) !== null) {
      const videoId = ytMatch[1];
      const fullUrl = ytMatch[0];
      if (!handledUrls.has(fullUrl)) {
        handledUrls.add(fullUrl);
        embeds.push(`
          <div class="discord-video-embed">
            <iframe 
              src="https://www.youtube-nocookie.com/embed/${this.escapeHtml(videoId)}" 
              title="Video" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          </div>
        `);
      }
    }

    const mediaRegex = /https?:\/\/[^\s]+?\.(?:gif|png|jpg|jpeg|webp|svg)(?:\?[^\s]*)?|https?:\/\/media\.tenor\.com\/[^\s]+|https?:\/\/media[0-9]*\.giphy\.com\/[^\s]+/gi;
    let mediaMatch;
    while ((mediaMatch = mediaRegex.exec(text)) !== null) {
      const mUrl = mediaMatch[0];
      if (!handledUrls.has(mUrl)) {
        handledUrls.add(mUrl);
        embeds.push(`
          <div class="discord-media-embed">
            <a href="${this.escapeHtml(mUrl)}" target="_blank" rel="noopener noreferrer">
              <img src="${this.escapeHtml(mUrl)}" alt="GIF/Image" class="discord-embed-image" loading="lazy" />
            </a>
          </div>
        `);
      }
    }

    const linkRegex = /https?:\/\/[^\s<>"'`]+/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(text)) !== null) {
      const lUrl = linkMatch[0];
      if (!handledUrls.has(lUrl) && !lUrl.includes('youtube.com') && !lUrl.includes('youtu.be')) {
        handledUrls.add(lUrl);
        let domain = '';
        try { domain = new URL(lUrl).hostname; } catch { domain = lUrl; }
        embeds.push(`
          <div class="discord-link-embed">
            <div class="discord-link-embed-border"></div>
            <div class="discord-link-embed-content">
              <span class="discord-link-site">${this.escapeHtml(domain)}</span>
              <a href="${this.escapeHtml(lUrl)}" target="_blank" rel="noopener noreferrer" class="discord-link-title">${this.escapeHtml(lUrl)}</a>
            </div>
          </div>
        `);
      }
    }

    return {
      textHtml: escaped,
      embedsHtml: embeds.join('')
    };
  }

  async updateMessages() {
    const state = appState.getState();
    const isFriendsHub = (state.activeContext === 'dm' && !state.activeDM);

    if (isFriendsHub) {
      this.renderFriendsHub(state);
      return;
    }

    const streamKey = appState.getStreamKey();
    const allMsgs = state.messages[streamKey] || [];
    const searchQuery = state.searchQuery.trim();
    const currentUser = playFabService.getCurrentUser();
    const currentUserId = currentUser ? currentUser.playFabId : null;

    const server = state.activeContext === 'server' ? state.activeServer : null;
    const rolesMap = new Map();
    if (server && Array.isArray(server.roles)) {
      server.roles.forEach(r => rolesMap.set(r.id, r));
    }
    const membersMap = (server && server.members) ? server.members : {};

    const isOwner = server && (server.ownerId === currentUserId || (!server.ownerId && (server.id === currentUserId || server.serverId === currentUserId)));
    const myRecord = (server && server.members && server.members[currentUserId]) ? server.members[currentUserId] : null;
    const myRoles = (myRecord && Array.isArray(myRecord.roles) && myRecord.roles.length > 0) ? myRecord.roles : ['role_member'];
    let canManageMessages = isOwner || myRoles.includes('role_admin');
    if (!canManageMessages && server) {
      const chId = state.activeChannelId || 'chat';
      const overrides = (server.channelOverrides && server.channelOverrides[chId]) || {};
      let explicitAllow = false;
      let explicitDeny = false;
      for (const rId of myRoles) {
        if (overrides[rId]) {
          if (overrides[rId].manage_messages === true) explicitAllow = true;
          if (overrides[rId].manage_messages === false) explicitDeny = true;
        }
      }
      if (explicitAllow) {
        canManageMessages = true;
      } else if (!explicitDeny) {
        const allRoles = Array.isArray(server.roles) ? server.roles : [];
        for (const r of allRoles) {
          if (myRoles.includes(r.id) && Array.isArray(r.permissions)) {
            if (r.permissions.includes('manage_messages')) {
              canManageMessages = true;
              break;
            }
          }
        }
      }
    } else if (!canManageMessages && state.activeContext === 'dm' && state.activeDM && state.activeDM.isGroup) {
      if (state.activeDM.ownerId === currentUserId) canManageMessages = true;
    }

    const filteredMsgs = searchQuery
      ? allMsgs.filter(m => m.text.toLowerCase().includes(searchQuery))
      : allMsgs;

    const currentSnapshot = `${streamKey}_${filteredMsgs.length}_${filteredMsgs.map(m => m.id + (m.isEdited ? 'e' : '') + m.text).join('|')}_${searchQuery}_${state.isPendingCloudScript ? '1' : '0'}`;
    if (this.lastSnapshot === currentSnapshot) {
      if (this.shouldAutoScroll) this.scrollToBottom(false);
      return;
    }
    this.lastSnapshot = currentSnapshot;

    for (const msg of filteredMsgs) {
      if (msg.senderId) {
        if (playFabService.userCache.has(msg.senderId)) {
          this.resolvedProfiles.set(msg.senderId, playFabService.userCache.get(msg.senderId));
        } else if (!this.resolvedProfiles.has(msg.senderId)) {
          playFabService.resolveUser(msg.senderId).then(profile => {
            this.resolvedProfiles.set(msg.senderId, profile);
            const cards = this.streamEl.querySelectorAll(`[data-sender-id="${msg.senderId}"]`);
            cards.forEach(card => {
              const nameSpan = card.querySelector('.message-sender');
              const avatarBox = card.querySelector('.message-avatar-box');
              if (nameSpan) nameSpan.textContent = profile.displayName;
              if (avatarBox) {
                avatarBox.innerHTML = `
                  ${profile.avatarUrl 
                    ? `<img src="${this.escapeHtml(profile.avatarUrl)}" class="message-avatar-img" alt="" />`
                    : profile.displayName.charAt(0).toUpperCase()
                  }
                  <div class="presence-badge-dot dot-${profile.presence || 'online'}"></div>
                `;
              }
            });
          });
        }
      }
    }

    let channelTitle = 'Messages';
    let starterIcon = '#';
    if (state.activeContext === 'global') {
      channelTitle = 'global-chat';
      starterIcon = '#';
    } else if (state.activeContext === 'server') {
      channelTitle = state.activeChannelId || 'chat';
      starterIcon = '#';
    } else if (state.activeContext === 'dm' && state.activeDM) {
      if (state.activeDM.isGroup) {
        channelTitle = state.activeDM.name || 'Group Chat';
        starterIcon = '@';
      } else {
        const partnerName = (state.activeDM.partnerId && state.userProfiles[state.activeDM.partnerId]?.displayName) || 'Direct Message';
        channelTitle = partnerName;
        starterIcon = '@';
      }
    }

    let html = `
      <div class="channel-starter">
        <div class="channel-starter-hash">${starterIcon}</div>
        <h2 class="channel-starter-title">${this.escapeHtml(channelTitle)}</h2>
      </div>
    `;

    if (filteredMsgs.length === 0) {
      if (state.isPendingCloudScript) {
        html += `
          <div class="message-loading-skeleton-list">
            <div class="message-skeleton-card">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line" style="width: 120px;"></div>
                <div class="skeleton-line" style="width: 75%;"></div>
              </div>
            </div>
            <div class="message-skeleton-card">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line" style="width: 90px;"></div>
                <div class="skeleton-line" style="width: 50%;"></div>
              </div>
            </div>
          </div>
        `;
      } else {
        html += `
          <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px;">
            No messages here yet.
          </div>
        `;
      }
    } else {
      let lastDate = null;

      filteredMsgs.forEach(msg => {
        const msgDate = this.formatDateHeader(msg.timestamp);
        if (msgDate !== lastDate) {
          lastDate = msgDate;
          html += `
            <div class="date-divider">
              <div class="date-divider-line"></div>
              <span class="date-divider-text">${msgDate}</span>
              <div class="date-divider-line"></div>
            </div>
          `;
        }

        const isOwn = currentUserId && msg.senderId === currentUserId;
        const profile = this.resolvedProfiles.get(msg.senderId) || playFabService.userCache.get(msg.senderId) || { displayName: "User", avatarUrl: "", presence: "online" };
        const initial = profile.displayName.charAt(0).toUpperCase();

        let roleBadge = '';
        if (server && membersMap[msg.senderId] && membersMap[msg.senderId].roles) {
          const rId = membersMap[msg.senderId].roles[0];
          const rObj = rolesMap.get(rId);
          if (rObj) {
            roleBadge = `<span class="message-role-badge">${this.escapeHtml(rObj.name)}</span>`;
          }
        }

        let replyPreviewHtml = '';
        if (msg.replyTo) {
          const rSenderProf = this.resolvedProfiles.get(msg.replyTo.senderId) || playFabService.userCache.get(msg.replyTo.senderId) || { displayName: "User" };
          replyPreviewHtml = `
            <div class="message-reply-preview" style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #888888; margin-bottom: 4px; padding-left: 12px; position: relative;">
              <span style="position: absolute; left: 0; top: 7px; width: 8px; height: 8px; border-left: 2px solid #3e3e3e; border-top: 2px solid #3e3e3e; border-top-left-radius: 4px;"></span>
              <span style="font-weight: 600; color: #cccccc; cursor: pointer;" class="reply-target-user" data-user-id="${this.escapeHtml(msg.replyTo.senderId)}">@${this.escapeHtml(rSenderProf.displayName)}</span>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px; color: #888888;">${this.escapeHtml(msg.replyTo.text)}</span>
            </div>
          `;
        }

        const { textHtml, embedsHtml } = this.formatMessageWithEmbeds(msg.text);

        html += `
          <div class="message-card" data-msg-id="${this.escapeHtml(msg.id)}" data-sender-id="${this.escapeHtml(msg.senderId)}" style="position: relative;">
            <div class="message-hover-actions" style="position: absolute; right: 12px; top: -10px; background: #1c1c1c; border: 1px solid #333333; border-radius: 4px; padding: 2px 4px; display: none; gap: 4px; z-index: 5;">
              <button type="button" class="btn-reply-msg" data-msg-id="${this.escapeHtml(msg.id)}" data-sender-id="${this.escapeHtml(msg.senderId)}" data-sender-name="${this.escapeHtml(profile.displayName)}" data-text="${this.escapeHtml(msg.text)}" title="Reply" style="background: none; border: none; color: #aaaaaa; cursor: pointer; padding: 3px 6px; display: flex; align-items: center; font-size: 12px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                  <polyline points="9 14 4 9 9 4"></polyline>
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                </svg>
              </button>
              ${isOwn ? `
                <button type="button" class="btn-edit-msg" data-msg-id="${this.escapeHtml(msg.id)}" title="Edit Message" style="background: none; border: none; color: #aaaaaa; cursor: pointer; padding: 3px 6px; display: flex; align-items: center; font-size: 12px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button>
              ` : ''}
              ${(isOwn || canManageMessages) ? `
                <button type="button" class="btn-delete-msg" data-msg-id="${this.escapeHtml(msg.id)}" title="Delete Message" style="background: none; border: none; color: #e57373; cursor: pointer; padding: 3px 6px; display: flex; align-items: center; font-size: 12px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              ` : ''}
            </div>

            ${replyPreviewHtml}

            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <div class="message-avatar-box clickable-user-avatar" data-user-id="${this.escapeHtml(msg.senderId)}" style="cursor: pointer; position: relative;">
                ${profile.avatarUrl 
                  ? `<img src="${this.escapeHtml(profile.avatarUrl)}" class="message-avatar-img" alt="" />`
                  : initial
                }
                <div class="presence-badge-dot dot-${profile.presence || 'online'}"></div>
              </div>
              <div class="message-body" style="flex: 1;">
                <div class="message-meta">
                  <span class="message-sender clickable-user-name" data-user-id="${this.escapeHtml(msg.senderId)}" style="cursor: pointer;">${this.escapeHtml(profile.displayName)}</span>
                  ${roleBadge}
                  ${isOwn ? '<span class="message-role-badge role-you">You</span>' : ''}
                  <span class="message-time">${this.formatTime(msg.timestamp)}</span>
                </div>
                <div class="message-text">${textHtml}${msg.isEdited ? '<span class="message-edited-tag" style="font-size: 10px; color: #777777; margin-left: 4px;">(edited)</span>' : ''}</div>
                ${embedsHtml ? `<div class="message-embeds-container">${embedsHtml}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      });
    }

    this.streamEl.innerHTML = html;

    this.streamEl.querySelectorAll('.message-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        const actions = card.querySelector('.message-hover-actions');
        if (actions) actions.style.display = 'flex';
      });
      card.addEventListener('mouseleave', () => {
        const actions = card.querySelector('.message-hover-actions');
        if (actions) actions.style.display = 'none';
      });
    });

    this.streamEl.querySelectorAll('.btn-reply-msg').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.msgId;
        const senderId = btn.dataset.senderId;
        const senderName = btn.dataset.senderName;
        const text = btn.dataset.text;
        appState.setReplyingTo({ id, senderId, senderName, text });
      });
    });

    this.streamEl.querySelectorAll('.btn-edit-msg').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const msgId = btn.dataset.msgId;
        const card = this.streamEl.querySelector(`.message-card[data-msg-id="${msgId}"]`);
        if (!card) return;
        const textContainer = card.querySelector('.message-text');
        if (!textContainer || card.querySelector('.inline-edit-box')) return;

        const currentMsg = (allMsgs || []).find(m => m.id === msgId);
        const originalText = currentMsg ? currentMsg.text : '';

        textContainer.style.display = 'none';
        const editBox = document.createElement('div');
        editBox.className = 'inline-edit-box';
        editBox.style.marginTop = '4px';
        editBox.innerHTML = `
          <textarea class="form-input inline-edit-textarea" style="width: 100%; min-height: 48px; resize: vertical; padding: 8px; font-size: 13px; background: #181818; border: 1px solid #383838; border-radius: 4px; color: #fff;">${this.escapeHtml(originalText)}</textarea>
          <div style="display: flex; gap: 6px; align-items: center; font-size: 11px; color: #777777; margin-top: 4px;">
            <span>escape to <a href="#" class="cancel-inline-edit" style="color: #999999; text-decoration: underline;">cancel</a> • enter to <a href="#" class="save-inline-edit" style="color: #ffffff; text-decoration: underline;">save</a></span>
          </div>
        `;
        textContainer.parentNode.appendChild(editBox);

        const textarea = editBox.querySelector('.inline-edit-textarea');
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);

        const cancelEdit = () => {
          editBox.remove();
          textContainer.style.display = 'block';
        };

        const saveEdit = async () => {
          const newText = textarea.value.trim();
          if (!newText || newText === originalText) {
            cancelEdit();
            return;
          }
          editBox.remove();
          textContainer.innerHTML = `${this.formatMentions(newText)}<span class="message-edited-tag" style="font-size: 10px; color: #777777; margin-left: 4px;">(edited)</span>`;
          textContainer.style.display = 'block';

          if (currentMsg) {
            currentMsg.text = newText;
            currentMsg.isEdited = true;
          }

          const targetParam = appState.getTargetParam();
          try {
            await playFabService.editMessage(targetParam, msgId, newText);
            pollingEngine.pollNow();
          } catch {}
        };

        textarea.addEventListener('keydown', (ke) => {
          if (ke.key === 'Escape') {
            ke.preventDefault();
            cancelEdit();
          } else if (ke.key === 'Enter' && !ke.shiftKey) {
            ke.preventDefault();
            saveEdit();
          }
        });

        editBox.querySelector('.cancel-inline-edit')?.addEventListener('click', (ce) => {
          ce.preventDefault();
          cancelEdit();
        });

        editBox.querySelector('.save-inline-edit')?.addEventListener('click', (se) => {
          se.preventDefault();
          saveEdit();
        });
      });
    });

    this.streamEl.querySelectorAll('.btn-delete-msg').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const msgId = btn.dataset.msgId;
        if (!msgId) return;

        const streamKey = appState.getStreamKey();
        const curMsgs = appState.getState().messages[streamKey] || [];
        appState.state.messages[streamKey] = curMsgs.filter(m => m.id !== msgId);
        this.updateMessages();

        const targetParam = appState.getTargetParam();
        try {
          await playFabService.deleteMessage(targetParam, msgId);
          pollingEngine.pollNow();
        } catch {}
      });
    });

    this.streamEl.querySelectorAll('.clickable-user-avatar, .clickable-user-name, .reply-target-user').forEach(el => {
      el.addEventListener('click', () => {
        const uId = el.dataset.userId;
        if (uId && this.callbacks.onOpenUserProfile) {
          this.callbacks.onOpenUserProfile(uId);
        }
      });
    });

    this.streamEl.querySelectorAll('.btn-join-embed-server').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const serverId = btn.getAttribute('data-server-id');
        if (!serverId) return;

        btn.disabled = true;
        btn.textContent = 'Joining...';

        try {
          const res = await playFabService.joinServer(serverId);
          if (res && res.success) {
            btn.textContent = 'Joined!';
            const servers = await playFabService.getUserServers(false);
            appState.setServers(servers);
            const joinedServer = servers.find(s => (s.serverId || s.id) === serverId) || res.server;
            if (joinedServer) {
              appState.setActiveServer(joinedServer, 'chat');
            }
          } else {
            btn.textContent = 'Failed';
            setTimeout(() => {
              btn.disabled = false;
              btn.textContent = 'Join Server';
            }, 2000);
          }
        } catch (err) {
          btn.textContent = 'Error';
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Join Server';
          }, 2000);
        }
      });
    });

    this.streamEl.querySelectorAll('.btn-download-file').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const fileId = btn.getAttribute('data-file-id');
        const fileName = btn.getAttribute('data-file-name') || 'download';
        if (!fileId) return;

        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span>Downloading...</span>`;

        try {
          const fileObj = await playFabService.downloadFile(fileId);
          if (fileObj && fileObj.data) {
            const link = document.createElement('a');
            link.href = fileObj.data;
            link.download = fileObj.fileName || fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } catch (err) {
          alert(err?.message || "Failed to download file");
        } finally {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
        }
      });
    });

    this.streamEl.querySelectorAll('.file-image-preview').forEach(previewEl => {
      const fileId = previewEl.getAttribute('data-file-id');
      if (fileId && previewEl.style.display === 'none') {
        playFabService.downloadFile(fileId).then(fileObj => {
          if (fileObj && fileObj.data) {
            const img = previewEl.querySelector('img');
            if (img) {
              img.src = fileObj.data;
              previewEl.style.display = 'block';
            }
          }
        }).catch(() => {});
      }
    });

    if (this.shouldAutoScroll) {
      setTimeout(() => this.scrollToBottom(false), 20);
    }
  }

  async renderFriendsHub(state) {
    const friends = state.friends || [];

    for (const f of friends) {
      const fId = f.playFabId || f.FriendPlayFabId;
      if (fId && !this.resolvedProfiles.has(fId)) {
        if (f.displayName && f.displayName !== 'Friend') {
          this.resolvedProfiles.set(fId, { 
            displayName: f.displayName, 
            avatarUrl: f.avatarUrl || '',
            presence: f.presence || 'offline',
            statusMessage: f.statusMessage || ''
          });
        } else {
          playFabService.resolveUser(fId).then(p => {
            this.resolvedProfiles.set(fId, p);
            this.updateMessages();
          });
        }
      }
    }

    if (this.activeFriendsTab === 'pending') {
      try {
        this.pendingRequests = await playFabService.getFriendRequests();
      } catch {
        this.pendingRequests = [];
      }
    }

    let tabContentHtml = '';

    if (this.activeFriendsTab === 'all') {
      if (friends.length === 0) {
        tabContentHtml = `
          <div style="padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
            No friends added yet
          </div>
        `;
      } else {
        tabContentHtml = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${friends.map(f => {
              const fId = f.playFabId || f.FriendPlayFabId;
              const profile = this.resolvedProfiles.get(fId) || { displayName: f.displayName || "Friend", avatarUrl: f.avatarUrl || "", presence: "offline", statusMessage: "" };
              const initial = (profile.displayName || "F").charAt(0).toUpperCase();

              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                  <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" class="btn-friend-profile" data-friend-id="${this.escapeHtml(fId)}">
                    <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: #222222; border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                      ${profile.avatarUrl 
                        ? `<img src="${this.escapeHtml(profile.avatarUrl)}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />`
                        : `<span style="font-weight: 700; color: #ffffff;">${initial}</span>`
                      }
                      <div class="presence-badge-dot dot-${profile.presence || 'offline'}"></div>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-size: 14px; font-weight: 600; color: #ffffff;">${this.escapeHtml(profile.displayName)}</span>
                      ${profile.statusMessage ? `<span style="font-size: 11px; color: var(--text-secondary);">${this.escapeHtml(profile.statusMessage)}</span>` : ''}
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="form-btn-submit btn-msg-friend" data-friend-id="${this.escapeHtml(fId)}" style="width: auto; padding: 6px 14px; margin: 0; font-size: 12px;">
                      Message
                    </button>
                    <button type="button" class="form-btn-submit btn-remove-friend" data-friend-id="${this.escapeHtml(fId)}" style="width: auto; padding: 6px 12px; margin: 0; font-size: 12px; background: transparent; border: 1px solid var(--border-medium); color: var(--text-muted);">
                      Remove
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    } else if (this.activeFriendsTab === 'pending') {
      if (this.pendingRequests.length === 0) {
        tabContentHtml = `
          <div style="padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
            There are no pending friend requests
          </div>
        `;
      } else {
        tabContentHtml = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${this.pendingRequests.map(req => {
              const initial = (req.fromName || "U").charAt(0).toUpperCase();
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: #222222; border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                      ${req.fromAvatar 
                        ? `<img src="${this.escapeHtml(req.fromAvatar)}" style="width: 100%; height: 100%; object-fit: cover;" alt="" />`
                        : `<span style="font-weight: 700; color: #ffffff;">${initial}</span>`
                      }
                    </div>
                    <div>
                      <div style="font-size: 14px; font-weight: 600; color: #ffffff;">${this.escapeHtml(req.fromName || 'User')}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">Incoming Friend Request</div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="form-btn-submit btn-accept-req" data-from-id="${this.escapeHtml(req.fromId)}" style="width: auto; padding: 6px 14px; margin: 0; font-size: 12px;">
                      Accept
                    </button>
                    <button type="button" class="form-btn-submit btn-decline-req" data-from-id="${this.escapeHtml(req.fromId)}" style="width: auto; padding: 6px 12px; margin: 0; font-size: 12px; background: transparent; border: 1px solid var(--border-medium); color: var(--text-muted);">
                      Decline
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    } else if (this.activeFriendsTab === 'add') {
      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 14px; max-width: 480px;">
          <div class="form-group">
            <label class="form-label" for="hub-add-friend-input">Friend Username</label>
            <input type="text" id="hub-add-friend-input" class="form-input" placeholder="Enter username" value="${this.escapeHtml(this.addFriendInput)}" maxlength="100" />
          </div>
          <button type="button" class="form-btn-submit" id="hub-add-friend-btn">
            Send Friend Request
          </button>
        </div>
      `;
    } else if (this.activeFriendsTab === 'group') {
      const selectedCount = this.selectedGroupFriends.size;
      tabContentHtml = `
        <div style="display: flex; flex-direction: column; gap: 14px; max-width: 480px;">
          <div class="form-group">
            <label class="form-label" for="hub-group-name-input">Group Name</label>
            <input type="text" id="hub-group-name-input" class="form-input" placeholder="Group Chat" value="${this.escapeHtml(this.groupNameInput)}" maxlength="40" />
          </div>

          <div>
            <span class="form-label">Select Friends (${selectedCount}/9)</span>
            ${friends.length === 0 ? `
              <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px;">
                No friends available to add
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 6px; max-height: 220px; overflow-y: auto; padding: 4px 0;">
                ${friends.map(f => {
                  const fId = f.playFabId || f.FriendPlayFabId;
                  const profile = this.resolvedProfiles.get(fId) || { displayName: f.displayName || "Friend" };
                  const isChecked = this.selectedGroupFriends.has(fId);

                  return `
                    <label style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer;">
                      <input type="checkbox" class="hub-group-friend-check" data-friend-id="${this.escapeHtml(fId)}" ${isChecked ? 'checked' : ''} />
                      <span style="font-size: 13px; color: #ffffff;">${this.escapeHtml(profile.displayName)}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <button type="button" class="form-btn-submit" id="hub-create-group-btn" ${selectedCount === 0 ? 'disabled' : ''}>
            Create Group DM
          </button>
        </div>
      `;
    }

    this.streamEl.innerHTML = `
      <div style="padding: 24px; max-width: 800px; width: 100%; box-sizing: border-box;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <button type="button" class="auth-tab ${this.activeFriendsTab === 'all' ? 'active' : ''}" id="hub-tab-all">
            All Friends (${friends.length})
          </button>
          <button type="button" class="auth-tab ${this.activeFriendsTab === 'pending' ? 'active' : ''}" id="hub-tab-pending">
            Pending ${this.pendingRequests.length > 0 ? `(${this.pendingRequests.length})` : ''}
          </button>
          <button type="button" class="auth-tab ${this.activeFriendsTab === 'add' ? 'active' : ''}" id="hub-tab-add">
            Add Friend
          </button>
          <button type="button" class="auth-tab ${this.activeFriendsTab === 'group' ? 'active' : ''}" id="hub-tab-group">
            New Group DM
          </button>
        </div>

        ${this.statusMessage ? `
          <div style="padding: 8px 12px; background: #181818; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: #ffffff; font-size: 12px; margin-bottom: 16px;">
            ${this.escapeHtml(this.statusMessage)}
          </div>
        ` : ''}

        ${tabContentHtml}
      </div>
    `;

    const tabAll = this.streamEl.querySelector('#hub-tab-all');
    tabAll?.addEventListener('click', () => {
      this.activeFriendsTab = 'all';
      this.statusMessage = null;
      this.renderFriendsHub(state);
    });

    const tabPending = this.streamEl.querySelector('#hub-tab-pending');
    tabPending?.addEventListener('click', () => {
      this.activeFriendsTab = 'pending';
      this.statusMessage = null;
      this.renderFriendsHub(state);
    });

    const tabAdd = this.streamEl.querySelector('#hub-tab-add');
    tabAdd?.addEventListener('click', () => {
      this.activeFriendsTab = 'add';
      this.statusMessage = null;
      this.renderFriendsHub(state);
    });

    const tabGroup = this.streamEl.querySelector('#hub-tab-group');
    tabGroup?.addEventListener('click', () => {
      this.activeFriendsTab = 'group';
      this.statusMessage = null;
      this.renderFriendsHub(state);
    });

    this.streamEl.querySelectorAll('.btn-friend-profile').forEach(btn => {
      btn.addEventListener('click', () => {
        const fId = btn.dataset.friendId;
        if (fId && this.callbacks.onOpenUserProfile) {
          this.callbacks.onOpenUserProfile(fId);
        }
      });
    });

    this.streamEl.querySelectorAll('.btn-msg-friend').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fId = btn.getAttribute('data-friend-id');
        if (fId) {
          if (this.callbacks.onOpenDM) {
            this.callbacks.onOpenDM(fId);
          } else {
            const res = await playFabService.createOrGetDM(fId);
            if (res && res.dmId) {
              appState.setActiveDM({ dmId: res.dmId, partnerId: fId });
              const dms = await playFabService.getUserDMs();
              appState.setDMs(dms);
              pollingEngine.pollNow();
            }
          }
        }
      });
    });

    this.streamEl.querySelectorAll('.btn-remove-friend').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fId = btn.getAttribute('data-friend-id');
        if (fId) {
          try {
            await playFabService.removeFriend(fId);
            const flist = await playFabService.getFriendsList();
            appState.setFriends(flist);
            this.renderFriendsHub(appState.getState());
          } catch {}
        }
      });
    });

    this.streamEl.querySelectorAll('.btn-accept-req').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fromId = btn.dataset.fromId;
        if (fromId) {
          try {
            await playFabService.respondFriendRequest(fromId, 'accept');
            const flist = await playFabService.getFriendsList();
            appState.setFriends(flist);
            this.pendingRequests = await playFabService.getFriendRequests();
            this.statusMessage = 'Friend request accepted';
            this.renderFriendsHub(appState.getState());
          } catch (e) {
            this.statusMessage = e.message;
            this.renderFriendsHub(appState.getState());
          }
        }
      });
    });

    this.streamEl.querySelectorAll('.btn-decline-req').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fromId = btn.dataset.fromId;
        if (fromId) {
          try {
            await playFabService.respondFriendRequest(fromId, 'decline');
            this.pendingRequests = await playFabService.getFriendRequests();
            this.statusMessage = 'Friend request declined';
            this.renderFriendsHub(appState.getState());
          } catch (e) {
            this.statusMessage = e.message;
            this.renderFriendsHub(appState.getState());
          }
        }
      });
    });

    const addInput = this.streamEl.querySelector('#hub-add-friend-input');
    addInput?.addEventListener('input', (e) => {
      this.addFriendInput = e.target.value;
    });

    const addBtn = this.streamEl.querySelector('#hub-add-friend-btn');
    addBtn?.addEventListener('click', async () => {
      const val = this.addFriendInput.trim();
      if (!val) return;
      try {
        await playFabService.sendFriendRequest(val);
        this.addFriendInput = '';
        this.statusMessage = 'Friend request sent';
        this.renderFriendsHub(appState.getState());
      } catch (err) {
        this.statusMessage = err.message || 'Failed to send request';
        this.renderFriendsHub(appState.getState());
      }
    });

    const gNameInput = this.streamEl.querySelector('#hub-group-name-input');
    gNameInput?.addEventListener('input', (e) => {
      this.groupNameInput = e.target.value;
    });

    const checkBoxes = this.streamEl.querySelectorAll('.hub-group-friend-check');
    checkBoxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-friend-id');
        if (cb.checked) {
          if (this.selectedGroupFriends.size < 9) {
            this.selectedGroupFriends.add(id);
          } else {
            cb.checked = false;
          }
        } else {
          this.selectedGroupFriends.delete(id);
        }
        this.renderFriendsHub(state);
      });
    });

    const createGrpBtn = this.streamEl.querySelector('#hub-create-group-btn');
    createGrpBtn?.addEventListener('click', async () => {
      const name = this.groupNameInput.trim() || 'Group Chat';
      const ids = Array.from(this.selectedGroupFriends);
      if (ids.length === 0) return;
      try {
        const res = await playFabService.createGroupDM(name, ids);
        if (res && res.group) {
          this.selectedGroupFriends.clear();
          this.groupNameInput = '';
          appState.setActiveDM({ dmId: res.group.id, isGroup: true, name: res.group.name });
          const dms = await playFabService.getUserDMs();
          appState.setDMs(dms);
          pollingEngine.pollNow();
        }
      } catch (err) {
        this.statusMessage = err.message || 'Failed to create group';
        this.renderFriendsHub(appState.getState());
      }
    });
  }
}
