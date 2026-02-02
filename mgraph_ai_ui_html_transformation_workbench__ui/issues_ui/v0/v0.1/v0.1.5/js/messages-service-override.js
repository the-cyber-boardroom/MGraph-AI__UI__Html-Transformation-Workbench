/**
 * Messages Service Override - v0.1.5
 *
 * Purpose: Add confirm() method for inline confirmation dialogs
 * Version: v0.1.5
 *
 * Task-23: Replace browser confirm() with messages panel confirmations
 *
 * Usage:
 * const confirmed = await window.issuesApp.messages.confirm(
 *     'Delete Task-18? This cannot be undone.',
 *     { confirmLabel: 'Delete', confirmStyle: 'danger' }
 * );
 * if (confirmed) { ... }
 */

(function() {
    'use strict';

    const messagesService = window.issuesApp?.messages;
    if (!messagesService) {
        console.error('[v0.1.5] Messages service not found!');
        return;
    }

    /**
     * Show a confirmation dialog in the messages panel
     * @param {string} text - Confirmation message text
     * @param {Object} options - Configuration options
     * @param {string} options.confirmLabel - Label for confirm button (default: 'Confirm')
     * @param {string} options.cancelLabel - Label for cancel button (default: 'Cancel')
     * @param {string} options.confirmStyle - Style: 'primary', 'danger' (default: 'primary')
     * @param {string} options.title - Optional title for the confirmation
     * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
     */
    messagesService.confirm = function(text, options = {}) {
        return new Promise((resolve) => {
            const id = ++this._messageIdCounter;

            const message = {
                id,
                type: 'confirm',
                text,
                title: options.title || 'Confirm',
                icon: '\u{26A0}\u{FE0F}',  // Warning sign
                color: options.confirmStyle === 'danger' ? '#ef4444' : '#3b82f6',
                timestamp: Date.now(),
                autoDismiss: false,
                dismissed: false,
                isConfirmation: true,
                confirmLabel: options.confirmLabel || 'Confirm',
                cancelLabel: options.cancelLabel || 'Cancel',
                confirmStyle: options.confirmStyle || 'primary',
                onConfirm: () => {
                    this.dismiss(id);
                    resolve(true);
                },
                onCancel: () => {
                    this.dismiss(id);
                    resolve(false);
                }
            };

            this._messages.unshift(message);
            this._notifyListeners('message-added', message);

            // Emit event to auto-open panel
            if (window.issuesApp.events) {
                window.issuesApp.events.emit('message-added', {
                    message,
                    autoOpen: true  // Always auto-open for confirmations
                });
            }

            console.log(`[Messages] confirm: ${text}`);
        });
    };

    /**
     * Check if there are any pending confirmations
     * @returns {boolean}
     */
    messagesService.hasPendingConfirmations = function() {
        return this._messages.some(m => m.isConfirmation && !m.dismissed);
    };

    /**
     * Get all pending confirmations
     * @returns {Array}
     */
    messagesService.getPendingConfirmations = function() {
        return this._messages.filter(m => m.isConfirmation && !m.dismissed);
    };

    console.log('[Issues UI v0.1.5] Messages service patched: confirm() method added');

})();
