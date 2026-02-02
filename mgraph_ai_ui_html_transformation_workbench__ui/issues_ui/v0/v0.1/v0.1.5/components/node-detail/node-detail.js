/**
 * Node Detail Override - v0.1.5
 *
 * Purpose: Add "+ New" button, fix back navigation, use confirm dialog
 * Version: v0.1.5
 *
 * Task-18: Add "+ New" button to node-detail header
 * Bug-8: Fix back to Kanban navigation (use previousApp)
 * Task-23: Use messages panel confirm() instead of browser confirm()
 */

(function() {
    'use strict';

    // Make sure NodeDetail exists
    if (typeof NodeDetail === 'undefined') {
        console.error('[v0.1.5] NodeDetail class not found!');
        return;
    }

    console.log('[v0.1.5] Initializing NodeDetail override (+ New, Back fix, Confirm dialog)...');

    // Store the v0.1.4 methods
    const _v014Render = NodeDetail.prototype.render;
    const _v014GetStyles = NodeDetail.prototype.getStyles;

    // Override render to add "+ New" button and fix back navigation
    NodeDetail.prototype.render = function() {
        // Call v0.1.4 render first
        _v014Render.call(this);

        // If we have a valid node, inject the "+ New" button
        if (this.state.node && !this.state.loading && !this.state.error) {
            const actionsDiv = this.querySelector('.nd-actions');
            if (actionsDiv) {
                // Task-18: Add "+ New" button if not already present
                if (!actionsDiv.querySelector('#nd-new')) {
                    const newBtn = document.createElement('button');
                    newBtn.id = 'nd-new';
                    newBtn.className = 'nd-btn nd-btn-new';
                    newBtn.innerHTML = '+ New';
                    newBtn.title = 'Create new issue';

                    // Insert at the beginning of actions
                    actionsDiv.insertBefore(newBtn, actionsDiv.firstChild);
                }
            }

            // Bug-8: Fix the back button to use previousApp
            const backBtn = this.querySelector('#nd-back');
            if (backBtn && !backBtn._v015Patched) {
                backBtn._v015Patched = true;

                // Remove old click handlers by cloning
                const newBackBtn = backBtn.cloneNode(true);
                backBtn.parentNode.replaceChild(newBackBtn, backBtn);

                newBackBtn.addEventListener('click', () => {
                    // Bug-8 fix: Use router's previousApp instead of hardcoded 'node-list'
                    const previousApp = window.issuesApp.router?.previousApp || 'node-list';
                    window.issuesApp.router?.navigate(previousApp);
                });
            }
        }

        // Re-attach v0.1.5 specific event handlers
        this.attachV015EventHandlers();
    };

    // Add v0.1.5 specific event handlers
    NodeDetail.prototype.attachV015EventHandlers = function() {
        const self = this;

        // Task-18: "+ New" button handler
        const newBtn = this.querySelector('#nd-new');
        if (newBtn && !newBtn._v015Attached) {
            newBtn._v015Attached = true;
            newBtn.addEventListener('click', () => {
                // Emit event to show create modal
                self.events.emit('show-create-modal', {});
            });
        }

        // Task-23: Replace delete handler to use confirm dialog
        const deleteBtn = this.querySelector('#nd-delete');
        if (deleteBtn && !deleteBtn._v015Attached) {
            deleteBtn._v015Attached = true;

            // Remove old click handlers by cloning
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

            newDeleteBtn.addEventListener('click', async () => {
                if (!self.state.node) return;

                // Task-23: Use messages panel confirm instead of browser confirm
                const confirmed = await window.issuesApp.messages.confirm(
                    `Delete ${self.state.node.label}? This cannot be undone.`,
                    {
                        title: 'Confirm Delete',
                        confirmLabel: 'Delete',
                        cancelLabel: 'Cancel',
                        confirmStyle: 'danger'
                    }
                );

                if (confirmed) {
                    self.deleteNode();
                }
            });
        }
    };

    // Override getStyles to add "+ New" button styles
    NodeDetail.prototype.getStyles = function() {
        const baseStyles = _v014GetStyles.call(this);

        const v015Styles = `
            /* Task-18: + New button */
            .nd-btn-new {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white;
                border: none;
                font-weight: 600;
            }
            .nd-btn-new:hover {
                background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
            }
        `;

        return baseStyles + v015Styles;
    };

    console.log('[Issues UI v0.1.5] Node Detail patched: + New button, Back fix, Confirm dialog');

})();
