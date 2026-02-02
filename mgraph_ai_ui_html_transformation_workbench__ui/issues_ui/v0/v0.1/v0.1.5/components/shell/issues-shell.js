/**
 * Issues Shell Override - v0.1.5
 *
 * Purpose: Track previous app for proper back navigation (Bug-8 fix)
 * Version: v0.1.5
 *
 * Bug-8: Back to Kanban navigation - track previousAppId
 *
 * Changes:
 * - Track _previousAppId when navigating between apps
 * - Expose previousApp via router for back navigation
 * - Add v0.1.5 to version switcher
 */

(function() {
    'use strict';

    // Get the IssuesShell class
    const IssuesShellClass = customElements.get('issues-shell');
    if (!IssuesShellClass) {
        console.error('[v0.1.5] IssuesShell not found!');
        return;
    }

    // Store original navigate method
    const _originalNavigate = IssuesShellClass.prototype.navigate;

    // Override navigate to track previous app
    IssuesShellClass.prototype.navigate = function(targetAppId) {
        const targetApp = this._apps.find(a => a.appId === targetAppId);
        if (!targetApp) {
            console.error(`App '${targetAppId}' not found`);
            return;
        }

        // If it's a sidebar app, don't track it as previous
        if (targetApp.isSidebarApp) {
            this.openSidebarTab(targetAppId);
            return;
        }

        // Bug-8 fix: Track the previous main app before changing
        if (this._currentAppId && this._currentAppId !== targetAppId) {
            const currentApp = this._apps.find(a => a.appId === this._currentAppId);
            if (currentApp && !currentApp.isSidebarApp) {
                this._previousAppId = this._currentAppId;
            }
        }

        // Call original navigate
        _originalNavigate.call(this, targetAppId);
    };

    // Store original initializeRouter to patch the router object
    const _originalInitializeRouter = IssuesShellClass.prototype.initializeRouter;

    IssuesShellClass.prototype.initializeRouter = function() {
        // Call original
        _originalInitializeRouter.call(this);

        const shell = this;

        // Bug-8 fix: Add previousApp getter to router
        Object.defineProperty(window.issuesApp.router, 'previousApp', {
            get() {
                return shell._previousAppId || 'node-list';
            }
        });

        // Bug-8 fix: Add goBack method to router
        window.issuesApp.router.goBack = function() {
            const previousApp = shell._previousAppId || 'node-list';
            shell.navigate(previousApp);
        };
    };

    // Update available versions to include v0.1.5
    const _originalRender = IssuesShellClass.prototype.render;

    IssuesShellClass.prototype.render = function() {
        _originalRender.call(this);

        // Update version select if it exists
        const versionSelect = this.querySelector('#version-select');
        if (versionSelect) {
            // Check if v0.1.5 option already exists
            const hasV015 = Array.from(versionSelect.options).some(opt => opt.value === 'v0.1.5');
            if (!hasV015) {
                const option = document.createElement('option');
                option.value = 'v0.1.5';
                option.textContent = 'v0.1.5 (UX+Viz)';
                option.selected = true;
                versionSelect.appendChild(option);

                // Deselect v0.1.4
                Array.from(versionSelect.options).forEach(opt => {
                    if (opt.value === 'v0.1.4') opt.selected = false;
                });
            }
        }
    };

    console.log('[Issues UI v0.1.5] Shell patched: previousAppId tracking for back navigation');

})();
