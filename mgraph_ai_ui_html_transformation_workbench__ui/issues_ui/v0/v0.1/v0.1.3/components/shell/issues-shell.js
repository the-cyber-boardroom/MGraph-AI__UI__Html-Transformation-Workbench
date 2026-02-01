/**
 * Issues Shell Component - v0.1.3
 *
 * Purpose: Main application shell for Issues UI with enhanced features
 * Version: v0.1.3
 *
 * Changes from v0.1.2:
 * - Bug-1: Added API Docs link in header
 * - Bug-3: Left nav collapses to icons only
 * - Feature-11: Hash-based URL routing for persistence
 *
 * Namespace: window.issuesApp
 */

// Define navigation sections and their apps
const NAV_SECTIONS = [
    {
        id: 'issues',
        label: 'Issues',
        icon: '\u{1F4CB}',
        apps: ['node-list', 'kanban-board', 'node-detail']
    }
];

// Apps that open in right sidebar instead of main area
const SIDEBAR_APPS = ['events-viewer', 'api-logger', 'automation-runner'];

// Available versions for the version switcher
const AVAILABLE_VERSIONS = [
    { id: 'v0.1.0', label: 'v0.1.0 (Base)' },
    { id: 'v0.1.1', label: 'v0.1.1 (API Logger)' },
    { id: 'v0.1.2', label: 'v0.1.2 (Automation)' },
    { id: 'v0.1.3', label: 'v0.1.3 (Enhanced)' }
];

class IssuesShell extends HTMLElement {
    constructor() {
        super();
        this._apps = [];
        this._appInstances = new Map();
        this._currentAppId = null;
        this._boundHandlers = {};
        this._sidebarOpen = false;
        this._activeSidebarTab = null;
        this._collapsedSections = new Set();
        this._navCollapsed = false;  // Bug-3: Track nav collapsed state
        this._pendingNavigation = null;  // Feature-11: Pending hash navigation
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.initializeRouter();
        this.initHashRouting();  // Feature-11
        console.log('[Issues UI v0.1.3] Shell initialized with API Docs, Collapsible Nav, Hash Routing');
    }

    disconnectedCallback() {
        this.cleanup();
    }

    cleanup() {
        this.events.off('navigate', this._boundHandlers.onNavigate);
        this.events.off('navigated', this._boundHandlers.onNavigated);
        this.events.off('navigate-to-node', this._boundHandlers.onNavigateToNode);
        window.removeEventListener('hashchange', this._boundHandlers.onHashChange);
    }

