/**
 * Graph Viewer Component - v0.1.4
 *
 * Purpose: D3.js force-directed graph visualization for node relationships
 * Version: v0.1.4
 *
 * Task-15: Build D3.js force-directed graph component
 * Feature-12: Graph Visualization
 *
 * Features:
 * - Force-directed layout using D3.js
 * - Pan and zoom with mouse/touch
 * - Node selection and navigation
 * - Color-coded by node type
 * - Depth control (1-3 levels)
 * - Responsive sizing
 * - Tooltips on hover
 *
 * Namespace: window.issuesApp
 */

class GraphViewer extends HTMLElement {
    static appId = 'graph-viewer';
    static navLabel = 'Graph';
    static navIcon = '\u{1F578}';  // Spider web (network icon)

    // Node colors by type
    static NODE_COLORS = {
        bug: '#ef4444',       // Red
        task: '#3b82f6',      // Blue
        feature: '#22c55e',   // Green
        version: '#f59e0b',   // Amber
        'user-story': '#06b6d4',  // Cyan
        person: '#8b5cf6'     // Purple
    };

    static get observedAttributes() {
        return ['root-label', 'root-type', 'depth'];
    }

    constructor() {
        super();
        this._rootLabel = null;
        this._rootType = null;
        this._depth = 1;
        this._graphData = null;
        this._simulation = null;
        this._svg = null;
        this._g = null;
        this._zoom = null;
        this._selectedNode = null;
        this._isActive = false;
        this._boundHandlers = {};
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    cleanup() {
        if (this._simulation) {
            this._simulation.stop();
            this._simulation = null;
        }
        if (this._boundHandlers.onShowGraphViewer) {
            this.events.off('show-graph-viewer', this._boundHandlers.onShowGraphViewer);
        }
        window.removeEventListener('resize', this._boundHandlers.onResize);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'root-label':
                this._rootLabel = newValue;
                break;
            case 'root-type':
                this._rootType = newValue;
                break;
            case 'depth':
                this._depth = parseInt(newValue, 10) || 1;
                break;
        }

        if (this._isActive && this._rootLabel && this._rootType) {
            this.loadGraph();
        }
    }

    setupEventListeners() {
        // Listen for show-graph-viewer events
        this._boundHandlers.onShowGraphViewer = (data) => {
            if (data.rootType && data.rootLabel) {
                this._rootType = data.rootType;
                this._rootLabel = data.rootLabel;
                this._depth = data.depth || 1;

                // Navigate to this app
                if (window.issuesApp.router) {
                    window.issuesApp.router.navigate('graph-viewer');
                }
            }
        };
        this.events.on('show-graph-viewer', this._boundHandlers.onShowGraphViewer);

        // Handle window resize
        this._boundHandlers.onResize = () => {
            if (this._isActive && this._graphData) {
                this.resizeGraph();
            }
        };
        window.addEventListener('resize', this._boundHandlers.onResize);
    }

    onActivate() {
        this._isActive = true;
        if (this._rootLabel && this._rootType) {
            this.loadGraph();
        } else {
            this.renderEmptyState();
        }
    }

    onDeactivate() {
        this._isActive = false;
        if (this._simulation) {
            this._simulation.stop();
        }
    }

    async loadGraph() {
        if (!this._rootType || !this._rootLabel) {
            this.renderEmptyState();
            return;
        }

        this.renderLoading();

        try {
            const response = await this.graphService.getNodeGraph(
                this._rootType,
                this._rootLabel,
                this._depth
            );

            if (response.success) {
                this._graphData = response;
                this.renderGraph();
            } else {
                this.renderError(response.message || 'Failed to load graph');
            }
        } catch (error) {
            console.error('[GraphViewer] Error loading graph:', error);
            this.renderError(error.message);
        }
    }

    setDepth(newDepth) {
        this._depth = Math.min(Math.max(1, newDepth), 3);
        if (this._rootLabel && this._rootType) {
            this.loadGraph();
        }
    }

