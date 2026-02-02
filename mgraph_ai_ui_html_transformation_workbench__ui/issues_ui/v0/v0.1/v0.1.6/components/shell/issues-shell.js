/**
 * Issues Shell Override - v0.1.6
 *
 * Purpose: Add root selector and context indicator for Phase 1
 * Version: v0.1.6
 *
 * Phase 1 UI Tasks:
 * - U1: Root selector in header (P1)
 * - U2: Current root context indicator (P1)
 *
 * Changes:
 * - Add root selector dropdown to header
 * - Add root context indicator showing current selection
 * - Initialize root service on shell connect
 * - Update v0.1.6 in version switcher
 */

(function() {
    'use strict';

    // Get the IssuesShell class
    const IssuesShellClass = customElements.get('issues-shell');
    if (!IssuesShellClass) {
        console.error('[v0.1.6] IssuesShell not found!');
        return;
    }

    // Store original render method
    const _originalRender = IssuesShellClass.prototype.render;

    // Override render to add root selector and context indicator
    IssuesShellClass.prototype.render = function() {
        // Call original render first
        _originalRender.call(this);

        // Add root selector to header
        this._addRootSelector();

        // Update version select if it exists
        this._updateVersionSwitcher();
    };

    /**
     * Add root selector dropdown and context indicator to header
     * U1: Root selector in header
     * U2: Current root context indicator
     */
    IssuesShellClass.prototype._addRootSelector = function() {
        const header = this.querySelector('.shell-header');
        if (!header) return;

        // Check if already added
        if (header.querySelector('.root-selector')) return;

        // Create root selector container
        const rootSelectorContainer = document.createElement('div');
        rootSelectorContainer.className = 'root-selector';
        rootSelectorContainer.innerHTML = `
            <div class="root-context-indicator" id="root-context">
                <span class="root-icon">📁</span>
                <span class="root-label" id="root-label">Loading...</span>
            </div>
            <select id="root-select" class="root-select" title="Select root issue folder">
                <option value="">Loading roots...</option>
            </select>
        `;

        // Insert after title, before version switcher
        const versionSwitcher = header.querySelector('.version-switcher');
        if (versionSwitcher) {
            header.insertBefore(rootSelectorContainer, versionSwitcher);
        } else {
            header.appendChild(rootSelectorContainer);
        }

        // Add styles for root selector
        this._addRootSelectorStyles();

        // Cache DOM references
        this.$rootSelect = this.querySelector('#root-select');
        this.$rootLabel = this.querySelector('#root-label');
        this.$rootContext = this.querySelector('#root-context');

        // Attach event listeners
        this._attachRootSelectorEvents();

        // Initialize root service and populate dropdown
        this._initializeRootService();
    };

    /**
     * Add CSS styles for root selector
     */
    IssuesShellClass.prototype._addRootSelectorStyles = function() {
        const styleId = 'v016-root-selector-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Root Selector Container */
            .root-selector {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-left: auto;
                margin-right: 16px;
            }

            /* Root Context Indicator (U2) */
            .root-context-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                font-size: 13px;
                color: #e5e7eb;
            }

            .root-context-indicator .root-icon {
                font-size: 14px;
            }

            .root-context-indicator .root-label {
                max-width: 150px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .root-context-indicator.loading .root-label {
                opacity: 0.6;
            }

            .root-context-indicator.has-new-structure {
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid rgba(34, 197, 94, 0.4);
            }

            .root-context-indicator.has-new-structure .root-icon::after {
                content: ' \\2713';
                font-size: 10px;
                color: #22c55e;
            }

            /* Root Select Dropdown (U1) */
            .root-select {
                padding: 4px 8px;
                background: #374151;
                color: #e5e7eb;
                border: 1px solid #4b5563;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                min-width: 120px;
            }

            .root-select:hover {
                border-color: #6b7280;
            }

            .root-select:focus {
                outline: none;
                border-color: #3b82f6;
            }

            .root-select option {
                background: #1f2937;
                color: #e5e7eb;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .root-selector {
                    flex-direction: column;
                    gap: 4px;
                }

                .root-context-indicator {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    };

    /**
     * Attach event listeners for root selector
     */
    IssuesShellClass.prototype._attachRootSelectorEvents = function() {
        // Root select change handler
        this.$rootSelect?.addEventListener('change', async (e) => {
            const selectedPath = e.target.value;
            if (selectedPath) {
                await window.issuesApp.rootService.selectRoot(selectedPath);
            }
        });

        // Listen for root changes to update UI
        this.events.on('root-changed', (detail) => {
            this._updateRootDisplay(detail.root);
        });

        // Listen for roots loaded to populate dropdown
        this.events.on('roots-loaded', (detail) => {
            this._populateRootDropdown(detail.roots);
        });
    };

    /**
     * Initialize root service
     */
    IssuesShellClass.prototype._initializeRootService = async function() {
        try {
            // Show loading state
            if (this.$rootContext) {
                this.$rootContext.classList.add('loading');
            }

            // Initialize the root service
            await window.issuesApp.rootService.initialize();

            // Update display with current root
            const currentRoot = window.issuesApp.rootService.currentRoot;
            if (currentRoot) {
                this._updateRootDisplay(currentRoot);
            }

            // Populate dropdown with available roots
            const roots = window.issuesApp.rootService.availableRoots;
            this._populateRootDropdown(roots);

        } catch (error) {
            console.error('[v0.1.6] Failed to initialize root service:', error);
            if (this.$rootLabel) {
                this.$rootLabel.textContent = 'Error loading roots';
            }
        } finally {
            if (this.$rootContext) {
                this.$rootContext.classList.remove('loading');
            }
        }
    };

    /**
     * Populate root dropdown with available roots
     */
    IssuesShellClass.prototype._populateRootDropdown = function(roots) {
        if (!this.$rootSelect) return;

        const currentPath = window.issuesApp.rootService.currentRoot?.path;

        this.$rootSelect.innerHTML = roots.map(root => {
            const displayName = root.displayName || root.label || root.path;
            const countSuffix = root.issueCount != null ? ` (${root.issueCount})` : '';
            const isSelected = root.path === currentPath ? 'selected' : '';
            return `<option value="${root.path}" ${isSelected}>${displayName}${countSuffix}</option>`;
        }).join('');

        // If no roots available, show placeholder
        if (roots.length === 0) {
            this.$rootSelect.innerHTML = '<option value="">No roots available</option>';
        }
    };

    /**
     * Update root context display
     */
    IssuesShellClass.prototype._updateRootDisplay = function(root) {
        if (!root) return;

        // Update label
        if (this.$rootLabel) {
            this.$rootLabel.textContent = root.displayName || root.label || root.path;
        }

        // Update indicator style based on structure type
        if (this.$rootContext) {
            if (root.hasNewStructure) {
                this.$rootContext.classList.add('has-new-structure');
                this.$rootContext.title = 'Using new recursive issue structure';
            } else {
                this.$rootContext.classList.remove('has-new-structure');
                this.$rootContext.title = 'Using legacy node structure';
            }
        }

        // Update dropdown selection
        if (this.$rootSelect) {
            this.$rootSelect.value = root.path;
        }
    };

    /**
     * Update version switcher to include v0.1.6
     */
    IssuesShellClass.prototype._updateVersionSwitcher = function() {
        const versionSelect = this.querySelector('#version-select');
        if (!versionSelect) return;

        // Check if v0.1.6 option already exists
        const hasV016 = Array.from(versionSelect.options).some(opt => opt.value === 'v0.1.6');
        if (!hasV016) {
            const option = document.createElement('option');
            option.value = 'v0.1.6';
            option.textContent = 'v0.1.6 (Root Selector)';
            option.selected = true;
            versionSelect.appendChild(option);

            // Deselect previous versions
            Array.from(versionSelect.options).forEach(opt => {
                if (opt.value !== 'v0.1.6') opt.selected = false;
            });
        }
    };

    console.log('[Issues UI v0.1.6] Shell patched: U1 Root Selector, U2 Context Indicator');

})();
