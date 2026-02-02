/**
 * Graph Service Override - v0.1.4
 *
 * Purpose: Extends graph-service with graph traversal API and new node types
 * Version: v0.1.4
 *
 * Changes:
 * - Task-14: Added getNodeGraph() for graph traversal API
 * - Task-12: Added version and user-story node types (from v0.1.3)
 * - Added graph caching with 30-second TTL
 *
 * New API endpoint used:
 * GET /nodes/api/nodes/{node_type}/{label}/graph?depth=N
 *
 * Namespace: window.issuesApp
 */

(function() {
    'use strict';

    const graphService = window.issuesApp.graph;
    if (!graphService) {
        console.error('[v0.1.4] Graph service not found!');
        return;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // Task-12: Add new node types (carried forward from v0.1.3)
    // ═══════════════════════════════════════════════════════════════════════════════

    const NEW_NODE_TYPES = {
        version: {
            color: '#f59e0b',  // Amber
            icon: '\u{1F4E6}',  // Package emoji
            statuses: ['planned', 'in-progress', 'released']
        },
        'user-story': {
            color: '#06b6d4',  // Cyan
            icon: '\u{1F4D6}',  // Book emoji
            statuses: ['draft', 'ready', 'implemented', 'validated']
        }
    };

    // Merge new types into the existing nodeTypes
    Object.assign(window.issuesApp.nodeTypes, NEW_NODE_TYPES);

    // Update the getNodeType method to include new types
    const originalGetNodeType = graphService.getNodeType.bind(graphService);
    graphService.getNodeType = function(typeName) {
        if (NEW_NODE_TYPES[typeName]) {
            return NEW_NODE_TYPES[typeName];
        }
        return originalGetNodeType(typeName);
    };

    // Update getNodeTypes to include all types
    graphService.getNodeTypes = function() {
        return window.issuesApp.nodeTypes;
    };

    // Get statuses for any type including new ones
    const originalGetStatusesForType = graphService.getStatusesForType.bind(graphService);
    graphService.getStatusesForType = function(nodeType) {
        if (NEW_NODE_TYPES[nodeType]) {
            return NEW_NODE_TYPES[nodeType].statuses;
        }
        return originalGetStatusesForType(nodeType);
    };

    // v0.1.2: updateNodeStatus method (carried forward)
    graphService.updateNodeStatus = async function(label, newStatus) {
        return this.updateNode(label, { status: newStatus });
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // Task-14: Graph Traversal API
    // ═══════════════════════════════════════════════════════════════════════════════

    // Graph cache with 30-second TTL
    const graphCache = new Map();
    const GRAPH_CACHE_TTL = 30000; // 30 seconds

    /**
     * Generate cache key for graph requests
     * @param {string} nodeType
     * @param {string} label
     * @param {number} depth
     * @returns {string}
     */
    function getGraphCacheKey(nodeType, label, depth) {
        return `${nodeType}:${label}:${depth}`;
    }

    /**
     * Check if cached graph is still valid
     * @param {string} key
     * @returns {Object|null}
     */
    function getCachedGraph(key) {
        const cached = graphCache.get(key);
        if (cached && (Date.now() - cached.timestamp) < GRAPH_CACHE_TTL) {
            return cached.data;
        }
        // Remove stale entry
        if (cached) {
            graphCache.delete(key);
        }
        return null;
    }

    /**
     * Store graph in cache
     * @param {string} key
     * @param {Object} data
     */
    function setCachedGraph(key, data) {
        graphCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Get node with connected nodes for graph visualization
     * Uses the new backend API: GET /nodes/api/nodes/{node_type}/{label}/graph?depth=N
     *
     * @param {string} nodeType - Type of root node (bug, task, feature, version, etc.)
     * @param {string} label - Label of root node (Bug-1, Feature-11, etc.)
     * @param {number} depth - Link hops to traverse (default: 1, max: 3)
     * @param {boolean} useCache - Whether to use cache (default: true)
     * @returns {Promise<{success: boolean, root: string, nodes: Array, links: Array, depth: number, message?: string}>}
     */
    graphService.getNodeGraph = async function(nodeType, label, depth = 1, useCache = true) {
        // Validate inputs
        if (!nodeType || !label) {
            return {
                success: false,
                nodes: [],
                links: [],
                message: 'Node type and label are required'
            };
        }

        // Clamp depth to valid range
        depth = Math.min(Math.max(1, depth), 3);

        // Check cache first
        const cacheKey = getGraphCacheKey(nodeType, label, depth);
        if (useCache) {
            const cached = getCachedGraph(cacheKey);
            if (cached) {
                console.log(`[v0.1.4] Graph cache hit: ${cacheKey}`);
                this._emit('graph-loaded', {
                    root: cached.root,
                    nodeCount: cached.nodes.length,
                    linkCount: cached.links.length,
                    cached: true
                });
                return cached;
            }
        }

        try {
            const url = `/nodes/api/nodes/${encodeURIComponent(nodeType)}/${encodeURIComponent(label)}/graph?depth=${depth}`;
            console.log(`[v0.1.4] Fetching graph: ${url}`);

            const response = await fetch(url, {
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(error.detail || error.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Cache the result
                setCachedGraph(cacheKey, data);

                this._emit('graph-loaded', {
                    root: data.root,
                    nodeCount: data.nodes?.length || 0,
                    linkCount: data.links?.length || 0,
                    cached: false
                });

                // Also emit to messages service if available
                if (window.issuesApp.messages) {
                    window.issuesApp.messages.add('info',
                        `Graph loaded: ${data.nodes?.length || 0} nodes, ${data.links?.length || 0} links`
                    );
                }
            }

            return data;
        } catch (error) {
            console.error('[v0.1.4] Failed to fetch node graph:', error);

            this._emit('api-error', {
                operation: 'getNodeGraph',
                nodeType,
                label,
                depth,
                error: error.message
            });

            // Show error in messages panel
            if (window.issuesApp.messages) {
                window.issuesApp.messages.add('error', `Failed to load graph: ${error.message}`);
            }

            return {
                success: false,
                nodes: [],
                links: [],
                message: error.message
            };
        }
    };

    /**
     * Clear graph cache (useful when nodes/links change)
     */
    graphService.clearGraphCache = function() {
        graphCache.clear();
        console.log('[v0.1.4] Graph cache cleared');
    };

    /**
     * Invalidate specific graph cache entry
     * @param {string} nodeType
     * @param {string} label
     */
    graphService.invalidateGraphCache = function(nodeType, label) {
        // Invalidate all depths for this node
        for (let d = 1; d <= 3; d++) {
            const key = getGraphCacheKey(nodeType, label, d);
            graphCache.delete(key);
        }
        console.log(`[v0.1.4] Graph cache invalidated for ${nodeType}:${label}`);
    };

    // Listen for node/link changes and invalidate cache
    if (window.issuesApp.events) {
        const events = window.issuesApp.events;

        events.on('node-created', () => graphService.clearGraphCache());
        events.on('node-updated', () => graphService.clearGraphCache());
        events.on('node-deleted', () => graphService.clearGraphCache());
        events.on('link-created', () => graphService.clearGraphCache());
        events.on('link-deleted', () => graphService.clearGraphCache());
    }

    console.log('[Issues UI v0.1.4] Graph service extended with getNodeGraph(), version, user-story types');

})();