    render() {
        this.innerHTML = `
            <style>
                /* Bug-3: Collapsible nav styles - simplified without sections */
                .shell-left-nav.collapsed {
                    width: 50px !important;
                    min-width: 50px !important;
                }
                .shell-left-nav.collapsed .nav-item-label {
                    display: none;
                }
                .shell-left-nav.collapsed .nav-item {
                    justify-content: center;
                    padding: 12px 8px;
                }
                .shell-left-nav.collapsed .nav-item-icon {
                    margin-right: 0;
                    font-size: 20px;
                }
                .shell-left-nav.collapsed .left-nav-resize {
                    display: none;
                }
                /* Nav items styling */
                #nav-sections {
                    padding: 8px 0;
                }
                #nav-sections .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 16px;
                    cursor: pointer;
                    transition: background 0.15s;
                    border-radius: 6px;
                    margin: 2px 8px;
                }
                #nav-sections .nav-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                #nav-sections .nav-item.active {
                    background: rgba(233, 69, 96, 0.2);
                }
                #nav-sections .nav-item-icon {
                    font-size: 16px;
                }
                #nav-sections .nav-item-label {
                    font-size: 13px;
                    color: #c0c0c0;
                }
                #nav-sections .nav-item.active .nav-item-label {
                    color: #fff;
                }
                .nav-collapse-btn {
                    background: none;
                    border: 1px solid #3a4f6f;
                    color: var(--text-muted, #8a9cc4);
                    cursor: pointer;
                    padding: 8px 12px;
                    font-size: 14px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .nav-collapse-btn:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: #667eea;
                }
                .nav-footer {
                    padding: 12px;
                    border-top: 1px solid var(--border-color, #2a3f5f);
                    display: flex;
                    justify-content: center;
                }
                /* Bug-1: API Docs button */
                .api-docs-btn {
                    background: var(--accent-color, #3b82f6);
                    color: white;
                    border: none;
                    padding: 4px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    margin-left: 12px;
                    transition: background 0.2s;
                }
                .api-docs-btn:hover {
                    background: var(--accent-hover, #2563eb);
                }
            </style>

            <header class="shell-header">
                <span class="shell-logo">\u{1F4CB}</span>
                <span class="shell-title">Issues Tracker</span>
                <button class="api-docs-btn" id="api-docs-btn" title="Open API Documentation">API Docs</button>
                <div class="version-switcher">
                    <label>Version:</label>
                    <select id="version-select">
                        ${AVAILABLE_VERSIONS.map(v =>
                            `<option value="${v.id}" ${v.id === 'v0.1.3' ? 'selected' : ''}>${v.label}</option>`
                        ).join('')}
                    </select>
                </div>
            </header>

            <div class="shell-body">
                <nav class="shell-left-nav ${this._navCollapsed ? 'collapsed' : ''}" id="left-nav">
                    <div class="shell-left-nav-inner">
                        <div id="nav-sections"></div>
                        <div class="nav-footer">
                            <button class="nav-collapse-btn" id="nav-collapse-btn" title="Toggle sidebar">
                                ${this._navCollapsed ? '\u{25B6}' : '\u{25C0}'}
                            </button>
                        </div>
                        <div class="left-nav-resize" id="left-nav-resize"></div>
                    </div>
                </nav>

                <div class="shell-main-area">
                    <main class="shell-container" id="main-container"></main>
                </div>

                <aside class="shell-sidebar" id="shell-sidebar">
                    <div class="sidebar-resize-handle" id="sidebar-resize"></div>
                    <div class="sidebar-header">
                        <button class="sidebar-tab" data-tab="events-viewer">Events</button>
                        <button class="sidebar-tab" data-tab="api-logger">API</button>
                        <button class="sidebar-tab" data-tab="automation-runner">Auto</button>
                        <button class="sidebar-close" id="sidebar-close">&times;</button>
                    </div>
                    <div class="sidebar-content" id="sidebar-content"></div>
                </aside>
            </div>

            <footer class="shell-footer">
                <span class="status">Ready</span>
                <span class="active-app">Active: None</span>
                <span class="app-count">Apps: 0</span>
                <button class="sidebar-toggle" id="sidebar-toggle">Debug Panel</button>
            </footer>
        `;

        // Cache DOM references
        this.$leftNav = this.querySelector('#left-nav');
        this.$navSections = this.querySelector('#nav-sections');
        this.$container = this.querySelector('#main-container');
        this.$sidebar = this.querySelector('#shell-sidebar');
        this.$sidebarContent = this.querySelector('#sidebar-content');
        this.$sidebarToggle = this.querySelector('#sidebar-toggle');
        this.$sidebarClose = this.querySelector('#sidebar-close');
        this.$leftNavResize = this.querySelector('#left-nav-resize');
        this.$sidebarResize = this.querySelector('#sidebar-resize');
        this.$versionSelect = this.querySelector('#version-select');
        this.$status = this.querySelector('.status');
        this.$activeApp = this.querySelector('.active-app');
        this.$appCount = this.querySelector('.app-count');
        this.$navCollapseBtn = this.querySelector('#nav-collapse-btn');
        this.$apiDocsBtn = this.querySelector('#api-docs-btn');

        // Load saved preferences
        this._loadPreferences();
    }

