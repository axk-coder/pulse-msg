import { appState } from '../services/state.js';
import { playFabService } from '../services/playfab.js';
import { pollingEngine } from '../services/pollingEngine.js';
import { soundSynth } from '../services/soundEffects.js';

const EMOJI_CATEGORIES = [
  {
    icon: "😀",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "🤓", "😎", "🥳", "🤔", "🤫", "😴"]
  },
  {
    icon: "🎮",
    emojis: ["🎮", "🕹️", "👾", "🏆", "⚡", "🔥", "💥", "🎯", "🎲", "🎧", "🚀", "🛡️", "⚔️", "💎", "⭐"]
  },
  {
    icon: "👍",
    emojis: ["👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "🤟", "🤘", "🤙", "👋", "💪", "🙏", "✨", "💯", "❤️", "🔥", "🎉", "👀", "🫡"]
  }
];

export class MessageInput {
  constructor(container, { onRequireAuth }) {
    this.container = container;
    this.callbacks = { onRequireAuth };
    this.isSending = false;
    this.isEmojiOpen = false;
    this.activeEmojiCategory = 0;
    this.lastSentTime = 0;
    this.render();

    this.unsubscribe = appState.subscribe((state, key) => {
      if (key === 'navigation' || key === 'channel' || key === 'servers' || key === 'profile') {
        this.updatePlaceholder();
      }
      if (key === 'reply') {
        this.updateReplyBar();
      }
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="chat-input-wrapper">
        <div id="reply-preview-bar" style="display: none; align-items: center; justify-content: space-between; padding: 6px 14px; background: #1a1a1a; border: 1px solid #2e2e2e; border-bottom: none; border-radius: 6px 6px 0 0; font-size: 12px; color: #cccccc;">
          <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="flex-shrink: 0; color: #888888;">
              <polyline points="9 14 4 9 9 4"></polyline>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
            </svg>
            <span id="reply-preview-text" style="font-weight: 500;">Replying...</span>
          </div>
          <button type="button" id="cancel-reply-btn" style="background: none; border: none; color: #888888; cursor: pointer; padding: 2px 4px; display: flex; align-items: center; font-size: 14px;">
            ✕
          </button>
        </div>

        <div class="chat-input-box" id="chat-input-box">
          <textarea
            id="chat-input-textarea"
            class="chat-textarea"
            placeholder="Message... (Enter to send, Shift+Enter for newline)"
            rows="1"
            maxlength="2000"
          ></textarea>

          <div class="input-actions">
            <button class="icon-btn" id="emoji-toggle-btn" type="button" title="Emoji">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <circle cx="9" cy="9.5" r="1.2" fill="currentColor"></circle>
                <circle cx="15" cy="9.5" r="1.2" fill="currentColor"></circle>
              </svg>
            </button>

            <button class="send-btn" id="chat-send-btn" type="button" title="Send (Enter)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

        <div class="emoji-popover" id="emoji-popover" style="display: none;">
          <div class="emoji-categories">
            ${EMOJI_CATEGORIES.map((cat, idx) => `
              <button type="button" class="emoji-cat-btn ${idx === 0 ? 'active' : ''}" data-cat-index="${idx}">
                ${cat.icon}
              </button>
            `).join('')}
          </div>
          <div class="emoji-grid" id="emoji-grid"></div>
        </div>
      </div>
    `;

    this.textarea = this.container.querySelector('#chat-input-textarea');
    this.sendBtn = this.container.querySelector('#chat-send-btn');
    this.emojiBtn = this.container.querySelector('#emoji-toggle-btn');
    this.emojiPopover = this.container.querySelector('#emoji-popover');
    this.emojiGrid = this.container.querySelector('#emoji-grid');
    this.replyBar = this.container.querySelector('#reply-preview-bar');
    this.replyText = this.container.querySelector('#reply-preview-text');
    this.cancelReplyBtn = this.container.querySelector('#cancel-reply-btn');

    this.attachEvents();
    this.renderEmojiGrid();
    this.updatePlaceholder();
    this.updateReplyBar();
  }

  attachEvents() {
    this.textarea.addEventListener('input', () => {
      this.textarea.style.height = 'auto';
      this.textarea.style.height = `${Math.min(this.textarea.scrollHeight, 120)}px`;
    });

    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
      if (e.key === 'Escape') {
        if (appState.getState().replyingTo) {
          appState.clearReplyingTo();
        }
      }
    });

    this.sendBtn.addEventListener('click', () => {
      this.handleSend();
    });

    this.cancelReplyBtn?.addEventListener('click', () => {
      appState.clearReplyingTo();
    });

    this.emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isEmojiOpen = !this.isEmojiOpen;
      this.emojiPopover.style.display = this.isEmojiOpen ? 'flex' : 'none';
    });

    const catBtns = this.container.querySelectorAll('.emoji-cat-btn');
    catBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        catBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeEmojiCategory = parseInt(btn.getAttribute('data-cat-index'), 10);
        this.renderEmojiGrid();
      });
    });

    document.addEventListener('click', (e) => {
      if (this.isEmojiOpen && !this.emojiPopover.contains(e.target) && e.target !== this.emojiBtn) {
        this.isEmojiOpen = false;
        this.emojiPopover.style.display = 'none';
      }
    });
  }

  updateReplyBar() {
    const state = appState.getState();
    const replyingTo = state.replyingTo;
    const inputBox = this.container.querySelector('#chat-input-box');

    if (replyingTo && this.replyBar) {
      this.replyBar.style.display = 'flex';
      if (this.replyText) {
        this.replyText.textContent = `Replying to @${replyingTo.senderName || 'User'}`;
      }
      if (inputBox) {
        inputBox.style.borderRadius = '0 0 6px 6px';
      }
      this.textarea.focus();
    } else if (this.replyBar) {
      this.replyBar.style.display = 'none';
      if (inputBox) {
        inputBox.style.borderRadius = '6px';
      }
    }
  }

  renderEmojiGrid() {
    const cat = EMOJI_CATEGORIES[this.activeEmojiCategory];
    if (!cat) return;

    this.emojiGrid.innerHTML = cat.emojis
      .map((emoji) => `<button type="button" class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`)
      .join('');

    const btns = this.emojiGrid.querySelectorAll('.emoji-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const emoji = btn.getAttribute('data-emoji');
        this.insertText(emoji);
      });
    });
  }

  insertText(textToInsert) {
    const start = this.textarea.selectionStart || this.textarea.value.length;
    const end = this.textarea.selectionEnd || this.textarea.value.length;
    const val = this.textarea.value;
    this.textarea.value = val.substring(0, start) + textToInsert + val.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + textToInsert.length;
    this.textarea.focus();
  }

  canUserSend() {
    const state = appState.getState();
    if (state.activeContext !== 'server' || !state.activeServer) return true;

    const server = state.activeServer;
    const currentUserId = playFabService.getCurrentUser()?.playFabId;
    const isOwner = server.ownerId === currentUserId || (!server.ownerId && (server.id === currentUserId || server.serverId === currentUserId));
    if (isOwner) return true;

    const memberRecord = (server.members && server.members[currentUserId]) ? server.members[currentUserId] : null;
    const userRoles = (memberRecord && Array.isArray(memberRecord.roles) && memberRecord.roles.length > 0) ? memberRecord.roles : ['role_member'];
    if (userRoles.includes('role_admin')) return true;

    const chId = state.activeChannelId || 'chat';
    const overrides = (server.channelOverrides && server.channelOverrides[chId]) || {};
    let explicitAllow = false;
    let explicitDeny = false;
    for (const rId of userRoles) {
      if (overrides[rId]) {
        if (overrides[rId].send_messages === true) explicitAllow = true;
        if (overrides[rId].send_messages === false) explicitDeny = true;
      }
    }

    if (explicitAllow) return true;
    if (explicitDeny) return false;

    const allRoles = Array.isArray(server.roles) ? server.roles : [
      { id: 'role_admin', name: 'Admin', permissions: ['manage_server', 'manage_channels', 'manage_roles', 'send_messages'] },
      { id: 'role_member', name: 'Member', permissions: ['send_messages'] }
    ];
    for (const r of allRoles) {
      if (userRoles.includes(r.id) && Array.isArray(r.permissions) && r.permissions.includes('send_messages')) {
        return true;
      }
    }
    return false;
  }

  updatePlaceholder() {
    const state = appState.getState();
    const isChatOpen = (state.activeContext === 'global') || (state.activeContext === 'server' && !!state.activeServerId && !!state.activeChannelId) || (state.activeContext === 'dm' && !!state.activeDM);
    this.container.style.display = isChatOpen ? 'block' : 'none';

    const canSend = this.canUserSend();

    this.textarea.disabled = !canSend;
    this.sendBtn.disabled = !canSend;
    this.textarea.style.opacity = canSend ? '1' : '0.5';
    this.textarea.style.cursor = canSend ? 'text' : 'not-allowed';

    if (!canSend) {
      this.textarea.placeholder = "You do not have permission to send messages in this channel";
    } else if (state.activeContext === 'global') {
      this.textarea.placeholder = `Message #global-chat... (Enter to send, Shift+Enter for newline)`;
    } else if (state.activeContext === 'server') {
      this.textarea.placeholder = `Message #${state.activeChannelId || 'chat'}... (Enter to send, Shift+Enter for newline)`;
    } else if (state.activeContext === 'dm' && state.activeDM) {
      if (state.activeDM.isGroup) {
        this.textarea.placeholder = `Message ${state.activeDM.name || 'Group'}... (Enter to send, Shift+Enter for newline)`;
      } else {
        this.textarea.placeholder = `Message direct conversation... (Enter to send, Shift+Enter for newline)`;
      }
    } else {
      this.textarea.placeholder = `Message... (Enter to send, Shift+Enter for newline)`;
    }
  }

  async handleSend() {
    if (!this.canUserSend()) return;
    const text = this.textarea.value.trim();
    if (!text || this.isSending) return;

    if (!playFabService.isAuthenticated()) {
      this.callbacks.onRequireAuth();
      return;
    }

    const now = Date.now();
    if (now - this.lastSentTime < 1000) {
      return;
    }

    const currentUser = playFabService.getCurrentUser() || { displayName: "User", playFabId: "" };
    const targetParam = appState.getTargetParam();
    const streamKey = appState.getStreamKey();
    const state = appState.getState();
    const replyingTo = state.replyingTo;

    this.textarea.value = '';
    this.textarea.style.height = 'auto';
    this.sendBtn.disabled = true;
    this.isSending = true;
    this.lastSentTime = now;

    soundSynth.playSent();

    const optimisticMsg = {
      id: "opt_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      senderId: currentUser.playFabId,
      text: text,
      timestamp: new Date().toISOString(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderId: replyingTo.senderId,
        text: replyingTo.text
      } : null
    };

    appState.addMessage(streamKey, optimisticMsg);

    const sendPayload = Object.assign({}, targetParam);
    if (replyingTo) {
      sendPayload.replyTo = {
        id: replyingTo.id,
        senderId: replyingTo.senderId,
        text: replyingTo.text
      };
      appState.clearReplyingTo();
    }

    try {
      await playFabService.sendMessage(sendPayload, text);
      pollingEngine.pollNow();
    } catch {} finally {
      this.isSending = false;
      this.sendBtn.disabled = false;
      this.textarea.focus();
    }
  }
}
