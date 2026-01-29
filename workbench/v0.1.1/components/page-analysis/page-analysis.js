/**
 * Page Analysis Mini App
 *
 * Purpose: Analyze individual page structure, content, and links
 * Story: M6
 * Version: v0.1.0
 */

class PageAnalysis extends HTMLElement {

    static get appId()    { return 'page-analysis'; }
    static get navLabel() { return 'Page Analysis'; }
    static get navIcon()  { return '📊'; }

    constructor() {
        super();
        this.state = {
            loading: false,
            error: null,
            cacheKey: '',
            cacheId: null,
            html: '',
            activeTab: 'structure',
            analysis: {
                structure: null,
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
        // Refresh from recent keys if available
    }

    onDeactivate() {
        // Nothing needed
    }

    render() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="page-analysis">
                <div class="pa-header">
                    <h2>Page Analysis</h2>
                </div>

                <div class="pa-toolbar">
                    <div class="pa-input-group">
                        <label>Cache Key:</label>
                        <input type="text" id="pa-cache-key" class="pa-input" placeholder="example.com/about" value="${this.state.cacheKey}">
                        <button class="pa-btn" id="pa-load-btn">Load</button>
                        <button class="pa-btn pa-btn-primary" id="pa-analyze-btn" ${!this.state.html ? 'disabled' : ''}>Analyze</button>
                    </div>
                </div>

                <div class="pa-tabs">
                    <button class="pa-tab ${this.state.activeTab === 'structure' ? 'active' : ''}" data-tab="structure">Structure</button>
                    <button class="pa-tab ${this.state.activeTab === 'content' ? 'active' : ''}" data-tab="content">Content</button>
                    <button class="pa-tab ${this.state.activeTab === 'links' ? 'active' : ''}" data-tab="links">Links</button>
                    <button class="pa-tab ${this.state.activeTab === 'dom-graph' ? 'active' : ''}" data-tab="dom-graph">DOM Graph</button>
                </div>

                <div class="pa-content">
                    ${this.state.loading ? this.renderLoading() : ''}
                    ${this.state.error ? this.renderError() : ''}
                    ${!this.state.loading && !this.state.error ? this.renderActiveTab() : ''}
                </div>

                <div class="pa-footer">
                    <button class="pa-btn" id="pa-save-btn" ${!this.state.analysis.structure ? 'disabled' : ''}>Save Analysis</button>
                    <button class="pa-btn" id="pa-export-btn" ${!this.state.analysis.structure ? 'disabled' : ''}>Export JSON</button>
                </div>
            </div>
        `;

        this.bindElements();
        this.attachEventHandlers();
    }

    renderLoading() {
        return `
            <div class="pa-loading">
                <div class="pa-spinner"></div>
                <p>Analyzing page...</p>
            </div>
        `;
    }

    renderError() {
        return `
            <div class="pa-error">
                <p>${this.escapeHtml(this.state.error)}</p>
            </div>
        `;
    }

    renderActiveTab() {
        switch (this.state.activeTab) {
            case 'structure': return this.renderStructureTab();
            case 'content': return this.renderContentTab();
            case 'links': return this.renderLinksTab();
            case 'dom-graph': return this.renderDomGraphTab();
            default: return '';
        }
    }

    renderStructureTab() {
        const analysis = this.state.analysis.structure;

        if (!analysis) {
            return `
                <div class="pa-empty">
                    <p>Load a page and click "Analyze" to see structure analysis.</p>
                </div>
            `;
        }

        return `
            <div class="pa-panel">
                <div class="pa-panel-header">
                    <h3>Structure Analysis</h3>
                    ${this.state.analyzedAt ? `<span class="pa-timestamp">Analyzed: ${this.formatDate(this.state.analyzedAt)}</span>` : ''}
                </div>

                <div class="pa-section">
                    <h4>Summary</h4>
                    <div class="pa-stats-grid">
                        <div class="pa-stat">
                            <span class="pa-stat-value">${analysis.totalElements}</span>
                            <span class="pa-stat-label">Total Elements</span>
                        </div>
                        <div class="pa-stat">
                            <span class="pa-stat-value">${analysis.maxDepth}</span>
                            <span class="pa-stat-label">Max DOM Depth</span>
                        </div>
                        <div class="pa-stat">
                            <span class="pa-stat-value">${analysis.textNodes}</span>
                            <span class="pa-stat-label">Text Nodes</span>
                        </div>
                        <div class="pa-stat">
                            <span class="pa-stat-value">${this.formatBytes(analysis.charCount)}</span>
                            <span class="pa-stat-label">Size</span>
                        </div>
                    </div>
                </div>

                <div class="pa-section">
                    <h4>Element Distribution</h4>
                    <div class="pa-bars">
                        ${analysis.elementDistribution.map(item => `
                            <div class="pa-bar-row">
                                <span class="pa-bar-label">${item.tag}</span>
                                <div class="pa-bar-track">
                                    <div class="pa-bar-fill" style="width: ${item.percentage}%"></div>
                                </div>
                                <span class="pa-bar-value">${item.count} (${item.percentage}%)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="pa-section">
                    <h4>Semantic Structure</h4>
                    <ul class="pa-checklist">
                        ${analysis.semanticElements.map(item => `
                            <li class="${item.present ? 'present' : 'missing'}">
                                ${item.present ? '✓' : '✗'} Has &lt;${item.tag}&gt;
                            </li>
                        `).join('')}
                    </ul>
                    ${analysis.mainContent ? `<p class="pa-note">Main Content: ${this.escapeHtml(analysis.mainContent)} (detected)</p>` : ''}
                </div>
            </div>
        `;
    }

    renderContentTab() {
        const analysis = this.state.analysis.content;

        if (!analysis) {
            return `
                <div class="pa-empty">
                    <p>Content analysis requires LLM API. Run analysis to see content insights.</p>
                </div>
            `;
        }

        return `
            <div class="pa-panel">
                <div class="pa-panel-header">
                    <h3>Content Analysis</h3>
                    ${this.state.analyzedAt ? `<span class="pa-timestamp">Analyzed: ${this.formatDate(this.state.analyzedAt)}</span>` : ''}
                </div>

                <div class="pa-section">
                    <h4>Reading Stats</h4>
                    <div class="pa-stats-grid">
                        <div class="pa-stat">
                            <span class="pa-stat-value">${analysis.wordCount.toLocaleString()}</span>
                            <span class="pa-stat-label">Word Count</span>
                        </div>
                        <div class="pa-stat">
                            <span class="pa-stat-value">~${analysis.readingTime} min</span>
                            <span class="pa-stat-label">Reading Time</span>
                        </div>
                        <div class="pa-stat">
                            <span class="pa-stat-value">Grade ${analysis.readability}</span>
                            <span class="pa-stat-label">Readability</span>
                        </div>
                        <div class="pa-stat">
                            <span class="pa-stat-value">${analysis.language}</span>
                            <span class="pa-stat-label">Language</span>
                        </div>
                    </div>
                </div>

                ${analysis.topics ? `
                    <div class="pa-section">
                        <h4>Topics</h4>
                        <div class="pa-bars">
                            ${analysis.topics.map(topic => `
                                <div class="pa-bar-row">
                                    <span class="pa-bar-label">${topic.name}</span>
                                    <div class="pa-bar-track">
                                        <div class="pa-bar-fill" style="width: ${topic.percentage}%"></div>
                                    </div>
                                    <span class="pa-bar-value">${topic.percentage}%</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${analysis.sentiment !== undefined ? `
                    <div class="pa-section">
                        <h4>Sentiment</h4>
                        <div class="pa-sentiment">
                            <div class="pa-sentiment-label">
                                Overall: ${analysis.sentiment > 0.5 ? 'Positive' : analysis.sentiment < 0.5 ? 'Negative' : 'Neutral'}
                                (${analysis.sentiment.toFixed(2)})
                            </div>
                            <div class="pa-sentiment-bar">
                                <div class="pa-sentiment-track">
                                    <div class="pa-sentiment-marker" style="left: ${analysis.sentiment * 100}%"></div>
                                </div>
                                <div class="pa-sentiment-labels">
                                    <span>Negative</span>
                                    <span>Positive</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${analysis.entities ? `
                    <div class="pa-section">
                        <h4>Entities Mentioned</h4>
                        <div class="pa-entities">
                            ${Object.entries(analysis.entities).map(([type, items]) => `
                                <div class="pa-entity-group">
                                    <span class="pa-entity-type">${type}:</span>
                                    <span class="pa-entity-items">${items.join(', ')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderLinksTab() {
        const analysis = this.state.analysis.links;

        if (!analysis) {
            return `
                <div class="pa-empty">
                    <p>Run analysis to see link information.</p>
                </div>
            `;
        }

        return `
            <div class="pa-panel">
                <div class="pa-panel-header">
                    <h3>Links Analysis</h3>
                    ${this.state.analyzedAt ? `<span class="pa-timestamp">Analyzed: ${this.formatDate(this.state.analyzedAt)}</span>` : ''}
                </div>

                <div class="pa-section">
                    <h4>Summary</h4>
                    <div class="pa-stats-grid">
                        <div class="pa-stat">
                            <span class="pa-stat-value">${analysis.total}</span>
                            <span class="pa-stat-label">Total Links</span>
                        </div>
                        <div class="pa-stat">
                            <span class="pa-stat-value">${analysis.internal}</span>
                            <span class="pa-stat-label">Internal</span>
                        </div>
                        <div class="pa-stat">
                            <span class="pa-stat-value">${analysis.external}</span>
                            <span class="pa-stat-label">External</span>
                        </div>
                        <div class="pa-stat">
                            <span class="pa-stat-value">${analysis.broken || 0}</span>
                            <span class="pa-stat-label">Broken</span>
                        </div>
                    </div>
                </div>

                <div class="pa-section">
                    <h4>Internal Links</h4>
                    <ul class="pa-link-list">
                        ${analysis.internalLinks.slice(0, 20).map(link => `
                            <li class="pa-link-item">
                                <span class="pa-link-url">${this.escapeHtml(link.href)}</span>
                                ${link.text ? `<span class="pa-link-text">${this.escapeHtml(link.text)}</span>` : ''}
                            </li>
                        `).join('')}
                        ${analysis.internalLinks.length > 20 ? `<li class="pa-link-more">...and ${analysis.internalLinks.length - 20} more</li>` : ''}
                    </ul>
                </div>

                <div class="pa-section">
                    <h4>External Links</h4>
                    <ul class="pa-link-list external">
                        ${analysis.externalLinks.slice(0, 20).map(link => `
                            <li class="pa-link-item">
                                <span class="pa-link-url">${this.escapeHtml(link.href)}</span>
                                ${link.text ? `<span class="pa-link-text">${this.escapeHtml(link.text)}</span>` : ''}
                            </li>
                        `).join('')}
                        ${analysis.externalLinks.length > 20 ? `<li class="pa-link-more">...and ${analysis.externalLinks.length - 20} more</li>` : ''}
                    </ul>
                </div>
            </div>
        `;
    }

    renderDomGraphTab() {
        if (!this.state.html) {
            return `
                <div class="pa-empty">
                    <p>Load a page to visualize its DOM structure.</p>
                </div>
            `;
        }

        return `
            <div class="pa-graph-container">
                <graph-visualizer id="pa-graph-viz" layout="hierarchy"></graph-visualizer>
            </div>
        `;
    }

    bindElements() {
        this.$cacheKey = this.querySelector('#pa-cache-key');
        this.$loadBtn = this.querySelector('#pa-load-btn');
        this.$analyzeBtn = this.querySelector('#pa-analyze-btn');
        this.$saveBtn = this.querySelector('#pa-save-btn');
        this.$exportBtn = this.querySelector('#pa-export-btn');
    }

    attachEventHandlers() {
        // Load button
        this.$loadBtn?.addEventListener('click', () => this.loadPage());

        // Analyze button
        this.$analyzeBtn?.addEventListener('click', () => this.analyzePage());

        // Save button
        this.$saveBtn?.addEventListener('click', () => this.saveAnalysis());

        // Export button
        this.$exportBtn?.addEventListener('click', () => this.exportJson());

        // Tab switching
        this.querySelectorAll('.pa-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Enter key on cache key input
        this.$cacheKey?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.loadPage();
        });
    }

    setupEventListeners() {
        // Listen for entity selection
        this.entitySelectedHandler = (e) => {
            if (e.detail && e.detail.cacheKey) {
                this.state.cacheKey = e.detail.cacheKey;
                this.render();
                this.loadPage();
            }
        };
        this.events.on('entity-selected', this.entitySelectedHandler);
    }

    cleanup() {
        if (this.entitySelectedHandler) {
            this.events.off('entity-selected', this.entitySelectedHandler);
        }
    }

    async loadPage() {
        const cacheKey = this.$cacheKey.value.trim();
        if (!cacheKey) return;

        this.state.cacheKey = cacheKey;
        this.state.loading = true;
        this.state.error = null;
        this.render();

        try {
            const namespace = this.config.get('defaults.namespace') || 'html-cache';
            const response = await this.api.call(
                'html-graph',
                `/cache-entity/${namespace}/entity/${cacheKey}/html`,
                'GET'
            );

            if (response && response.html) {
                this.state.html = response.html;
                this.state.cacheId = response.cache_id;
                this.state.loading = false;
                this.render();

                this.events.emit('html-loaded', {
                    cacheKey,
                    cacheId: response.cache_id,
                    html: response.html
                });
            } else {
                throw new Error('HTML not found');
            }
        } catch (error) {
            this.state.loading = false;
            this.state.error = error.message || 'Failed to load page';
            this.render();
        }
    }

    async analyzePage() {
        if (!this.state.html) return;

        this.state.loading = true;
        this.state.error = null;
        this.render();

        try {
            // Perform local analysis
            const structureAnalysis = this.analyzeStructure(this.state.html);
            const linksAnalysis = this.analyzeLinks(this.state.html);
            const contentAnalysis = this.analyzeContent(this.state.html);

            this.state.analysis = {
                structure: structureAnalysis,
                content: contentAnalysis,
                links: linksAnalysis
            };
            this.state.analyzedAt = new Date();
            this.state.loading = false;

            this.render();

            // Emit analysis complete event
            this.events.emit('analysis-complete', {
                type: 'page',
                cacheId: this.state.cacheId,
                analysis: this.state.analysis
            });

            // If on DOM graph tab, render the graph
            if (this.state.activeTab === 'dom-graph') {
                this.renderDomGraph();
            }
        } catch (error) {
            this.state.loading = false;
            this.state.error = error.message || 'Analysis failed';
            this.render();
        }
    }

    analyzeStructure(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Count elements
        const allElements = doc.querySelectorAll('*');
        const elementCounts = {};

        allElements.forEach(el => {
            const tag = el.tagName.toLowerCase();
            elementCounts[tag] = (elementCounts[tag] || 0) + 1;
        });

        // Sort by count and get top elements
        const sorted = Object.entries(elementCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7);

        const total = allElements.length;
        const elementDistribution = sorted.map(([tag, count]) => ({
            tag,
            count,
            percentage: Math.round((count / total) * 100)
        }));

        // Calculate max depth
        const getDepth = (el, depth = 0) => {
            const children = el.children;
            if (children.length === 0) return depth;
            return Math.max(...Array.from(children).map(c => getDepth(c, depth + 1)));
        };
        const maxDepth = getDepth(doc.documentElement);

        // Count text nodes
        const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        let textNodes = 0;
        while (walker.nextNode()) {
            if (walker.currentNode.textContent.trim()) textNodes++;
        }

        // Semantic elements check
        const semanticTags = ['header', 'nav', 'main', 'article', 'aside', 'footer'];
        const semanticElements = semanticTags.map(tag => ({
            tag,
            present: doc.querySelector(tag) !== null
        }));

        // Detect main content
        let mainContent = null;
        const mainEl = doc.querySelector('main, article, [role="main"], .content, #content');
        if (mainEl) {
            mainContent = mainEl.tagName.toLowerCase();
            if (mainEl.className) mainContent += '.' + mainEl.className.split(' ')[0];
            else if (mainEl.id) mainContent += '#' + mainEl.id;
        }

        return {
            totalElements: total,
            maxDepth,
            textNodes,
            charCount: html.length,
            elementDistribution,
            semanticElements,
            mainContent
        };
    }

    analyzeContent(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract text content
        const textContent = doc.body?.textContent || '';
        const words = textContent.split(/\s+/).filter(w => w.length > 0);

        const wordCount = words.length;
        const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute

        // Simple readability estimate (average word length based)
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
        const readability = Math.min(16, Math.max(1, Math.round(avgWordLength * 2)));

        return {
            wordCount,
            readingTime,
            readability,
            language: 'English (detected)',
            topics: null, // Would require LLM
            sentiment: null, // Would require LLM
            entities: null // Would require LLM
        };
    }

    analyzeLinks(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const links = doc.querySelectorAll('a[href]');
        const currentDomain = this.extractDomain(this.state.cacheKey);

        const internalLinks = [];
        const externalLinks = [];

        links.forEach(link => {
            const href = link.getAttribute('href');
            const text = link.textContent.trim();

            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            const linkInfo = { href, text: text.substring(0, 50) };

            if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
                internalLinks.push(linkInfo);
            } else if (href.startsWith('http')) {
                const linkDomain = this.extractDomain(href);
                if (linkDomain === currentDomain) {
                    internalLinks.push(linkInfo);
                } else {
                    externalLinks.push(linkInfo);
                }
            } else {
                internalLinks.push(linkInfo);
            }
        });

        return {
            total: internalLinks.length + externalLinks.length,
            internal: internalLinks.length,
            external: externalLinks.length,
            internalLinks,
            externalLinks
        };
    }

    extractDomain(url) {
        try {
            if (url.startsWith('http')) {
                return new URL(url).hostname;
            }
            return url.split('/')[0];
        } catch {
            return url.split('/')[0];
        }
    }

    switchTab(tabName) {
        this.state.activeTab = tabName;
        this.render();

        if (tabName === 'dom-graph' && this.state.html) {
            setTimeout(() => this.renderDomGraph(), 100);
        }
    }

    renderDomGraph() {
        const graphViz = this.querySelector('#pa-graph-viz');
        if (!graphViz || !this.state.html) return;

        // Build DOM tree graph data
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.state.html, 'text/html');

        const nodes = [];
        const edges = [];
        let nodeId = 0;

        const processNode = (el, parentId = null, depth = 0) => {
            if (depth > 6) return; // Limit depth for visualization

            const id = `node-${nodeId++}`;
            const tagName = el.tagName?.toLowerCase() || 'text';

            nodes.push({
                id,
                label: tagName,
                type: this.getNodeType(tagName),
                data: {
                    tag: tagName,
                    classes: el.className || '',
                    id: el.id || ''
                }
            });

            if (parentId) {
                edges.push({
                    source: parentId,
                    target: id,
                    type: 'child'
                });
            }

            // Process children (limit to first 5 at each level)
            const children = Array.from(el.children).slice(0, 5);
            children.forEach(child => processNode(child, id, depth + 1));
        };

        processNode(doc.documentElement);

        graphViz.setData({ nodes, edges });

        this.events.emit('graph-complete', {
            type: 'dom-tree',
            graph: { nodes, edges }
        });
    }

    getNodeType(tagName) {
        const semanticTags = ['html', 'head', 'body', 'header', 'nav', 'main', 'article', 'aside', 'footer'];
        if (semanticTags.includes(tagName)) return 'semantic';
        if (['div', 'span', 'p'].includes(tagName)) return 'layout';
        if (['a', 'button'].includes(tagName)) return 'interactive';
        if (['img', 'video', 'audio'].includes(tagName)) return 'media';
        return 'default';
    }

    async saveAnalysis() {
        if (!this.state.analysis.structure) return;

        try {
            const namespace = this.config.get('defaults.namespace') || 'html-cache';
            const analysisKey = `${this.state.cacheKey}/_page-analysis`;

            await this.api.call(
                'html-graph',
                `/cache-entity/${namespace}/entity/${analysisKey}/data`,
                'POST',
                {
                    analysis: this.state.analysis,
                    analyzedAt: this.state.analyzedAt?.toISOString(),
                    cacheKey: this.state.cacheKey
                }
            );

            this.showToast('Analysis saved');
        } catch (error) {
            this.showToast('Failed to save: ' + error.message);
        }
    }

    exportJson() {
        if (!this.state.analysis.structure) return;

        const data = {
            cacheKey: this.state.cacheKey,
            analyzedAt: this.state.analyzedAt?.toISOString(),
            analysis: this.state.analysis
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `page-analysis-${this.state.cacheKey.replace(/\//g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    formatDate(date) {
        return new Date(date).toLocaleString();
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
        toast.className = 'pa-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    get config() { return window.workbench.config; }
    get api() { return window.workbench.api; }
    get events() { return window.workbench.events; }

    getStyles() {
        return `
            .page-analysis {
                display: flex;
                flex-direction: column;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5;
            }

            .pa-header {
                padding: 16px 20px;
                background: #fff;
                border-bottom: 1px solid #e0e0e0;
            }

            .pa-header h2 {
                margin: 0;
                font-size: 20px;
                color: #333;
            }

            .pa-toolbar {
                padding: 12px 20px;
                background: #fff;
                border-bottom: 1px solid #e0e0e0;
            }

            .pa-input-group {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .pa-input-group label {
                font-weight: 500;
                color: #555;
            }

            .pa-input {
                flex: 1;
                max-width: 400px;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
            }

            .pa-input:focus {
                outline: none;
                border-color: #667eea;
            }

            .pa-btn {
                padding: 8px 16px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: #fff;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.15s;
            }

            .pa-btn:hover:not(:disabled) {
                background: #f5f5f5;
            }

            .pa-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .pa-btn-primary {
                background: #667eea;
                color: #fff;
                border-color: #667eea;
            }

            .pa-btn-primary:hover:not(:disabled) {
                background: #5a6fd6;
            }

            .pa-tabs {
                display: flex;
                background: #fff;
                border-bottom: 1px solid #e0e0e0;
                padding: 0 20px;
            }

            .pa-tab {
                padding: 12px 20px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 14px;
                color: #666;
                border-bottom: 2px solid transparent;
                transition: all 0.15s;
            }

            .pa-tab:hover {
                color: #333;
            }

            .pa-tab.active {
                color: #667eea;
                border-bottom-color: #667eea;
            }

            .pa-content {
                flex: 1;
                overflow: auto;
                padding: 20px;
            }

            .pa-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #666;
            }

            .pa-spinner {
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

            .pa-error {
                padding: 20px;
                background: #ffebee;
                color: #c62828;
                border-radius: 8px;
            }

            .pa-empty {
                padding: 40px;
                text-align: center;
                color: #666;
            }

            .pa-panel {
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .pa-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
            }

            .pa-panel-header h3 {
                margin: 0;
                font-size: 16px;
                color: #333;
            }

            .pa-timestamp {
                font-size: 12px;
                color: #888;
            }

            .pa-section {
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
            }

            .pa-section:last-child {
                border-bottom: none;
            }

            .pa-section h4 {
                margin: 0 0 12px 0;
                font-size: 13px;
                font-weight: 600;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .pa-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 16px;
            }

            .pa-stat {
                text-align: center;
                padding: 12px;
                background: #f9f9f9;
                border-radius: 6px;
            }

            .pa-stat-value {
                display: block;
                font-size: 24px;
                font-weight: 600;
                color: #333;
            }

            .pa-stat-label {
                display: block;
                font-size: 12px;
                color: #666;
                margin-top: 4px;
            }

            .pa-bars {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .pa-bar-row {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .pa-bar-label {
                width: 80px;
                font-size: 13px;
                font-family: monospace;
                color: #555;
            }

            .pa-bar-track {
                flex: 1;
                height: 20px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
            }

            .pa-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .pa-bar-value {
                width: 80px;
                font-size: 12px;
                color: #666;
                text-align: right;
            }

            .pa-checklist {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .pa-checklist li {
                padding: 6px 0;
                font-size: 14px;
            }

            .pa-checklist li.present {
                color: #4caf50;
            }

            .pa-checklist li.missing {
                color: #f44336;
            }

            .pa-note {
                margin: 12px 0 0;
                font-size: 13px;
                color: #666;
                font-style: italic;
            }

            .pa-sentiment {
                padding: 12px;
                background: #f9f9f9;
                border-radius: 6px;
            }

            .pa-sentiment-label {
                font-size: 14px;
                margin-bottom: 12px;
            }

            .pa-sentiment-track {
                height: 8px;
                background: linear-gradient(90deg, #f44336, #ffeb3b, #4caf50);
                border-radius: 4px;
                position: relative;
            }

            .pa-sentiment-marker {
                position: absolute;
                top: -4px;
                width: 16px;
                height: 16px;
                background: #333;
                border: 2px solid #fff;
                border-radius: 50%;
                transform: translateX(-50%);
            }

            .pa-sentiment-labels {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #666;
                margin-top: 4px;
            }

            .pa-entities {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .pa-entity-group {
                display: flex;
                gap: 8px;
            }

            .pa-entity-type {
                font-weight: 500;
                color: #555;
            }

            .pa-entity-items {
                color: #666;
            }

            .pa-link-list {
                list-style: none;
                padding: 0;
                margin: 0;
                max-height: 300px;
                overflow: auto;
            }

            .pa-link-item {
                padding: 8px;
                border-bottom: 1px solid #f0f0f0;
            }

            .pa-link-url {
                display: block;
                font-family: monospace;
                font-size: 13px;
                color: #1976d2;
            }

            .pa-link-text {
                display: block;
                font-size: 12px;
                color: #666;
                margin-top: 2px;
            }

            .pa-link-list.external .pa-link-url {
                color: #f57c00;
            }

            .pa-link-more {
                padding: 8px;
                color: #666;
                font-style: italic;
            }

            .pa-graph-container {
                height: 100%;
                min-height: 400px;
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
            }

            .pa-graph-container graph-visualizer {
                width: 100%;
                height: 100%;
            }

            .pa-footer {
                display: flex;
                gap: 10px;
                padding: 12px 20px;
                background: #fff;
                border-top: 1px solid #e0e0e0;
            }

            .pa-toast {
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

customElements.define('page-analysis', PageAnalysis);
