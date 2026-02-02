/**
 * Graph Viewer - Vis.js Renderer - v0.1.5
 *
 * Purpose: Render graph using Vis.js Network library
 * Version: v0.1.5
 *
 * Task-20: Add Vis.js graph visualization option
 *
 * Features:
 * - Excellent performance with large graphs
 * - Multiple layout options (physics, hierarchical, circular)
 * - Built-in clustering support
 * - Rich interaction model
 */

(function() {
    'use strict';

    // Make sure GraphViewer exists
    if (typeof GraphViewer === 'undefined') {
        console.error('[v0.1.5] GraphViewer class not found for Vis.js renderer!');
        return;
    }

    // Check if vis is available
    if (typeof vis === 'undefined') {
        console.warn('[v0.1.5] Vis.js library not loaded');
        return;
    }

    // Node shape mapping for Vis.js
    const VISJS_SHAPES = {
        feature: 'hexagon',
        task: 'box',
        bug: 'diamond',
        version: 'ellipse',
        'user-story': 'database',
        person: 'circle'
    };

    // Layout options
    const LAYOUT_OPTIONS = {
        physics: {
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -50,
                    centralGravity: 0.01,
                    springLength: 120,
                    springConstant: 0.08
                },
                stabilization: {
                    iterations: 100
                }
            }
        },
        hierarchical: {
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: 'UD',
                    sortMethod: 'directed',
                    nodeSpacing: 100,
                    levelSeparation: 100
                }
            },
            physics: false
        },
        circular: {
            physics: {
                enabled: true,
                solver: 'repulsion',
                repulsion: {
                    nodeDistance: 150
                },
                stabilization: {
                    iterations: 50
                }
            }
        }
    };

    // Convert API response to Vis.js format (using arrays, not DataSet)
    function toVisJsFormat(graphData, rootLabel) {
        const nodes = graphData.nodes.map(node => ({
            id: node.label,
            label: node.label,
            title: node.title || node.label,
            color: GraphViewer.NODE_COLORS[node.node_type] || '#6e7681',
            shape: 'dot',
            size: node.label === rootLabel ? 25 : 15,
            font: { color: '#ffffff' },
            _data: node
        }));

        const edges = graphData.links.map((link, i) => ({
            id: `edge-${i}`,
            from: link.source,
            to: link.target,
            label: link.link_type || '',
            arrows: 'to',
            color: '#888888',
            font: { color: '#aaaaaa', size: 10 }
        }));

        return { nodes, edges };
    }

    // Vis.js renderer
    GraphViewer.prototype.renderVisJsGraph = function() {
        const area = this.querySelector('#gv-graph-area');
        if (!area) return;

        // Get the area height for explicit sizing
        const areaRect = area.getBoundingClientRect();
        const containerHeight = Math.max(areaRect.height - 50, 400); // Subtract toolbar, min 400px

        // Create container with layout controls
        area.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div class="gv-visjs-toolbar" style="padding: 8px 12px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; gap: 8px; align-items: center;">
                    <span style="font-size: 11px; color: #8b949e;">Layout:</span>
                    <button class="gv-layout-btn active" data-layout="physics">Physics</button>
                    <button class="gv-layout-btn" data-layout="hierarchical">Hierarchy</button>
                    <button class="gv-layout-btn" data-layout="circular">Circular</button>
                    <button class="gv-layout-btn" data-layout="fit" style="margin-left: auto;">Fit View</button>
                </div>
                <div id="gv-visjs-container" style="flex: 1; min-height: ${containerHeight}px; background: #0d1117; position: relative;"></div>
            </div>
            <style>
                .gv-layout-btn {
                    padding: 4px 10px;
                    border: 1px solid #30363d;
                    background: transparent;
                    color: #c9d1d9;
                    font-size: 11px;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .gv-layout-btn:hover {
                    background: #21262d;
                }
                .gv-layout-btn.active {
                    background: #238636;
                    border-color: #238636;
                }
            </style>
        `;

        const container = this.querySelector('#gv-visjs-container');
        if (!container) {
            console.error('[Vis.js] Container not found');
            return;
        }

        // Debug: log container dimensions
        console.log('[Vis.js] Container:', container.offsetWidth, 'x', container.offsetHeight);

        // Convert data
        const data = toVisJsFormat(this._graphData, this._rootLabel);
        console.log('[Vis.js] Data:', data.nodes.length, 'nodes,', data.edges.length, 'edges');

        // Simple default options - minimal configuration
        const options = {
            autoResize: true,
            physics: {
                enabled: true,
                stabilization: {
                    enabled: true,
                    iterations: 100,
                    fit: true
                }
            },
            nodes: {
                borderWidth: 2
            },
            edges: {
                arrows: 'to'
            }
        };

        // Create network - vis-network standalone exposes vis.Network
        console.log('[Vis.js] Creating network, vis object:', typeof vis, vis ? Object.keys(vis) : 'undefined');
        try {
            this._visNetwork = new vis.Network(container, data, options);
            console.log('[Vis.js] Network created successfully');
        } catch (err) {
            console.error('[Vis.js] Failed to create network:', err);
            return;
        }
        this._visData = data;

        // Handle node selection
        this._visNetwork.on('selectNode', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = data.nodes.find(n => n.id === nodeId);
                if (node && node._data) {
                    this.events.emit('graph-node-selected', { node: node._data });
                }
            }
        });

        // Handle double-click for navigation
        this._visNetwork.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                this.events.emit('navigate-to-node', { label: nodeId });
                window.issuesApp.router?.navigate('node-detail');
            }
        });

        // Attach layout button handlers
        this.querySelectorAll('.gv-layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.dataset.layout;

                if (layout === 'fit') {
                    this._visNetwork.fit({ animation: true });
                    return;
                }

                // Update active state
                this.querySelectorAll('.gv-layout-btn').forEach(b => {
                    if (b.dataset.layout !== 'fit') {
                        b.classList.toggle('active', b.dataset.layout === layout);
                    }
                });

                // Apply layout
                if (LAYOUT_OPTIONS[layout]) {
                    this._visNetwork.setOptions(LAYOUT_OPTIONS[layout]);
                }
            });
        });

        // Fit view after stabilization
        this._visNetwork.once('stabilizationIterationsDone', () => {
            console.log('[Vis.js] Stabilization done, fitting view');
            this._visNetwork.fit({ animation: true });
        });

        // Force fit after a delay in case stabilization doesn't trigger
        const network = this._visNetwork;
        setTimeout(() => {
            console.log('[Vis.js] Forcing fit after timeout');
            // Check if canvas exists
            const canvas = container.querySelector('canvas');
            console.log('[Vis.js] Canvas element:', canvas ? `${canvas.width}x${canvas.height}` : 'NOT FOUND');
            network.redraw();
            network.fit();
        }, 500);
    };

    console.log('[Issues UI v0.1.5] Vis.js graph renderer loaded');

})();
