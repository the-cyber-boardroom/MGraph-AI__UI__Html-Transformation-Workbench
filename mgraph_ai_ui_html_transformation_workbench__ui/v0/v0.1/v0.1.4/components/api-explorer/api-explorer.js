/**
 * v0.1.4 API Explorer Override
 *
 * Purpose: Fix API Explorer issues
 * Surgical override of v0.1.0/components/api-explorer/api-explorer.js
 *
 * Changes:
 * - Include cookies/credentials with requests
 * - Hide Request Body section for GET requests
 * - Show errors in red on the right panel
 */

// Override sendRequest to include credentials (cookies)
ApiExplorer.prototype.sendRequest = async function() {
    if (!this.state.endpoint) {
        this.showToast('Please select or enter an endpoint');
        return;
    }

    this.state.loading = true;
    this.state.response = null;
    this.state.error = null;
    this.render();

    const startTime = Date.now();

    try {
        const endpoint = this.buildUrl(this.state.endpoint, this.state.params);
        let body = null;

        if (this.state.method !== 'GET' && this.$body && this.$body.value.trim()) {
            try {
                body = JSON.parse(this.$body.value);
            } catch (e) {
                throw new Error('Invalid JSON in request body');
            }
        }

        // Get service config
        const config = this.config.getService(this.state.service);
        if (!config) {
            throw new Error(`Service '${this.state.service}' not configured`);
        }

        const url = `${config.baseUrl}${endpoint}`;

        // Build headers
        const headers = {
            'Content-Type': 'application/json'
        };
        if (config.headerName && config.headerValue) {
            headers[config.headerName] = config.headerValue;
        }

        // Make the fetch call with credentials included
        const fetchOptions = {
            method: this.state.method,
            headers,
            credentials: 'include'  // Include cookies
        };

        if (body && (this.state.method === 'POST' || this.state.method === 'PUT' || this.state.method === 'PATCH')) {
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

        this.state.loading = false;
        this.state.response = data;
        this.state.status = response.status;
        this.state.duration = duration;

        // Emit events for API logger
        if (window.workbench && window.workbench.events) {
            window.workbench.events.emit('api-response', {
                id: Date.now(),
                service: this.state.service,
                endpoint: endpoint,
                status: response.status,
                data: data,
                duration: duration
            });
        }

    } catch (error) {
        this.state.loading = false;
        this.state.error = error.message;
        this.state.status = error.status || 500;
        this.state.duration = Date.now() - startTime;

        // Emit error event
        if (window.workbench && window.workbench.events) {
            window.workbench.events.emit('api-error', {
                id: Date.now(),
                service: this.state.service,
                endpoint: this.state.endpoint,
                error: error.message,
                duration: this.state.duration
            });
        }
    }

    this.render();
};

// Override render to hide body section for GET and show better error display
const _originalApiExplorerRender = ApiExplorer.prototype.render;
ApiExplorer.prototype.render = function() {
    _originalApiExplorerRender.call(this);

    // Hide body section for GET requests
    if (this.$bodySection) {
        this.$bodySection.style.display = this.state.method === 'GET' ? 'none' : 'block';
    }
};

// Override renderResponse to show errors in red on the right panel
ApiExplorer.prototype.renderResponse = function() {
    if (this.state.loading) {
        return '<div class="ae-empty">Sending request...</div>';
    }

    if (this.state.error) {
        return `
            <div class="ae-response-header">
                <span class="ae-status error">Error</span>
                ${this.state.duration ? `<span class="ae-duration">${this.state.duration}ms</span>` : ''}
            </div>
            <div class="ae-error-panel">
                <pre class="ae-error-content">${this.escapeHtml(this.state.error)}</pre>
            </div>
        `;
    }

    if (this.state.response !== null) {
        const isSuccess = this.state.status >= 200 && this.state.status < 400;
        return `
            <div class="ae-response-header">
                <span class="ae-status ${isSuccess ? 'success' : 'error'}">${this.state.status}</span>
                ${this.state.duration ? `<span class="ae-duration">${this.state.duration}ms</span>` : ''}
            </div>
            ${!isSuccess ? `
                <div class="ae-error-panel">
                    <pre class="ae-error-content">${this.escapeHtml(JSON.stringify(this.state.response, null, 2))}</pre>
                </div>
            ` : `
                <pre class="ae-json">${this.escapeHtml(JSON.stringify(this.state.response, null, 2))}</pre>
            `}
            <div class="ae-actions">
                <button class="ae-btn ae-btn-secondary" id="ae-copy-response">Copy Response</button>
                <button class="ae-btn ae-btn-secondary" id="ae-copy-curl">Copy cURL</button>
            </div>
        `;
    }

    return '<div class="ae-empty">Send a request to see the response.</div>';
};

// Override generateCurl to include credentials flag
ApiExplorer.prototype.generateCurl = function() {
    const config = this.config.getService(this.state.service);
    const endpoint = this.buildUrl(this.state.endpoint, this.state.params);
    const url = `${config.baseUrl}${endpoint}`;

    let curl = `curl -X ${this.state.method}`;
    curl += ` "${url}"`;
    curl += ` -H "Content-Type: application/json"`;
    curl += ` --cookie ""`;  // Include cookies flag

    if (config.headerName && config.headerValue) {
        curl += ` -H "${config.headerName}: ${config.headerValue}"`;
    }

    if (this.state.method !== 'GET' && this.$body && this.$body.value.trim()) {
        curl += ` -d '${this.$body.value.replace(/'/g, "'\\''")}'`;
    }

    return curl;
};

// Add extra styles for error panel
const apiExplorerExtraStyles = `
    .ae-error-panel {
        background: #2d1f1f;
        border: 1px solid #c62828;
        border-radius: 6px;
        padding: 16px;
        margin-top: 12px;
    }

    .ae-error-content {
        color: #ff6b6b;
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 13px;
        white-space: pre-wrap;
        word-break: break-all;
        margin: 0;
    }

    .ae-status.error {
        background: #c62828;
        color: white;
    }
`;

// Inject extra styles
const aeStyleEl = document.createElement('style');
aeStyleEl.textContent = apiExplorerExtraStyles;
document.head.appendChild(aeStyleEl);

console.log('[v0.1.4] API Explorer updated with cookies, hidden body for GET, and red error display');
