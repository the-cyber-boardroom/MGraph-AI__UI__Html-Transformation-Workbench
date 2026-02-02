/**
 * Messages Service - v0.1.4
 *
 * Purpose: Global service for managing user-facing messages (errors, info, success)
 * Version: v0.1.4
 *
 * Task-13: Replaces alert() calls with a proper messages panel system
 *
 * Message Types:
 * - error: Red, auto-opens panel, persists
 * - warning: Yellow, auto-opens panel, auto-dismisses after 10s
 * - success: Green, doesn't auto-open, auto-dismisses after 5s
 * - info: Blue, doesn't auto-open, auto-dismisses after 5s
 *
 * Usage:
 * window.issuesApp.messages.add('error', 'Failed to save');
 * window.issuesApp.messages.add('success', 'Node created');
 * window.issuesApp.messages.clear();
 *
 * Namespace: window.issuesApp.messages
 */

(function() {
    'use strict';

    // Message type configurations
    const MESSAGE_TYPES = {
        error: {
            icon: '\u{1F534}',  // Red circle
            color: '#ef4444',
            autoOpen: true,
            autoDismiss: false,
            dismissDelay: 0
        },
        warning: {
            icon: '\u{1F7E1}',  // Yellow circle
            color: '#f59e0b',
            autoOpen: true,
            autoDismiss: true,
            dismissDelay: 10000
        },
        success: {
            icon: '\u{1F7E2}',  // Green circle
            color: '#22c55e',
            autoOpen: false,
            autoDismiss: true,
            dismissDelay: 5000
        },
        info: {
            icon: '\u{1F535}',  // Blue circle
            color: '#3b82f6',
            autoOpen: false,
            autoDismiss: true,
            dismissDelay: 5000
        }
    };

    // Maximum messages to keep
    const MAX_MESSAGES = 100;

    class MessagesService {
        constructor() {
            this._messages = [];
            this._listeners = new Set();
            this._messageIdCounter = 0;
        }

        /**
         * Add a new message
         * @param {string} type - 'error', 'warning', 'success', 'info'
         * @param {string} text - Message text
         * @param {Object} options - Optional overrides
         * @returns {Object} The created message
         */
        add(type, text, options = {}) {
            const config = MESSAGE_TYPES[type] || MESSAGE_TYPES.info;
            const id = ++this._messageIdCounter;

            const message = {
                id,
                type,
                text,
                icon: options.icon || config.icon,
                color: options.color || config.color,
                timestamp: Date.now(),
                autoDismiss: options.autoDismiss !== undefined ? options.autoDismiss : config.autoDismiss,
                dismissDelay: options.dismissDelay || config.dismissDelay,
                dismissed: false
            };

            this._messages.unshift(message);

            // Trim to max size
            if (this._messages.length > MAX_MESSAGES) {
                this._messages = this._messages.slice(0, MAX_MESSAGES);
            }

            // Notify listeners
            this._notifyListeners('message-added', message);

            // Emit event for panel to handle
            if (window.issuesApp.events) {
                window.issuesApp.events.emit('message-added', {
                    message,
                    autoOpen: config.autoOpen
                });
            }

            // Auto-dismiss if configured
            if (message.autoDismiss && message.dismissDelay > 0) {
                setTimeout(() => {
                    this.dismiss(id);
                }, message.dismissDelay);
            }

            console.log(`[Messages] ${type}: ${text}`);
            return message;
        }

        /**
         * Dismiss a specific message
         * @param {number} id - Message ID
         */
        dismiss(id) {
            const message = this._messages.find(m => m.id === id);
            if (message && !message.dismissed) {
                message.dismissed = true;
                this._notifyListeners('message-dismissed', message);

                if (window.issuesApp.events) {
                    window.issuesApp.events.emit('message-dismissed', { id });
                }
            }
        }

        /**
         * Clear all messages
         */
        clear() {
            this._messages = [];
            this._notifyListeners('messages-cleared', {});

            if (window.issuesApp.events) {
                window.issuesApp.events.emit('messages-cleared', {});
            }
        }

        /**
         * Get all messages (optionally filtered)
         * @param {Object} filter - Optional filter { type, dismissed }
         * @returns {Array}
         */
        getMessages(filter = {}) {
            let messages = [...this._messages];

            if (filter.type) {
                messages = messages.filter(m => m.type === filter.type);
            }

            if (filter.dismissed !== undefined) {
                messages = messages.filter(m => m.dismissed === filter.dismissed);
            }

            return messages;
        }

        /**
         * Get active (non-dismissed) messages
         * @returns {Array}
         */
        getActiveMessages() {
            return this.getMessages({ dismissed: false });
        }

        /**
         * Get count of active messages by type
         * @returns {Object} { error: n, warning: n, success: n, info: n }
         */
        getActiveCount() {
            const active = this.getActiveMessages();
            return {
                error: active.filter(m => m.type === 'error').length,
                warning: active.filter(m => m.type === 'warning').length,
                success: active.filter(m => m.type === 'success').length,
                info: active.filter(m => m.type === 'info').length,
                total: active.length
            };
        }

        /**
         * Subscribe to message changes
         * @param {Function} callback
         * @returns {Function} Unsubscribe function
         */
        subscribe(callback) {
            this._listeners.add(callback);
            return () => this._listeners.delete(callback);
        }

        /**
         * Notify all listeners
         * @private
         */
        _notifyListeners(event, data) {
            this._listeners.forEach(callback => {
                try {
                    callback(event, data);
                } catch (e) {
                    console.error('[Messages] Listener error:', e);
                }
            });
        }
    }

    // Initialize and expose
    window.issuesApp = window.issuesApp || {};
    window.issuesApp.messages = new MessagesService();

    // Listen for API errors and convert to messages
    if (window.issuesApp.events) {
        window.issuesApp.events.on('api-error', (data) => {
            const operation = data.operation || 'API call';
            const error = data.error || 'Unknown error';
            window.issuesApp.messages.add('error', `${operation} failed: ${error}`);
        });
    }

    console.log('[Issues UI v0.1.4] Messages service initialized');

})();
