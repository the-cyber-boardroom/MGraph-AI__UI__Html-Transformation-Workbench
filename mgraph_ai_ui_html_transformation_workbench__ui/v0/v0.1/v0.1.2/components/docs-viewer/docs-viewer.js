/**
 * Documentation & Briefs Viewer Mini App
 *
 * Purpose: Browse and view development briefs and documentation
 * Version: v0.1.2
 *
 * Fetches markdown files from /dev-briefs/* endpoint
 */

class DocsViewer extends HTMLElement {

    static get appId()    { return 'docs-viewer'; }
    static get navLabel() { return 'Docs'; }
    static get navIcon()  { return '📚'; }

    constructor() {
        super();
        this.state = {
            loading: false,
            error: null,
            currentPath: '',
            content: '',
            breadcrumbs: [],
            files: []
        };
        this.baseUrl = '/dev-briefs';
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {}

    onActivate() {
        // Load root directory on activate
        if (!this.state.currentPath && this.state.files.length === 0) {
            this.loadPath('');
        }
    }

    onDeactivate() {}

    render() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="docs-viewer">
                <div class="dv-header">
                    <h2>Documentation & Briefs</h2>
                </div>

                <div class="dv-toolbar">
                    <div class="dv-breadcrumbs" id="dv-breadcrumbs">
                        ${this.renderBreadcrumbs()}
                    </div>
                    <button class="dv-btn" id="dv-refresh-btn">Refresh</button>
                </div>

                <div class="dv-content">
                    <div class="dv-sidebar">
                        <div class="dv-file-tree" id="dv-file-tree">
                            ${this.state.loading ? '<p class="dv-loading">Loading...</p>' : ''}
                            ${this.state.error ? `<p class="dv-error">${this.escapeHtml(this.state.error)}</p>` : ''}
                            ${this.renderFileTree()}
                        </div>
                    </div>
                    <div class="dv-main">
                        <div class="dv-document" id="dv-document">
                            ${this.state.content ? this.renderMarkdown(this.state.content) : this.renderWelcome()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventHandlers();
    }

    renderBreadcrumbs() {
        const parts = this.state.currentPath.split('/').filter(Boolean);
        let html = `<a href="#" class="dv-breadcrumb" data-path="">dev-briefs</a>`;

        let path = '';
        for (const part of parts) {
            path += '/' + part;
            html += ` <span class="dv-breadcrumb-sep">/</span> `;
            html += `<a href="#" class="dv-breadcrumb" data-path="${this.escapeHtml(path)}">${this.escapeHtml(part)}</a>`;
        }

        return html;
    }

    renderFileTree() {
        if (this.state.files.length === 0 && !this.state.loading) {
            return '<p class="dv-empty">No files found</p>';
        }

        return this.state.files.map(file => {
            const isDir = file.type === 'directory' || file.name.endsWith('/');
            const icon = isDir ? '📁' : (file.name.endsWith('.md') ? '📄' : '📋');
            const name = file.name.replace(/\/$/, '');

            return `
                <div class="dv-file-item ${isDir ? 'dir' : 'file'}" data-path="${this.escapeHtml(file.path || file.name)}" data-type="${isDir ? 'dir' : 'file'}">
                    <span class="dv-file-icon">${icon}</span>
                    <span class="dv-file-name">${this.escapeHtml(name)}</span>
                </div>
            `;
        }).join('');
    }

    renderWelcome() {
        return `
            <div class="dv-welcome">
                <h3>Welcome to the Documentation Viewer</h3>
                <p>Browse development briefs and documentation from the sidebar.</p>
                <ul>
                    <li>Click on folders to expand them</li>
                    <li>Click on .md files to view their content</li>
                    <li>Use breadcrumbs to navigate back</li>
                </ul>
            </div>
        `;
    }

    renderMarkdown(content) {
        // Simple markdown to HTML conversion
        let html = content;

        // Escape HTML first
        html = this.escapeHtml(html);

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Bold and italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Code blocks (fenced)
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="dv-code-block"><code>$2</code></pre>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code class="dv-inline-code">$1</code>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Lists
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

        // Numbered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');

        // Paragraphs (lines with text not already in a tag)
        html = html.replace(/^(?!<[hluop]|<li|<hr|<pre)(.+)$/gm, '<p>$1</p>');

        // Clean up empty paragraphs
        html = html.replace(/<p>\s*<\/p>/g, '');

        return `<div class="dv-markdown">${html}</div>`;
    }

    attachEventHandlers() {
        // Refresh button
        this.querySelector('#dv-refresh-btn')?.addEventListener('click', () => {
            this.loadPath(this.state.currentPath);
        });

        // Breadcrumb navigation
        this.querySelector('#dv-breadcrumbs')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('dv-breadcrumb')) {
                e.preventDefault();
                const path = e.target.dataset.path;
                this.loadPath(path);
            }
        });

        // File tree clicks
        this.querySelector('#dv-file-tree')?.addEventListener('click', (e) => {
            const item = e.target.closest('.dv-file-item');
            if (item) {
                const path = item.dataset.path;
                const type = item.dataset.type;

                if (type === 'dir') {
                    this.loadPath(path);
                } else {
                    this.loadFile(path);
                }
            }
        });
    }

    async loadPath(path) {
        this.state.loading = true;
        this.state.error = null;
        this.state.currentPath = path;
        this.state.content = '';
        this.render();

        try {
            const url = this.baseUrl + (path ? '/' + path : '');
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }

            const text = await response.text();

            // Try to parse as directory listing or treat as file content
            if (this.isMarkdown(path)) {
                this.state.content = text;
                this.state.files = [];
            } else {
                // Parse directory listing (we'll assume a simple format or index.md)
                this.state.files = this.parseDirectoryListing(text, path);
            }

            this.state.loading = false;
            this.render();

        } catch (error) {
            this.state.loading = false;
            this.state.error = error.message;
            this.render();
        }
    }

    async loadFile(path) {
        this.state.loading = true;
        this.state.error = null;
        this.render();

        try {
            const url = this.baseUrl + '/' + path;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.status}`);
            }

            const text = await response.text();
            this.state.content = text;
            this.state.loading = false;
            this.render();

        } catch (error) {
            this.state.loading = false;
            this.state.error = error.message;
            this.render();
        }
    }

    isMarkdown(path) {
        return path.endsWith('.md');
    }

    parseDirectoryListing(text, currentPath) {
        // If the response is HTML, try to extract links
        // If it's plain text, try to parse as a file list
        // This is a simple heuristic - adjust based on actual server response

        const files = [];

        // Check if response contains markdown content (index.md)
        if (text.trim().startsWith('#') || text.includes('\n# ')) {
            // It's a markdown file, show it
            this.state.content = text;
            return files;
        }

        // Try to parse HTML directory listing
        const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            const href = match[1];
            const name = match[2];

            // Skip parent directory and special links
            if (href === '../' || href.startsWith('?') || href.startsWith('#')) {
                continue;
            }

            const isDir = href.endsWith('/');
            const fullPath = currentPath ? `${currentPath}/${href}`.replace(/\/+/g, '/') : href;

            files.push({
                name: name,
                path: fullPath.replace(/\/$/, ''),
                type: isDir ? 'directory' : 'file'
            });
        }

        // If no HTML links found, try line-by-line parsing
        if (files.length === 0) {
            const lines = text.split('\n').filter(l => l.trim());
            for (const line of lines) {
                const name = line.trim();
                if (name && !name.startsWith('<') && !name.startsWith('#')) {
                    const isDir = name.endsWith('/') || !name.includes('.');
                    const fullPath = currentPath ? `${currentPath}/${name}` : name;

                    files.push({
                        name: name,
                        path: fullPath.replace(/\/$/, ''),
                        type: isDir ? 'directory' : 'file'
                    });
                }
            }
        }

        return files;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getStyles() {
        return `
            .docs-viewer {
                display: flex;
                flex-direction: column;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5;
            }

            .dv-header {
                padding: 16px 20px;
                background: #252836;
                border-bottom: 1px solid #3a3f4f;
            }

            .dv-header h2 {
                margin: 0;
                font-size: 18px;
                color: #ffffff;
            }

            .dv-toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 20px;
                background: #1a1a2e;
                border-bottom: 1px solid #3a3f4f;
            }

            .dv-breadcrumbs {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 13px;
            }

            .dv-breadcrumb {
                color: #a0a0b0;
                text-decoration: none;
            }

            .dv-breadcrumb:hover {
                color: #e94560;
            }

            .dv-breadcrumb-sep {
                color: #5a5a6a;
            }

            .dv-btn {
                padding: 6px 14px;
                border: 1px solid #3a3f4f;
                border-radius: 4px;
                background: transparent;
                color: #a0a0b0;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.15s;
            }

            .dv-btn:hover {
                background: #3a3f4f;
                color: #ffffff;
            }

            .dv-content {
                display: flex;
                flex: 1;
                overflow: hidden;
            }

            .dv-sidebar {
                width: 280px;
                background: #252836;
                border-right: 1px solid #3a3f4f;
                overflow: auto;
            }

            .dv-file-tree {
                padding: 12px;
            }

            .dv-file-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                color: #c0c0d0;
                transition: all 0.15s;
            }

            .dv-file-item:hover {
                background: #3a3f4f;
                color: #ffffff;
            }

            .dv-file-item.dir {
                color: #e94560;
            }

            .dv-file-icon {
                font-size: 14px;
            }

            .dv-file-name {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .dv-main {
                flex: 1;
                overflow: auto;
                background: #ffffff;
            }

            .dv-document {
                padding: 24px 32px;
                max-width: 900px;
            }

            .dv-welcome {
                color: #666;
            }

            .dv-welcome h3 {
                color: #333;
            }

            .dv-markdown {
                line-height: 1.7;
                color: #333;
            }

            .dv-markdown h1 {
                font-size: 28px;
                border-bottom: 2px solid #e0e0e0;
                padding-bottom: 10px;
                margin: 24px 0 16px;
            }

            .dv-markdown h2 {
                font-size: 22px;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 8px;
                margin: 20px 0 14px;
            }

            .dv-markdown h3 {
                font-size: 18px;
                margin: 18px 0 12px;
            }

            .dv-markdown p {
                margin: 12px 0;
            }

            .dv-markdown ul {
                padding-left: 24px;
                margin: 12px 0;
            }

            .dv-markdown li {
                margin: 6px 0;
            }

            .dv-markdown hr {
                border: none;
                border-top: 1px solid #e0e0e0;
                margin: 24px 0;
            }

            .dv-code-block {
                background: #1a1a2e;
                color: #e0e0e0;
                padding: 16px;
                border-radius: 6px;
                overflow-x: auto;
                font-family: 'SF Mono', Monaco, monospace;
                font-size: 13px;
                line-height: 1.5;
                margin: 16px 0;
            }

            .dv-inline-code {
                background: #f0f0f0;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'SF Mono', Monaco, monospace;
                font-size: 0.9em;
            }

            .dv-loading,
            .dv-error,
            .dv-empty {
                padding: 20px;
                text-align: center;
                color: #a0a0b0;
            }

            .dv-error {
                color: #e94560;
            }
        `;
    }
}

customElements.define('docs-viewer', DocsViewer);
