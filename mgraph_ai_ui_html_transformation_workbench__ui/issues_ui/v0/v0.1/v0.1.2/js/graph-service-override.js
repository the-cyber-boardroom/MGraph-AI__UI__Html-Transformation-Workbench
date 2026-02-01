/**
 * Graph Service Override for v0.1.2
 *
 * Purpose: Add convenience methods for status updates and other operations
 * Version: v0.1.2 (Issues UI)
 *
 * Adds:
 * - updateNodeStatus() - Convenience method for changing node status
 */

(function() {
    'use strict';

    const graphService = window.issuesApp.graph;

    /**
     * Update a node's status
     * @param {string} label - Node label (e.g., 'Bug-27')
     * @param {string} newStatus - New status value
     * @returns {Promise<Object>} Response with updated node
     */
    graphService.updateNodeStatus = async function(label, newStatus) {
        console.log(`[v0.1.2] Updating status: ${label} -> ${newStatus}`);

        try {
            const response = await this.updateNode(label, { status: newStatus });

            if (response.success) {
                this._emit('node-status-changed', {
                    label,
                    newStatus,
                    node: response.node
                });
            }

            return response;
        } catch (error) {
            this._emit('api-error', {
                operation: 'updateNodeStatus',
                label,
                newStatus,
                error: error.message
            });
            throw error;
        }
    };

    /**
     * Batch update multiple nodes' statuses
     * @param {Array<{label: string, status: string}>} updates - Array of updates
     * @returns {Promise<Array>} Array of responses
     */
    graphService.batchUpdateStatus = async function(updates) {
        console.log(`[v0.1.2] Batch updating ${updates.length} nodes`);

        const results = [];
        for (const update of updates) {
            try {
                const result = await this.updateNodeStatus(update.label, update.status);
                results.push({ label: update.label, success: true, result });
            } catch (error) {
                results.push({ label: update.label, success: false, error: error.message });
            }
        }

        this._emit('batch-status-updated', { results });
        return results;
    };

    console.log('[Issues UI v0.1.2] Graph service extended with status update methods');

})();
