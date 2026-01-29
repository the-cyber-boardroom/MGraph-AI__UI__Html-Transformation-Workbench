/**
 * Graph Visualizer Component
 *
 * Purpose: D3-based interactive graph visualization
 * Story: S2
 * Version: v0.1.0
 *
 * Used by: Page Analysis (M6), Site Analysis (M7)
 */

const NODE_STYLES = {
    'page':      { color: '#4CAF50', size: 25 },
    'external':  { color: '#FF5722', size: 20 },
    'element':   { color: '#2196F3', size: 20 },
    'semantic':  { color: '#9C27B0', size: 22 },
    'collapsed': { color: '#FF9800', size: 18 },
    'orphan':    { color: '#E91E63', size: 20 },
    'default':   { color: '#607D8B', size: 20 }
};

const EDGE_STYLES = {
    'child':         { color: '#666', width: 1.5, dash: null },
    'internal':      { color: '#4CAF50', width: 2, dash: null },
    'external':      { color: '#FF5722', width: 1.5, dash: '5,5' },
    'bidirectional': { color: '#2196F3', width: 2.5, dash: null },
    'default':       { color: '#888', width: 1, dash: null }
};

class GraphVisualizer extends HTMLElement {

    static get observedAttributes() {
        return ['layout', 'show-legend', 'show-tooltips'];
    }

    constructor() {
        super();
        this._data = null;
        this._svg = null;
        this._simulation = null;
        this._zoom = null;
        this._width = 800;
        this._height = 600;
    }

    connectedCallback() {
        this.render();
        this.loadD3().then(() => {
            if (this._data) {
                this.renderGraph();
            }
        });
    }

