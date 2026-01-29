/**
 * Site Analysis Mini App
 *
 * Purpose: Analyze entire site structure, content distribution, and navigation patterns
 * Story: M7
 * Version: v0.1.0
 */

class SiteAnalysis extends HTMLElement {

    static get appId()    { return 'site-analysis'; }
    static get navLabel() { return 'Site Analysis'; }
    static get navIcon()  { return '🌐'; }

    constructor() {
        super();
        this.state = {
            loading: false,
            error: null,
            domain: '',
            activeTab: 'sitemap',
            pages: [],
            analysis: {
                sitemap: null,
                content: null,
                links: null
            },
            analyzedAt: null
        };
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    onActivate() {
        // Refresh from config if available
    }

    onDeactivate() {
        // Nothing needed
    }

    render() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="site-analysis">
                <div class="sa-header">
                    <h2>Site Analysis</h2>
                </div>

                <div class="sa-toolbar">
                    <div class="sa-input-group">
                        <label>Domain:</label>
                        <input type="text" id="sa-domain" class="sa-input" placeholder="example.com" value="${this.state.domain}">
                        <button class="sa-btn sa-btn-primary" id="sa-analyze-btn">Analyze Site</button>
                    </div>
                </div>

                <div class="sa-tabs">
                    <button class="sa-tab ${this.state.activeTab === 'sitemap' ? 'active' : ''}" data-tab="sitemap">Site Map</button>
                    <button class="sa-tab ${this.state.activeTab === 'content' ? 'active' : ''}" data-tab="content">Content Overview</button>
                    <button class="sa-tab ${this.state.activeTab === 'link-graph' ? 'active' : ''}" data-tab="link-graph">Link Graph</button>
                </div>

                <div class="sa-content">
                    ${this.state.loading ? this.renderLoading() : ''}
                    ${this.state.error ? this.renderError() : ''}
                    ${!this.state.loading && !this.state.error ? this.renderActiveTab() : ''}
                </div>

                <div class="sa-footer">
                    <button class="sa-btn" id="sa-save-btn" ${!this.state.analysis.sitemap ? 'disabled' : ''}>Save Analysis</button>
                    <button class="sa-btn" id="sa-export-btn" ${!this.state.analysis.sitemap ? 'disabled' : ''}>Export JSON</button>
                </div>
            </div>
        `;

        this.bindElements();
        this.attachEventHandlers();
    }

    renderLoading() {
        return `
            <div class="sa-loading">
                <div class="sa-spinner"></div>
                <p>Analyzing site...</p>
                <p class="sa-loading-detail">Found ${this.state.pages.length} pages</p>
            </div>
        `;
    }

    renderError() {
        return `
            <div class="sa-error">
                <p>${this.escapeHtml(this.state.error)}</p>
            </div>
        `;
    }

    renderActiveTab() {
        switch (this.state.activeTab) {
            case 'sitemap': return this.renderSitemapTab();
            case 'content': return this.renderContentTab();
            case 'link-graph': return this.renderLinkGraphTab();
            default: return '';
        }
    }

    renderSitemapTab() {
        const analysis = this.state.analysis.sitemap;

        if (!analysis) {
            return `
                <div class="sa-empty">
                    <p>Enter a domain and click "Analyze Site" to see site structure.</p>
                </div>
            `;
        }

        return `
            <div class="sa-panel">
                <div class="sa-panel-header">
                    <h3>Site Map</h3>
                    <div class="sa-header-info">
                        ${this.state.analyzedAt ? `<span class="sa-timestamp">Analyzed: ${this.formatDate(this.state.analyzedAt)}</span>` : ''}
                        <span class="sa-page-count">${analysis.totalPages} pages found</span>
                    </div>
                </div>

                <div class="sa-section">
                    <div class="sa-tree">
                        <div class="sa-tree-root">${this.escapeHtml(this.state.domain)}</div>
                        ${this.renderPageTree(analysis.tree)}
                    </div>
                </div>

                ${analysis.orphanPages.length > 0 ? `
                    <div class="sa-section sa-orphans">
                        <h4>Orphan Pages (not linked from anywhere)</h4>
                        <div class="sa-tree">
                            ${analysis.orphanPages.map(page => `
                                <div class="sa-tree-item orphan">
                                    <span class="sa-tree-label">${this.escapeHtml(page.path)}</span>
                                    <span class="sa-tree-meta">${this.formatBytes(page.size)} | ${this.formatDateShort(page.date)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="sa-section sa-summary">
                    <h4>Summary</h4>
                    <ul class="sa-summary-list">
                        <li>Max Depth: <strong>${analysis.maxDepth}</strong></li>
                        <li>Orphan Pages: <strong>${analysis.orphanPages.length}</strong></li>
                        <li>Most Linked: <strong>${analysis.mostLinked.path}</strong> (${analysis.mostLinked.count} incoming links)</li>
                    </ul>
                </div>
            </div>
        `;
    }

    renderPageTree(tree, depth = 0) {
        if (!tree || tree.length === 0) return '';

        return tree.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            return `
                <div class="sa-tree-item" style="margin-left: ${depth * 20}px">
                    <span class="sa-tree-branch">${hasChildren ? '├──' : '└──'}</span>
                    <span class="sa-tree-label">${this.escapeHtml(item.path)}</span>
                    <span class="sa-tree-meta">${this.formatBytes(item.size)} | ${this.formatDateShort(item.date)}</span>
                </div>
                ${hasChildren ? this.renderPageTree(item.children, depth + 1) : ''}
            `;
        }).join('');
    }

    renderContentTab() {
        const analysis = this.state.analysis.content;

        if (!analysis) {
            return `
                <div class="sa-empty">
                    <p>Run site analysis to see content overview.</p>
                </div>
            `;
        }

        return `
            <div class="sa-panel">
                <div class="sa-panel-header">
                    <h3>Content Overview</h3>
                </div>

                <div class="sa-section">
                    <h4>Aggregate Stats</h4>
                    <div class="sa-stats-grid">
                        <div class="sa-stat">
                            <span class="sa-stat-value">${analysis.totalPages}</span>
                            <span class="sa-stat-label">Total Pages</span>
                        </div>
                        <div class="sa-stat">
                            <span class="sa-stat-value">${analysis.totalWords.toLocaleString()}</span>
                            <span class="sa-stat-label">Total Words</span>
                        </div>
                        <div class="sa-stat">
                            <span class="sa-stat-value">${analysis.avgWordsPerPage.toLocaleString()}</span>
                            <span class="sa-stat-label">Avg Words/Page</span>
                        </div>
                        <div class="sa-stat">
                            <span class="sa-stat-value">${this.formatBytes(analysis.totalSize)}</span>
                            <span class="sa-stat-label">Total Size</span>
                        </div>
                    </div>
                </div>

                ${analysis.topicDistribution ? `
                    <div class="sa-section">
                        <h4>Topic Distribution (across all pages)</h4>
                        <div class="sa-bars">
                            ${analysis.topicDistribution.map(topic => `
                                <div class="sa-bar-row">
                                    <span class="sa-bar-label">${topic.name}</span>
                                    <div class="sa-bar-track">
                                        <div class="sa-bar-fill" style="width: ${topic.percentage}%"></div>
                                    </div>
                                    <span class="sa-bar-value">${topic.percentage}%</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="sa-section">
                    <h4>Content Freshness</h4>
                    <div class="sa-bars">
                        ${analysis.freshness.map(item => `
                            <div class="sa-bar-row">
                                <span class="sa-bar-label">${item.label}</span>
                                <div class="sa-bar-track">
                                    <div class="sa-bar-fill freshness" style="width: ${item.percentage}%"></div>
                                </div>
                                <span class="sa-bar-value">${item.count} pages (${item.percentage}%)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="sa-section">
                    <h4>Pages by Size</h4>
                    <div class="sa-page-sizes">
                        ${analysis.largestPages.map((page, index) => `
                            <div class="sa-size-row">
                                <span class="sa-size-rank">${index + 1}.</span>
                                <span class="sa-size-path">${this.escapeHtml(page.path)}</span>
                                <div class="sa-size-bar">
                                    <div class="sa-size-fill" style="width: ${(page.size / analysis.largestPages[0].size) * 100}%"></div>
                                </div>
                                <span class="sa-size-value">${this.formatBytes(page.size)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderLinkGraphTab() {
        if (!this.state.analysis.links) {
            return `
                <div class="sa-empty">
                    <p>Run site analysis to visualize link structure.</p>
                </div>
            `;
        }

        return `
            <div class="sa-graph-panel">
                <div class="sa-graph-legend">
                    <span class="sa-legend-item"><span class="sa-legend-dot internal"></span> Internal Page</span>
                    <span class="sa-legend-item"><span class="sa-legend-dot external"></span> External Link</span>
                    <span class="sa-legend-item"><span class="sa-legend-line internal"></span> Internal Link</span>
                    <span class="sa-legend-item"><span class="sa-legend-line external"></span> External Link</span>
                </div>
                <div class="sa-graph-container">
                    <graph-visualizer id="sa-graph-viz" layout="force"></graph-visualizer>
                </div>
                <div class="sa-graph-hint">
                    Click node for details | Drag to pan | Scroll to zoom
                </div>
            </div>
        `;
    }

    bindElements() {
        this.$domain = this.querySelector('#sa-domain');
        this.$analyzeBtn = this.querySelector('#sa-analyze-btn');
        this.$saveBtn = this.querySelector('#sa-save-btn');
        this.$exportBtn = this.querySelector('#sa-export-btn');
    }

    attachEventHandlers() {
        // Analyze button
        this.$analyzeBtn?.addEventListener('click', () => this.analyzeSite());

        // Save button
        this.$saveBtn?.addEventListener('click', () => this.saveAnalysis());

        // Export button
        this.$exportBtn?.addEventListener('click', () => this.exportJson());

        // Tab switching
        this.querySelectorAll('.sa-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Enter key on domain input
        this.$domain?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.analyzeSite();
        });
    }

    setupEventListeners() {
        // Listen for site loaded event
        this.siteLoadedHandler = (e) => {
            if (e.detail && e.detail.domain) {
                this.state.domain = e.detail.domain;
                this.render();
            }
        };
        this.events.on('site-loaded', this.siteLoadedHandler);
    }

    cleanup() {
        if (this.siteLoadedHandler) {
            this.events.off('site-loaded', this.siteLoadedHandler);
        }
    }

    async analyzeSite() {
        const domain = this.$domain.value.trim();
        if (!domain) return;

        this.state.domain = domain;
        this.state.loading = true;
        this.state.error = null;
        this.state.pages = [];
        this.render();

        this.events.emit('site-analysis-request', { domain });

        try {
            // Fetch all pages for this domain
            const namespace = this.config.get('defaults.namespace') || 'html-cache';
            const response = await this.api.call(
                'html-graph',
                `/cache-entity/${namespace}/entities`,
                'GET'
            );

            if (response && response.entities) {
                // Filter entities belonging to this domain
                const domainPages = response.entities.filter(entity => {
                    const key = entity.cache_key || entity.key || '';
                    return key.startsWith(domain) || key.includes(domain);
                });

                this.state.pages = domainPages;

                // Perform analysis
                const sitemapAnalysis = this.analyzeSitemap(domainPages, domain);
                const contentAnalysis = this.analyzeContent(domainPages);
                const linksAnalysis = this.analyzeLinks(domainPages, domain);

                this.state.analysis = {
                    sitemap: sitemapAnalysis,
                    content: contentAnalysis,
                    links: linksAnalysis
                };
                this.state.analyzedAt = new Date();
                this.state.loading = false;

                this.render();

                this.events.emit('site-analysis-complete', {
                    domain,
                    analysis: this.state.analysis
                });

                // If on link graph tab, render the graph
                if (this.state.activeTab === 'link-graph') {
                    setTimeout(() => this.renderLinkGraph(), 100);
                }
            } else {
                throw new Error('No entities found');
            }
        } catch (error) {
            this.state.loading = false;
            this.state.error = error.message || 'Analysis failed';
            this.render();
        }
    }

    analyzeSitemap(pages, domain) {
        // Build tree structure from paths
        const tree = [];
        const pathMap = {};
        let maxDepth = 0;
        const linkCounts = {};

        pages.forEach(page => {
            const key = page.cache_key || page.key || '';
            const path = key.replace(domain, '').replace(/^\/+/, '/') || '/';
            const depth = (path.match(/\//g) || []).length;

            maxDepth = Math.max(maxDepth, depth);

            pathMap[path] = {
                path,
                size: page.char_count || page.size || 0,
                date: page.updated_at || page.created_at || new Date(),
                children: []
            };

            // Count incoming links (simplified)
            linkCounts[path] = linkCounts[path] || 0;
        });

        // Organize into tree
        Object.values(pathMap).forEach(item => {
            const parentPath = item.path.split('/').slice(0, -1).join('/') || '/';
            if (parentPath !== item.path && pathMap[parentPath]) {
                pathMap[parentPath].children.push(item);
            } else if (item.path !== '/') {
                tree.push(item);
            }
        });

        // Add root if exists
        if (pathMap['/']) {
            tree.unshift(pathMap['/']);
        }

        // Identify orphan pages (pages with no parent in tree)
        const orphanPages = pages
            .filter(page => {
                const key = page.cache_key || page.key || '';
                const path = key.replace(domain, '').replace(/^\/+/, '/') || '/';
                const parentPath = path.split('/').slice(0, -1).join('/') || '/';
                return parentPath !== '/' && !pathMap[parentPath];
            })
            .slice(0, 10)
            .map(page => ({
                path: (page.cache_key || page.key || '').replace(domain, ''),
                size: page.char_count || page.size || 0,
                date: page.updated_at || new Date()
            }));

        // Find most linked page
        let mostLinked = { path: '/', count: 0 };
        Object.entries(linkCounts).forEach(([path, count]) => {
            if (count > mostLinked.count) {
                mostLinked = { path, count };
            }
        });

        // If no links tracked, just use first page
        if (mostLinked.count === 0 && pages.length > 0) {
            mostLinked = { path: pages[0].cache_key || '/', count: pages.length };
        }

        return {
            totalPages: pages.length,
            tree,
            orphanPages,
            maxDepth,
            mostLinked
        };
    }

    analyzeContent(pages) {
        let totalWords = 0;
        let totalSize = 0;

        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        let last7Days = 0;
        let last30Days = 0;
        let older = 0;

        const pageSizes = [];

        pages.forEach(page => {
            const size = page.char_count || page.size || 0;
            totalSize += size;

            // Estimate words (chars / 5)
            totalWords += Math.round(size / 5);

            // Track freshness
            const date = new Date(page.updated_at || page.created_at || now);
            if (date >= weekAgo) {
                last7Days++;
            } else if (date >= monthAgo) {
                last30Days++;
            } else {
                older++;
            }

            pageSizes.push({
                path: (page.cache_key || page.key || '').split('/').slice(1).join('/') || '/',
                size
            });
        });

        // Sort by size and get top 5
        pageSizes.sort((a, b) => b.size - a.size);
        const largestPages = pageSizes.slice(0, 5);

        const total = pages.length || 1;

        return {
            totalPages: pages.length,
            totalWords,
            avgWordsPerPage: Math.round(totalWords / total),
            totalSize,
            topicDistribution: null, // Would require LLM analysis
            freshness: [
                { label: 'Last 7 days', count: last7Days, percentage: Math.round((last7Days / total) * 100) },
                { label: 'Last 30 days', count: last30Days, percentage: Math.round((last30Days / total) * 100) },
                { label: 'Older', count: older, percentage: Math.round((older / total) * 100) }
            ],
            largestPages
        };
    }

    analyzeLinks(pages, domain) {
        const nodes = [];
        const edges = [];
        const nodeMap = {};

        // Create nodes for each page
        pages.forEach(page => {
            const key = page.cache_key || page.key || '';
            const path = key.replace(domain, '').replace(/^\/+/, '/') || '/';

            if (!nodeMap[path]) {
                nodeMap[path] = {
                    id: path,
                    label: path === '/' ? 'Home' : path.split('/').pop() || path,
                    type: 'internal',
                    data: { path, size: page.char_count || 0 }
                };
                nodes.push(nodeMap[path]);
            }
        });

        // Create links between pages (simplified - in real implementation would parse HTML)
        // For now, create hierarchical links based on path structure
        Object.keys(nodeMap).forEach(path => {
            if (path === '/') return;

            const parts = path.split('/').filter(Boolean);
            if (parts.length > 1) {
                const parentPath = '/' + parts.slice(0, -1).join('/');
                if (nodeMap[parentPath]) {
                    edges.push({
                        source: parentPath,
                        target: path,
                        type: 'internal'
                    });
                }
            } else {
                // Link to root
                if (nodeMap['/']) {
                    edges.push({
                        source: '/',
                        target: path,
                        type: 'internal'
                    });
                }
            }
        });

        // Add some external nodes as examples
        const externalDomains = ['twitter.com', 'linkedin.com', 'github.com'];
        externalDomains.slice(0, 2).forEach(extDomain => {
            const extId = `ext-${extDomain}`;
            nodes.push({
                id: extId,
                label: extDomain,
                type: 'external',
                data: { external: true }
            });

            // Link from a random internal page
            if (nodes.length > 3) {
                const randomPage = nodes[Math.floor(Math.random() * (nodes.length - 2))];
                if (randomPage.type === 'internal') {
                    edges.push({
                        source: randomPage.id,
                        target: extId,
                        type: 'external'
                    });
                }
            }
        });

        return { nodes, edges };
    }

    switchTab(tabName) {
        this.state.activeTab = tabName;
        this.render();

        if (tabName === 'link-graph' && this.state.analysis.links) {
            setTimeout(() => this.renderLinkGraph(), 100);
        }
    }

    renderLinkGraph() {
        const graphViz = this.querySelector('#sa-graph-viz');
        if (!graphViz || !this.state.analysis.links) return;

        graphViz.setData(this.state.analysis.links);

        this.events.emit('site-graph-complete', {
            type: 'links',
            domain: this.state.domain,
            graph: this.state.analysis.links
        });
    }

    async saveAnalysis() {
        if (!this.state.analysis.sitemap) return;

        try {
            const namespace = this.config.get('defaults.namespace') || 'html-cache';
            const analysisKey = `${this.state.domain}/_site-analysis`;

            await this.api.call(
                'html-graph',
                `/cache-entity/${namespace}/entity/${analysisKey}/data`,
                'POST',
                {
                    analysis: this.state.analysis,
                    analyzedAt: this.state.analyzedAt?.toISOString(),
                    domain: this.state.domain
                }
            );

            this.showToast('Analysis saved');
        } catch (error) {
            this.showToast('Failed to save: ' + error.message);
        }
    }

    exportJson() {
        if (!this.state.analysis.sitemap) return;

        const data = {
            domain: this.state.domain,
            analyzedAt: this.state.analyzedAt?.toISOString(),
            pageCount: this.state.pages.length,
            analysis: this.state.analysis
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `site-analysis-${this.state.domain.replace(/\./g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    formatDate(date) {
        return new Date(date).toLocaleString();
    }

    formatDateShort(date) {
        return new Date(date).toLocaleDateString();
    }

    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'sa-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    get config() { return window.workbench.config; }
    get api() { return window.workbench.api; }
    get events() { return window.workbench.events; }

    getStyles() {
        return `
            .site-analysis {
                display: flex;
                flex-direction: column;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5;
            }

            .sa-header {
                padding: 16px 20px;
                background: #fff;
                border-bottom: 1px solid #e0e0e0;
            }

            .sa-header h2 {
                margin: 0;
                font-size: 20px;
                color: #333;
            }

            .sa-toolbar {
                padding: 12px 20px;
                background: #fff;
                border-bottom: 1px solid #e0e0e0;
            }

            .sa-input-group {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .sa-input-group label {
                font-weight: 500;
                color: #555;
            }

            .sa-input {
                flex: 1;
                max-width: 300px;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
            }

            .sa-input:focus {
                outline: none;
                border-color: #667eea;
            }

            .sa-btn {
                padding: 8px 16px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: #fff;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.15s;
            }

            .sa-btn:hover:not(:disabled) {
                background: #f5f5f5;
            }

            .sa-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .sa-btn-primary {
                background: #667eea;
                color: #fff;
                border-color: #667eea;
            }

            .sa-btn-primary:hover:not(:disabled) {
                background: #5a6fd6;
            }

            .sa-tabs {
                display: flex;
                background: #fff;
                border-bottom: 1px solid #e0e0e0;
                padding: 0 20px;
            }

            .sa-tab {
                padding: 12px 20px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 14px;
                color: #666;
                border-bottom: 2px solid transparent;
                transition: all 0.15s;
            }

            .sa-tab:hover {
                color: #333;
            }

            .sa-tab.active {
                color: #667eea;
                border-bottom-color: #667eea;
            }

            .sa-content {
                flex: 1;
                overflow: auto;
                padding: 20px;
            }

            .sa-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #666;
            }

            .sa-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e0e0e0;
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .sa-loading-detail {
                margin-top: 10px;
                font-size: 13px;
                color: #888;
            }

            .sa-error {
                padding: 20px;
                background: #ffebee;
                color: #c62828;
                border-radius: 8px;
            }

            .sa-empty {
                padding: 40px;
                text-align: center;
                color: #666;
            }

            .sa-panel {
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .sa-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
            }

            .sa-panel-header h3 {
                margin: 0;
                font-size: 16px;
                color: #333;
            }

            .sa-header-info {
                display: flex;
                gap: 16px;
                align-items: center;
            }

            .sa-timestamp,
            .sa-page-count {
                font-size: 12px;
                color: #888;
            }

            .sa-section {
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
            }

            .sa-section:last-child {
                border-bottom: none;
            }

            .sa-section h4 {
                margin: 0 0 12px 0;
                font-size: 13px;
                font-weight: 600;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .sa-tree {
                font-family: 'SF Mono', Monaco, monospace;
                font-size: 13px;
            }

            .sa-tree-root {
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
            }

            .sa-tree-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 0;
            }

            .sa-tree-branch {
                color: #888;
            }

            .sa-tree-label {
                color: #1976d2;
            }

            .sa-tree-item.orphan .sa-tree-label {
                color: #f57c00;
            }

            .sa-tree-meta {
                color: #888;
                font-size: 11px;
                margin-left: auto;
            }

            .sa-orphans {
                background: #fff8e1;
            }

            .sa-summary-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .sa-summary-list li {
                padding: 6px 0;
                font-size: 14px;
                color: #555;
            }

            .sa-summary-list strong {
                color: #333;
            }

            .sa-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 16px;
            }

            .sa-stat {
                text-align: center;
                padding: 12px;
                background: #f9f9f9;
                border-radius: 6px;
            }

            .sa-stat-value {
                display: block;
                font-size: 24px;
                font-weight: 600;
                color: #333;
            }

            .sa-stat-label {
                display: block;
                font-size: 12px;
                color: #666;
                margin-top: 4px;
            }

            .sa-bars {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .sa-bar-row {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .sa-bar-label {
                width: 100px;
                font-size: 13px;
                color: #555;
            }

            .sa-bar-track {
                flex: 1;
                height: 20px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
            }

            .sa-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .sa-bar-fill.freshness {
                background: linear-gradient(90deg, #4caf50, #8bc34a);
            }

            .sa-bar-value {
                width: 120px;
                font-size: 12px;
                color: #666;
                text-align: right;
            }

            .sa-page-sizes {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .sa-size-row {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .sa-size-rank {
                width: 24px;
                font-size: 13px;
                color: #888;
            }

            .sa-size-path {
                width: 150px;
                font-size: 13px;
                font-family: monospace;
                color: #333;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .sa-size-bar {
                flex: 1;
                height: 16px;
                background: #f0f0f0;
                border-radius: 3px;
                overflow: hidden;
            }

            .sa-size-fill {
                height: 100%;
                background: #667eea;
                border-radius: 3px;
            }

            .sa-size-value {
                width: 80px;
                font-size: 12px;
                color: #666;
                text-align: right;
            }

            .sa-graph-panel {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
            }

            .sa-graph-legend {
                display: flex;
                gap: 20px;
                padding: 12px 20px;
                background: #f9f9f9;
                border-bottom: 1px solid #eee;
                font-size: 12px;
            }

            .sa-legend-item {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #555;
            }

            .sa-legend-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }

            .sa-legend-dot.internal {
                background: #667eea;
            }

            .sa-legend-dot.external {
                background: #f57c00;
            }

            .sa-legend-line {
                width: 20px;
                height: 2px;
            }

            .sa-legend-line.internal {
                background: #667eea;
            }

            .sa-legend-line.external {
                background: #f57c00;
                border-style: dashed;
            }

            .sa-graph-container {
                flex: 1;
                min-height: 400px;
            }

            .sa-graph-container graph-visualizer {
                width: 100%;
                height: 100%;
            }

            .sa-graph-hint {
                padding: 8px 20px;
                text-align: center;
                font-size: 12px;
                color: #888;
                background: #f9f9f9;
                border-top: 1px solid #eee;
            }

            .sa-footer {
                display: flex;
                gap: 10px;
                padding: 12px 20px;
                background: #fff;
                border-top: 1px solid #e0e0e0;
            }

            .sa-toast {
                position: fixed;
                bottom: 60px;
                right: 20px;
                background: #333;
                color: #fff;
                padding: 12px 20px;
                border-radius: 6px;
                font-size: 14px;
                z-index: 1000;
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
    }
}

customElements.define('site-analysis', SiteAnalysis);
