/**
 * API Client Service
 *
 * Purpose: Unified API client that handles calls to all backend services
 * Story: F3
 * Version: v0.1.0
 *
 * Automatically injects authentication headers and emits events for all API calls.
 */

(function() {
    'use strict';

    class ApiClient {
        constructor() {
            this._nextRequestId = 1;
        }

        /**
         * Make an API call to any service
         * @param {string} service - Service name ('html-graph', 'text-transform', 'llms')
         * @param {string} endpoint - API endpoint (e.g., '/flet-html-domain/html/load/...')
         * @param {string} method - HTTP method ('GET', 'POST', 'PUT', 'DELETE')
         * @param {object} body - Request body (optional)
         * @returns {Promise<object>} Response data
         */
        async call(service, endpoint, method = 'GET', body = null) {
            const requestId = this._nextRequestId++;
            const startTime = Date.now();

            // Get service config
            const config = window.workbench.config.getService(service);
            if (!config) {
                const error = new Error(`Service '${service}' not configured`);
                this._emitError(requestId, service, endpoint, error.message, Date.now() - startTime);
                throw error;
            }

            const url = `${config.baseUrl}${endpoint}`;

            // Build headers
            const headers = {
                'Content-Type': 'application/json'
            };
            if (config.headerName && config.headerValue) {
                headers[config.headerName] = config.headerValue;
            }

            // Emit api-request event
            this._emitRequest(requestId, service, endpoint, method, body, url);

            try {
                // Make the fetch call
                const fetchOptions = {
                    method,
                    headers
                };

                if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                    fetchOptions.body = JSON.stringify(body);
                }

                const response = await fetch(url, fetchOptions);
                const duration = Date.now() - startTime;

                // Parse response
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }

                // Emit api-response event
                this._emitResponse(requestId, service, endpoint, response.status, data, duration);

                return data;

            } catch (error) {
                const duration = Date.now() - startTime;

                // Emit api-error event
                this._emitError(requestId, service, endpoint, error.message, duration);

                throw error;
            }
        }

        _emitRequest(id, service, endpoint, method, body, url) {
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit('api-request', {
                    id,
                    service,
                    endpoint,
                    method,
                    body,
                    url
                });
            }
        }

        _emitResponse(id, service, endpoint, status, data, duration) {
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit('api-response', {
                    id,
                    service,
                    endpoint,
                    status,
                    data,
                    duration
                });
            }
        }

        _emitError(id, service, endpoint, error, duration) {
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit('api-error', {
                    id,
                    service,
                    endpoint,
                    error,
                    duration
                });
            }
        }
    }

    // Create convenience methods object
    const htmlGraph = {
        async loadHtml(namespace, cacheKey) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/html/load/${namespace}/key/${encodeURIComponent(cacheKey)}`,
                'POST'
            );
        },

        async saveHtml(namespace, cacheKey, html) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/html/store/${namespace}/key/${encodeURIComponent(cacheKey)}`,
                'POST',
                { html }
            );
        },

        async listEntities(namespace, includeDataFiles = false) {
            const query = includeDataFiles ? '?include_data_files=true' : '';
            return window.workbench.api.call('html-graph',
                `/cache-entity/${namespace}/entities${query}`,
                'GET'
            );
        },

        async listSitePages(namespace, domain) {
            return window.workbench.api.call('html-graph',
                `/cache-entity/${namespace}/entities/site/${encodeURIComponent(domain)}`,
                'GET'
            );
        },

        async getProfile(namespace, profileId) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/profiles/${namespace}/${encodeURIComponent(profileId)}`,
                'GET'
            );
        },

        async listProfiles(namespace) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/profiles/${namespace}`,
                'GET'
            );
        },

        async saveProfile(namespace, profileId, profile) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/profiles/${namespace}/${encodeURIComponent(profileId)}`,
                'POST',
                profile
            );
        },

        async deleteProfile(namespace, profileId) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/profiles/${namespace}/${encodeURIComponent(profileId)}`,
                'DELETE'
            );
        },

        async applyProfile(namespace, profileId, cacheId) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/profiles/${namespace}/${encodeURIComponent(profileId)}/apply`,
                'POST',
                { cache_id: cacheId }
            );
        },

        async analyzeStructure(namespace, cacheId) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/html/analyze/${namespace}/structure`,
                'POST',
                { cache_id: cacheId }
            );
        },

        async analyzeContent(namespace, cacheId) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/html/analyze/${namespace}/content`,
                'POST',
                { cache_id: cacheId }
            );
        },

        async analyzeLinks(namespace, cacheId) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/html/analyze/${namespace}/links`,
                'POST',
                { cache_id: cacheId }
            );
        },

        async getDomTreeGraph(namespace, cacheId) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/html/graph/${namespace}/dom-tree`,
                'POST',
                { cache_id: cacheId }
            );
        },

        async getSitemapGraph(namespace, domain) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/site/analyze/${namespace}/sitemap/${encodeURIComponent(domain)}`,
                'POST'
            );
        },

        async getSiteLinkGraph(namespace, domain) {
            return window.workbench.api.call('html-graph',
                `/flet-html-domain/site/graph/${namespace}/links/${encodeURIComponent(domain)}`,
                'POST'
            );
        }
    };

    // Placeholder for text-transform service
    const textTransform = {
        // Methods to be added as needed
    };

    // Placeholder for llms service
    const llms = {
        // Methods to be added as needed
    };

    // Initialize window.workbench if not exists
    window.workbench = window.workbench || {};

    // Create the API client instance
    const apiClient = new ApiClient();

    // Attach convenience methods
    apiClient.htmlGraph = htmlGraph;
    apiClient.textTransform = textTransform;
    apiClient.llms = llms;

    // Expose the API client
    window.workbench.api = apiClient;

})();
