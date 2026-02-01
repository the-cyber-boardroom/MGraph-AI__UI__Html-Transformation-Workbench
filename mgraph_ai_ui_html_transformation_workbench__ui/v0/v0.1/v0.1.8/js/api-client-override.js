/**
 * v0.1.8 API Client Override
 *
 * Purpose: Fix API endpoint issues and prevent duplicate requests
 *
 * Fixes:
 * 1. Changed loadHtml to use /flet-html-domain/html/load/html-graph/id with POST body
 * 2. Added request deduplication to prevent multiple identical requests
 */

(function() {
    'use strict';

    // Request deduplication cache
    const pendingRequests = new Map();
    const DEDUP_WINDOW_MS = 500; // Don't allow same request within 500ms

    /**
     * Generate a cache key for request deduplication
     */
    function getRequestKey(service, endpoint, method, body) {
        return `${service}:${method}:${endpoint}:${JSON.stringify(body || {})}`;
    }

    /**
     * Override the main API call method to add deduplication
     */
    const originalCall = window.workbench.api.call.bind(window.workbench.api);

    window.workbench.api.call = async function(service, endpoint, method = 'GET', body = null) {
        const requestKey = getRequestKey(service, endpoint, method, body);

        // Check if there's a pending or recent identical request
        const pending = pendingRequests.get(requestKey);
        if (pending) {
            const elapsed = Date.now() - pending.timestamp;
            if (elapsed < DEDUP_WINDOW_MS) {
                // Return the existing promise to deduplicate
                console.log(`[v0.1.8] Deduplicating request: ${endpoint}`);
                return pending.promise;
            }
        }

        // Create a new request
        const promise = originalCall(service, endpoint, method, body);

        // Store the pending request
        pendingRequests.set(requestKey, {
            promise,
            timestamp: Date.now()
        });

        // Clean up after request completes
        promise.finally(() => {
            // Remove from pending after a short delay to allow deduplication
            setTimeout(() => {
                const current = pendingRequests.get(requestKey);
                if (current && current.promise === promise) {
                    pendingRequests.delete(requestKey);
                }
            }, DEDUP_WINDOW_MS);
        });

        return promise;
    };

    /**
     * Override htmlGraph.loadHtml to use correct endpoint
     *
     * Old endpoint: /flet-html-domain/html/load/${namespace}/key/${cacheKey}
     * New endpoint: /flet-html-domain/html/load/html-graph/id (POST with cache_id)
     *
     * The new endpoint accepts cache_id in the POST body and returns the HTML.
     */
    window.workbench.api.htmlGraph.loadHtml = async function(namespace, cacheKey) {
        // First, we need to get the cache_id from the cache_key
        // The listSitePages or listEntities returns cache_id for each page
        // But for direct loading, we'll try the key-based endpoint first
        // and fall back to the id-based endpoint if we have a cache_id

        // Check if cacheKey looks like a UUID (cache_id) or a path (cache_key)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cacheKey);

        if (isUuid) {
            // Use the id-based endpoint with POST
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/html/load/html-graph/id`,
                'POST',
                { cache_id: cacheKey }
            );
        } else {
            // For path-based keys, we need to first lookup the cache_id
            // Try to load by key first
            try {
                const result = await window.workbench.api.call('html-graph',
                    `/flet-html-domain/html/load/${namespace}/key/${encodeURIComponent(cacheKey)}`,
                    'POST'
                );

                // If we got a result with cache_id but no html, try loading by id
                if (result && result.cache_id && !result.html && !result.found) {
                    return window.workbench.api.call('html-graph',
                        `/flet-html-domain/html/load/html-graph/id`,
                        'POST',
                        { cache_id: result.cache_id }
                    );
                }

                return result;
            } catch (error) {
                // If the key-based endpoint fails, throw the error
                throw error;
            }
        }
    };

    /**
     * Add a new method to load HTML directly by cache_id
     */
    window.workbench.api.htmlGraph.loadHtmlById = async function(cacheId) {
        return window.workbench.api.call('html-graph',
            `/flet-html-domain/html/load/html-graph/id`,
            'POST',
            { cache_id: cacheId }
        );
    };

    console.log('[v0.1.8] API client override applied - fixed endpoints and request deduplication');

})();
