/**
 * Graph Service
 *
 * Purpose: API client for graph-based issue tracking system
 * Version: v0.1.7
 *
 * Provides methods for CRUD operations on nodes (bugs, tasks, features, people)
 * and their relationships (links).
 */

(function() {
    'use strict';

    const API_BASE = '/api';

    // Node type configurations
    const NODE_TYPES = {
        bug: {
            color: '#ef4444',
            icon: '🔴',
            statuses: ['backlog', 'confirmed', 'in-progress', 'testing', 'resolved', 'closed']
        },
        task: {
            color: '#3b82f6',
            icon: '🔵',
            statuses: ['backlog', 'todo', 'in-progress', 'review', 'done']
        },
        feature: {
            color: '#22c55e',
            icon: '🟢',
            statuses: ['proposed', 'approved', 'in-progress', 'released']
        },
        person: {
            color: '#8b5cf6',
            icon: '🟣',
            statuses: ['active', 'inactive']
        }
    };

    // Link type configurations
    const LINK_TYPES = {
        'blocks': { inverse: 'blocked-by', description: 'Source prevents progress on target' },
        'blocked-by': { inverse: 'blocks', description: 'Source is blocked by target' },
        'has-task': { inverse: 'task-of', description: 'Feature contains sub-task' },
        'task-of': { inverse: 'has-task', description: 'Task belongs to feature' },
        'assigned-to': { inverse: 'assignee-of', description: 'Work assigned to person' },
        'assignee-of': { inverse: 'assigned-to', description: 'Person assigned to work' },
        'depends-on': { inverse: 'dependency-of', description: 'Source requires target complete first' },
        'dependency-of': { inverse: 'depends-on', description: 'Target is dependency of source' },
        'relates-to': { inverse: 'relates-to', description: 'General association' }
    };

    class GraphService {
        constructor() {
            this._nodeCache = new Map();
            this._typeCache = null;
            this._linkTypeCache = null;
        }

        // ═══════════════════════════════════════════════════════════════════════════════
        // Node Operations
        // ═══════════════════════════════════════════════════════════════════════════════

        /**
         * List all nodes
         * @returns {Promise<Object>} Response with nodes array
         */
        async listNodes() {
            try {
                const response = await this._fetch(`${API_BASE}/nodes`);
                this._emit('nodes-loaded', { count: response.nodes?.length || 0 });
                return response;
            } catch (error) {
                this._emit('api-error', { operation: 'listNodes', error: error.message });
                throw error;
            }
        }

        /**
         * List nodes by type
         * @param {string} nodeType - bug, task, feature, or person
         * @returns {Promise<Object>} Response with nodes array
         */
        async listNodesByType(nodeType) {
            try {
                const response = await this._fetch(`${API_BASE}/nodes/type/${nodeType}`);
                this._emit('nodes-loaded', { type: nodeType, count: response.nodes?.length || 0 });
                return response;
            } catch (error) {
                this._emit('api-error', { operation: 'listNodesByType', error: error.message });
                throw error;
            }
        }

        /**
         * Get a single node by label
         * @param {string} label - Node label (e.g., 'Bug-27')
         * @returns {Promise<Object>} Node object
         */
        async getNode(label) {
            // Check cache
            if (this._nodeCache.has(label)) {
                return this._nodeCache.get(label);
            }

            try {
                const node = await this._fetch(`${API_BASE}/nodes/${label}`);
                this._nodeCache.set(label, node);
                this._emit('node-loaded', { label, node });
                return node;
            } catch (error) {
                this._emit('api-error', { operation: 'getNode', label, error: error.message });
                throw error;
            }
        }

        /**
         * Create a new node
         * @param {Object} data - Node data (node_type, title, description, tags, properties)
         * @returns {Promise<Object>} Response with created node
         */
        async createNode(data) {
            try {
                const response = await this._fetch(`${API_BASE}/nodes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.success && response.node) {
                    this._nodeCache.set(response.node.label, response.node);
                    this._emit('node-created', { node: response.node });
                }

                return response;
            } catch (error) {
                this._emit('api-error', { operation: 'createNode', error: error.message });
                throw error;
            }
        }

        /**
         * Update a node
         * @param {string} label - Node label
         * @param {Object} data - Fields to update
         * @returns {Promise<Object>} Response with updated node
         */
        async updateNode(label, data) {
            try {
                const response = await this._fetch(`${API_BASE}/nodes/${label}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.success && response.node) {
                    this._nodeCache.set(label, response.node);
                    this._emit('node-updated', { label, node: response.node });
                }

                return response;
            } catch (error) {
                this._emit('api-error', { operation: 'updateNode', label, error: error.message });
                throw error;
            }
        }

        /**
         * Delete a node
         * @param {string} label - Node label
         * @returns {Promise<Object>} Response
         */
        async deleteNode(label) {
            try {
                const response = await this._fetch(`${API_BASE}/nodes/${label}`, {
                    method: 'DELETE'
                });

                if (response.success) {
                    this._nodeCache.delete(label);
                    this._emit('node-deleted', { label });
                }

                return response;
            } catch (error) {
                this._emit('api-error', { operation: 'deleteNode', label, error: error.message });
                throw error;
            }
        }

        // ═══════════════════════════════════════════════════════════════════════════════
        // Link Operations
        // ═══════════════════════════════════════════════════════════════════════════════

        /**
         * List links for a node
         * @param {string} label - Node label
         * @returns {Promise<Object>} Response with links array
         */
        async listLinks(label) {
            try {
                const response = await this._fetch(`${API_BASE}/nodes/${label}/links`);
                this._emit('links-loaded', { label, count: response.links?.length || 0 });
                return response;
            } catch (error) {
                this._emit('api-error', { operation: 'listLinks', label, error: error.message });
                throw error;
            }
        }

        /**
         * Create a link between nodes
         * @param {string} sourceLabel - Source node label
         * @param {string} verb - Link type (e.g., 'blocks', 'assigned-to')
         * @param {string} targetLabel - Target node label
         * @returns {Promise<Object>} Response with created links (both directions)
         */
        async createLink(sourceLabel, verb, targetLabel) {
            try {
                const response = await this._fetch(`${API_BASE}/nodes/${sourceLabel}/links`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ verb, target_label: targetLabel })
                });

                if (response.success) {
                    // Invalidate cache for both nodes since links changed
                    this._nodeCache.delete(sourceLabel);
                    this._nodeCache.delete(targetLabel);
                    this._emit('link-created', { sourceLabel, verb, targetLabel });
                }

                return response;
            } catch (error) {
                this._emit('api-error', { operation: 'createLink', error: error.message });
                throw error;
            }
        }

        /**
         * Delete a link between nodes
         * @param {string} sourceLabel - Source node label
         * @param {string} targetLabel - Target node label
         * @returns {Promise<Object>} Response
         */
        async deleteLink(sourceLabel, targetLabel) {
            try {
                const response = await this._fetch(`${API_BASE}/nodes/${sourceLabel}/links/${targetLabel}`, {
                    method: 'DELETE'
                });

                if (response.success) {
                    // Invalidate cache for both nodes
                    this._nodeCache.delete(sourceLabel);
                    this._nodeCache.delete(targetLabel);
                    this._emit('link-deleted', { sourceLabel, targetLabel });
                }

                return response;
            } catch (error) {
                this._emit('api-error', { operation: 'deleteLink', error: error.message });
                throw error;
            }
        }

        // ═══════════════════════════════════════════════════════════════════════════════
        // Type Operations
        // ═══════════════════════════════════════════════════════════════════════════════

        /**
         * Get node type configuration
         * @param {string} typeName - Type name (bug, task, feature, person)
         * @returns {Object} Type configuration
         */
        getNodeType(typeName) {
            return NODE_TYPES[typeName] || null;
        }

        /**
         * Get all node types
         * @returns {Object} All type configurations
         */
        getNodeTypes() {
            return NODE_TYPES;
        }

        /**
         * Get link type configuration
         * @param {string} verb - Link verb
         * @returns {Object} Link type configuration
         */
        getLinkType(verb) {
            return LINK_TYPES[verb] || null;
        }

        /**
         * Get all link types
         * @returns {Object} All link type configurations
         */
        getLinkTypes() {
            return LINK_TYPES;
        }

        /**
         * Get valid statuses for a node type
         * @param {string} nodeType - Type name
         * @returns {Array<string>} Valid statuses
         */
        getStatusesForType(nodeType) {
            return NODE_TYPES[nodeType]?.statuses || [];
        }

        // ═══════════════════════════════════════════════════════════════════════════════
        // Helper Methods
        // ═══════════════════════════════════════════════════════════════════════════════

        /**
         * Parse node type from label
         * @param {string} label - Node label (e.g., 'Bug-27')
         * @returns {string|null} Node type or null
         */
        parseTypeFromLabel(label) {
            if (!label || typeof label !== 'string') return null;
            const parts = label.split('-');
            if (parts.length < 2) return null;
            return parts[0].toLowerCase();
        }

        /**
         * Parse node index from label
         * @param {string} label - Node label (e.g., 'Bug-27')
         * @returns {number|null} Node index or null
         */
        parseIndexFromLabel(label) {
            if (!label || typeof label !== 'string') return null;
            const parts = label.split('-');
            if (parts.length < 2) return null;
            const index = parseInt(parts[1], 10);
            return isNaN(index) ? null : index;
        }

        /**
         * Clear all caches
         */
        clearCache() {
            this._nodeCache.clear();
            this._emit('cache-cleared', {});
        }

        /**
         * Refresh data (clear cache)
         */
        refresh() {
            this.clearCache();
            this._emit('refresh', {});
        }

        // ═══════════════════════════════════════════════════════════════════════════════
        // Internal Methods
        // ═══════════════════════════════════════════════════════════════════════════════

        async _fetch(url, options = {}) {
            const response = await fetch(url, {
                ...options,
                credentials: 'include' // Include cookies for session
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(error.detail || error.message || `HTTP ${response.status}`);
            }

            return response.json();
        }

        _emit(event, data) {
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit(event, data);
            }
        }
    }

    // Initialize workbench if needed
    window.workbench = window.workbench || {};

    // Create and expose the service instance
    window.workbench.graph = new GraphService();

    // Also expose type configs for components
    window.workbench.nodeTypes = NODE_TYPES;
    window.workbench.linkTypes = LINK_TYPES;

    console.log('[v0.1.7] Graph service initialized');

})();
