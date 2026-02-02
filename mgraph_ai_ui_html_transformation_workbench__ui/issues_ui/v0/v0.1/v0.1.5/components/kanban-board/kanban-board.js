/**
 * Kanban Board Override - v0.1.5
 *
 * Purpose: Add support for opening issues in new tab
 * Version: v0.1.5
 *
 * Task-25: Open issue in new tab from Kanban
 * - Wrap cards in <a> tags with proper href
 * - Handle Cmd/Ctrl+Click for new tab
 * - Support right-click "Open in New Tab"
 * - Preserve normal click for SPA navigation
 */

(function() {
    'use strict';

    // Make sure KanbanBoard exists
    if (typeof KanbanBoard === 'undefined') {
        console.error('[v0.1.5] KanbanBoard class not found!');
        return;
    }

    console.log('[v0.1.5] Initializing KanbanBoard override (open in new tab)...');

    // Store original renderCard method
    const _originalRenderCard = KanbanBoard.prototype.renderCard;

    // Override renderCard to wrap in <a> tag
    KanbanBoard.prototype.renderCard = function(node) {
        const nodeType = this.graphService.parseTypeFromLabel(node.label);
        const typeConfig = window.issuesApp.nodeTypes[nodeType] || {};

        // Task-25: Wrap card in <a> tag with href for new tab support
        // Bug-14 fix: Make <a> tag NOT draggable to prevent href being used as drag data
        // The inner .kb-card must have draggable="true" and data-status for drag-drop to work
        return `
            <a href="#/issue/${node.label}" class="kb-card-link" data-label="${node.label}" draggable="false">
                <div class="kb-card" data-label="${node.label}" data-status="${node.status}" draggable="true">
                    <div class="kb-card-header">
                        <span class="kb-card-type" style="background: ${typeConfig.color || '#6b7280'}">
                            ${typeConfig.icon || '\u{1F4C4}'}
                        </span>
                        <span class="kb-card-label">${node.label}</span>
                    </div>
                    <div class="kb-card-title">${this.escapeHtml(node.title || '')}</div>
                    ${node.tags && node.tags.length > 0 ? `
                        <div class="kb-card-tags">
                            ${node.tags.slice(0, 3).map(tag =>
                                `<span class="kb-card-tag">${this.escapeHtml(tag)}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            </a>
        `;
    };

    // Store original attachEventHandlers
    const _originalAttachEventHandlers = KanbanBoard.prototype.attachEventHandlers;

    // Override attachEventHandlers to handle card links properly
    KanbanBoard.prototype.attachEventHandlers = function() {
        // Call original first for type filter, search, refresh
        _originalAttachEventHandlers.call(this);

        // Task-25: Replace card click handlers with link handlers
        this.querySelectorAll('.kb-card-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Check for modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
                if (e.metaKey || e.ctrlKey) {
                    // Let the browser handle it (opens in new tab)
                    return;
                }

                // Middle-click also opens in new tab (let browser handle)
                if (e.button === 1) {
                    return;
                }

                // For regular left-click, prevent default and use SPA navigation
                e.preventDefault();
                const label = link.dataset.label;
                this.events.emit('navigate-to-node', { label });
                this.router.navigate('node-detail');
            });
        });
    };

    // Store original getStyles
    const _originalGetStyles = KanbanBoard.prototype.getStyles;

    // Override getStyles to add link styles
    KanbanBoard.prototype.getStyles = function() {
        const baseStyles = _originalGetStyles.call(this);

        const v015Styles = `
            /* Task-25: Card link wrapper */
            .kb-card-link {
                display: block;
                text-decoration: none;
                color: inherit;
                margin-bottom: 8px;
            }

            .kb-card-link .kb-card {
                margin-bottom: 0;
            }

            /* Ensure drag-and-drop still works */
            .kb-card-link[draggable="true"] {
                cursor: grab;
            }

            .kb-card-link[draggable="true"]:active {
                cursor: grabbing;
            }
        `;

        return baseStyles + v015Styles;
    };

    console.log('[Issues UI v0.1.5] KanbanBoard patched: Task-25 open in new tab');

})();
