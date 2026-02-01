/**
 * Kanban Board Drag & Drop Override
 *
 * Purpose: Add drag-and-drop functionality to change issue status
 * Version: v0.1.2 (Issues UI)
 *
 * Features:
 * - Drag cards between columns to change status
 * - Visual feedback during drag
 * - Auto-save status changes
 * - Undo notification after status change
 */

// Store original methods
const _originalRenderCard = KanbanBoard.prototype.renderCard;
const _originalRenderColumn = KanbanBoard.prototype.renderColumn;
const _originalAttachEventHandlers = KanbanBoard.prototype.attachEventHandlers;
const _originalGetStyles = KanbanBoard.prototype.getStyles;

// Track drag state
let draggedCard = null;
let draggedNodeLabel = null;
let originalStatus = null;

// Override renderCard to add draggable attribute
KanbanBoard.prototype.renderCard = function(node) {
    const nodeType = this.graphService.parseTypeFromLabel(node.label);
    const typeConfig = window.issuesApp.nodeTypes[nodeType] || {};

    return `
        <div class="kb-card"
             data-label="${node.label}"
             data-status="${node.status}"
             draggable="true">
            <div class="kb-card-drag-handle">⋮⋮</div>
            <div class="kb-card-content">
                <div class="kb-card-header">
                    <span class="kb-card-type" style="background: ${typeConfig.color || '#6b7280'}">
                        ${typeConfig.icon || '📄'}
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
        </div>
    `;
};

// Override renderColumn to add drop zone classes
KanbanBoard.prototype.renderColumn = function(status) {
    const nodes = this.state.nodes[status.id] || [];
    const filteredNodes = this.state.filter
        ? nodes.filter(n =>
            n.title?.toLowerCase().includes(this.state.filter.toLowerCase()) ||
            n.label?.toLowerCase().includes(this.state.filter.toLowerCase()))
        : nodes;

    return `
        <div class="kb-column kb-drop-zone" data-status="${status.id}">
            <div class="kb-column-header">
                <span class="kb-column-icon">${status.icon}</span>
                <span class="kb-column-title">${status.label}</span>
                <span class="kb-column-count">${filteredNodes.length}</span>
            </div>
            <div class="kb-column-body kb-drop-target" data-status="${status.id}">
                ${filteredNodes.length === 0 ? `
                    <div class="kb-empty kb-drop-placeholder">Drop here</div>
                ` : filteredNodes.map(node => this.renderCard(node)).join('')}
            </div>
        </div>
    `;
};

// Override attachEventHandlers to add drag-and-drop handlers
KanbanBoard.prototype.attachEventHandlers = function() {
    // Call original handlers
    _originalAttachEventHandlers.call(this);

    const self = this;

    // Drag start
    this.querySelectorAll('.kb-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            draggedNodeLabel = card.dataset.label;
            originalStatus = card.dataset.status;

            // Add dragging class after a small delay for visual feedback
            setTimeout(() => {
                card.classList.add('kb-card-dragging');
            }, 0);

            // Set drag data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedNodeLabel);

            // Highlight all drop zones
            self.querySelectorAll('.kb-drop-target').forEach(zone => {
                zone.classList.add('kb-drop-active');
            });
        });

        card.addEventListener('dragend', (e) => {
            card.classList.remove('kb-card-dragging');

            // Remove all drop zone highlights
            self.querySelectorAll('.kb-drop-target').forEach(zone => {
                zone.classList.remove('kb-drop-active', 'kb-drop-hover');
            });

            draggedCard = null;
            draggedNodeLabel = null;
            originalStatus = null;
        });
    });

    // Drop zones
    this.querySelectorAll('.kb-drop-target').forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        zone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            zone.classList.add('kb-drop-hover');
        });

        zone.addEventListener('dragleave', (e) => {
            // Only remove hover if we're actually leaving the zone
            const rect = zone.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX >= rect.right ||
                e.clientY < rect.top || e.clientY >= rect.bottom) {
                zone.classList.remove('kb-drop-hover');
            }
        });

        zone.addEventListener('drop', async (e) => {
            e.preventDefault();
            zone.classList.remove('kb-drop-hover', 'kb-drop-active');

            const newStatus = zone.dataset.status;
            const nodeLabel = e.dataTransfer.getData('text/plain');

            if (nodeLabel && newStatus && newStatus !== originalStatus) {
                await self.changeNodeStatus(nodeLabel, newStatus, originalStatus);
            }
        });
    });
};

// New method to change node status - optimistic UI update
KanbanBoard.prototype.changeNodeStatus = async function(nodeLabel, newStatus, oldStatus) {
    // First, do an optimistic local update (no flicker!)
    this.moveNodeLocally(nodeLabel, oldStatus, newStatus);

    try {
        // Update via graph service (in background)
        await this.graphService.updateNodeStatus(nodeLabel, newStatus);

        // Emit event for other components
        this.events.emit('node-status-changed', {
            label: nodeLabel,
            oldStatus: oldStatus,
            newStatus: newStatus
        });

        // Show success with undo option
        this.showUndoToast(nodeLabel, oldStatus, newStatus);

    } catch (error) {
        console.error('Failed to update status:', error);
        this.showToast(`Failed to update: ${error.message}`, 'error');

        // Revert the local change on error
        this.moveNodeLocally(nodeLabel, newStatus, oldStatus);
    }
};

