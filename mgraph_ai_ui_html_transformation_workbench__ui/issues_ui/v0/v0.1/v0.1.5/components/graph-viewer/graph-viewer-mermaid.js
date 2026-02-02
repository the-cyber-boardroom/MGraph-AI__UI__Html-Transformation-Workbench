/**
 * Graph Viewer - Mermaid.js Renderer - v0.1.5
 *
 * Purpose: Render graph using Mermaid.js declarative syntax
 * Version: v0.1.5
 *
 * Task-19: Add Mermaid.js graph visualization option
 *
 * Features:
 * - Declarative graph definition
 * - Auto-layout (no manual positioning)
 * - Export/copy Mermaid code for documentation
 * - GitHub/GitLab markdown compatible
 */

(function() {
    'use strict';

    // Make sure GraphViewer exists
    if (typeof GraphViewer === 'undefined') {
        console.error('[v0.1.5] GraphViewer class not found for Mermaid renderer!');
        return;
    }

    // Node shape mapping for Mermaid
    const MERMAID_SHAPES = {
        feature: ['{{', '}}'],    // Hexagon
        task: ['[', ']'],          // Rectangle
        bug: ['{', '}'],           // Diamond (rhombus) - using brace
        version: ['([', '])'],     // Stadium
        'user-story': ['(', ')'],  // Rounded
        person: ['((', '))']       // Circle
    };

    // Convert API response to Mermaid syntax
    function toMermaidSyntax(graphData, rootLabel) {
        const lines = ['graph TD'];

        // Track processed nodes to avoid duplicates
        const processedNodes = new Set();

        // Add nodes with styling
        graphData.nodes.forEach(node => {
            if (processedNodes.has(node.label)) return;
            processedNodes.add(node.label);

            const shape = MERMAID_SHAPES[node.node_type] || ['[', ']'];
            const displayLabel = node.label.replace(/-/g, '_'); // Mermaid doesn't like hyphens in IDs
            const title = node.title ? node.title.substring(0, 30) : node.label;

            lines.push(`    ${displayLabel}${shape[0]}"${escapeLabel(title)}"${shape[1]}`);
        });

        // Add edges
        graphData.links.forEach(link => {
            const source = link.source.replace(/-/g, '_');
            const target = link.target.replace(/-/g, '_');

            if (link.link_type && link.link_type.trim()) {
                lines.push(`    ${source} -->|${escapeLabel(link.link_type)}| ${target}`);
            } else {
                lines.push(`    ${source} --> ${target}`);
            }
        });

        // Add styling
        lines.push('');
        lines.push('    %% Node type styling');

        // Group nodes by type for class definitions
        const nodesByType = {};
        graphData.nodes.forEach(node => {
            const type = node.node_type;
            if (!nodesByType[type]) nodesByType[type] = [];
            nodesByType[type].push(node.label.replace(/-/g, '_'));
        });

        // Define classes for each type
        Object.entries(nodesByType).forEach(([type, nodes]) => {
            if (nodes.length > 0) {
                const color = GraphViewer.NODE_COLORS[type] || '#6e7681';
                lines.push(`    classDef ${type} fill:${color},stroke:#333,color:#fff`);
                lines.push(`    class ${nodes.join(',')} ${type}`);
            }
        });

        // Highlight root node
        if (rootLabel) {
            const rootId = rootLabel.replace(/-/g, '_');
            lines.push(`    style ${rootId} stroke:#a371f7,stroke-width:4px`);
        }

        return lines.join('\n');
    }

    // Escape special characters in labels
    function escapeLabel(text) {
        if (!text) return '';
        return text
            .replace(/"/g, "'")
            .replace(/[<>]/g, '')
            .replace(/\n/g, ' ');
    }

    // Mermaid renderer with zoom/pan support
    GraphViewer.prototype.renderMermaidGraph = function() {
        const area = this.querySelector('#gv-graph-area');
        if (!area) return;

        // Generate Mermaid code
        const mermaidCode = toMermaidSyntax(this._graphData, this._rootLabel);

        // Create container with zoom/pan support
        area.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div class="gv-mermaid-toolbar" style="padding: 8px 12px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; gap: 8px; align-items: center;">
                    <span style="font-size: 11px; color: #8b949e;">Zoom:</span>
                    <button class="gv-mermaid-btn" id="gv-mermaid-zoom-in">+</button>
                    <button class="gv-mermaid-btn" id="gv-mermaid-zoom-out">-</button>
                    <button class="gv-mermaid-btn" id="gv-mermaid-reset">Reset</button>
                    <button class="gv-mermaid-btn" id="gv-mermaid-fit">Fit</button>
                    <span style="margin-left: 16px; font-size: 11px; color: #6e7681;" id="gv-mermaid-zoom-level">100%</span>
                </div>
                <div class="gv-mermaid-viewport" id="gv-mermaid-viewport" style="flex: 1; overflow: hidden; position: relative; cursor: grab; background: #0d1117;">
                    <div class="gv-mermaid-canvas" id="gv-mermaid-canvas" style="position: absolute; transform-origin: 0 0;">
                        <pre class="mermaid" id="gv-mermaid-diagram">${escapeHtml(mermaidCode)}</pre>
                    </div>
                </div>
                <div class="gv-mermaid-footer" style="padding: 12px; border-top: 1px solid #30363d; background: #161b22; display: flex; gap: 8px; align-items: center;">
                    <button class="gv-mermaid-btn" id="gv-copy-mermaid" title="Copy Mermaid code">
                        Copy Code
                    </button>
                    <button class="gv-mermaid-btn" id="gv-toggle-code" title="Show/hide Mermaid code">
                        Show Code
                    </button>
                    <span style="margin-left: auto; font-size: 11px; color: #6e7681;">
                        Scroll to zoom, drag to pan | Paste in GitHub/GitLab with \`\`\`mermaid
                    </span>
                </div>
                <div class="gv-mermaid-code" id="gv-mermaid-code" style="display: none; padding: 12px; background: #0d1117; border-top: 1px solid #30363d; max-height: 200px; overflow: auto;">
                    <pre style="margin: 0; font-size: 11px; color: #c9d1d9; white-space: pre-wrap;">${escapeHtml(mermaidCode)}</pre>
                </div>
            </div>
            <style>
                .gv-mermaid-btn {
                    padding: 4px 10px;
                    border: 1px solid #30363d;
                    background: transparent;
                    color: #c9d1d9;
                    font-size: 11px;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .gv-mermaid-btn:hover {
                    background: #21262d;
                }
                .gv-mermaid-viewport:active {
                    cursor: grabbing;
                }
            </style>
        `;

        // Render Mermaid diagram
        const diagramEl = document.getElementById('gv-mermaid-diagram');
        try {
            mermaid.run({ nodes: [diagramEl] });
        } catch (error) {
            console.error('[Mermaid] Render error:', error);
        }

        // Setup zoom/pan after a brief delay for Mermaid to render
        setTimeout(() => {
            this._setupMermaidZoomPan(mermaidCode);
        }, 100);
    };

    // Setup zoom and pan for Mermaid
    GraphViewer.prototype._setupMermaidZoomPan = function(mermaidCode) {
        const viewport = this.querySelector('#gv-mermaid-viewport');
        const canvas = this.querySelector('#gv-mermaid-canvas');
        const zoomLabel = this.querySelector('#gv-mermaid-zoom-level');

        if (!viewport || !canvas) return;

        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let startX, startY;

        const updateTransform = () => {
            canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
        };

        // Center the diagram initially
        const centerDiagram = () => {
            const svg = canvas.querySelector('svg');
            if (svg) {
                const svgRect = svg.getBoundingClientRect();
                const viewportRect = viewport.getBoundingClientRect();
                translateX = (viewportRect.width - svgRect.width * scale) / 2;
                translateY = (viewportRect.height - svgRect.height * scale) / 2;
                updateTransform();
            }
        };

        // Fit diagram to viewport
        const fitDiagram = () => {
            const svg = canvas.querySelector('svg');
            if (svg) {
                const svgRect = svg.getBoundingClientRect();
                const viewportRect = viewport.getBoundingClientRect();
                const scaleX = (viewportRect.width - 40) / (svgRect.width / scale);
                const scaleY = (viewportRect.height - 40) / (svgRect.height / scale);
                scale = Math.min(scaleX, scaleY, 2);
                centerDiagram();
            }
        };

        // Mouse wheel zoom
        viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.1, Math.min(3, scale * delta));

            // Zoom towards mouse position
            const rect = viewport.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            translateX = mouseX - (mouseX - translateX) * (newScale / scale);
            translateY = mouseY - (mouseY - translateY) * (newScale / scale);
            scale = newScale;

            updateTransform();
        });

        // Pan with mouse drag
        viewport.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            viewport.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            viewport.style.cursor = 'grab';
        });

        // Zoom buttons
        const zoomInBtn = this.querySelector('#gv-mermaid-zoom-in');
        const zoomOutBtn = this.querySelector('#gv-mermaid-zoom-out');
        const resetBtn = this.querySelector('#gv-mermaid-reset');
        const fitBtn = this.querySelector('#gv-mermaid-fit');

        if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
            scale = Math.min(3, scale * 1.2);
            updateTransform();
        });

        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
            scale = Math.max(0.1, scale / 1.2);
            updateTransform();
        });

        if (resetBtn) resetBtn.addEventListener('click', () => {
            scale = 1;
            centerDiagram();
        });

        if (fitBtn) fitBtn.addEventListener('click', fitDiagram);

        // Copy and toggle code buttons
        const copyBtn = this.querySelector('#gv-copy-mermaid');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(mermaidCode).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy Code'; }, 2000);
                });
            });
        }

        const toggleBtn = this.querySelector('#gv-toggle-code');
        const codeBlock = this.querySelector('#gv-mermaid-code');
        if (toggleBtn && codeBlock) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = codeBlock.style.display !== 'none';
                codeBlock.style.display = isVisible ? 'none' : 'block';
                toggleBtn.textContent = isVisible ? 'Show Code' : 'Hide Code';
            });
        }

        // Initial fit
        setTimeout(fitDiagram, 200);
    };

    // Helper to escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    console.log('[Issues UI v0.1.5] Mermaid.js graph renderer loaded');

})();
