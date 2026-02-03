/**
 * Child Issues Service - v0.1.6
 *
 * Purpose: Handle child issue operations for hierarchical issue model
 * Version: v0.1.6 (Issues UI)
 *
 * Phase 1 Implementation:
 * - POST /api/issues/children: Add child issue to parent
 * - POST /api/issues/children/list: List children of an issue
 * - POST /api/issues/convert: Convert issue to new structure (create issues/ folder)
 *
 * The child issues service manages the parent-child relationships between issues.
 */

(function() {
    'use strict';

    class ChildIssuesService {
        constructor() {
            this._cache = new Map();  // Cache children by parent path
        }

        /**
         * Get base URL for API calls
         */
        _getBaseUrl() {
            const config = window.issuesApp.config;
            return config?.apiBaseUrl || '/issues';
        }

        /**
         * List children of an issue
         * POST /api/issues/children/list
         *
         * @param {string} parentPath - Path to the parent issue
         * @returns {Promise<Array>} - Array of child issues
         */
        async listChildren(parentPath) {
            const baseUrl = this._getBaseUrl();

            try {
                const response = await fetch(`${baseUrl}/api/issues/children/list`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ parent_path: parentPath })
                });

                if (!response.ok) {
                    console.warn('[ChildIssuesService] Failed to list children:', response.status);
                    return [];
                }

                const data = await response.json();

                if (data.success) {
                    // Map API response to internal format
                    const children = (data.children || []).map(child => ({
                        path: child.path,
                        label: child.label,
                        title: child.title,
                        nodeType: child.node_type || child.issue_type,
                        status: child.status
                    }));

                    // Cache the result
                    this._cache.set(parentPath, children);

                    return children;
                }

                return [];

            } catch (error) {
                console.error('[ChildIssuesService] Failed to list children:', error);
                return [];
            }
        }

        /**
         * Add a child issue to a parent
         * POST /api/issues/children
         *
         * @param {string} parentPath - Path to the parent issue
         * @param {Object} childData - Child issue data { issue_type, title, description?, status? }
         * @returns {Promise<Object>} - Created child issue
         */
        async addChild(parentPath, childData) {
            const baseUrl = this._getBaseUrl();

            try {
                const response = await fetch(`${baseUrl}/api/issues/children`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parent_path: parentPath,
                        issue_type: childData.issue_type || childData.issueType,
                        title: childData.title,
                        description: childData.description || '',
                        status: childData.status || ''
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    // Clear cache for this parent
                    this._cache.delete(parentPath);

                    // Emit event for UI updates
                    window.issuesApp.events.emit('child-added', {
                        parentPath: parentPath,
                        child: {
                            path: data.path,
                            label: data.label,
                            title: data.title,
                            nodeType: data.issue_type
                        }
                    });

                    return {
                        success: true,
                        path: data.path,
                        label: data.label,
                        title: data.title,
                        issueType: data.issue_type
                    };
                }

                throw new Error(data.message || 'Failed to create child issue');

            } catch (error) {
                console.error('[ChildIssuesService] Failed to add child:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        /**
         * Convert an issue to support child issues (create issues/ folder)
         * POST /api/issues/convert
         *
         * @param {string} issuePath - Path to the issue to convert
         * @returns {Promise<Object>} - Conversion result
         */
        async convertToParent(issuePath) {
            const baseUrl = this._getBaseUrl();

            try {
                const response = await fetch(`${baseUrl}/api/issues/convert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ issue_path: issuePath })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    // Emit event for UI updates
                    window.issuesApp.events.emit('issue-converted', {
                        issuePath: issuePath,
                        issuesPath: data.issues_path,
                        converted: data.converted
                    });

                    return {
                        success: true,
                        converted: data.converted,
                        issuesPath: data.issues_path,
                        message: data.message
                    };
                }

                throw new Error(data.message || 'Failed to convert issue');

            } catch (error) {
                console.error('[ChildIssuesService] Failed to convert issue:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        /**
         * Get cached children for a parent (if available)
         */
        getCachedChildren(parentPath) {
            return this._cache.get(parentPath) || null;
        }

        /**
         * Clear cache for a parent or all cache
         */
        clearCache(parentPath = null) {
            if (parentPath) {
                this._cache.delete(parentPath);
            } else {
                this._cache.clear();
            }
        }
    }

    // Create singleton instance
    window.issuesApp = window.issuesApp || {};
    window.issuesApp.childIssuesService = new ChildIssuesService();

    console.log('[Issues UI v0.1.6] ChildIssuesService initialized');

})();
