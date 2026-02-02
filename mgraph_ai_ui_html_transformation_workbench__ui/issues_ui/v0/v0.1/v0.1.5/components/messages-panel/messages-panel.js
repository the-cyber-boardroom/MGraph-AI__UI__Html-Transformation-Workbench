/**
 * Messages Panel Override - v0.1.5
 *
 * Purpose: Render confirmation dialogs with action buttons
 * Version: v0.1.5
 *
 * Task-23: Confirmation dialogs in messages panel
 * - Render confirmation messages with Confirm/Cancel buttons
 * - Auto-expand panel when confirmation is shown
 * - Handle button clicks to resolve the Promise
 */

(function() {
    'use strict';

    // Make sure MessagesPanel exists
    if (typeof MessagesPanel === 'undefined') {
        console.error('[v0.1.5] MessagesPanel class not found!');
        return;
    }

    console.log('[v0.1.5] Initializing MessagesPanel override (confirmation dialogs)...');

    // Store original render method
    const _originalRender = MessagesPanel.prototype.render;

    // Override render to handle confirmation messages
    MessagesPanel.prototype.render = function() {
        const messages = window.issuesApp.messages?.getMessages() || [];
        const activeCount = window.issuesApp.messages?.getActiveCount() || { error: 0, total: 0 };
        const pendingConfirmations = window.issuesApp.messages?.getPendingConfirmations() || [];

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

                /* Task-23: Confirmation dialog styles */
                .mp-message.mp-confirm {
                    background: #1e2746;
                    border-left-width: 4px;
                    border-color: var(--msg-color);
                }
                .mp-confirm-title {
                    font-weight: 600;
                    color: #f0f6fc;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .mp-confirm-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 10px;
                    justify-content: flex-end;
                }
                .mp-confirm-btn {
                    padding: 6px 14px;
                    border: none;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.15s;
                }
                .mp-confirm-btn-cancel {
                    background: #3a4f6f;
                    color: #c9d1d9;
                }
                .mp-confirm-btn-cancel:hover {
                    background: #4a5f7f;
                }
                .mp-confirm-btn-confirm {
                    background: #238636;
                    color: white;
                }
                .mp-confirm-btn-confirm:hover {
                    background: #2ea043;
                }
                .mp-confirm-btn-confirm.danger {
                    background: #da3633;
                }
                .mp-confirm-btn-confirm.danger:hover {
                    background: #f85149;
                }
            </style>

            <div class="mp-container">
                <div class="mp-header">
                    <div class="mp-header-title">
                        Messages
                        <span class="mp-badge ${activeCount.error === 0 && pendingConfirmations.length === 0 ? 'zero' : ''}">${activeCount.error + pendingConfirmations.length}</span>
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
                    ` : messages.map(msg => this.renderMessage(msg)).join('')}
                </div>

                <div class="mp-footer">
                    <span>Total: ${messages.length}</span>
                    <span>Active: ${activeCount.total}</span>
                </div>
            </div>
        `;

        this.attachEventHandlers();
    };

    // Task-23: Render individual message (handles confirmations)
    MessagesPanel.prototype.renderMessage = function(msg) {
        // Task-23: Special rendering for confirmation messages
        if (msg.isConfirmation && !msg.dismissed) {
            return `
                <div class="mp-message mp-confirm" style="--msg-color: ${msg.color}" data-id="${msg.id}">
                    <span class="mp-message-icon">${msg.icon}</span>
                    <div class="mp-message-content">
                        <div class="mp-confirm-title">${this.escapeHtml(msg.title || 'Confirm')}</div>
                        <div class="mp-message-text">${this.escapeHtml(msg.text)}</div>
                        <div class="mp-confirm-actions">
                            <button class="mp-confirm-btn mp-confirm-btn-cancel" data-action="cancel" data-id="${msg.id}">
                                ${msg.cancelLabel || 'Cancel'}
                            </button>
                            <button class="mp-confirm-btn mp-confirm-btn-confirm ${msg.confirmStyle === 'danger' ? 'danger' : ''}" data-action="confirm" data-id="${msg.id}">
                                ${msg.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Regular message rendering
        return `
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
        `;
    };

    // Store original attachEventHandlers
    const _originalAttachEventHandlers = MessagesPanel.prototype.attachEventHandlers;

    // Override attachEventHandlers to handle confirmation buttons
    MessagesPanel.prototype.attachEventHandlers = function() {
        // Clear all button
        this.querySelector('#mp-clear')?.addEventListener('click', () => {
            this.clearAllMessages();
        });

        // Dismiss buttons (regular messages)
        this.querySelectorAll('.mp-dismiss-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.dismiss, 10);
                this.dismissMessage(id);
            });
        });

        // Task-23: Confirmation action buttons
        this.querySelectorAll('.mp-confirm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id, 10);
                const action = btn.dataset.action;

                // Find the message and call the appropriate callback
                const messages = window.issuesApp.messages?.getMessages() || [];
                const msg = messages.find(m => m.id === id);

                if (msg) {
                    if (action === 'confirm' && typeof msg.onConfirm === 'function') {
                        msg.onConfirm();
                    } else if (action === 'cancel' && typeof msg.onCancel === 'function') {
                        msg.onCancel();
                    }
                }
            });
        });
    };

    console.log('[Issues UI v0.1.5] MessagesPanel patched: Task-23 confirmation dialogs');

})();