// Move a node between status columns locally (no API call)
KanbanBoard.prototype.moveNodeLocally = function(nodeLabel, fromStatus, toStatus) {
    // Find the node in the source column
    const sourceNodes = this.state.nodes[fromStatus] || [];
    const nodeIndex = sourceNodes.findIndex(n => n.label === nodeLabel);

    if (nodeIndex === -1) {
        console.warn(`Node ${nodeLabel} not found in ${fromStatus}`);
        return;
    }

    // Remove from source
    const [node] = sourceNodes.splice(nodeIndex, 1);

    // Update the node's status
    node.status = toStatus;

    // Add to destination
    if (!this.state.nodes[toStatus]) {
        this.state.nodes[toStatus] = [];
    }
    this.state.nodes[toStatus].push(node);

    // Re-render without API call
    this.render();
};

// Show toast with undo option
KanbanBoard.prototype.showUndoToast = function(nodeLabel, oldStatus, newStatus) {
    const existing = this.querySelector('.kb-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'kb-toast kb-toast-undo';
    toast.innerHTML = `
        <span class="kb-toast-message">
            Status changed to <strong>${this.formatStatus(newStatus)}</strong>
        </span>
        <button class="kb-toast-undo-btn" data-label="${nodeLabel}" data-status="${oldStatus}">
            Undo
        </button>
        <button class="kb-toast-close">×</button>
    `;

    this.appendChild(toast);

    // Handle undo click
    toast.querySelector('.kb-toast-undo-btn').addEventListener('click', async () => {
        await this.changeNodeStatus(nodeLabel, oldStatus, newStatus);
        toast.remove();
    });

    // Handle close click
    toast.querySelector('.kb-toast-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('kb-toast-fade');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
};

// Simple toast for info/error messages
KanbanBoard.prototype.showToast = function(message, type = 'info') {
    const existing = this.querySelector('.kb-toast:not(.kb-toast-undo)');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `kb-toast kb-toast-${type}`;
    toast.textContent = message;
    this.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('kb-toast-fade');
            setTimeout(() => toast.remove(), 300);
        }
    }, 2000);
};

// Override getStyles to add drag-and-drop styles
KanbanBoard.prototype.getStyles = function() {
    const baseStyles = _originalGetStyles.call(this);

    const dndStyles = `
        /* Drag handle */
        .kb-card {
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }

        .kb-card-drag-handle {
            color: #4a5f7f;
            font-size: 12px;
            cursor: grab;
            padding: 2px;
            opacity: 0.5;
            transition: opacity 0.15s;
            user-select: none;
        }

        .kb-card:hover .kb-card-drag-handle {
            opacity: 1;
        }

        .kb-card-drag-handle:active {
            cursor: grabbing;
        }

        .kb-card-content {
            flex: 1;
            min-width: 0;
        }

        /* Dragging state */
        .kb-card-dragging {
            opacity: 0.5;
            transform: rotate(2deg);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .kb-card[draggable="true"] {
            cursor: grab;
        }

        .kb-card[draggable="true"]:active {
            cursor: grabbing;
        }

        /* Drop zone states */
        .kb-drop-target {
            transition: all 0.2s ease;
            min-height: 100px;
        }

        .kb-drop-active {
            background: rgba(102, 126, 234, 0.05);
        }

        .kb-drop-hover {
            background: rgba(102, 126, 234, 0.15) !important;
            border: 2px dashed #667eea !important;
            border-radius: 6px;
        }

        .kb-drop-placeholder {
            border: 2px dashed #3a4f6f;
            border-radius: 6px;
            color: #6a7a8a;
            transition: all 0.2s;
        }

        .kb-drop-hover .kb-drop-placeholder {
            border-color: #667eea;
            color: #667eea;
            background: rgba(102, 126, 234, 0.1);
        }

        /* Toast notifications */
        .kb-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e2746;
            color: #e0e0e0;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 1px solid #3a4f6f;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: kb-toast-in 0.3s ease;
        }

        @keyframes kb-toast-in {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }

        .kb-toast-fade {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
            transition: all 0.3s ease;
        }

        .kb-toast-info {
            border-left: 3px solid #667eea;
        }

        .kb-toast-error {
            border-left: 3px solid #e94560;
            background: #2d1f2f;
        }

        .kb-toast-undo {
            border-left: 3px solid #22c55e;
        }

        .kb-toast-message {
            flex: 1;
        }

        .kb-toast-message strong {
            color: #fff;
        }

        .kb-toast-undo-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
        }

        .kb-toast-undo-btn:hover {
            background: #5a6fd6;
        }

        .kb-toast-close {
            background: none;
            border: none;
            color: #6a7a8a;
            font-size: 18px;
            cursor: pointer;
            padding: 0 4px;
            line-height: 1;
        }

        .kb-toast-close:hover {
            color: #e0e0e0;
        }

        /* Column highlight when dragging */
        .kb-column.kb-drag-over .kb-column-header {
            background: rgba(102, 126, 234, 0.2);
        }
    `;

    return baseStyles + dndStyles;
};

console.log('[Issues UI v0.1.2] Kanban Board drag-and-drop enabled');
