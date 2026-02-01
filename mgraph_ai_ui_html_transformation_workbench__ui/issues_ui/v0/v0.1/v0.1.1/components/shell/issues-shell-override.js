/**
 * Issues Shell Override - v0.1.1
 *
 * Purpose: Surgical override to add API Logger to sidebar
 * Version: v0.1.1 (Issues UI)
 *
 * This file overrides specific methods from the base v0.1.0 shell
 * to add API Logger functionality to the sidebar tabs.
 */

// Update SIDEBAR_APPS to include api-logger
const SIDEBAR_APPS_V011 = ['events-viewer', 'api-logger'];

// Update AVAILABLE_VERSIONS for the version switcher
const AVAILABLE_VERSIONS_V011 = [
    { id: 'v0.1.0', label: 'v0.1.0 (Base)' },
    { id: 'v0.1.1', label: 'v0.1.1 (API Log)' }
];

// Override the render method to update sidebar tabs and version switcher
const originalRender = IssuesShell.prototype.render;
IssuesShell.prototype.render = function() {
    this.innerHTML = `
        <header class="shell-header">
            <span class="shell-logo">📋</span>
            <span class="shell-title">Issues Tracker</span>
            <div class="version-switcher">
                <label>Version:</label>
                <select id="version-select">
                    ${AVAILABLE_VERSIONS_V011.map(v =>
                        `<option value="${v.id}" ${v.id === 'v0.1.1' ? 'selected' : ''}>${v.label}</option>`
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
                    <button class="sidebar-tab" data-tab="api-logger">API Log</button>
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
};

// Override initializeRouter to use updated SIDEBAR_APPS
const originalInitializeRouter = IssuesShell.prototype.initializeRouter;
IssuesShell.prototype.initializeRouter = function() {
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
                isSidebarApp: SIDEBAR_APPS_V011.includes(MiniAppClass.appId)
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
};

console.log('[Issues UI v0.1.1] Shell override applied - API Logger tab added');
