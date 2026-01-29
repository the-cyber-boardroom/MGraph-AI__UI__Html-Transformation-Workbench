/**
 * Workbench Shell Component
 *
 * Purpose: Main application shell that provides the frame for all mini apps
 * Story: F1
 * Version: v0.1.0
 *
 * This is the "container" that all other components slot into.
 */

class WorkbenchShell extends HTMLElement {
    constructor() {
        super();
        this._apps = [];
        this._appInstances = new Map();
        this._currentAppId = null;
        this._boundHandlers = {};
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.initializeRouter();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    render() {
        this.innerHTML = `
            <header class="shell-header">
                <span class="shell-logo">🔧</span>
                <span class="shell-title">HTML Transformation Workbench</span>
            </header>

            <nav-bar></nav-bar>

            <main class="shell-container"></main>

            <footer class="shell-footer">
                <span class="status">Ready</span>
                <span class="active-app">Active: None</span>
                <span class="app-count">Apps: 0</span>
            </footer>
        `;

        this.$navBar = this.querySelector('nav-bar');
        this.$container = this.querySelector('.shell-container');
        this.$status = this.querySelector('.status');
        this.$activeApp = this.querySelector('.active-app');
        this.$appCount = this.querySelector('.app-count');
    }

    setupEventListeners() {
        this._boundHandlers.onNavigate = this.onNavigateRequest.bind(this);
        this.events.on('navigate', this._boundHandlers.onNavigate);
    }

    cleanup() {
        this.events.off('navigate', this._boundHandlers.onNavigate);
    }

    initializeRouter() {
        // Create and expose the router on window.workbench
        const shell = this;

        window.workbench.router = {
            /**
             * Register a mini app
             * @param {class} MiniAppClass - The mini app class to register
             */
            register(MiniAppClass) {
                if (!MiniAppClass.appId || !MiniAppClass.navLabel) {
                    console.error('Mini app must have static appId and navLabel');
                    return;
                }

                const appInfo = {
                    appId: MiniAppClass.appId,
                    navLabel: MiniAppClass.navLabel,
                    navIcon: MiniAppClass.navIcon || '📱',
                    MiniAppClass
                };

                // Check for duplicate
                if (shell._apps.find(a => a.appId === appInfo.appId)) {
                    console.warn(`App '${appInfo.appId}' already registered`);
                    return;
                }

                shell._apps.push(appInfo);

                // Create instance and add to DOM (hidden)
                const tagName = MiniAppClass.appId;
                const instance = document.createElement(tagName);
                instance.style.display = 'none';
                shell.$container.appendChild(instance);
                shell._appInstances.set(appInfo.appId, instance);

                // Update footer
                shell.updateFooter();

                // Emit app-registered event
                shell.events.emit('app-registered', {
                    appId: appInfo.appId,
                    navLabel: appInfo.navLabel,
                    navIcon: appInfo.navIcon
                });

                // If this is the first app, navigate to it
                if (shell._apps.length === 1) {
                    shell.navigate(appInfo.appId);
                }
            },

            /**
             * Navigate to an app
             * @param {string} appId - The app ID to navigate to
             */
            navigate(appId) {
                shell.navigate(appId);
            },

            /**
             * Current active app ID
             */
            get current() {
                return shell._currentAppId;
            },

            /**
             * List of registered apps
             */
            get apps() {
                return shell._apps.map(a => ({
                    appId: a.appId,
                    navLabel: a.navLabel,
                    navIcon: a.navIcon
                }));
            }
        };
    }

    onNavigateRequest(detail) {
        if (detail && detail.appId) {
            this.navigate(detail.appId);
        }
    }

    navigate(targetAppId) {
        // Find target app
        const targetApp = this._apps.find(a => a.appId === targetAppId);
        if (!targetApp) {
            console.error(`App '${targetAppId}' not found`);
            return;
        }

        const previousAppId = this._currentAppId;

        // Deactivate current app
        if (this._currentAppId) {
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

        // Update footer
        this.updateFooter();

        // Update nav bar
        this.$navBar.setActive(targetAppId);

        // Emit navigated event
        this.events.emit('navigated', {
            appId: targetAppId,
            previousAppId
        });
    }

    updateFooter() {
        const currentApp = this._apps.find(a => a.appId === this._currentAppId);
        this.$activeApp.textContent = `Active: ${currentApp ? currentApp.navLabel : 'None'}`;
        this.$appCount.textContent = `Apps: ${this._apps.length}`;
    }

    setStatus(message) {
        this.$status.textContent = message;
    }

    get events() {
        return window.workbench.events;
    }
}

customElements.define('workbench-shell', WorkbenchShell);
