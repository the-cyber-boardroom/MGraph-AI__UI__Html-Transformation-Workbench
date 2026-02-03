/**
 * Kanban Board Override - v0.1.6
 *
 * Purpose: Support dynamic type loading from API
 * Version: v0.1.6
 *
 * Changes:
 * - Listen for 'types-loaded' event and re-render type filter buttons
 * - Ensure all dynamic types appear in the type filter
 */

(function() {
    'use strict';

    // Make sure KanbanBoard exists
    if (typeof KanbanBoard === 'undefined') {
        console.error('[v0.1.6] KanbanBoard class not found!');
        return;
    }

    console.log('[v0.1.6] Initializing KanbanBoard override (Dynamic Types)...');

    // Store original connectedCallback
    const _originalConnectedCallback = KanbanBoard.prototype.connectedCallback;

    // Override connectedCallback to add types-loaded listener
    KanbanBoard.prototype.connectedCallback = function() {
        // Call original
        if (_originalConnectedCallback) {
            _originalConnectedCallback.call(this);
        }

        // Listen for types-loaded event to re-render
        if (window.issuesApp.events && !this._v016TypesListener) {
            this._v016TypesListener = () => {
                console.log('[v0.1.6] Types loaded, re-rendering Kanban board');
                this.render();
            };
            window.issuesApp.events.on('types-loaded', this._v016TypesListener);
        }
    };

    // Store original disconnectedCallback
    const _originalDisconnectedCallback = KanbanBoard.prototype.disconnectedCallback;

    // Override disconnectedCallback to remove listener
    KanbanBoard.prototype.disconnectedCallback = function() {
        // Remove types-loaded listener
        if (window.issuesApp.events && this._v016TypesListener) {
            window.issuesApp.events.off('types-loaded', this._v016TypesListener);
            this._v016TypesListener = null;
        }

        // Call original
        if (_originalDisconnectedCallback) {
            _originalDisconnectedCallback.call(this);
        }
    };

    console.log('[Issues UI v0.1.6] Kanban Board patched: dynamic type loading support');

})();
