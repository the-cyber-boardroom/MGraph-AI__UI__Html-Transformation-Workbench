/**
 * Navigation Bar Component
 *
 * Purpose: Navigation bar that dynamically shows registered mini apps
 * Story: F1
 * Version: v0.1.0
 */

class NavBar extends HTMLElement {
    constructor() {
        super();
        this._apps = [];
        this._activeAppId = null;
        this._boundHandlers = {};
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    render() {
        this.innerHTML = `
            <div class="nav-bar">
                <div class="nav-items"></div>
            </div>
        `;
        this.$navItems = this.querySelector('.nav-items');
    }

    setupEventListeners() {
        // Listen for app registration
        this._boundHandlers.onAppRegistered = this.onAppRegistered.bind(this);
        this._boundHandlers.onNavigated = this.onNavigated.bind(this);

        this.events.on('app-registered', this._boundHandlers.onAppRegistered);
        this.events.on('navigated', this._boundHandlers.onNavigated);

        // Click handler for nav items
        this.$navItems.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const appId = navItem.dataset.appId;
                this.events.emit('navigate', { appId });
            }
        });
    }

    cleanup() {
        this.events.off('app-registered', this._boundHandlers.onAppRegistered);
        this.events.off('navigated', this._boundHandlers.onNavigated);
    }

    onAppRegistered(detail) {
        this._apps.push({
            appId: detail.appId,
            navLabel: detail.navLabel,
            navIcon: detail.navIcon
        });
        this.renderNavItems();
    }

    onNavigated(detail) {
        this._activeAppId = detail.appId;
        this.updateActiveState();
    }

    renderNavItems() {
        this.$navItems.innerHTML = this._apps.map(app => `
            <button class="nav-item ${app.appId === this._activeAppId ? 'active' : ''}"
                    data-app-id="${app.appId}">
                <span class="nav-icon">${app.navIcon}</span>
                <span class="nav-label">${app.navLabel}</span>
            </button>
        `).join('');
    }

    updateActiveState() {
        const items = this.$navItems.querySelectorAll('.nav-item');
        items.forEach(item => {
            if (item.dataset.appId === this._activeAppId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    setApps(apps) {
        this._apps = apps;
        this.renderNavItems();
    }

    setActive(appId) {
        this._activeAppId = appId;
        this.updateActiveState();
    }

    get events() {
        return window.workbench.events;
    }
}

customElements.define('nav-bar', NavBar);
