# Story S2: Graph Visualizer Component

**Story ID:** S2  
**Layer:** Shared Components  
**Priority:** MEDIUM  
**Parallel With:** S1, S3  
**Dependencies:** None

---

## 1. Purpose

Create a reusable D3-based graph visualization component. This component renders node-edge graphs with interactive features like pan, zoom, and click events.

**You are building:**
- D3.js force-directed graph rendering
- Hierarchical tree layout option
- Pan and zoom controls
- Node click/hover events
- Tooltips
- Legend

**Used by:** Page Analysis (M6), Site Analysis (M7)

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Layout: [Force ▼]  [🔍+] [🔍-] [⟲ Reset] [📥 Export SVG]                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              ┌──────┐                                           │
│                     ┌────────│ Home │────────┐                                  │
│                     │        └──────┘        │                                  │
│                     │            │           │                                  │
│                     ▼            │           ▼                                  │
│                ┌────────┐        │      ┌─────────┐                            │
│                │ About  │        │      │ Contact │                            │
│                └────────┘        │      └─────────┘                            │
│                     │            ▼                                              │
│                     │       ┌────────┐                                         │
│                     │       │  Blog  │                                         │
│                     │       └───┬────┘                                         │
│                     │     ┌─────┼─────┐                                        │
│                     │     ▼     ▼     ▼                                        │
│                     │  ┌────┐┌────┐┌────┐                                      │
│                     │  │ P1 ││ P2 ││ P3 │                                      │
│                     │  └────┘└────┘└────┘                                      │
│                     │                                                           │
│                     └──────────────────► ┌──────────┐                          │
│                                          │ Twitter  │  (external)              │
│                                          └──────────┘                          │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Legend:  ● Page  ● External  ─ Internal Link  ─ External Link                 │
│  Nodes: 8 | Edges: 12                                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Interface

```javascript
class GraphVisualizer extends HTMLElement {
    // ═══════════════════════════════════════════════════════════════════
    // Attributes
    // ═══════════════════════════════════════════════════════════════════
    
    static get observedAttributes() {
        return ['layout', 'show-legend', 'show-tooltips'];
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Properties
    // ═══════════════════════════════════════════════════════════════════
    
    get data() { return this._data; }
    set data(graphData) { 
        this._data = graphData; 
        this.renderGraph(); 
    }
    
    get layout() { return this.getAttribute('layout') || 'force'; }
    set layout(val) { this.setAttribute('layout', val); }
    
    // ═══════════════════════════════════════════════════════════════════
    // Methods
    // ═══════════════════════════════════════════════════════════════════
    
    // Set graph data
    setData(graphData) { this.data = graphData; }
    
    // Change layout
    setLayout(layout) { this.layout = layout; this.renderGraph(); }
    
    // Zoom controls
    zoomIn() { /* zoom in */ }
    zoomOut() { /* zoom out */ }
    resetZoom() { /* reset to fit */ }
    
    // Center on node
    centerOnNode(nodeId) { /* pan and zoom to node */ }
    
    // Highlight node
    highlightNode(nodeId) { /* add highlight class */ }
    clearHighlight() { /* remove highlights */ }
    
    // Export
    exportSVG() { /* return SVG string */ }
    exportPNG() { /* return PNG blob */ }
    
    // ═══════════════════════════════════════════════════════════════════
    // Events Emitted
    // ═══════════════════════════════════════════════════════════════════
    
    // this.dispatchEvent(new CustomEvent('node-click', { detail: { node } }))
    // this.dispatchEvent(new CustomEvent('node-hover', { detail: { node } }))
    // this.dispatchEvent(new CustomEvent('edge-click', { detail: { edge } }))
}

customElements.define('graph-visualizer', GraphVisualizer);
```

---

## 4. Graph Data Format

The component accepts the standard graph format from B5:

```javascript
{
    "format": "d3",
    "layout_hint": "force",  // Optional: "force", "hierarchy", "radial"
    "nodes": [
        {
            "id": "node-1",
            "label": "Home",
            "type": "page",       // Used for color/shape
            "data": { ... }       // Custom data for tooltips
        }
    ],
    "edges": [
        {
            "source": "node-1",
            "target": "node-2",
            "type": "internal",   // Used for line style
            "data": { ... }
        }
    ],
    "metadata": {
        "node_count": 10,
        "edge_count": 15
    }
}
```

---

## 5. Layout Types

### Force-Directed (default)

Good for arbitrary graphs. Nodes repel each other, edges act as springs.

```javascript
const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(40));
```

### Hierarchical (tree)

Good for DOM trees and site maps. Parent-child relationships.

```javascript
const root = d3.hierarchy(treeData);
const treeLayout = d3.tree().size([width, height]);
treeLayout(root);
```

### Radial

Good for showing relationships from a central node.

```javascript
const root = d3.hierarchy(treeData);
const radialLayout = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
```

---

## 6. Node Styling

