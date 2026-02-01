/**
 * Kanban Board Override - v0.1.3
 *
 * Purpose: Add create issue buttons to Kanban columns
 * Version: v0.1.3 (Issues UI)
 *
 * Changes from v0.1.2:
 * - Task-2: Added "+" button in each column header to create issues
 *
 * Note: This builds on top of v0.1.2 drag-and-drop functionality
 */

// Store the v0.1.2 renderColumn method
const _v012RenderColumn = KanbanBoard.prototype.renderColumn;
const _v012GetStyles = KanbanBoard.prototype.getStyles;
const _v012AttachEventHandlers = KanbanBoard.prototype.attachEventHandlers;

// Override renderColumn to add create button in header
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
                <button class="kb-add-btn" data-status="${status.id}" title="Create issue in ${status.label}">+</button>
            </div>
            <div class="kb-column-body kb-drop-target" data-status="${status.id}">
                ${filteredNodes.length === 0 ? `
                    <div class="kb-empty kb-drop-placeholder">Drop here</div>
                ` : filteredNodes.map(node => this.renderCard(node)).join('')}
            </div>
        </div>
    `;
};

// Override attachEventHandlers to add create button handlers
KanbanBoard.prototype.attachEventHandlers = function() {
    // Call v0.1.2 handlers (which includes drag-and-drop)
    _v012AttachEventHandlers.call(this);

    const self = this;

    // Task-2: Handle create button clicks
    this.querySelectorAll('.kb-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const status = btn.dataset.status;

            // Determine default type based on current filter
            let defaultType = 'task';
            if (self.state.typeFilter && self.state.typeFilter !== 'all') {
                defaultType = self.state.typeFilter;
            }

            // Emit event to show create modal with defaults
            self.events.emit('show-create-modal', {
                defaultType: defaultType,
                defaultStatus: status
            });

            console.log(`[v0.1.3] Create issue: type=${defaultType}, status=${status}`);
        });
    });
};

// Override getStyles to add create button styles
KanbanBoard.prototype.getStyles = function() {
    const baseStyles = _v012GetStyles.call(this);

    const createBtnStyles = `
        /* Task-2: Create button in column header - always visible, after count */
        .kb-column-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .kb-column-count {
            margin-left: auto;
        }

        .kb-add-btn {
            background: transparent;
            border: 1px solid #4a5f7f;
            color: #8a9cc4;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            flex-shrink: 0;
        }

        .kb-add-btn:hover {
            background: #667eea;
            border-color: #667eea;
            color: white;
        }

        .kb-add-btn:active {
            transform: scale(0.95);
        }
    `;

    return baseStyles + createBtnStyles;
};

console.log('[Issues UI v0.1.3] Kanban Board create button enabled');
