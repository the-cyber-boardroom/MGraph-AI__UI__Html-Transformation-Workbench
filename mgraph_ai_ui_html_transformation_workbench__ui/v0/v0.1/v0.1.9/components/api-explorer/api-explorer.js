/**
 * v0.1.9 API Explorer Override
 *
 * Purpose: Show path and body in response section (not headers)
 * Surgical override of v0.1.4 API Explorer
 *
 * Changes:
 * - Show request path in response section
 * - Show request body for POST/PUT/PATCH requests
 * - Don't show headers (simpler view)
 */

// Store the request details for display in response
let lastRequestDetails = {
    path: '',
    body: null,
    method: ''
};

// Override sendRequest to capture request details
const _originalSendRequest_v019 = ApiExplorer.prototype.sendRequest;
ApiExplorer.prototype.sendRequest = async function() {
    // Capture request details before making the call
    const endpoint = this.buildUrl(this.state.endpoint, this.state.params);
    const config = this.config.getService(this.state.service);
    const fullPath = config ? `${config.baseUrl}${endpoint}` : endpoint;

    let body = null;
    if (this.state.method !== 'GET' && this.$body && this.$body.value.trim()) {
        try {
            body = JSON.parse(this.$body.value);
        } catch (e) {
            body = this.$body.value; // Keep as string if not valid JSON
        }
    }

    lastRequestDetails = {
        path: fullPath,
        body: body,
        method: this.state.method
    };

    // Call the original implementation
    return _originalSendRequest_v019.call(this);
};

// Override renderResponse to show path and body
ApiExplorer.prototype.renderResponse = function() {
    if (this.state.loading) {
        return '<div class="ae-empty">Sending request...</div>';
    }

    // Build request info section
    const requestSection = lastRequestDetails.path ? `
        <div class="ae-request-info">
            <div class="ae-request-title">${lastRequestDetails.method} Request</div>
            <div class="ae-request-path">${this.escapeHtml(lastRequestDetails.path)}</div>
            ${lastRequestDetails.body ? `
                <div class="ae-request-body-title">Request Body:</div>
                <pre class="ae-request-body">${this.escapeHtml(
                    typeof lastRequestDetails.body === 'string'
                        ? lastRequestDetails.body
                        : JSON.stringify(lastRequestDetails.body, null, 2)
                )}</pre>
            ` : ''}
        </div>
    ` : '';

    if (this.state.error) {
        return `
            ${requestSection}
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
            ${requestSection}
            <div class="ae-response-header">
                <span class="ae-status ${isSuccess ? 'success' : 'error'}">${this.state.status}</span>
                ${this.state.duration ? `<span class="ae-duration">${this.state.duration}ms</span>` : ''}
            </div>
            <div class="ae-response-title">Response Body:</div>
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

// Add extra styles for request info
const apiExplorerStyles_v019 = `
    .ae-request-info {
        background: #1e2746;
        border: 1px solid #3a4f6f;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 16px;
    }

    .ae-request-title {
        font-size: 11px;
        font-weight: 600;
        color: #667eea;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
    }

    .ae-request-path {
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 12px;
        color: #a0b0c0;
        word-break: break-all;
        margin-bottom: 12px;
        padding: 8px;
        background: #252836;
        border-radius: 4px;
    }

    .ae-request-body-title,
    .ae-response-title {
        font-size: 11px;
        font-weight: 600;
        color: #8a9cc4;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
        margin-top: 12px;
    }

    .ae-request-body {
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 11px;
        color: #a0b0c0;
        background: #252836;
        padding: 12px;
        border-radius: 4px;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 150px;
        overflow-y: auto;
        margin: 0;
    }

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
const aeStyleEl_v019 = document.createElement('style');
aeStyleEl_v019.textContent = apiExplorerStyles_v019;
document.head.appendChild(aeStyleEl_v019);

console.log('[v0.1.9] API Explorer: now shows request path and body');
