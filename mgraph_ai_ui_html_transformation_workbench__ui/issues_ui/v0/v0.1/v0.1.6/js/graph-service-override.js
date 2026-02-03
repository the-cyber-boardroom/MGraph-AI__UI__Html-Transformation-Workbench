/**
 * Graph Service Override - v0.1.6
 *
 * Purpose: Load node types dynamically from the API
 * Version: v0.1.6
 *
 * Changes:
 * - Fetch node types from /types/api/types on initialization
 * - Support all dynamic types (project, release, etc.)
 * - Fallback to hardcoded types if API fails
 * - Emit event when types are loaded
 *
 * API endpoint: GET /types/api/types
 *
 * Namespace: window.issuesApp
 */

(function() {
    'use strict';

    const graphService = window.issuesApp.graph;
    if (!graphService) {
        console.error('[v0.1.6] Graph service not found!');
        return;
    }

    // Default icon mapping for types without icons
    const DEFAULT_ICONS = {
        'bug': '🔴',
        'task': '🔵',
        'feature': '🟢',
        'person': '🟣',
        'version': '📦',
        'user-story': '📖',
        'project': '📁',
        'release': '🚀',
        'epic': '⭐',
        'story': '📝'
    };

    // Fallback icon for unknown types
    const FALLBACK_ICON = '📄';

    /**
     * Fetch node types from API and update window.issuesApp.nodeTypes
     */
    async function loadTypesFromAPI() {
        try {
            console.log('[v0.1.6] Fetching types from /types/api/types...');

            const response = await fetch('/types/api/types', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const types = await response.json();

            if (!Array.isArray(types) || types.length === 0) {
                console.warn('[v0.1.6] No types returned from API');
                return;
            }

            // Transform API response to internal format
            const nodeTypes = {};
            types.forEach(type => {
                const name = type.name || type.type_id;
                nodeTypes[name] = {
                    color: type.color || '#6b7280',
                    icon: type.icon || DEFAULT_ICONS[name] || FALLBACK_ICON,
                    statuses: type.statuses || ['backlog'],
                    displayName: type.display_name || name,
                    description: type.description || '',
                    defaultStatus: type.default_status || (type.statuses && type.statuses[0]) || 'backlog'
                };
            });

            // Update the global nodeTypes
            window.issuesApp.nodeTypes = nodeTypes;

            // Update graphService methods
            graphService.getNodeTypes = function() {
                return window.issuesApp.nodeTypes;
            };

            graphService.getNodeType = function(typeName) {
                return window.issuesApp.nodeTypes[typeName] || null;
            };

            graphService.getStatusesForType = function(typeName) {
                const type = window.issuesApp.nodeTypes[typeName];
                return type?.statuses || [];
            };

            console.log(`[v0.1.6] Loaded ${Object.keys(nodeTypes).length} types from API:`, Object.keys(nodeTypes));

            // Emit event so components can re-render
            if (window.issuesApp.events) {
                window.issuesApp.events.emit('types-loaded', {
                    types: nodeTypes,
                    count: Object.keys(nodeTypes).length
                });
            }

            return nodeTypes;

        } catch (error) {
            console.warn('[v0.1.6] Failed to fetch types from API, using fallback:', error.message);
            // Keep existing hardcoded types as fallback
            return window.issuesApp.nodeTypes;
        }
    }

    /**
     * Refresh types from API (can be called manually)
     */
    graphService.refreshTypes = async function() {
        return await loadTypesFromAPI();
    };

    // Load types on initialization
    // Use setTimeout to ensure other services are ready
    setTimeout(() => {
        loadTypesFromAPI().then(() => {
            // If node-list is currently visible, trigger a re-render
            if (window.issuesApp.router?.current === 'node-list') {
                const nodeList = document.querySelector('node-list');
                if (nodeList && typeof nodeList.render === 'function') {
                    nodeList.render();
                }
            }
        });
    }, 100);

    console.log('[Issues UI v0.1.6] Graph service extended: dynamic type loading from /types/api/types');

})();
