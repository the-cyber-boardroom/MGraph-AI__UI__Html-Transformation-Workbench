/**
 * Graph Viewer - Cytoscape.js Renderer - v0.1.5
 *
 * Purpose: Render graph using Cytoscape.js library
 * Version: v0.1.5
 *
 * Task-21: Add Cytoscape.js graph visualization option
 *
 * Features:
 * - Industry standard for network analysis
 * - Powerful graph algorithms (shortest path, clustering, centrality)
 * - Multiple layout algorithms (dagre, breadthfirst, circle)
 * - Compound nodes support
 */

(function() {
    'use strict';

    // Make sure GraphViewer exists
    if (typeof GraphViewer === 'undefined') {
        console.error('[v0.1.5] GraphViewer class not found for Cytoscape renderer!');
        return;
    }

    // Check if cytoscape is available
    if (typeof cytoscape === 'undefined') {
        console.warn('[v0.1.5] Cytoscape.js library not loaded');
        return;
    }

    // Node shape mapping for Cytoscape
    const CYTOSCAPE_SHAPES = {
        feature: 'hexagon',
        task: 'round-rectangle',
        bug: 'diamond',
        version: 'ellipse',
        'user-story': 'barrel',
        person: 'ellipse'
    };

    // Layout options
    const LAYOUT_OPTIONS = {
        dagre: {
            name: 'dagre',
            rankDir: 'TB',
            animate: true,
            animationDuration: 500,
            nodeSep: 50,
            rankSep: 80
        },
        breadthfirst: {
            name: 'breadthfirst',
            directed: true,
            spacingFactor: 1.5,
            animate: true,
            animationDuration: 500
        },
        circle: {
            name: 'circle',
            animate: true,
            animationDuration: 500
        },
        cose: {
            name: 'cose',
            animate: true,
            animationDuration: 500,
            nodeRepulsion: 400000,
            idealEdgeLength: 100
        }
    };

    // Convert API response to Cytoscape format
    function toCytoscapeFormat(graphData, rootLabel) {
        const elements = [];

        // Add nodes
        graphData.nodes.forEach(node => {
            elements.push({
                data: {
                    id: node.label,
                    label: node.label,
                    type: node.node_type,
                    title: node.title || node.label,
                    status: node.status,
                    isRoot: node.label === rootLabel
                },
                classes: [node.node_type, node.label === rootLabel ? 'root' : ''].filter(Boolean).join(' ')
            });
        });

        // Add edges
        graphData.links.forEach((link, i) => {
            elements.push({
                data: {
                    id: `edge-${i}`,
                    source: link.source,
                    target: link.target,
                    label: link.link_type || ''
                }
            });
        });

        return elements;
    }

    // Cytoscape styles
    function getCytoscapeStyles() {
        const styles = [
            // Base node style
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'text-valign': 'bottom',
                    'text-margin-y': 8,
                    'font-size': 11,
                    'color': '#c9d1d9',
                    'text-outline-color': '#0d1117',
                    'text-outline-width': 2,
                    'border-width': 2,
                    'border-color': '#30363d',
                    'width': 40,
                    'height': 40
                }
            },
            // Root node
            {
                selector: 'node.root',
                style: {
                    'border-width': 4,
                    'border-color': '#a371f7',
                    'width': 50,
                    'height': 50
                }
            },
            // Selected node
            {
                selector: 'node:selected',
                style: {
                    'border-width': 4,
                    'border-color': '#58a6ff'
                }
            }
        ];

        // Add styles for each node type
        Object.entries(GraphViewer.NODE_COLORS).forEach(([type, color]) => {
            styles.push({
                selector: `node.${type}`,
                style: {
                    'background-color': color,
                    'shape': CYTOSCAPE_SHAPES[type] || 'ellipse'
                }
            });
        });

        // Edge styles
        styles.push({
            selector: 'edge',
            style: {
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#30363d',
                'line-color': '#30363d',
                'width': 2,
                'label': 'data(label)',
                'font-size': 9,
                'color': '#6e7681',
                'text-rotation': 'autorotate',
                'text-margin-y': -10
            }
        });

        styles.push({
            selector: 'edge:selected',
            style: {
                'line-color': '#58a6ff',
                'target-arrow-color': '#58a6ff'
            }
        });

        return styles;
    }

    // Cytoscape renderer
    GraphViewer.prototype.renderCytoscapeGraph = function() {
        const area = this.querySelector('#gv-graph-area');
        if (!area) return;

        // Create container with layout controls
        area.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div class="gv-cy-toolbar" style="padding: 8px 12px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; gap: 8px; align-items: center;">
                    <span style="font-size: 11px; color: #8b949e;">Layout:</span>
                    <button class="gv-cy-btn active" data-layout="dagre">Dagre</button>
                    <button class="gv-cy-btn" data-layout="breadthfirst">Breadth</button>
                    <button class="gv-cy-btn" data-layout="circle">Circle</button>
                    <button class="gv-cy-btn" data-layout="cose">Force</button>
                    <button class="gv-cy-btn" data-layout="fit" style="margin-left: auto;">Fit View</button>
                    <button class="gv-cy-btn" data-layout="center">Center Root</button>
                </div>
                <div id="gv-cy-container" style="flex: 1; background: #0d1117;"></div>
            </div>
            <style>
                .gv-cy-btn {
                    padding: 4px 10px;
                    border: 1px solid #30363d;
                    background: transparent;
                    color: #c9d1d9;
                    font-size: 11px;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .gv-cy-btn:hover {
                    background: #21262d;
                }
                .gv-cy-btn.active {
                    background: #238636;
                    border-color: #238636;
                }
            </style>
        `;

        const container = this.querySelector('#gv-cy-container');
        if (!container) return;

        // Convert data
        const elements = toCytoscapeFormat(this._graphData, this._rootLabel);

        // Create Cytoscape instance
        this._cytoscape = cytoscape({
            container: container,
            elements: elements,
            style: getCytoscapeStyles(),
            layout: LAYOUT_OPTIONS.dagre,
            wheelSensitivity: 0.3
        });

        // Handle node selection
        this._cytoscape.on('tap', 'node', (event) => {
            const node = event.target;
            const data = node.data();
            this.events.emit('graph-node-selected', { node: data });
        });

        // Handle double-click for navigation
        this._cytoscape.on('dbltap', 'node', (event) => {
            const node = event.target;
            const label = node.data('id');
            this.events.emit('navigate-to-node', { label });
            window.issuesApp.router?.navigate('node-detail');
        });

        // Attach layout button handlers
        this.querySelectorAll('.gv-cy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.dataset.layout;

                if (layout === 'fit') {
                    this._cytoscape.fit(null, 50);
                    return;
                }

                if (layout === 'center') {
                    const rootNode = this._cytoscape.getElementById(this._rootLabel);
                    if (rootNode.length > 0) {
                        this._cytoscape.center(rootNode);
                    }
                    return;
                }

                // Update active state
                this.querySelectorAll('.gv-cy-btn').forEach(b => {
                    if (!['fit', 'center'].includes(b.dataset.layout)) {
                        b.classList.toggle('active', b.dataset.layout === layout);
                    }
                });

                // Apply layout
                if (LAYOUT_OPTIONS[layout]) {
                    this._cytoscape.layout(LAYOUT_OPTIONS[layout]).run();
                }
            });
        });
    };

    console.log('[Issues UI v0.1.5] Cytoscape.js graph renderer loaded');

})();
