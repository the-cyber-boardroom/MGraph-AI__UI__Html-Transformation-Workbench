/**
 * Graph Service Override - v0.1.3
 *
 * Purpose: Extends graph-service with new node types and helper methods
 * Version: v0.1.3
 *
 * Changes:
 * - Task-12: Added version and user-story node types
 * - Kept updateNodeStatus from v0.1.2
 *
 * Namespace: window.issuesApp
 */

(function() {
    'use strict';

    const graphService = window.issuesApp.graph;
    if (!graphService) {
        console.error('[v0.1.3] Graph service not found!');
        return;
    }

    // Task-12: Add new node types (backend has configured these)
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
        // Check new types first
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

    console.log('[Issues UI v0.1.3] Graph service extended with version, user-story types');

})();
