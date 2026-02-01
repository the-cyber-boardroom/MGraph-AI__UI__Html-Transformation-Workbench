/**
 * Issues Shell Component - v0.1.2
 *
 * Purpose: Main application shell for Issues UI with API Logger and Automation
 * Version: v0.1.2 (Complete replacement, not surgical override)
 *
 * Changes from v0.1.0:
 * - Added API Logger tab to sidebar
 * - Added Automation Runner tab to sidebar
 * - Updated version list
 *
 * Namespace: window.issuesApp
 */

// Define navigation sections and their apps
const NAV_SECTIONS = [
    {
        id: 'issues',
        label: 'Issues',
        icon: '📋',
        apps: ['node-list', 'kanban-board', 'node-detail']
    }
];

// Apps that open in right sidebar instead of main area
const SIDEBAR_APPS = ['events-viewer', 'api-logger', 'automation-runner'];

// Available versions for the version switcher
const AVAILABLE_VERSIONS = [
    { id: 'v0.1.0', label: 'v0.1.0 (Base)' },
    { id: 'v0.1.1', label: 'v0.1.1 (API Logger)' },
    { id: 'v0.1.2', label: 'v0.1.2 (Automation)' }
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
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.initializeRouter();
        console.log('[Issues UI v0.1.2] Shell initialized with API Logger and Automation');
    }

    disconnectedCallback() {
        this.cleanup();
    }

    cleanup() {
        this.events.off('navigate', this._boundHandlers.onNavigate);
    }

    render() {
        this.innerHTML = `
            <header class="shell-header">
                <span class="shell-logo">📋</span>
                <span class="shell-title">Issues Tracker</span>
                <div class="version-switcher">
                    <label>Version:</label>
                    <select id="version-select">
                        ${AVAILABLE_VERSIONS.map(v =>
                            `<option value="${v.id}" ${v.id === 'v0.1.2' ? 'selected' : ''}>${v.label}</option>`
                        ).join('')}
                    </select>
                </div>
            </header>

            <div class="shell-body">
                <nav class="shell-left-nav" id="left-nav">
                    <div class="shell-left-nav-inner">
                        <div id="nav-sections"></div>
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

        // Load saved preferences
        this._loadPreferences();
    }

    setupEventListeners() {
        // Navigation events
        this._boundHandlers.onNavigate = this.onNavigateRequest.bind(this);
        this.events.on('navigate', this._boundHandlers.onNavigate);

        // Sidebar toggle
        this.$sidebarToggle?.addEventListener('click', () => this.toggleSidebar());
        this.$sidebarClose?.addEventListener('click', () => this.closeSidebar());

        // Sidebar tabs
        this.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', () => this.openSidebarTab(tab.dataset.tab));
        });

        // Version switcher
        this.$versionSelect?.addEventListener('change', (e) => this.switchVersion(e.target.value));

        // Initialize resize handles
        this.initLeftNavResize();
        this.initSidebarResize();
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
                    navIcon: MiniAppClass.navIcon || '📱',
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

                // Navigate to first non-sidebar app
                if (shell._apps.filter(a => !a.isSidebarApp).length === 1 && !appInfo.isSidebarApp) {
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

        this.$navSections.innerHTML = NAV_SECTIONS.map(section => {
            const isCollapsed = this._collapsedSections.has(section.id);
            const sectionApps = this._apps.filter(app => section.apps.includes(app.appId));

            if (sectionApps.length === 0) return '';

            return `
                <div class="nav-section ${isCollapsed ? 'collapsed' : ''}" data-section="${section.id}">
                    <div class="nav-section-header" data-section="${section.id}">
                        <span class="nav-section-icon">${section.icon}</span>
                        <span class="nav-section-label">${section.label}</span>
                        <span class="nav-section-chevron">▼</span>
                    </div>
                    <div class="nav-section-items">
                        ${sectionApps.map(app => `
                            <div class="nav-item ${app.appId === this._currentAppId ? 'active' : ''}"
                                 data-app="${app.appId}">
                                <span class="nav-item-icon">${app.navIcon}</span>
                                <span class="nav-item-label">${app.navLabel}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Attach event listeners
        this.$navSections.querySelectorAll('.nav-section-header').forEach(header => {
            header.addEventListener('click', () => {
                const sectionId = header.dataset.section;
                const section = header.closest('.nav-section');
                section.classList.toggle('collapsed');

                if (section.classList.contains('collapsed')) {
                    this._collapsedSections.add(sectionId);
                } else {
                    this._collapsedSections.delete(sectionId);
                }
                this._savePreferences();
            });
        });

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
                collapsedSections: Array.from(this._collapsedSections)
            };
            localStorage.setItem('issues-app-prefs', JSON.stringify(prefs));
        } catch (e) {}
    }

    _loadPreferences() {
        try {
            const saved = localStorage.getItem('issues-app-prefs');
            if (saved) {
                const prefs = JSON.parse(saved);
                if (prefs.leftNavWidth && this.$leftNav) {
                    this.$leftNav.style.width = prefs.leftNavWidth + 'px';
                }
                if (prefs.collapsedSections) {
                    this._collapsedSections = new Set(prefs.collapsedSections);
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