    setupEventListeners() {
        // Navigation events
        this._boundHandlers.onNavigate = this.onNavigateRequest.bind(this);
        this._boundHandlers.onNavigated = this.onNavigated.bind(this);
        this._boundHandlers.onNavigateToNode = this.onNavigateToNode.bind(this);
        this.events.on('navigate', this._boundHandlers.onNavigate);
        this.events.on('navigated', this._boundHandlers.onNavigated);
        this.events.on('navigate-to-node', this._boundHandlers.onNavigateToNode);

        // Sidebar toggle
        this.$sidebarToggle?.addEventListener('click', () => this.toggleSidebar());
        this.$sidebarClose?.addEventListener('click', () => this.closeSidebar());

        // Sidebar tabs
        this.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', () => this.openSidebarTab(tab.dataset.tab));
        });

        // Version switcher
        this.$versionSelect?.addEventListener('change', (e) => this.switchVersion(e.target.value));

        // Bug-3: Nav collapse button
        this.$navCollapseBtn?.addEventListener('click', () => this.toggleNavCollapse());

        // Bug-1: API Docs button
        this.$apiDocsBtn?.addEventListener('click', () => this.openApiDocs());

        // Initialize resize handles
        this.initLeftNavResize();
        this.initSidebarResize();
    }

    // Bug-1: Open API Documentation
    openApiDocs() {
        window.open('/docs', '_blank');
        this.events.emit('api-docs-opened', {});
    }

    // Bug-3: Toggle nav collapse
    toggleNavCollapse() {
        this._navCollapsed = !this._navCollapsed;
        this.$leftNav.classList.toggle('collapsed', this._navCollapsed);
        this.$navCollapseBtn.textContent = this._navCollapsed ? '\u{25B6}' : '\u{25C0}';
        this._savePreferences();
        this.events.emit('nav-collapsed', { collapsed: this._navCollapsed });
    }

    // Feature-11: Initialize hash routing
    initHashRouting() {
        this._boundHandlers.onHashChange = this.handleHashRoute.bind(this);
        window.addEventListener('hashchange', this._boundHandlers.onHashChange);

        // Process initial hash after apps are registered
        setTimeout(() => this.handleHashRoute(), 100);
    }

    // Feature-11: Handle hash route changes
    handleHashRoute() {
        const hash = window.location.hash.slice(1); // Remove #
        if (!hash) return;

        console.log('[v0.1.3] Hash route:', hash);

        if (hash.startsWith('/issue/')) {
            const label = hash.split('/')[2];
            if (label) {
                // Navigate to node-detail and select the node
                if (this._appInstances.has('node-detail')) {
                    this.navigate('node-detail');
                    this.events.emit('navigate-to-node', { label });
                } else {
                    // Store for later when apps are registered
                    this._pendingNavigation = { app: 'node-detail', label };
                }
            }
        } else if (hash === '/kanban') {
            this.navigate('kanban-board');
        } else if (hash === '/issues') {
            this.navigate('node-list');
        }
    }

    // Feature-11: Update hash when navigating
    onNavigated(detail) {
        const { appId } = detail;
        if (appId === 'kanban-board') {
            this.updateHash('/kanban');
        } else if (appId === 'node-list') {
            this.updateHash('/issues');
        }
        // node-detail hash is set when a specific node is selected
    }

    // Feature-11: Handle navigate-to-node event (update hash)
    onNavigateToNode(detail) {
        if (detail && detail.label) {
            this.updateHash(`/issue/${detail.label}`);
        }
    }

    // Feature-11: Update URL hash without triggering navigation
    updateHash(path) {
        const newHash = '#' + path;
        if (window.location.hash !== newHash) {
            // Use replaceState to avoid adding to history on every small change
            history.replaceState(null, '', newHash);
        }
    }

    initializeRouter() {
        const shell = this;

        window.issuesApp.router = {
            register(MiniAppClass) {
                if (!MiniAppClass.appId || !MiniAppClass.navLabel) {
                    console.error('Mini app must have static appId and navLabel');
                    return;
                }

                const appInfo = {
                    appId: MiniAppClass.appId,
                    navLabel: MiniAppClass.navLabel,
                    navIcon: MiniAppClass.navIcon || '\u{1F4F1}',
                    MiniAppClass,
                    isSidebarApp: SIDEBAR_APPS.includes(MiniAppClass.appId)
                };

                if (shell._apps.find(a => a.appId === appInfo.appId)) {
                    return;
                }

                shell._apps.push(appInfo);

                // Create instance
                const tagName = MiniAppClass.appId;
                const instance = document.createElement(tagName);
                instance.style.display = 'none';

                // Add to appropriate container
                if (appInfo.isSidebarApp) {
                    shell.$sidebarContent.appendChild(instance);
                } else {
                    shell.$container.appendChild(instance);
                }

                shell._appInstances.set(appInfo.appId, instance);

                // Rebuild left nav when apps are registered
                shell.buildLeftNav();
                shell.updateFooter();

                shell.events.emit('app-registered', {
                    appId: appInfo.appId,
                    navLabel: appInfo.navLabel,
                    navIcon: appInfo.navIcon,
                    isSidebarApp: appInfo.isSidebarApp
                });

                // Check for pending navigation (Feature-11)
                if (shell._pendingNavigation && shell._pendingNavigation.app === appInfo.appId) {
                    const pending = shell._pendingNavigation;
                    shell._pendingNavigation = null;
                    shell.navigate(pending.app);
                    if (pending.label) {
                        setTimeout(() => {
                            shell.events.emit('navigate-to-node', { label: pending.label });
                        }, 50);
                    }
                    return;
                }

                // Navigate to first non-sidebar app if no hash route
                if (!window.location.hash && shell._apps.filter(a => !a.isSidebarApp).length === 1 && !appInfo.isSidebarApp) {
                    shell.navigate(appInfo.appId);
                }
            },

            navigate(appId) {
                shell.navigate(appId);
            },

            get current() {
                return shell._currentAppId;
            },

            get apps() {
                return shell._apps.map(a => ({
                    appId: a.appId,
                    navLabel: a.navLabel,
                    navIcon: a.navIcon,
                    isSidebarApp: a.isSidebarApp
                }));
            },

            openSidebar(tabId) {
                shell.openSidebarTab(tabId);
            },

            closeSidebar() {
                shell.closeSidebar();
            },

            toggleSidebar() {
                shell.toggleSidebar();
            }
        };
    }

    buildLeftNav() {
        if (!this.$navSections) return;

        // Get all non-sidebar apps (no section grouping - just show apps directly)
        const mainApps = this._apps.filter(app => !app.isSidebarApp);

        this.$navSections.innerHTML = mainApps.map(app => `
            <div class="nav-item ${app.appId === this._currentAppId ? 'active' : ''}"
                 data-app="${app.appId}">
                <span class="nav-item-icon">${app.navIcon}</span>
                <span class="nav-item-label">${app.navLabel}</span>
            </div>
        `).join('');

        // Attach event listeners to nav items
        this.$navSections.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const appId = item.dataset.app;
                this.navigate(appId);
            });
        });
    }

    onNavigateRequest(detail) {
        if (detail && detail.appId) {
            this.navigate(detail.appId);
        }
    }

    navigate(targetAppId) {
        const targetApp = this._apps.find(a => a.appId === targetAppId);
        if (!targetApp) {
            console.error(`App '${targetAppId}' not found`);
            return;
        }

        // If it's a sidebar app, open in sidebar
        if (targetApp.isSidebarApp) {
            this.openSidebarTab(targetAppId);
            return;
        }

        // Deactivate current main app
        if (this._currentAppId) {
            const currentApp = this._apps.find(a => a.appId === this._currentAppId);
            if (currentApp && !currentApp.isSidebarApp) {
                const currentInstance = this._appInstances.get(this._currentAppId);
                if (currentInstance) {
                    currentInstance.style.display = 'none';
                    if (typeof currentInstance.onDeactivate === 'function') {
                        try { currentInstance.onDeactivate(); } catch (e) {}
                    }
                }
            }
        }

        const previousAppId = this._currentAppId;

        // Activate target app
        const targetInstance = this._appInstances.get(targetAppId);
        if (targetInstance) {
            targetInstance.style.display = 'block';
            if (typeof targetInstance.onActivate === 'function') {
                try { targetInstance.onActivate(); } catch (e) {}
            }
        }

        this._currentAppId = targetAppId;
        this.updateFooter();
        this.updateNavActive();

        this.events.emit('navigated', { appId: targetAppId, previousAppId });
    }

    updateNavActive() {
        this.$navSections?.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.app === this._currentAppId);
        });
    }

    toggleSidebar() {
        if (this._sidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebarTab(this._activeSidebarTab || 'events-viewer');
        }
    }

    openSidebarTab(appId) {
        this.$sidebar.classList.add('open');
        this.$sidebarToggle.classList.add('active');
        this._sidebarOpen = true;

        // Deactivate previous tab
        if (this._activeSidebarTab && this._activeSidebarTab !== appId) {
            const prevInstance = this._appInstances.get(this._activeSidebarTab);
            if (prevInstance) {
                prevInstance.style.display = 'none';
                if (typeof prevInstance.onDeactivate === 'function') {
                    try { prevInstance.onDeactivate(); } catch (e) {}
                }
            }
        }

        // Activate new tab
        const instance = this._appInstances.get(appId);
        if (instance) {
            instance.style.display = 'block';
            if (typeof instance.onActivate === 'function') {
                try { instance.onActivate(); } catch (e) {}
            }
        }

        // Update tab buttons
        this.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === appId);
        });

        this._activeSidebarTab = appId;
    }

    closeSidebar() {
        this.$sidebar.classList.remove('open');
        this.$sidebarToggle.classList.remove('active');
        this._sidebarOpen = false;

        if (this._activeSidebarTab) {
            const instance = this._appInstances.get(this._activeSidebarTab);
            if (instance) {
                instance.style.display = 'none';
                if (typeof instance.onDeactivate === 'function') {
                    try { instance.onDeactivate(); } catch (e) {}
                }
            }
        }
    }

    initLeftNavResize() {
        let isResizing = false;
        let startX, startWidth;

        const startResize = (e) => {
            if (this._navCollapsed) return;  // Bug-3: Don't resize when collapsed
            isResizing = true;
            startX = e.clientX;
            startWidth = this.$leftNav.offsetWidth;
            this.$leftNavResize.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        };

        const doResize = (e) => {
            if (!isResizing) return;
            const diff = e.clientX - startX;
            const newWidth = Math.min(Math.max(startWidth + diff, 180), 400);
            this.$leftNav.style.width = newWidth + 'px';
        };

        const stopResize = () => {
            if (!isResizing) return;
            isResizing = false;
            this.$leftNavResize.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            this._savePreferences();
        };

        this.$leftNavResize?.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    }

    initSidebarResize() {
        let isResizing = false;
        let startX, startWidth;

        const startResize = (e) => {
            if (!this._sidebarOpen) return;
            isResizing = true;
            startX = e.clientX;
            startWidth = this.$sidebar.offsetWidth;
            this.$sidebarResize.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        };

        const doResize = (e) => {
            if (!isResizing) return;
            const diff = startX - e.clientX;
            const newWidth = Math.min(Math.max(startWidth + diff, 280), 800);
            this.$sidebar.style.width = newWidth + 'px';
        };

        const stopResize = () => {
            if (!isResizing) return;
            isResizing = false;
            this.$sidebarResize.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            this._savePreferences();
        };

        this.$sidebarResize?.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    }

    switchVersion(version) {
        const currentPath = window.location.pathname;
        const basePath = currentPath.replace(/v0\.1\.\d+\/index\.html$/, '');
        window.location.href = basePath + version + '/index.html';
    }

    _savePreferences() {
        try {
            const prefs = {
                leftNavWidth: this.$leftNav?.offsetWidth,
                sidebarWidth: this.$sidebar?.offsetWidth,
                collapsedSections: Array.from(this._collapsedSections),
                navCollapsed: this._navCollapsed  // Bug-3: Save collapsed state
            };
            localStorage.setItem('issues-app-prefs', JSON.stringify(prefs));
        } catch (e) {}
    }

    _loadPreferences() {
        try {
            const saved = localStorage.getItem('issues-app-prefs');
            if (saved) {
                const prefs = JSON.parse(saved);
                if (prefs.leftNavWidth && this.$leftNav && !prefs.navCollapsed) {
                    this.$leftNav.style.width = prefs.leftNavWidth + 'px';
                }
                if (prefs.collapsedSections) {
                    this._collapsedSections = new Set(prefs.collapsedSections);
                }
                // Bug-3: Restore collapsed state
                if (prefs.navCollapsed) {
                    this._navCollapsed = true;
                    this.$leftNav?.classList.add('collapsed');
                    if (this.$navCollapseBtn) {
                        this.$navCollapseBtn.textContent = '\u{25B6}';
                    }
                }
            }
        } catch (e) {}
    }

    updateFooter() {
        if (this.$activeApp) {
            const app = this._apps.find(a => a.appId === this._currentAppId);
            this.$activeApp.textContent = app ? `Active: ${app.navLabel}` : 'Active: None';
        }
        if (this.$appCount) {
            this.$appCount.textContent = `Apps: ${this._apps.length}`;
        }
    }

    setStatus(message) {
        if (this.$status) {
            this.$status.textContent = message;
        }
    }

    get events() {
        return window.issuesApp.events;
    }
}

customElements.define('issues-shell', IssuesShell);
