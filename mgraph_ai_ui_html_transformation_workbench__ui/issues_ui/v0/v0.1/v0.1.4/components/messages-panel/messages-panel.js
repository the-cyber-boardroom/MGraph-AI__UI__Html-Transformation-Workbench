/**
 * Messages Panel Component - v0.1.4
 *
 * Purpose: Sidebar panel for displaying user messages (errors, warnings, info, success)
 * Version: v0.1.4
 *
 * Task-13: Replaces alert() with a proper messages panel
 *
 * Features:
 * - Shows all messages with timestamps
 * - Color-coded by type
 * - Auto-expands on errors
 * - Dismiss individual messages
 * - Clear all messages
 * - Badge shows error count
 *
 * Namespace: window.issuesApp
 */

class MessagesPanel extends HTMLElement {
    static appId = 'messages-panel';
    static navLabel = 'Messages';
    static navIcon = '\u{1F4AC}';  // Speech bubble

    constructor() {
        super();
        this._isActive = false;
        this._unsubscribe = null;
        this._boundHandlers = {};
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    cleanup() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
        if (this._boundHandlers.onMessageAdded) {
            this.events.off('message-added', this._boundHandlers.onMessageAdded);
        }
    }

    setupEventListeners() {
        // Subscribe to messages service
        if (window.issuesApp.messages) {
            this._unsubscribe = window.issuesApp.messages.subscribe((event, data) => {
                this.render();
            });
        }

        // Listen for message-added events to auto-open panel
        this._boundHandlers.onMessageAdded = (data) => {
            if (data.autoOpen && !this._isActive) {
                // Request to open the messages panel
                if (window.issuesApp.router) {
                    window.issuesApp.router.openSidebar('messages-panel');
                }
            }
            this.render();
        };
        this.events.on('message-added', this._boundHandlers.onMessageAdded);
    }

    onActivate() {
        this._isActive = true;
        this.render();
    }

    onDeactivate() {
        this._isActive = false;
    }

    dismissMessage(id) {
        if (window.issuesApp.messages) {
            window.issuesApp.messages.dismiss(id);
        }
    }

    clearAllMessages() {
        if (window.issuesApp.messages) {
            window.issuesApp.messages.clear();
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than a minute
        if (diff < 60000) {
            return 'just now';
        }
        // Less than an hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins}m ago`;
        }
        // Less than a day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        // Format as time
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    render() {
        const messages = window.issuesApp.messages?.getMessages() || [];
        const activeCount = window.issuesApp.messages?.getActiveCount() || { error: 0, total: 0 };

        this.innerHTML = `
            <style>
                .mp-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: var(--panel-bg, #1a1f2e);
                    color: var(--text-primary, #e0e0e0);
                    font-size: 13px;
                }
                .mp-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color, #2a3f5f);
                    background: var(--header-bg, #1e2746);
                }
                .mp-header-title {
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .mp-badge {
                    background: #ef4444;
                    color: white;
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    min-width: 18px;
                    text-align: center;
                }
                .mp-badge.zero {
                    background: #3a4f6f;
                }
                .mp-clear-btn {
                    background: transparent;
                    border: 1px solid #3a4f6f;
                    color: #8a9cc4;
                    padding: 4px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                }
                .mp-clear-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: #667eea;
                }
                .mp-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                }
                .mp-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #6b7280;
                    text-align: center;
                    padding: 20px;
                }
                .mp-empty-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                    opacity: 0.5;
                }
                .mp-message {
                    display: flex;
                    gap: 10px;
                    padding: 10px 12px;
                    background: var(--item-bg, #252836);
                    border-radius: 6px;
                    margin-bottom: 6px;
                    border-left: 3px solid var(--msg-color);
                    transition: opacity 0.3s;
                }
                .mp-message.dismissed {
                    opacity: 0.4;
                }
                .mp-message-icon {
                    font-size: 14px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .mp-message-content {
                    flex: 1;
                    min-width: 0;
                }
                .mp-message-text {
                    word-break: break-word;
                    line-height: 1.4;
                }
                .mp-message-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 4px;
                    font-size: 11px;
                    color: #6b7280;
                }
                .mp-message-type {
                    text-transform: uppercase;
                    font-weight: 500;
                    color: var(--msg-color);
                }
                .mp-dismiss-btn {
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 2px 6px;
                    font-size: 14px;
                    border-radius: 4px;
                    line-height: 1;
                }
                .mp-dismiss-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #e94560;
                }
                .mp-footer {
                    padding: 8px 16px;
                    border-top: 1px solid var(--border-color, #2a3f5f);
                    font-size: 11px;
                    color: #6b7280;
                    display: flex;
                    justify-content: space-between;
                }
            </style>

            <div class="mp-container">
                <div class="mp-header">
                    <div class="mp-header-title">
                        Messages
                        <span class="mp-badge ${activeCount.error === 0 ? 'zero' : ''}">${activeCount.error}</span>
                    </div>
                    ${messages.length > 0 ? `
                        <button class="mp-clear-btn" id="mp-clear">Clear All</button>
                    ` : ''}
                </div>

                <div class="mp-messages" id="mp-messages">
                    ${messages.length === 0 ? `
                        <div class="mp-empty">
                            <div class="mp-empty-icon">\u{2705}</div>
                            <div>No messages</div>
                            <div style="font-size: 11px; margin-top: 4px;">Errors and notifications will appear here</div>
                        </div>
                    ` : messages.map(msg => `
                        <div class="mp-message ${msg.dismissed ? 'dismissed' : ''}"
                             style="--msg-color: ${msg.color}"
                             data-id="${msg.id}">
                            <span class="mp-message-icon">${msg.icon}</span>
                            <div class="mp-message-content">
                                <div class="mp-message-text">${this.escapeHtml(msg.text)}</div>
                                <div class="mp-message-meta">
                                    <span>
                                        <span class="mp-message-type">${msg.type}</span>
                                        &middot; ${this.formatTimestamp(msg.timestamp)}
                                    </span>
                                </div>
                            </div>
                            ${!msg.dismissed ? `
                                <button class="mp-dismiss-btn" data-dismiss="${msg.id}" title="Dismiss">&times;</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="mp-footer">
                    <span>Total: ${messages.length}</span>
                    <span>Active: ${activeCount.total}</span>
                </div>
            </div>
        `;

        this.attachEventHandlers();
    }

    attachEventHandlers() {
        // Clear all button
        this.querySelector('#mp-clear')?.addEventListener('click', () => {
            this.clearAllMessages();
        });

        // Dismiss buttons
        this.querySelectorAll('.mp-dismiss-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.dismiss, 10);
                this.dismissMessage(id);
            });
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    get events() {
        return window.issuesApp.events;
    }
}

customElements.define('messages-panel', MessagesPanel);
