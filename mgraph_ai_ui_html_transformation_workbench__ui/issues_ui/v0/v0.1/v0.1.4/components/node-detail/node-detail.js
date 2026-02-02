/**
 * Node Detail Override - v0.1.4
 *
 * Purpose: Add "View Graph" button to node detail header
 * Version: v0.1.4 (Issues UI)
 *
 * Task-16: Add View Graph button to node detail header
 *
 * This override patches the v0.1.3 render to add a graph visualization button.
 * When clicked, it emits 'show-graph-viewer' event with the node's type and label.
 */

(function() {
    'use strict';

    // Make sure NodeDetail exists
    if (typeof NodeDetail === 'undefined') {
        console.error('[v0.1.4] NodeDetail class not found!');
        return;
    }

    console.log('[v0.1.4] Initializing NodeDetail override (View Graph button)...');

    // Store the v0.1.3 render method
    var _v013Render = NodeDetail.prototype.render;
    var _v013AttachEventHandlers = NodeDetail.prototype.attachEventHandlers;
    var _v013GetStyles = NodeDetail.prototype.getStyles;

    // Override render to add the View Graph button
    NodeDetail.prototype.render = function() {
        // Call v0.1.3 render first
        _v013Render.call(this);

        // If we have a valid node, inject the View Graph button
        if (this.state.node && !this.state.loading && !this.state.error) {
            var actionsDiv = this.querySelector('.nd-actions');
            if (actionsDiv) {
                // Check if button already exists (avoid duplicates)
                if (!actionsDiv.querySelector('#nd-view-graph')) {
                    var graphBtn = document.createElement('button');
                    graphBtn.id = 'nd-view-graph';
                    graphBtn.className = 'nd-btn nd-btn-graph';
                    graphBtn.innerHTML = '\u{1F578} Graph';
                    graphBtn.title = 'View relationship graph';

                    // Insert before the Delete button
                    var deleteBtn = actionsDiv.querySelector('#nd-delete');
                    if (deleteBtn) {
                        actionsDiv.insertBefore(graphBtn, deleteBtn);
                    } else {
                        actionsDiv.appendChild(graphBtn);
                    }
                }
            }
        }

        // Re-attach v0.1.4 specific event handlers
        this.attachV014EventHandlers();
    };

    // Add v0.1.4 specific event handlers
    NodeDetail.prototype.attachV014EventHandlers = function() {
        var self = this;

        var graphBtn = this.querySelector('#nd-view-graph');
        if (graphBtn && !graphBtn._v014Attached) {
            graphBtn._v014Attached = true;
            graphBtn.addEventListener('click', function() {
                self.openGraphView();
            });
        }
    };

    // Open graph view for current node
    NodeDetail.prototype.openGraphView = function() {
        if (!this.state.node) return;

        var nodeType = this.graphService.parseTypeFromLabel(this.state.node.label);

        // Emit event for graph viewer to handle
        this.events.emit('show-graph-viewer', {
            rootType: nodeType,
            rootLabel: this.state.node.label,
            depth: 1
        });

        // Show info message
        if (window.issuesApp.messages) {
            window.issuesApp.messages.add('info',
                'Opening graph view for ' + this.state.node.label
            );
        }
    };

    // Override getStyles to add graph button styles
    NodeDetail.prototype.getStyles = function() {
        var baseStyles = _v013GetStyles.call(this);

        var v014Styles = '\
            /* Task-16: View Graph button */ \
            .nd-btn-graph { \
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); \
                color: white; \
                border: none; \
                display: inline-flex; \
                align-items: center; \
                gap: 6px; \
            } \
            .nd-btn-graph:hover { \
                background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%); \
                transform: translateY(-1px); \
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); \
            } \
            .nd-actions { \
                display: flex; \
                gap: 8px; \
            } \
        ';

        return baseStyles + v014Styles;
    };

    console.log('[Issues UI v0.1.4] Node Detail with View Graph button enabled');

})();
