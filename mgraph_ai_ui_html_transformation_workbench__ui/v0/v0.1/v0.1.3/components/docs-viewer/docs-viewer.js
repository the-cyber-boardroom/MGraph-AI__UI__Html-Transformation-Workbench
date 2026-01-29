/**
 * v0.1.3 Docs Viewer Override
 *
 * Purpose: Hardcode the file tree since directory listing returns 404
 * Surgical override of v0.1.2/components/docs-viewer/docs-viewer.js
 */

// Hardcoded file tree structure
const DOCS_FILE_TREE = {
    'dev-briefs': {
        type: 'directory',
        children: {
            'index.md': { type: 'file' },
            'v0.1.1__create__workbench-architecture-and-stories': {
                type: 'directory',
                children: {
                    'part-1__LLM_BRIEF__HTML_Transformation_Workbench_UI.md': { type: 'file' },
                    'part-2__ARCHITECTURE__HTML_Transformation_Workbench.md': { type: 'file' },
                    'part-3__IFD_METHODOLOGY.md': { type: 'file' },
                    'part-3__STORY_INDEX.md': { type: 'file' },
                    'part-3__Stories__SHARED_BRIEFING.md': { type: 'file' },
                    'stories': {
                        type: 'directory',
                        children: {
                            'B1_Profile_CRUD_APIs.md': { type: 'file' },
                            'B2_Site_Browsing_API.md': { type: 'file' },
                            'B3_Page_Analysis_APIs.md': { type: 'file' },
                            'B4_Site_Analysis_APIs.md': { type: 'file' },
                            'B5_Graph_Generation_APIs.md': { type: 'file' },
                            'D1_Events_Viewer_Mini_App.md': { type: 'file' },
                            'D2_API_Logger_Mini_App.md': { type: 'file' },
                            'F1_Foundation_Shell_Router.md': { type: 'file' },
                            'F2_Event_Bus_Service.md': { type: 'file' },
                            'F3_API_Client_Service.md': { type: 'file' },
                            'F4_Config_Manager_Service.md': { type: 'file' },
                            'F5_Hello_World_Validation_Apps.md': { type: 'file' },
                            'M1_Settings_Mini_App.md': { type: 'file' },
                            'M2_API_Explorer_Mini_App.md': { type: 'file' },
                            'M3_HTML_Workbench_Mini_App.md': { type: 'file' },
                            'M4_Profile_Manager_Mini_App.md': { type: 'file' },
                            'M5_Site_Browser_Mini_App.md': { type: 'file' },
                            'M6_Page_Analysis_Mini_App.md': { type: 'file' },
                            'M7_Site_Analysis_Mini_App.md': { type: 'file' },
                            'S1_HTML_Editor_Component.md': { type: 'file' },
                            'S2_Graph_Visualizer_Component.md': { type: 'file' },
                            'S3_Transform_Config_Component.md': { type: 'file' }
                        }
                    }
                }
            },
            'v0.1.2__implement-workbench-using-claude-code': {
                type: 'directory',
                children: {
                    'v0.1.2__brief__claude-code-orchestrator-briefing.md': { type: 'file' }
                }
            }
        }
    }
};

// Override loadPath to use hardcoded tree instead of fetching directory listing
DocsViewer.prototype.loadPath = function(path) {
    this.state.loading = false;
    this.state.error = null;
    this.state.currentPath = path;
    this.state.content = '';

    // Navigate the hardcoded tree to get files for this path
    const files = this.getFilesForPath(path);
    this.state.files = files;

    this.render();

    // If it's a markdown file, load it
    if (path && path.endsWith('.md')) {
        this.loadFile(path);
    }
};

// New method: Get files from hardcoded tree for a given path
DocsViewer.prototype.getFilesForPath = function(path) {
    let current = DOCS_FILE_TREE['dev-briefs'];

    if (path) {
        const parts = path.split('/').filter(Boolean);
        for (const part of parts) {
            if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return [];
            }
        }
    }

    if (!current.children) {
        return [];
    }

    // Convert to array format expected by render
    const files = [];
    for (const [name, info] of Object.entries(current.children)) {
        const fullPath = path ? `${path}/${name}` : name;
        files.push({
            name: name,
            path: fullPath,
            type: info.type
        });
    }

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

// Override renderFileTree to handle nested display better
const _originalRenderFileTree = DocsViewer.prototype.renderFileTree;
DocsViewer.prototype.renderFileTree = function() {
    if (this.state.files.length === 0 && !this.state.loading && !this.state.currentPath) {
        // Show root level
        this.state.files = this.getFilesForPath('');
    }

    if (this.state.files.length === 0) {
        return '<p class="dv-empty">No files found</p>';
    }

    return this.state.files.map(file => {
        const isDir = file.type === 'directory';
        const icon = isDir ? '📁' : (file.name.endsWith('.md') ? '📄' : '📋');
        const name = file.name;

        // Add category labels for story files
        let label = '';
        if (name.startsWith('B')) label = '<span class="dv-file-tag backend">API</span>';
        else if (name.startsWith('D')) label = '<span class="dv-file-tag debug">Debug</span>';
        else if (name.startsWith('F')) label = '<span class="dv-file-tag foundation">Core</span>';
        else if (name.startsWith('M')) label = '<span class="dv-file-tag miniapp">App</span>';
        else if (name.startsWith('S')) label = '<span class="dv-file-tag shared">Shared</span>';

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
const styleEl = document.createElement('style');
styleEl.textContent = docsViewerExtraStyles;
document.head.appendChild(styleEl);

console.log('[v0.1.3] Docs viewer updated with hardcoded file tree');
