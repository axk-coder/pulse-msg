export class ShortcutsModal {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
  }

  open() {
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.container.innerHTML = '';
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-backdrop" id="shortcuts-backdrop" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
        <div class="modal-card" style="background: var(--bg-modal); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); width: 100%; max-width: 520px; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-card);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color: var(--text-primary);">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <line x1="6" y1="8" x2="6" y2="8"></line>
                <line x1="10" y1="8" x2="10" y2="8"></line>
                <line x1="14" y1="8" x2="14" y2="8"></line>
                <line x1="18" y1="8" x2="18" y2="8"></line>
                <line x1="6" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="16" x2="18" y2="16"></line>
              </svg>
              <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0;">Keyboard Shortcuts</h3>
              <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); background: var(--bg-card); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border-subtle);">5.9</span>
            </div>
            <button type="button" id="shortcuts-close-btn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; display: flex; align-items: center; font-size: 16px;">✕</button>
          </div>

          <div style="padding: 16px 20px; max-height: 70vh; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;">
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 8px;">Navigation & Actions</div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Send Message</span>
                  <kbd style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">Enter</kbd>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>New Line in Message</span>
                  <kbd style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">Shift + Enter</kbd>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Focus Search</span>
                  <kbd style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">Ctrl + K / ⌘ + K</kbd>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Close Modal / Cancel Reply</span>
                  <kbd style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">Esc</kbd>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Keyboard Shortcuts</span>
                  <kbd style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">Ctrl + /</kbd>
                </div>
              </div>
            </div>

            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 8px;">Markdown Syntax</div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Bold</span>
                  <code style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">**text**</code>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Italic</span>
                  <code style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">*text*</code>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Strikethrough</span>
                  <code style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">~~text~~</code>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Inline Code</span>
                  <code style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">\`code\`</code>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Code Block</span>
                  <code style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">\`\`\`lang\ncode\n\`\`\`</code>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Blockquote</span>
                  <code style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">&gt; quote</code>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);">
                  <span>Spoiler</span>
                  <code style="background: var(--bg-primary); border: 1px solid var(--border-medium); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 11px;">||spoiler||</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#shortcuts-close-btn');
    const backdrop = this.container.querySelector('#shortcuts-backdrop');

    closeBtn?.addEventListener('click', () => this.close());
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });
  }
}