    render() {
        this.innerHTML = `
            <style>
                .gv-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #0d1117;
                    color: #e0e0e0;
                }
                .gv-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: #161b22;
                    border-bottom: 1px solid #30363d;
                    flex-wrap: wrap;
                }
                .gv-toolbar-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .gv-toolbar-label {
                    font-size: 12px;
                    color: #8b949e;
                }
                .gv-depth-btn {
                    padding: 6px 12px;
                    border: 1px solid #30363d;
                    background: transparent;
                    color: #c9d1d9;
                    font-size: 12px;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.15s;
                }
                .gv-depth-btn:hover {
                    background: #21262d;
                    border-color: #8b949e;
                }
                .gv-depth-btn.active {
                    background: #238636;
                    border-color: #238636;
                    color: white;
                }
                .gv-action-btn {
                    padding: 6px 12px;
                    border: 1px solid #30363d;
                    background: transparent;
                    color: #c9d1d9;
                    font-size: 12px;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.15s;
                }
                .gv-action-btn:hover {
                    background: #21262d;
                    border-color: #8b949e;
                }
                .gv-back-btn {
                    background: #21262d;
                    border-color: #30363d;
                }
                .gv-root-info {
                    margin-left: auto;
                    font-size: 12px;
                    color: #8b949e;
                }
                .gv-root-label {
                    color: #58a6ff;
                    font-weight: 500;
                }
                .gv-graph-area {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                }
                .gv-svg {
                    width: 100%;
                    height: 100%;
                }
                .gv-node {
                    cursor: pointer;
                }
                .gv-node circle {
                    stroke: #30363d;
                    stroke-width: 2;
                    transition: stroke-width 0.15s;
                }
                .gv-node:hover circle {
                    stroke-width: 4;
                    stroke: #58a6ff;
                }
                .gv-node.selected circle {
                    stroke-width: 4;
                    stroke: #f0883e;
                }
                .gv-node.root circle {
                    stroke-width: 4;
                    stroke: #a371f7;
                }
                .gv-node text {
                    font-size: 11px;
                    fill: #c9d1d9;
                    text-anchor: middle;
                    pointer-events: none;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                }
                .gv-link {
                    stroke: #30363d;
                    stroke-width: 1.5;
                    fill: none;
                }
                .gv-link-label {
                    font-size: 9px;
                    fill: #6e7681;
                    text-anchor: middle;
                    pointer-events: none;
                }
                .gv-tooltip {
                    position: absolute;
                    padding: 8px 12px;
                    background: #1f2428;
                    border: 1px solid #30363d;
                    border-radius: 6px;
                    font-size: 12px;
                    pointer-events: none;
                    z-index: 100;
                    max-width: 250px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
                }
                .gv-tooltip-title {
                    font-weight: 600;
                    color: #f0f6fc;
                    margin-bottom: 4px;
                }
                .gv-tooltip-type {
                    font-size: 10px;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                .gv-tooltip-status {
                    font-size: 11px;
                    color: #8b949e;
                }
                .gv-empty, .gv-loading, .gv-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #8b949e;
                    text-align: center;
                    padding: 40px;
                }
                .gv-empty-icon, .gv-loading-icon, .gv-error-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                .gv-loading-icon {
                    animation: gv-spin 1s linear infinite;
                }
                @keyframes gv-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .gv-legend {
                    display: flex;
                    gap: 16px;
                    padding: 8px 16px;
                    background: #161b22;
                    border-top: 1px solid #30363d;
                    flex-wrap: wrap;
                }
                .gv-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: #8b949e;
                }
                .gv-legend-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
            </style>

            <div class="gv-container" id="gv-container">
                <div class="gv-toolbar" id="gv-toolbar">
                    <button class="gv-action-btn gv-back-btn" id="gv-back" title="Back to previous view">
                        \u{2190} Back
                    </button>
                    <div class="gv-toolbar-group">
                        <span class="gv-toolbar-label">Depth:</span>
                        <button class="gv-depth-btn ${this._depth === 1 ? 'active' : ''}" data-depth="1">1</button>
                        <button class="gv-depth-btn ${this._depth === 2 ? 'active' : ''}" data-depth="2">2</button>
                        <button class="gv-depth-btn ${this._depth === 3 ? 'active' : ''}" data-depth="3">3</button>
                    </div>
                    <div class="gv-toolbar-group">
                        <button class="gv-action-btn" id="gv-fit" title="Fit graph to view">\u{1F50D} Fit</button>
                        <button class="gv-action-btn" id="gv-center" title="Center on root node">\u{1F3AF} Center</button>
                        <button class="gv-action-btn" id="gv-refresh" title="Refresh graph">\u{1F504} Refresh</button>
                    </div>
                    <div class="gv-root-info" id="gv-root-info">
                        ${this._rootLabel ? `Root: <span class="gv-root-label">${this._rootLabel}</span>` : 'No root selected'}
                    </div>
                </div>
                <div class="gv-graph-area" id="gv-graph-area">
                    <div class="gv-empty" id="gv-empty">
                        <div class="gv-empty-icon">\u{1F578}</div>
                        <div>No graph loaded</div>
                        <div style="font-size: 11px; margin-top: 8px;">
                            Click "View Graph" on any issue to visualize its connections
                        </div>
                    </div>
                </div>
                <div class="gv-legend" id="gv-legend">
                    ${Object.entries(GraphViewer.NODE_COLORS).map(([type, color]) => `
                        <div class="gv-legend-item">
                            <span class="gv-legend-dot" style="background: ${color}"></span>
                            <span>${this.capitalize(type)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.attachEventHandlers();
    }

    attachEventHandlers() {
        // Back button
        this.querySelector('#gv-back')?.addEventListener('click', () => {
            // Navigate back to node detail if we came from there
            if (this._rootLabel) {
                this.events.emit('navigate-to-node', { label: this._rootLabel });
                window.issuesApp.router?.navigate('node-detail');
            } else {
                window.issuesApp.router?.navigate('node-list');
            }
        });

        // Depth buttons
        this.querySelectorAll('.gv-depth-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const depth = parseInt(btn.dataset.depth, 10);
                this.setDepth(depth);
                // Update active state
                this.querySelectorAll('.gv-depth-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.depth === String(depth));
                });
            });
        });

        // Fit button
        this.querySelector('#gv-fit')?.addEventListener('click', () => {
            this.fitToView();
        });

        // Center button
        this.querySelector('#gv-center')?.addEventListener('click', () => {
            this.centerOnRoot();
        });

        // Refresh button
        this.querySelector('#gv-refresh')?.addEventListener('click', () => {
            if (this._rootLabel && this._rootType) {
                // Clear cache and reload
                this.graphService.invalidateGraphCache(this._rootType, this._rootLabel);
                this.loadGraph();
            }
        });
    }

    renderLoading() {
        const area = this.querySelector('#gv-graph-area');
        if (area) {
            area.innerHTML = `
                <div class="gv-loading">
                    <div class="gv-loading-icon">\u{1F504}</div>
                    <div>Loading graph...</div>
                </div>
            `;
        }
    }

    renderError(message) {
        const area = this.querySelector('#gv-graph-area');
        if (area) {
            area.innerHTML = `
                <div class="gv-error">
                    <div class="gv-error-icon">\u{26A0}\u{FE0F}</div>
                    <div>Failed to load graph</div>
                    <div style="font-size: 11px; margin-top: 8px; color: #f85149;">${this.escapeHtml(message)}</div>
                </div>
            `;
        }
    }

    renderEmptyState() {
        const area = this.querySelector('#gv-graph-area');
        if (area) {
            area.innerHTML = `
                <div class="gv-empty">
                    <div class="gv-empty-icon">\u{1F578}</div>
                    <div>No graph loaded</div>
                    <div style="font-size: 11px; margin-top: 8px;">
                        Click "View Graph" on any issue to visualize its connections
                    </div>
                </div>
            `;
        }
    }

    renderGraph() {
        if (!this._graphData || !this._graphData.nodes || this._graphData.nodes.length === 0) {
            this.renderEmptyState();
            return;
        }

        const area = this.querySelector('#gv-graph-area');
        if (!area) return;

        // Update root info
        const rootInfo = this.querySelector('#gv-root-info');
        if (rootInfo) {
            rootInfo.innerHTML = `Root: <span class="gv-root-label">${this._rootLabel}</span> (${this._graphData.nodes.length} nodes)`;
        }

        // Clear area and create SVG
        area.innerHTML = '';

        const width = area.clientWidth;
        const height = area.clientHeight;

        // Create SVG with D3
        this._svg = d3.select(area)
            .append('svg')
            .attr('class', 'gv-svg')
            .attr('width', width)
            .attr('height', height);

        // Create zoom behavior
        this._zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this._g.attr('transform', event.transform);
            });

        this._svg.call(this._zoom);

        // Create container group for zoom/pan
        this._g = this._svg.append('g');

        // Add arrow marker for directed links
        this._svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', '#30363d');

        // Process nodes and links
        const nodes = this._graphData.nodes.map(n => ({
            ...n,
            id: n.label
        }));

        const links = this._graphData.links.map(l => ({
            ...l,
            source: l.source,
            target: l.target
        }));

        // Create force simulation
        this._simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id || d.label)
                .distance(120))
            .force('charge', d3.forceManyBody()
                .strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(50));

        // Create links
        const link = this._g.append('g')
            .attr('class', 'gv-links')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'gv-link')
            .attr('marker-end', 'url(#arrowhead)');

        // Create link labels (only for links with non-empty link_type)
        const linksWithLabels = links.filter(l => l.link_type && l.link_type.trim());
        const linkLabel = this._g.append('g')
            .attr('class', 'gv-link-labels')
            .selectAll('text')
            .data(linksWithLabels)
            .enter()
            .append('text')
            .attr('class', 'gv-link-label')
            .text(d => d.link_type);

        // Create nodes
        const node = this._g.append('g')
            .attr('class', 'gv-nodes')
            .selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', d => {
                let classes = 'gv-node';
                if (d.label === this._rootLabel) classes += ' root';
                return classes;
            })
            .call(d3.drag()
                .on('start', (event, d) => this.dragStarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragEnded(event, d)));

        // Add circles to nodes
        node.append('circle')
            .attr('r', d => d.label === this._rootLabel ? 24 : 18)
            .attr('fill', d => GraphViewer.NODE_COLORS[d.node_type] || '#6e7681');

        // Add labels to nodes
        node.append('text')
            .attr('dy', d => d.label === this._rootLabel ? 40 : 34)
            .text(d => d.label);

        // Add type icon inside node
        node.append('text')
            .attr('dy', 5)
            .attr('font-size', d => d.label === this._rootLabel ? '16px' : '12px')
            .style('text-anchor', 'middle')
            .text(d => this.getTypeIcon(d.node_type));

        // Node click handler
        node.on('click', (event, d) => {
            event.stopPropagation();
            this.selectNode(d);
        });

        // Node double-click handler - navigate to detail
        node.on('dblclick', (event, d) => {
            event.stopPropagation();
            this.events.emit('navigate-to-node', { label: d.label });
            window.issuesApp.router?.navigate('node-detail');
        });

        // Node hover handlers
        node.on('mouseenter', (event, d) => {
            this.showTooltip(event, d);
        });

        node.on('mouseleave', () => {
            this.hideTooltip();
        });

        // Update positions on simulation tick
        this._simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            linkLabel
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Fit to view after simulation stabilizes
        setTimeout(() => this.fitToView(), 500);
    }

    dragStarted(event, d) {
        if (!event.active) this._simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragEnded(event, d) {
        if (!event.active) this._simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    selectNode(d) {
        // Clear previous selection
        this._g.selectAll('.gv-node').classed('selected', false);

        // Select this node
        this._selectedNode = d;
        this._g.selectAll('.gv-node')
            .filter(n => n.label === d.label)
            .classed('selected', true);

        this.events.emit('graph-node-selected', { node: d });
    }

    showTooltip(event, d) {
        // Remove existing tooltip
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'gv-tooltip';
        tooltip.id = 'gv-tooltip';
        tooltip.innerHTML = `
            <div class="gv-tooltip-type" style="color: ${GraphViewer.NODE_COLORS[d.node_type] || '#6e7681'}">
                ${this.getTypeIcon(d.node_type)} ${d.node_type}
            </div>
            <div class="gv-tooltip-title">${this.escapeHtml(d.title || d.label)}</div>
            <div class="gv-tooltip-status">Status: ${d.status || 'unknown'}</div>
        `;

        const area = this.querySelector('#gv-graph-area');
        if (area) {
            area.appendChild(tooltip);

            // Position tooltip
            const rect = area.getBoundingClientRect();
            const x = event.clientX - rect.left + 15;
            const y = event.clientY - rect.top + 15;

            tooltip.style.left = `${Math.min(x, rect.width - tooltip.offsetWidth - 10)}px`;
            tooltip.style.top = `${Math.min(y, rect.height - tooltip.offsetHeight - 10)}px`;
        }
    }

    hideTooltip() {
        const tooltip = this.querySelector('#gv-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    fitToView() {
        if (!this._g || !this._svg || !this._zoom) return;

        const area = this.querySelector('#gv-graph-area');
        if (!area) return;

        const bounds = this._g.node().getBBox();
        const width = area.clientWidth;
        const height = area.clientHeight;

        const dx = bounds.width;
        const dy = bounds.height;
        const x = bounds.x + bounds.width / 2;
        const y = bounds.y + bounds.height / 2;

        const scale = Math.min(0.9 / Math.max(dx / width, dy / height), 1.5);
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        this._svg.transition()
            .duration(500)
            .call(
                this._zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
    }

    centerOnRoot() {
        if (!this._g || !this._svg || !this._zoom || !this._graphData) return;

        const area = this.querySelector('#gv-graph-area');
        if (!area) return;

        // Find root node
        const rootNode = this._graphData.nodes.find(n => n.label === this._rootLabel);
        if (!rootNode || rootNode.x === undefined) return;

        const width = area.clientWidth;
        const height = area.clientHeight;

        this._svg.transition()
            .duration(500)
            .call(
                this._zoom.transform,
                d3.zoomIdentity.translate(width / 2 - rootNode.x, height / 2 - rootNode.y)
            );
    }

    resizeGraph() {
        const area = this.querySelector('#gv-graph-area');
        if (!area || !this._svg) return;

        const width = area.clientWidth;
        const height = area.clientHeight;

        this._svg
            .attr('width', width)
            .attr('height', height);

        if (this._simulation) {
            this._simulation.force('center', d3.forceCenter(width / 2, height / 2));
            this._simulation.alpha(0.3).restart();
        }
    }

    getTypeIcon(nodeType) {
        const icons = {
            bug: '\u{1F41E}',        // Bug
            task: '\u{2705}',        // Check mark
            feature: '\u{2728}',     // Sparkles
            version: '\u{1F4E6}',    // Package
            'user-story': '\u{1F4D6}', // Book
            person: '\u{1F464}'      // Person silhouette
        };
        return icons[nodeType] || '\u{2B24}';  // Circle
    }

    capitalize(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ') : '';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    get events() {
        return window.issuesApp.events;
    }

    get graphService() {
        return window.issuesApp.graph;
    }
}

customElements.define('graph-viewer', GraphViewer);
