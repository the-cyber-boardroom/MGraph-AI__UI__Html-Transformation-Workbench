/**
 * Root Service - v0.1.6
 *
 * Purpose: Handle root issue folder selection and context
 * Version: v0.1.6 (Issues UI)
 *
 * Phase 1 Implementation:
 * - GET /api/roots: List available root issue folders
 * - POST /api/roots/select: Select a root context
 * - Track current root selection
 *
 * The root service manages which issue folder is currently active.
 * All issue operations are scoped to the selected root.
 */

(function() {
    'use strict';

    class RootService {
        constructor() {
            this._currentRoot = null;
            this._availableRoots = [];
            this._loading = false;
            this._initialized = false;
        }

        /**
         * Initialize the root service
         * Fetches available roots and selects the default
         */
        async initialize() {
            if (this._initialized) return;

            try {
                this._loading = true;
                await this.fetchRoots();

                // Select first root by default if available
                if (this._availableRoots.length > 0 && !this._currentRoot) {
                    await this.selectRoot(this._availableRoots[0].path);
                }

                this._initialized = true;
            } catch (error) {
                console.error('[RootService] Initialization failed:', error);
            } finally {
                this._loading = false;
            }
        }

        /**
         * Fetch available root issue folders
         * GET /api/roots
         */
        async fetchRoots() {
            const config = window.issuesApp.config;
            const baseUrl = config?.apiBaseUrl || '/nodes';

            try {
                const response = await fetch(`${baseUrl}/api/roots`);

                if (!response.ok) {
                    // API may not be implemented yet - use fallback
                    console.warn('[RootService] /api/roots not available, using fallback');
                    this._availableRoots = this._getFallbackRoots();
                    return this._availableRoots;
                }

                const data = await response.json();
                this._availableRoots = data.roots || [];

                window.issuesApp.events.emit('roots-loaded', {
                    roots: this._availableRoots
                });

                return this._availableRoots;

            } catch (error) {
                console.warn('[RootService] Failed to fetch roots, using fallback:', error.message);
                this._availableRoots = this._getFallbackRoots();
                return this._availableRoots;
            }
        }

        /**
         * Fallback roots when API is not available
         * Returns the default .issues folder structure
         */
        _getFallbackRoots() {
            return [
                {
                    path: '.issues',
                    label: '.issues',
                    displayName: 'Issues (default)',
                    issueCount: null,
                    hasNewStructure: false
                }
            ];
        }

        /**
         * Select a root context
         * POST /api/roots/select
         */
        async selectRoot(rootPath) {
            const config = window.issuesApp.config;
            const baseUrl = config?.apiBaseUrl || '/nodes';

            const previousRoot = this._currentRoot;

            try {
                this._loading = true;

                const response = await fetch(`${baseUrl}/api/roots/select`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ root: rootPath })
                });

                if (!response.ok) {
                    // API may not be implemented - use local selection
                    console.warn('[RootService] /api/roots/select not available, using local selection');
                    this._currentRoot = this._findRoot(rootPath) || { path: rootPath, label: rootPath };
                } else {
                    const data = await response.json();
                    this._currentRoot = data.root || { path: rootPath, label: rootPath };
                }

                // Emit event for UI updates
                window.issuesApp.events.emit('root-changed', {
                    root: this._currentRoot,
                    previousRoot: previousRoot
                });

                // Refresh the graph data when root changes
                if (window.issuesApp.graph && typeof window.issuesApp.graph.fetchNodes === 'function') {
                    await window.issuesApp.graph.fetchNodes();
                }

                return this._currentRoot;

            } catch (error) {
                console.warn('[RootService] Failed to select root via API:', error.message);
                // Fallback to local selection
                this._currentRoot = this._findRoot(rootPath) || { path: rootPath, label: rootPath };

                window.issuesApp.events.emit('root-changed', {
                    root: this._currentRoot,
                    previousRoot: previousRoot
                });

                return this._currentRoot;
            } finally {
                this._loading = false;
            }
        }

        /**
         * Find a root by path in available roots
         */
        _findRoot(path) {
            return this._availableRoots.find(r => r.path === path);
        }

        /**
         * Get current root
         */
        get currentRoot() {
            return this._currentRoot;
        }

        /**
         * Get available roots
         */
        get availableRoots() {
            return this._availableRoots;
        }

        /**
         * Check if loading
         */
        get isLoading() {
            return this._loading;
        }

        /**
         * Get display name for current root
         */
        get currentRootDisplayName() {
            if (!this._currentRoot) return 'No root selected';
            return this._currentRoot.displayName || this._currentRoot.label || this._currentRoot.path;
        }
    }

    // Create singleton instance
    window.issuesApp = window.issuesApp || {};
    window.issuesApp.rootService = new RootService();

    console.log('[Issues UI v0.1.6] RootService initialized');

})();
