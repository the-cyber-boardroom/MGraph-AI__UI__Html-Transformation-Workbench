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

    // Mermaid renderer
    GraphViewer.prototype.renderMermaidGraph = function() {
        const area = this.querySelector('#gv-graph-area');
        if (!area) return;

        // Generate Mermaid code
        const mermaidCode = toMermaidSyntax(this._graphData, this._rootLabel);

        // Create container
        area.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div class="gv-mermaid-container" style="flex: 1; overflow: auto; padding: 20px; display: flex; justify-content: center; align-items: flex-start;">
                    <pre class="mermaid" id="gv-mermaid-diagram">${escapeHtml(mermaidCode)}</pre>
                </div>
                <div class="gv-mermaid-footer" style="padding: 12px; border-top: 1px solid #30363d; background: #161b22; display: flex; gap: 8px; align-items: center;">
                    <button class="gv-copy-btn" id="gv-copy-mermaid" title="Copy Mermaid code">
                        \u{1F4CB} Copy Code
                    </button>
                    <button class="gv-copy-btn" id="gv-toggle-code" title="Show/hide Mermaid code">
                        \u{1F4DD} Show Code
                    </button>
                    <span style="margin-left: auto; font-size: 11px; color: #6e7681;">
                        Paste in GitHub/GitLab markdown with \`\`\`mermaid fence
                    </span>
                </div>
                <div class="gv-mermaid-code" id="gv-mermaid-code" style="display: none; padding: 12px; background: #0d1117; border-top: 1px solid #30363d; max-height: 200px; overflow: auto;">
                    <pre style="margin: 0; font-size: 11px; color: #c9d1d9; white-space: pre-wrap;">${escapeHtml(mermaidCode)}</pre>
                </div>
            </div>
        `;

        // Render Mermaid diagram
        try {
            mermaid.run({
                nodes: [document.getElementById('gv-mermaid-diagram')]
            });
        } catch (error) {
            console.error('[Mermaid] Render error:', error);
        }

        // Attach event handlers
        const copyBtn = this.querySelector('#gv-copy-mermaid');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(mermaidCode).then(() => {
                    copyBtn.innerHTML = '\u{2705} Copied!';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = '\u{1F4CB} Copy Code';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                });
            });
        }

        const toggleBtn = this.querySelector('#gv-toggle-code');
        const codeBlock = this.querySelector('#gv-mermaid-code');
        if (toggleBtn && codeBlock) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = codeBlock.style.display !== 'none';
                codeBlock.style.display = isVisible ? 'none' : 'block';
                toggleBtn.innerHTML = isVisible ? '\u{1F4DD} Show Code' : '\u{1F4DD} Hide Code';
            });
        }
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