    disconnectedCallback() {
        if (this._simulation) {
            this._simulation.stop();
        }
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal && this._data) {
            this.renderGraph();
        }
    }

    get data() { return this._data; }
    set data(graphData) {
        this._data = graphData;
        if (window.d3) {
            this.renderGraph();
        }
    }

    get layout() { return this.getAttribute('layout') || 'force'; }
    set layout(val) { this.setAttribute('layout', val); }

    setData(graphData) { this.data = graphData; }
    setLayout(layout) { this.layout = layout; this.renderGraph(); }

    async loadD3() {
        if (window.d3) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://d3js.org/d3.v7.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    render() {
        const showLegend = this.hasAttribute('show-legend');

        this.innerHTML = `
            <style>
                .graph-visualizer {
                    display: flex;
                    flex-direction: column;
                    background: #1e1e1e;
                    border: 1px solid #333;
                    border-radius: 6px;
                    overflow: hidden;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .gv-toolbar {
                    display: flex;
                    gap: 10px;
                    padding: 10px 12px;
                    background: #252526;
                    border-bottom: 1px solid #333;
                    align-items: center;
                }
                .gv-toolbar-left {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                .gv-toolbar-right {
                    margin-left: auto;
                    display: flex;
                    gap: 8px;
                }
                .gv-label {
                    color: #888;
                    font-size: 12px;
                }
                .gv-select {
                    padding: 5px 10px;
                    border: 1px solid #333;
                    background: #1e1e1e;
                    color: #ccc;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .gv-btn {
                    padding: 5px 10px;
                    border: 1px solid #333;
                    background: transparent;
                    color: #ccc;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .gv-btn:hover {
                    background: #333;
                }
                .gv-container {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    background: #1a1a1a;
                }
                .gv-container svg {
                    width: 100%;
                    height: 100%;
                }
                .gv-footer {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: #252526;
                    border-top: 1px solid #333;
                    font-size: 11px;
                    color: #888;
                }
                .gv-legend {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }
                .gv-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .gv-legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }
                .gv-legend-line {
                    width: 20px;
                    height: 2px;
                }
                .gv-stats {
                    color: #666;
                }
                /* SVG styles */
                .node circle {
                    stroke: #fff;
                    stroke-width: 2px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .node:hover circle {
                    stroke: #ffeb3b;
                    stroke-width: 3px;
                }
                .node.highlighted circle {
                    stroke: #ffeb3b;
                    stroke-width: 4px;
                }
                .node-label {
                    font-size: 10px;
                    fill: #fff;
                    pointer-events: none;
                    text-anchor: middle;
                    dominant-baseline: middle;
                }
                .edge {
                    fill: none;
                    stroke-opacity: 0.6;
                }
                .edge:hover {
                    stroke-opacity: 1;
                    stroke-width: 3px;
                }
                .edge-label {
                    font-size: 9px;
                    fill: #666;
                }
                /* Tooltip */
                .gv-tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.9);
                    color: #fff;
                    padding: 10px 14px;
                    border-radius: 6px;
                    font-size: 12px;
                    pointer-events: none;
                    z-index: 1000;
                    max-width: 280px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: none;
                }
                .gv-tooltip.visible {
                    display: block;
                }
                .gv-tooltip-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .gv-tooltip-type {
                    color: #888;
                    font-size: 11px;
                }
                .gv-tooltip-data {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #444;
                    font-size: 11px;
                }
                .gv-tooltip-data div {
                    margin: 2px 0;
                }
                .gv-empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #666;
                    font-size: 14px;
                }
            </style>
            <div class="graph-visualizer">
                <div class="gv-toolbar">
                    <div class="gv-toolbar-left">
                        <span class="gv-label">Layout:</span>
                        <select class="gv-select" id="gv-layout">
                            <option value="force" ${this.layout === 'force' ? 'selected' : ''}>Force</option>
                            <option value="hierarchy" ${this.layout === 'hierarchy' ? 'selected' : ''}>Hierarchy</option>
                            <option value="radial" ${this.layout === 'radial' ? 'selected' : ''}>Radial</option>
                        </select>
                    </div>
                    <div class="gv-toolbar-right">
                        <button class="gv-btn" id="gv-zoom-in">🔍+</button>
                        <button class="gv-btn" id="gv-zoom-out">🔍−</button>
                        <button class="gv-btn" id="gv-reset">⟲ Reset</button>
                        <button class="gv-btn" id="gv-export">📥 SVG</button>
                    </div>
                </div>
                <div class="gv-container" id="gv-container">
                    <div class="gv-empty">Load data to visualize the graph</div>
                </div>
                <div class="gv-tooltip" id="gv-tooltip"></div>
                <div class="gv-footer">
                    ${showLegend ? `
                        <div class="gv-legend">
                            <div class="gv-legend-item">
                                <span class="gv-legend-color" style="background: ${NODE_STYLES.page.color}"></span>
                                <span>Page</span>
                            </div>
                            <div class="gv-legend-item">
                                <span class="gv-legend-color" style="background: ${NODE_STYLES.external.color}"></span>
                                <span>External</span>
                            </div>
                            <div class="gv-legend-item">
                                <span class="gv-legend-color" style="background: ${NODE_STYLES.element.color}"></span>
                                <span>Element</span>
                            </div>
                            <div class="gv-legend-item">
                                <span class="gv-legend-line" style="background: ${EDGE_STYLES.internal.color}"></span>
                                <span>Internal</span>
                            </div>
                            <div class="gv-legend-item">
                                <span class="gv-legend-line" style="background: ${EDGE_STYLES.external.color}; border-style: dashed;"></span>
                                <span>External</span>
                            </div>
                        </div>
                    ` : '<div></div>'}
                    <div class="gv-stats" id="gv-stats">Nodes: 0 | Edges: 0</div>
                </div>
            </div>
        `;

        this.$container = this.querySelector('#gv-container');
        this.$tooltip = this.querySelector('#gv-tooltip');
        this.$stats = this.querySelector('#gv-stats');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.querySelector('#gv-layout').addEventListener('change', (e) => {
            this.layout = e.target.value;
            this.dispatchEvent(new CustomEvent('layout-changed', { detail: { layout: this.layout } }));
        });

        this.querySelector('#gv-zoom-in').addEventListener('click', () => this.zoomIn());
        this.querySelector('#gv-zoom-out').addEventListener('click', () => this.zoomOut());
        this.querySelector('#gv-reset').addEventListener('click', () => this.resetZoom());
        this.querySelector('#gv-export').addEventListener('click', () => this.exportSVG());
    }

    renderGraph() {
        if (!window.d3 || !this._data) return;

        // Clear previous
        this.$container.innerHTML = '';
        if (this._simulation) {
            this._simulation.stop();
        }

        const nodes = this._data.nodes || [];
        const edges = this._data.edges || [];

        if (nodes.length === 0) {
            this.$container.innerHTML = '<div class="gv-empty">No nodes to display</div>';
            return;
        }

        // Update stats
        this.$stats.textContent = `Nodes: ${nodes.length} | Edges: ${edges.length}`;

        // Get dimensions
        const rect = this.$container.getBoundingClientRect();
        this._width = rect.width || 800;
        this._height = rect.height || 600;

        // Create SVG
        this._svg = d3.select(this.$container)
            .append('svg')
            .attr('width', this._width)
            .attr('height', this._height);

        // Create container for zoom
        const g = this._svg.append('g');

        // Setup zoom
        this._zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        this._svg.call(this._zoom);

        // Render based on layout
        if (this.layout === 'hierarchy' && this.canUseHierarchy()) {
            this.renderHierarchy(g, nodes, edges);
        } else {
            this.renderForce(g, nodes, edges);
        }
    }

    canUseHierarchy() {
        // Check if data can be represented as a tree
        return this._data.layout_hint === 'hierarchy' ||
               this._data.layout_hint === 'tree';
    }

    renderForce(g, nodes, edges) {
        // Create a copy of nodes for simulation
        const nodesCopy = nodes.map(d => ({ ...d }));
        const edgesCopy = edges.map(d => ({ ...d }));

        // Create simulation
        this._simulation = d3.forceSimulation(nodesCopy)
            .force('link', d3.forceLink(edgesCopy).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this._width / 2, this._height / 2))
            .force('collision', d3.forceCollide().radius(40));

        // Draw edges
        const edge = g.append('g')
            .selectAll('line')
            .data(edgesCopy)
            .join('line')
            .attr('class', 'edge')
            .attr('stroke', d => this.getEdgeStyle(d.type).color)
            .attr('stroke-width', d => this.getEdgeStyle(d.type).width)
            .attr('stroke-dasharray', d => this.getEdgeStyle(d.type).dash);

        // Draw nodes
        const node = g.append('g')
            .selectAll('g')
            .data(nodesCopy)
            .join('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', (event, d) => this.dragStarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragEnded(event, d)));

        node.append('circle')
            .attr('r', d => this.getNodeStyle(d.type).size / 2)
            .attr('fill', d => this.getNodeStyle(d.type).color);

        node.append('text')
            .attr('class', 'node-label')
            .attr('dy', d => this.getNodeStyle(d.type).size / 2 + 12)
            .text(d => this.truncateLabel(d.label || d.id));

        // Events
        node.on('click', (event, d) => {
            this.dispatchEvent(new CustomEvent('node-click', { detail: { node: d } }));
        });

        node.on('mouseenter', (event, d) => this.showTooltip(event, d));
        node.on('mouseleave', () => this.hideTooltip());

        // Update positions on tick
        this._simulation.on('tick', () => {
            edge
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }

    renderHierarchy(g, nodes, edges) {
        // Build hierarchy from nodes and edges
        const root = this.buildHierarchy(nodes, edges);

        const treeLayout = d3.tree()
            .size([this._width - 100, this._height - 100]);

        const hierarchy = d3.hierarchy(root);
        treeLayout(hierarchy);

        // Draw edges
        g.append('g')
            .selectAll('path')
            .data(hierarchy.links())
            .join('path')
            .attr('class', 'edge')
            .attr('d', d3.linkVertical()
                .x(d => d.x + 50)
                .y(d => d.y + 50))
            .attr('stroke', '#666')
            .attr('stroke-width', 1.5);

        // Draw nodes
        const node = g.append('g')
            .selectAll('g')
            .data(hierarchy.descendants())
            .join('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x + 50},${d.y + 50})`);

        node.append('circle')
            .attr('r', d => this.getNodeStyle(d.data.type).size / 2)
            .attr('fill', d => this.getNodeStyle(d.data.type).color);

        node.append('text')
            .attr('class', 'node-label')
            .attr('dy', d => this.getNodeStyle(d.data.type).size / 2 + 12)
            .text(d => this.truncateLabel(d.data.label || d.data.id));

        // Events
        node.on('click', (event, d) => {
            this.dispatchEvent(new CustomEvent('node-click', { detail: { node: d.data } }));
        });

        node.on('mouseenter', (event, d) => this.showTooltip(event, d.data));
        node.on('mouseleave', () => this.hideTooltip());
    }

    buildHierarchy(nodes, edges) {
        // Find root (node with no incoming edges)
        const hasIncoming = new Set(edges.map(e => e.target));
        const root = nodes.find(n => !hasIncoming.has(n.id)) || nodes[0];

        // Build tree
        const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] }]));

        edges.forEach(e => {
            const source = nodeMap.get(e.source);
            const target = nodeMap.get(e.target);
            if (source && target) {
                source.children.push(target);
            }
        });

        return nodeMap.get(root.id);
    }

    getNodeStyle(type) {
        return NODE_STYLES[type] || NODE_STYLES.default;
    }

    getEdgeStyle(type) {
        return EDGE_STYLES[type] || EDGE_STYLES.default;
    }

    truncateLabel(label) {
        return label.length > 15 ? label.slice(0, 12) + '...' : label;
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

    showTooltip(event, d) {
        if (!this.hasAttribute('show-tooltips')) return;

        let html = `<div class="gv-tooltip-title">${this.escapeHtml(d.label || d.id)}</div>`;
        html += `<div class="gv-tooltip-type">Type: ${d.type || 'unknown'}</div>`;

        if (d.data) {
            html += '<div class="gv-tooltip-data">';
            if (d.data.path) html += `<div>Path: ${this.escapeHtml(d.data.path)}</div>`;
            if (d.data.depth !== undefined) html += `<div>Depth: ${d.data.depth}</div>`;
            if (d.data.child_count) html += `<div>Children: ${d.data.child_count}</div>`;
            if (d.data.link_count) html += `<div>Links: ${d.data.link_count}</div>`;
            html += '</div>';
        }

        this.$tooltip.innerHTML = html;
        this.$tooltip.classList.add('visible');

        const rect = this.$container.getBoundingClientRect();
        const x = event.clientX - rect.left + 15;
        const y = event.clientY - rect.top + 15;

        this.$tooltip.style.left = x + 'px';
        this.$tooltip.style.top = y + 'px';
    }

    hideTooltip() {
        this.$tooltip.classList.remove('visible');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    zoomIn() {
        if (this._svg && this._zoom) {
            this._svg.transition().call(this._zoom.scaleBy, 1.3);
        }
    }

    zoomOut() {
        if (this._svg && this._zoom) {
            this._svg.transition().call(this._zoom.scaleBy, 0.7);
        }
    }

    resetZoom() {
        if (this._svg && this._zoom) {
            this._svg.transition().call(this._zoom.transform, d3.zoomIdentity);
        }
    }

    centerOnNode(nodeId) {
        // Find node and center view on it
        const node = this._data?.nodes?.find(n => n.id === nodeId);
        if (node && this._svg && this._zoom) {
            const transform = d3.zoomIdentity
                .translate(this._width / 2 - node.x, this._height / 2 - node.y);
            this._svg.transition().call(this._zoom.transform, transform);
        }
    }

    highlightNode(nodeId) {
        this._svg?.selectAll('.node')
            .classed('highlighted', d => d.id === nodeId);
    }

    clearHighlight() {
        this._svg?.selectAll('.node').classed('highlighted', false);
    }

    exportSVG() {
        if (!this._svg) return '';

        const svgNode = this._svg.node();
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgNode);

        // Add styles
        const styleString = `<style>
            .node circle { stroke: #fff; stroke-width: 2px; }
            .edge { fill: none; }
            .node-label { font-size: 10px; fill: #333; text-anchor: middle; }
        </style>`;
        svgString = svgString.replace('>', '>' + styleString);

        // Download
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'graph.svg';
        a.click();
        URL.revokeObjectURL(url);

        return svgString;
    }
}

customElements.define('graph-visualizer', GraphVisualizer);
