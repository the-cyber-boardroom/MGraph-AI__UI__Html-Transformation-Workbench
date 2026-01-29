/**
 * v0.1.4 Docs Viewer Override
 *
 * Purpose: Fetch file tree from /dev-briefs/files.json endpoint
 * Surgical override of v0.1.2/components/docs-viewer/docs-viewer.js
 */

// Override loadPath to fetch from /dev-briefs/files.json
DocsViewer.prototype.loadPath = async function(path) {
    this.state.loading = true;
    this.state.error = null;
    this.state.currentPath = path;
    this.state.content = '';
    this.render();

    try {
        // If we don't have the file tree yet, fetch it
        if (!this._fileTree) {
            const response = await fetch('/dev-briefs/files.json');
            if (!response.ok) {
                throw new Error(`Failed to load files.json: ${response.status}`);
            }
            const json = await response.json();
            this._fileTree = json.data;
        }

        // Navigate to the requested path
        const files = this.getFilesForPath(path);
        this.state.files = files;
        this.state.loading = false;
        this.render();

        // If it's a markdown file, load its content
        if (path && path.endsWith('.md')) {
            this.loadFile(path);
        }

    } catch (error) {
        this.state.loading = false;
        this.state.error = error.message;
        this.render();
    }
};

// New method: Get files from fetched tree for a given path
DocsViewer.prototype.getFilesForPath = function(path) {
    if (!this._fileTree) return [];

    let current = this._fileTree;

    // Navigate to the path
    if (path) {
        const parts = path.split('/').filter(Boolean);
        for (const part of parts) {
            if (current.children) {
                const child = current.children.find(c => c.name === part);
                if (child) {
                    current = child;
                } else {
                    return [];
                }
            } else {
                return [];
            }
        }
    }

    if (!current.children) {
        return [];
    }

    // Convert to array format expected by render
    const files = current.children.map(child => ({
        name: child.name,
        path: child.path.replace(/^\//, ''), // Remove leading slash
        type: child.type
    }));

    // Sort: directories first, then alphabetically
    files.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
    });

    return files;
};

// Override onActivate to load root immediately
DocsViewer.prototype.onActivate = function() {
    // Always refresh the file tree when activated
    this.loadPath(this.state.currentPath || '');
};

// Override renderFileTree to add category labels
const _originalRenderFileTree = DocsViewer.prototype.renderFileTree;
DocsViewer.prototype.renderFileTree = function() {
    if (this.state.files.length === 0 && !this.state.loading) {
        return '<p class="dv-empty">No files found</p>';
    }

    return this.state.files.map(file => {
        const isDir = file.type === 'directory';
        const icon = isDir ? '📁' : (file.name.endsWith('.md') ? '📄' : '📋');
        const name = file.name;

        // Add category labels for story files
        let label = '';
        if (name.startsWith('B') && name.includes('_')) label = '<span class="dv-file-tag backend">API</span>';
        else if (name.startsWith('D') && name.includes('_')) label = '<span class="dv-file-tag debug">Debug</span>';
        else if (name.startsWith('F') && name.includes('_')) label = '<span class="dv-file-tag foundation">Core</span>';
        else if (name.startsWith('M') && name.includes('_')) label = '<span class="dv-file-tag miniapp">App</span>';
        else if (name.startsWith('S') && name.includes('_')) label = '<span class="dv-file-tag shared">Shared</span>';

        return `
            <div class="dv-file-item ${isDir ? 'dir' : 'file'}" data-path="${this.escapeHtml(file.path)}" data-type="${file.type}">
                <span class="dv-file-icon">${icon}</span>
                <span class="dv-file-name">${this.escapeHtml(name)}</span>
                ${label}
            </div>
        `;
    }).join('');
};

// Add extra styles for file tags
const docsViewerExtraStyles = `
    .dv-file-tag {
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: auto;
        text-transform: uppercase;
        font-weight: 600;
    }
    .dv-file-tag.backend { background: #1e3a5f; color: #64b5f6; }
    .dv-file-tag.debug { background: #3e2723; color: #ffab91; }
    .dv-file-tag.foundation { background: #1b5e20; color: #81c784; }
    .dv-file-tag.miniapp { background: #4a148c; color: #ce93d8; }
    .dv-file-tag.shared { background: #e65100; color: #ffcc80; }
`;

// Inject extra styles
const docsStyleEl = document.createElement('style');
docsStyleEl.textContent = docsViewerExtraStyles;
document.head.appendChild(docsStyleEl);

console.log('[v0.1.4] Docs viewer updated to use /dev-briefs/files.json');
