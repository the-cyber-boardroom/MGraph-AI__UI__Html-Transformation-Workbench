/**
 * v0.1.5 Workbench Shell Override
 *
 * Purpose: Add Automation tab to the sidebar
 * Surgical override of v0.1.2/components/shell/workbench-shell.js
 */

// Update SIDEBAR_APPS to include automation-runner
const SIDEBAR_APPS_V015 = ['events-viewer', 'api-logger', 'automation-runner'];

// Override the original SIDEBAR_APPS constant by reassigning prototype behavior
const _originalRegister = window.workbench.router?.register;

// Update the render to include automation tab
const _v012Render = WorkbenchShell.prototype.render;
WorkbenchShell.prototype.render = function() {
    _v012Render.call(this);

    // Add automation tab to sidebar header if not already present
    const sidebarHeader = this.querySelector('.sidebar-header');
    if (sidebarHeader && !sidebarHeader.querySelector('[data-tab="automation-runner"]')) {
        const closeBtn = sidebarHeader.querySelector('.sidebar-close');
        const automationTab = document.createElement('button');
        automationTab.className = 'sidebar-tab';
        automationTab.dataset.tab = 'automation-runner';
        automationTab.textContent = 'Automation';
        sidebarHeader.insertBefore(automationTab, closeBtn);

        // Add click handler
        automationTab.addEventListener('click', () => {
            this.openSidebarTab('automation-runner');
        });
    }

    // Update version select to show v0.1.5 as current
    const versionSelect = this.querySelector('#version-select');
    if (versionSelect) {
        // Add v0.1.5 option if not present
        if (!versionSelect.querySelector('option[value="v0.1.5"]')) {
            const opt = document.createElement('option');
            opt.value = 'v0.1.5';
            opt.textContent = 'v0.1.5 (Latest)';
            versionSelect.appendChild(opt);
        }
        // Select v0.1.5
        versionSelect.value = 'v0.1.5';

        // Update v0.1.4 label
        const v014Opt = versionSelect.querySelector('option[value="v0.1.4"]');
        if (v014Opt) {
            v014Opt.textContent = 'v0.1.4 (Fixes)';
        }
    }
};

// Override initializeRouter to handle automation-runner in sidebar
const _v012InitRouter = WorkbenchShell.prototype.initializeRouter;
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
                isSidebarApp: SIDEBAR_APPS_V015.includes(MiniAppClass.appId)
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

console.log('[v0.1.5] Shell updated with Automation tab in sidebar');
