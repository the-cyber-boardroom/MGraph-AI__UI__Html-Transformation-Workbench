/**
 * Root Service - v0.1.6
 *
 * Purpose: Handle root issue folder selection and context
 * Version: v0.1.6 (Issues UI)
 *
 * Phase 1 Implementation:
 * - GET /api/roots: List available root issue folders
 * - GET /api/roots/current: Get currently selected root
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
         * Fetches current root and available roots
         */
        async initialize() {
            if (this._initialized) return;

            try {
                this._loading = true;

                // Fetch current root first
                await this.fetchCurrentRoot();

                // Then fetch all available roots
                await this.fetchRoots();

                this._initialized = true;
            } catch (error) {
                console.error('[RootService] Initialization failed:', error);
            } finally {
                this._loading = false;
            }
        }

        /**
         * Fetch current root from server
         * GET /api/roots/current
         */
        async fetchCurrentRoot() {
            const config = window.issuesApp.config;
            const baseUrl = config?.apiBaseUrl || '/roots';

            try {
                const response = await fetch(`${baseUrl}/api/roots/current`);

                if (!response.ok) {
                    console.warn('[RootService] /api/roots/current not available');
                    return null;
                }

                const data = await response.json();
                if (data.success) {
                    this._currentRoot = {
                        path: data.path || '',
                        label: data.label || 'Root',
                        title: data.title || '',
                        issueType: data.issue_type || 'root',
                        hasIssues: data.has_issues || false
                    };

                    window.issuesApp.events.emit('root-changed', {
                        root: this._currentRoot,
                        previousRoot: null
                    });
                }

                return this._currentRoot;

            } catch (error) {
                console.warn('[RootService] Failed to fetch current root:', error.message);
                return null;
            }
        }

        /**
         * Fetch available root issue folders
         * GET /api/roots
         */
        async fetchRoots() {
            const config = window.issuesApp.config;
            const baseUrl = config?.apiBaseUrl || '/roots';

            try {
                const response = await fetch(`${baseUrl}/api/roots`);

                if (!response.ok) {
                    // API may not be implemented yet - use fallback
                    console.warn('[RootService] /api/roots not available, using fallback');
                    this._availableRoots = this._getFallbackRoots();
                    return this._availableRoots;
                }

                const data = await response.json();

                // Map API response to internal format
                // API returns: { success, roots: [{ path, label, title, issue_type, depth, has_issues, has_children }], total }
                this._availableRoots = (data.roots || []).map(root => ({
                    path: root.path || '',
                    label: root.label || 'Root',
                    title: root.title || '',
                    displayName: root.title ? `${root.label}: ${root.title}` : root.label,
                    issueType: root.issue_type || 'root',
                    depth: root.depth || 0,
                    hasIssues: root.has_issues || false,
                    childCount: root.has_children || 0
                }));

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
            const baseUrl = config?.apiBaseUrl || '/roots';

            const previousRoot = this._currentRoot;

            try {
                this._loading = true;

                const response = await fetch(`${baseUrl}/api/roots/select`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: rootPath })  // API expects 'path' field
                });

                if (!response.ok) {
                    // API may not be implemented - use local selection
                    console.warn('[RootService] /api/roots/select not available, using local selection');
                    this._currentRoot = this._findRoot(rootPath) || { path: rootPath, label: rootPath };
                } else {
                    const data = await response.json();
                    // API returns { success, path, previous, message }
                    // Find the full root info from available roots
                    const selectedRoot = this._findRoot(data.path || rootPath);
                    this._currentRoot = selectedRoot || {
                        path: data.path || rootPath,
                        label: data.path ? data.path.split('/').pop() : 'Root',
                        issueType: 'root'
                    };
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
            return this._currentRoot.displayName || this._currentRoot.title || this._currentRoot.label || this._currentRoot.path || 'Root';
        }

        /**
         * Check if current root is the default (empty path)
         */
        get isDefaultRoot() {
            return !this._currentRoot || !this._currentRoot.path || this._currentRoot.path === '';
        }

        /**
         * Clear root selection (return to default)
         */
        async clearRoot() {
            return await this.selectRoot('');
        }
    }

    // Create singleton instance
    window.issuesApp = window.issuesApp || {};
    window.issuesApp.rootService = new RootService();

    console.log('[Issues UI v0.1.6] RootService initialized');

})();
