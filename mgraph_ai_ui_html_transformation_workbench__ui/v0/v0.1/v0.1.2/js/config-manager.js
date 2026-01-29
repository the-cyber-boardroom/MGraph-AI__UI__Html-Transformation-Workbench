/**
 * v0.1.2 Config Manager Override
 *
 * Purpose: Update default service URLs to https://*.dev.mgraph.ai
 * Surgical override of v0.1.0/js/config-manager.js
 */

(function() {
    'use strict';

    // Get the existing config manager
    const configManager = window.workbench.config;

    // New default service URLs
    const NEW_SERVICE_URLS = {
        'html-graph': {
            baseUrl: 'https://html-graph.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: ''
        },
        'text-transform': {
            baseUrl: 'https://text-transform.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: ''
        },
        'llms': {
            baseUrl: 'https://llms.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: ''
        }
    };

    // Update service URLs if they're still using the old defaults
    const OLD_URL_PATTERN = /\.dev\.aws\.cyber-boardroom\.com$/;

    Object.entries(NEW_SERVICE_URLS).forEach(([serviceName, newConfig]) => {
        const currentConfig = configManager.getService(serviceName);
        if (currentConfig) {
            // Only update if using old URL or empty
            if (!currentConfig.baseUrl || OLD_URL_PATTERN.test(currentConfig.baseUrl)) {
                configManager.setService(serviceName, {
                    ...currentConfig,
                    baseUrl: newConfig.baseUrl
                });
            }
        }
    });

    // Emit event to notify of URL update
    if (window.workbench.events) {
        window.workbench.events.emit('config-urls-updated', {
            services: Object.keys(NEW_SERVICE_URLS)
        });
    }

    console.log('[v0.1.2] API URLs updated to *.dev.mgraph.ai');

})();
