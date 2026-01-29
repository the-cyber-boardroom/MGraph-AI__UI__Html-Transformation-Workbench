/**
 * v0.1.2 Workbench Shell Override
 *
 * Purpose: Add resizable right sidebar for Events/API Log panels + version switcher
 * Surgical override of v0.1.0/components/shell/workbench-shell.js
 *
 * Overrides: render(), setupEventListeners(), cleanup()
 * Adds: toggleSidebar(), openSidebarTab(), initSidebarResize(), switchVersion()
 */

// List of apps that should open in sidebar instead of main area
const SIDEBAR_APPS = ['events-viewer', 'api-logger'];

// Available versions for the version switcher
const AVAILABLE_VERSIONS = [
    { id: 'v0.1.0', label: 'v0.1.0 (Base)' },
    { id: 'v0.1.1', label: 'v0.1.1 (Analysis)' },
    { id: 'v0.1.2', label: 'v0.1.2 (UI)' },
    { id: 'v0.1.3', label: 'v0.1.3 (Docs)' },
    { id: 'v0.1.4', label: 'v0.1.4 (Fixes)' },
    { id: 'v0.1.5', label: 'v0.1.5 (Latest)' }
];

// Override render to add sidebar structure and version switcher
WorkbenchShell.prototype.render = function() {
    this.innerHTML = `
        <header class="shell-header">
            <span class="shell-logo">🔧</span>
            <span class="shell-title">HTML Transformation Workbench</span>
            <div class="version-switcher">
                <label>Version:</label>
                <select id="version-select">
                    ${AVAILABLE_VERSIONS.map(v =>
                        `<option value="${v.id}" ${v.id === 'v0.1.2' ? 'selected' : ''}>${v.label}</option>`
                    ).join('')}
                </select>
            </div>
        </header>

        <nav-bar></nav-bar>

        <div class="shell-main-area">
            <main class="shell-container"></main>

            <div class="sidebar-resize-handle" id="sidebar-resize"></div>

            <aside class="shell-sidebar" id="shell-sidebar">
                <div class="sidebar-header">
                    <button class="sidebar-tab" data-tab="events-viewer">Events</button>
                    <button class="sidebar-tab" data-tab="api-logger">API Log</button>
                    <button class="sidebar-close" id="sidebar-close">&times;</button>
                </div>
                <div class="sidebar-content" id="sidebar-content">
                    <!-- Sidebar app instances will be moved here -->
                </div>
            </aside>
        </div>

        <footer class="shell-footer">
            <span class="status">Ready</span>
            <span class="active-app">Active: None</span>
            <span class="app-count">Apps: 0</span>
            <button class="sidebar-toggle" id="sidebar-toggle">Debug Panel</button>
        </footer>
    `;

    this.$navBar = this.querySelector('nav-bar');
    this.$container = this.querySelector('.shell-container');
    this.$status = this.querySelector('.status');
    this.$activeApp = this.querySelector('.active-app');
    this.$appCount = this.querySelector('.app-count');

    // Sidebar elements
    this.$sidebar = this.querySelector('#shell-sidebar');
    this.$sidebarContent = this.querySelector('#sidebar-content');
    this.$sidebarToggle = this.querySelector('#sidebar-toggle');
    this.$sidebarClose = this.querySelector('#sidebar-close');
    this.$sidebarResize = this.querySelector('#sidebar-resize');
    this.$versionSelect = this.querySelector('#version-select');

    this._sidebarOpen = false;
    this._activeSidebarTab = null;
};

// Override setupEventListeners to add sidebar handlers
WorkbenchShell.prototype.setupEventListeners = function() {
    // Call original
    this._boundHandlers.onNavigate = this.onNavigateRequest.bind(this);
    this.events.on('navigate', this._boundHandlers.onNavigate);

    // Sidebar toggle button
    this.$sidebarToggle?.addEventListener('click', () => this.toggleSidebar());

    // Sidebar close button
    this.$sidebarClose?.addEventListener('click', () => this.closeSidebar());

    // Sidebar tab buttons
    this.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            this.openSidebarTab(tab.dataset.tab);
        });
    });

    // Version switcher
    this.$versionSelect?.addEventListener('change', (e) => {
        this.switchVersion(e.target.value);
    });

    // Initialize resize handle
    this.initSidebarResize();
};

// Override cleanup
WorkbenchShell.prototype.cleanup = function() {
    this.events.off('navigate', this._boundHandlers.onNavigate);
};

