/**
 * v0.1.9 API Client Override
 *
 * Purpose: Fix API endpoints and add proper HTML loading methods
 *
 * Fixes:
 * 1. loadHtmlById uses POST to /flet-html-domain/html/load/html-graph/id
 * 2. Added request deduplication (from v0.1.8)
 * 3. Visual confirmation of override application
 */

(function() {
    'use strict';

    // Request deduplication cache (from v0.1.8)
    const pendingRequests = new Map();
    const DEDUP_WINDOW_MS = 500;

    function getRequestKey(service, endpoint, method, body) {
        return `${service}:${method}:${endpoint}:${JSON.stringify(body || {})}`;
    }

    // Override the main API call method to add deduplication
    const originalCall = window.workbench.api.call.bind(window.workbench.api);

    window.workbench.api.call = async function(service, endpoint, method = 'GET', body = null) {
        const requestKey = getRequestKey(service, endpoint, method, body);

        // Check for duplicate request
        const pending = pendingRequests.get(requestKey);
        if (pending) {
            const elapsed = Date.now() - pending.timestamp;
            if (elapsed < DEDUP_WINDOW_MS) {
                console.log(`[v0.1.9] Deduplicating request: ${endpoint}`);
                return pending.promise;
            }
        }

        const promise = originalCall(service, endpoint, method, body);

        pendingRequests.set(requestKey, {
            promise,
            timestamp: Date.now()
        });

        promise.finally(() => {
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
     * New method: Load HTML by cache_id using the correct endpoint
     * Endpoint: POST /flet-html-domain/html/load/html-graph/id
     * Body: { cache_id: "..." }
     */
    window.workbench.api.htmlGraph.loadHtmlById = async function(cacheId) {
        console.log('[v0.1.9] Loading HTML by cache_id:', cacheId);
        return window.workbench.api.call('html-graph',
            `/flet-html-domain/html/load/html-graph/id`,
            'POST',
            { cache_id: cacheId }
        );
    };

    /**
     * Override loadHtml to detect UUID vs path and use appropriate method
     */
    window.workbench.api.htmlGraph.loadHtml = async function(namespace, cacheKey) {
        // Check if cacheKey is a UUID (cache_id format)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cacheKey);

        if (isUuid) {
            console.log('[v0.1.9] Detected UUID, loading by cache_id');
            return window.workbench.api.htmlGraph.loadHtmlById(cacheKey);
        } else {
            console.log('[v0.1.9] Loading by cache_key:', cacheKey);
            // For path-based keys, try the key endpoint
            // Note: This may need to be updated based on actual API behavior
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/html/load/${namespace}/key/${encodeURIComponent(cacheKey)}`,
                'POST'
            );
        }
    };

    // Visual confirmation that override is applied
    const confirmationBanner = document.createElement('div');
    confirmationBanner.id = 'api-override-confirmation';
    confirmationBanner.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(102, 126, 234, 0.9);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        z-index: 9999;
        opacity: 1;
        transition: opacity 0.5s;
    `;
    confirmationBanner.textContent = 'v0.1.9 API Override Active';
    document.body.appendChild(confirmationBanner);

    // Fade out after 3 seconds
    setTimeout(() => {
        confirmationBanner.style.opacity = '0';
        setTimeout(() => confirmationBanner.remove(), 500);
    }, 3000);

    console.log('[v0.1.9] API client override applied - loadHtmlById uses /flet-html-domain/html/load/html-graph/id');

})();