```javascript
const nodeStyles = {
    // Type → { color, shape, size }
    'page':      { color: '#4CAF50', shape: 'circle', size: 25 },
    'external':  { color: '#FF5722', shape: 'square', size: 20 },
    'element':   { color: '#2196F3', shape: 'circle', size: 20 },
    'semantic':  { color: '#9C27B0', shape: 'circle', size: 22 },
    'collapsed': { color: '#FF9800', shape: 'diamond', size: 18 },
    'orphan':    { color: '#E91E63', shape: 'circle', size: 20 }
};

function getNodeStyle(node) {
    return nodeStyles[node.type] || nodeStyles['page'];
}
```

---

## 7. Edge Styling

```javascript
const edgeStyles = {
    // Type → { color, strokeWidth, dashArray }
    'child':         { color: '#666', strokeWidth: 1.5, dashArray: null },
    'internal':      { color: '#4CAF50', strokeWidth: 2, dashArray: null },
    'external':      { color: '#FF5722', strokeWidth: 1.5, dashArray: '5,5' },
    'bidirectional': { color: '#2196F3', strokeWidth: 2.5, dashArray: null }
};
```

---

## 8. Tooltip Content

```javascript
function renderTooltip(node) {
    let content = `<strong>${node.label}</strong>`;
    content += `<br>Type: ${node.type}`;
    
    // Add custom data
    if (node.data) {
        if (node.data.path) content += `<br>Path: ${node.data.path}`;
        if (node.data.depth !== undefined) content += `<br>Depth: ${node.data.depth}`;
        if (node.data.child_count) content += `<br>Children: ${node.data.child_count}`;
        if (node.data.link_count) content += `<br>Links: ${node.data.link_count}`;
    }
    
    return content;
}
```

---

## 9. Usage Examples

### Basic Usage

```html
<graph-visualizer show-legend show-tooltips></graph-visualizer>

<script>
const viz = document.querySelector('graph-visualizer');
viz.data = {
    format: 'd3',
    nodes: [
        { id: '1', label: 'Home', type: 'page' },
        { id: '2', label: 'About', type: 'page' },
        { id: '3', label: 'Twitter', type: 'external' }
    ],
    edges: [
        { source: '1', target: '2', type: 'internal' },
        { source: '1', target: '3', type: 'external' }
    ]
};

viz.addEventListener('node-click', (e) => {
    console.log('Clicked:', e.detail.node);
});
</script>
```

### Hierarchical Layout

```html
<graph-visualizer layout="hierarchy"></graph-visualizer>
```

### From API Response

```javascript
const response = await api.htmlGraph.generateDomTree(cacheId);
const viz = document.querySelector('graph-visualizer');
viz.data = response.graph;
```

---

## 10. File Structure

```
v0.1.0/
└── components/
    └── shared/
        └── graph-visualizer/
            ├── graph-visualizer.js
            ├── graph-visualizer.css
            └── graph-visualizer.test.js
```

---

## 11. CSS

```css
graph-visualizer {
    display: flex;
    flex-direction: column;
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
}

.graph-toolbar {
    display: flex;
    gap: 10px;
    padding: 8px;
    background: #252526;
    border-bottom: 1px solid #333;
}

.graph-container {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.graph-container svg {
    width: 100%;
    height: 100%;
}

.graph-footer {
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
    background: #252526;
    border-top: 1px solid #333;
    font-size: 11px;
    color: #888;
}

/* Nodes */
.node circle, .node rect {
    stroke: #fff;
    stroke-width: 2px;
    cursor: pointer;
    transition: transform 0.2s;
}

.node:hover circle, .node:hover rect {
    transform: scale(1.2);
}

.node.highlighted circle, .node.highlighted rect {
    stroke: #ffeb3b;
    stroke-width: 3px;
}

.node-label {
    font-size: 11px;
    fill: #fff;
    pointer-events: none;
    text-anchor: middle;
}

/* Edges */
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
    fill: #888;
}

/* Tooltip */
.graph-tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 1000;
    max-width: 250px;
}

/* Legend */
.graph-legend {
    display: flex;
    gap: 15px;
    align-items: center;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.legend-line {
    width: 20px;
    height: 2px;
}
```

---

## 12. Acceptance Criteria

- [ ] Renders nodes and edges from data
- [ ] Force-directed layout works
- [ ] Hierarchical layout works
- [ ] Pan with mouse drag
- [ ] Zoom with scroll/buttons
- [ ] Reset zoom fits graph
- [ ] Node click emits event
- [ ] Node hover shows tooltip
- [ ] Nodes colored by type
- [ ] Edges styled by type
- [ ] Legend shows node types
- [ ] Export to SVG works
- [ ] Handles empty data gracefully
- [ ] Responsive to container size

---

## 13. Events

### Events Emitted

| Event | When | Detail |
|-------|------|--------|
| `node-click` | Click on node | `{ node }` |
| `node-hover` | Hover on node | `{ node }` |
| `edge-click` | Click on edge | `{ edge }` |
| `layout-changed` | Layout changed | `{ layout }` |

### Events Listened

None (this is a passive UI component)

---

## 14. D3.js Dependency

This component requires D3.js. Include it before the component:

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="components/shared/graph-visualizer/graph-visualizer.js"></script>
```

Or load dynamically:

```javascript
async loadD3() {
    if (window.d3) return;
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://d3js.org/d3.v7.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
```

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
