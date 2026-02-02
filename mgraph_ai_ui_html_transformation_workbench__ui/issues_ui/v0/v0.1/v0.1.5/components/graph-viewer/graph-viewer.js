/**
 * Graph Viewer Override - v0.1.5
 *
 * Purpose: Add visualization mode toggle for multiple graph libraries
 * Version: v0.1.5
 *
 * Task-19, Task-20, Task-21: Multi-library visualization support
 * - D3.js (default, from v0.1.4)
 * - Mermaid.js (declarative, exportable)
 * - Vis.js (performance, hierarchical)
 * - Cytoscape.js (analysis, algorithms)
 */

(function() {
    'use strict';

    // Make sure GraphViewer exists
    if (typeof GraphViewer === 'undefined') {
        console.error('[v0.1.5] GraphViewer class not found!');
        return;
    }

    console.log('[v0.1.5] Initializing GraphViewer override (multi-library visualization)...');

    // Available visualization modes
    GraphViewer.VISUALIZATION_MODES = {
        d3: { label: 'D3.js', icon: '\u{1F310}' },       // Globe
        mermaid: { label: 'Mermaid', icon: '\u{1F9DC}' }, // Mermaid
        visjs: { label: 'Vis.js', icon: '\u{1F578}' },    // Spider web
        cytoscape: { label: 'Cytoscape', icon: '\u{1F52C}' } // Microscope
    };

    // Store original methods
    const _originalConstructor = GraphViewer.prototype.constructor;
    const _originalRender = GraphViewer.prototype.render;
    const _originalRenderGraph = GraphViewer.prototype.renderGraph;

    // Add visualization mode property
    const _originalConnectedCallback = GraphViewer.prototype.connectedCallback;
    GraphViewer.prototype.connectedCallback = function() {
        this._vizMode = 'd3'; // Default to D3.js
        _originalConnectedCallback.call(this);
    };

    // Override render to add mode toggle
    GraphViewer.prototype.render = function() {
        _originalRender.call(this);

        // Add mode toggle to toolbar
        const toolbar = this.querySelector('#gv-toolbar');
        if (toolbar && !toolbar.querySelector('.gv-mode-toggle')) {
            const modeGroup = document.createElement('div');
            modeGroup.className = 'gv-toolbar-group gv-mode-toggle';
            modeGroup.innerHTML = `
                <span class="gv-toolbar-label">Viz:</span>
                ${Object.entries(GraphViewer.VISUALIZATION_MODES).map(([mode, config]) => `
                    <button class="gv-mode-btn ${this._vizMode === mode ? 'active' : ''}"
                            data-mode="${mode}" title="${config.label}">
                        ${config.icon}
                    </button>
                `).join('')}
            `;

            // Insert after the back button
            const backBtn = toolbar.querySelector('#gv-back');
            if (backBtn && backBtn.nextSibling) {
                toolbar.insertBefore(modeGroup, backBtn.nextSibling);
            } else {
                toolbar.appendChild(modeGroup);
            }

            // Add mode button styles
            if (!document.getElementById('gv-v015-styles')) {
                const style = document.createElement('style');
                style.id = 'gv-v015-styles';
                style.textContent = `
                    .gv-mode-toggle {
                        margin-left: 8px;
                    }
                    .gv-mode-btn {
                        padding: 6px 10px;
                        border: 1px solid #30363d;
                        background: transparent;
                        color: #c9d1d9;
                        font-size: 14px;
                        cursor: pointer;
                        border-radius: 4px;
                        transition: all 0.15s;
                    }
                    .gv-mode-btn:hover {
                        background: #21262d;
                        border-color: #8b949e;
                    }
                    .gv-mode-btn.active {
                        background: #238636;
                        border-color: #238636;
                        color: white;
                    }
                    .gv-copy-btn {
                        margin-left: auto;
                        padding: 6px 12px;
                        border: 1px solid #30363d;
                        background: transparent;
                        color: #c9d1d9;
                        font-size: 12px;
                        cursor: pointer;
                        border-radius: 4px;
                    }
                    .gv-copy-btn:hover {
                        background: #21262d;
                        border-color: #8b949e;
                    }
                    .gv-copy-btn.copied {
                        background: #238636;
                        border-color: #238636;
                    }
                `;
                document.head.appendChild(style);
            }

            // Attach mode button handlers
            modeGroup.querySelectorAll('.gv-mode-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.setVisualizationMode(btn.dataset.mode);
                });
            });
        }
    };

    // Set visualization mode
    GraphViewer.prototype.setVisualizationMode = function(mode) {
        if (!GraphViewer.VISUALIZATION_MODES[mode]) return;

        this._vizMode = mode;

        // Update active button state
        this.querySelectorAll('.gv-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Re-render graph with new mode
        if (this._graphData) {
            this.renderGraphWithMode();
        }
    };

    // Get current visualization mode
    GraphViewer.prototype.getVisualizationMode = function() {
        return this._vizMode || 'd3';
    };

    // Override renderGraph to use mode-specific renderer
    GraphViewer.prototype.renderGraph = function() {
        this.renderGraphWithMode();
    };

    // Render graph with current visualization mode
    GraphViewer.prototype.renderGraphWithMode = function() {
        if (!this._graphData || !this._graphData.nodes || this._graphData.nodes.length === 0) {
            this.renderEmptyState();
            return;
        }

        const mode = this._vizMode || 'd3';

        // Update root info
        const rootInfo = this.querySelector('#gv-root-info');
        if (rootInfo) {
            const modeConfig = GraphViewer.VISUALIZATION_MODES[mode];
            rootInfo.innerHTML = `Root: <span class="gv-root-label">${this._rootLabel}</span> (${this._graphData.nodes.length} nodes) | ${modeConfig.icon} ${modeConfig.label}`;
        }

        // Use mode-specific renderer
        switch (mode) {
            case 'mermaid':
                this.renderMermaidGraph();
                break;
            case 'visjs':
                this.renderVisJsGraph();
                break;
            case 'cytoscape':
                this.renderCytoscapeGraph();
                break;
            case 'd3':
            default:
                this.renderD3Graph();
                break;
        }
    };

    // D3.js renderer (original from v0.1.4)
    GraphViewer.prototype.renderD3Graph = function() {
        // Use the original D3 rendering
        _originalRenderGraph.call(this);
    };

    // Placeholder methods for other renderers (defined in separate files)
    GraphViewer.prototype.renderMermaidGraph = GraphViewer.prototype.renderMermaidGraph || function() {
        const area = this.querySelector('#gv-graph-area');
        if (area) {
            area.innerHTML = `
                <div class="gv-error">
                    <div class="gv-error-icon">\u{1F9DC}</div>
                    <div>Mermaid.js renderer not loaded</div>
                </div>
            `;
        }
    };

    GraphViewer.prototype.renderVisJsGraph = GraphViewer.prototype.renderVisJsGraph || function() {
        const area = this.querySelector('#gv-graph-area');
        if (area) {
            area.innerHTML = `
                <div class="gv-error">
                    <div class="gv-error-icon">\u{1F578}</div>
                    <div>Vis.js renderer not loaded</div>
                </div>
            `;
        }
    };

    GraphViewer.prototype.renderCytoscapeGraph = GraphViewer.prototype.renderCytoscapeGraph || function() {
        const area = this.querySelector('#gv-graph-area');
        if (area) {
            area.innerHTML = `
                <div class="gv-error">
                    <div class="gv-error-icon">\u{1F52C}</div>
                    <div>Cytoscape.js renderer not loaded</div>
                </div>
            `;
        }
    };

    console.log('[Issues UI v0.1.5] GraphViewer patched: multi-library visualization support');

})();