// Override initializeRouter to handle sidebar apps differently
WorkbenchShell.prototype.initializeRouter = function() {
    const shell = this;

    window.workbench.router = {
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
                console.warn(`App '${appInfo.appId}' already registered`);
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

        // Methods for sidebar
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

// Override navigate to handle sidebar apps
WorkbenchShell.prototype.navigate = function(targetAppId) {
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

    // Otherwise, use normal navigation for main area
    const previousAppId = this._currentAppId;

    // Deactivate current main app
    if (this._currentAppId) {
        const currentApp = this._apps.find(a => a.appId === this._currentAppId);
        if (currentApp && !currentApp.isSidebarApp) {
            const currentInstance = this._appInstances.get(this._currentAppId);
            if (currentInstance) {
                currentInstance.style.display = 'none';
                if (typeof currentInstance.onDeactivate === 'function') {
                    try {
                        currentInstance.onDeactivate();
                    } catch (e) {
                        console.error(`Error in onDeactivate for '${this._currentAppId}':`, e);
                    }
                }
            }
        }
    }

    // Activate target app
    const targetInstance = this._appInstances.get(targetAppId);
    if (targetInstance) {
        targetInstance.style.display = 'block';
        if (typeof targetInstance.onActivate === 'function') {
            try {
                targetInstance.onActivate();
            } catch (e) {
                console.error(`Error in onActivate for '${targetAppId}':`, e);
            }
        }
    }

    this._currentAppId = targetAppId;
    this.updateFooter();
    this.$navBar.setActive(targetAppId);

    this.events.emit('navigated', {
        appId: targetAppId,
        previousAppId
    });
};

// New method: Toggle sidebar
WorkbenchShell.prototype.toggleSidebar = function() {
    if (this._sidebarOpen) {
        this.closeSidebar();
    } else {
        // Open with first tab if none selected
        this.openSidebarTab(this._activeSidebarTab || 'events-viewer');
    }
};

// New method: Open sidebar with specific tab
WorkbenchShell.prototype.openSidebarTab = function(appId) {
    // Open sidebar
    this.$sidebar.classList.add('open');
    this.$sidebarToggle.classList.add('active');
    this._sidebarOpen = true;

    // Deactivate previous sidebar tab
    if (this._activeSidebarTab && this._activeSidebarTab !== appId) {
        const prevInstance = this._appInstances.get(this._activeSidebarTab);
        if (prevInstance) {
            prevInstance.style.display = 'none';
            prevInstance.classList.remove('active');
            if (typeof prevInstance.onDeactivate === 'function') {
                try { prevInstance.onDeactivate(); } catch (e) {}
            }
        }
    }

    // Activate new sidebar tab
    const instance = this._appInstances.get(appId);
    if (instance) {
        instance.style.display = 'block';
        instance.classList.add('active');
        if (typeof instance.onActivate === 'function') {
            try { instance.onActivate(); } catch (e) {}
        }
    }

    // Update tab buttons
    this.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === appId);
    });

    this._activeSidebarTab = appId;

    // Also update nav bar to show this is selected (but keep main app too)
    this.$navBar.setActive(appId);
};

// New method: Close sidebar
WorkbenchShell.prototype.closeSidebar = function() {
    this.$sidebar.classList.remove('open');
    this.$sidebarToggle.classList.remove('active');
    this._sidebarOpen = false;

    // Deactivate current sidebar app
    if (this._activeSidebarTab) {
        const instance = this._appInstances.get(this._activeSidebarTab);
        if (instance) {
            instance.style.display = 'none';
            instance.classList.remove('active');
            if (typeof instance.onDeactivate === 'function') {
                try { instance.onDeactivate(); } catch (e) {}
            }
        }
    }

    // Reset nav bar to main app
    if (this._currentAppId) {
        this.$navBar.setActive(this._currentAppId);
    }
};

// New method: Initialize resize handle
WorkbenchShell.prototype.initSidebarResize = function() {
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
    };

    this.$sidebarResize?.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
};

// New method: Switch version
WorkbenchShell.prototype.switchVersion = function(version) {
    // Get base path (remove current version from URL)
    const currentPath = window.location.pathname;
    const basePath = currentPath.replace(/v0\.1\.\d+\/index\.html$/, '');

    // Navigate to selected version
    const newPath = basePath + version + '/index.html';
    window.location.href = newPath;
};
