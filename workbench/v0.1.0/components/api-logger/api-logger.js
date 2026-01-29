/**
 * API Logger Mini App
 *
 * Purpose: Postman-style debugging mini app that displays all API calls
 * Story: D2
 * Version: v0.1.0
 */

class ApiLogger extends HTMLElement {

    static get appId()    { return 'api-logger'; }
    static get navLabel() { return 'API Log'; }
    static get navIcon()  { return '🔌'; }

    constructor() {
        super();
        this.state = {
            requests: new Map(),
            filter: '',
            serviceFilter: '',
            expandedIds: new Set()
        };
        this._boundHandlers = {};
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    onActivate() {
        this.renderRequestList();
    }

    onDeactivate() {
        // Nothing needed
    }

    render() {
        this.innerHTML = `
            <style>
                .api-logger {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .al-toolbar {
                    display: flex;
                    gap: 10px;
                    padding: 12px 16px;
                    border-bottom: 1px solid #e0e0e0;
                    background: #f8f9fa;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .al-filter-input {
                    flex: 1;
                    min-width: 200px;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 13px;
                }
                .al-filter-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .al-select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 13px;
                    background: white;
                    min-width: 150px;
                }
                .al-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                    background: #f0f0f0;
                    color: #333;
                }
                .al-btn:hover {
                    background: #e0e0e0;
                }
                .al-stats {
                    padding: 10px 16px;
                    background: #e8f4fd;
                    font-size: 13px;
                    border-bottom: 1px solid #cde4f7;
                    display: flex;
                    gap: 24px;
                }
                .al-stat {
                    display: flex;
                    gap: 6px;
                }
                .al-stat-label {
                    color: #666;
                }
                .al-stat-value {
                    font-weight: 600;
                    color: #333;
                }
                .al-stat-value.error {
                    color: #dc3545;
                }
                .al-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px 16px;
                }
                .al-request {
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    background: white;
                    overflow: hidden;
                }
                .al-request.success { border-left: 4px solid #4caf50; }
                .al-request.error { border-left: 4px solid #f44336; }
                .al-request.pending { border-left: 4px solid #ff9800; }
                .al-request-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    cursor: pointer;
                    background: #fafafa;
                }
                .al-request-header:hover {
                    background: #f0f0f0;
                }
                .al-status {
                    font-size: 16px;
                }
                .al-status.success { color: #4caf50; }
                .al-status.error { color: #f44336; }
                .al-status.pending { color: #ff9800; }
                .al-id {
                    color: #666;
                    font-size: 12px;
                    font-weight: 500;
                }
                .al-method {
                    font-weight: 700;
                    color: #1976d2;
                    font-size: 12px;
                }
                .al-method.GET { color: #4caf50; }
                .al-method.POST { color: #ff9800; }
                .al-method.PUT { color: #2196f3; }
                .al-method.DELETE { color: #f44336; }
                .al-endpoint {
                    flex: 1;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                    color: #333;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .al-service {
                    color: #666;
                    font-size: 11px;
                    background: #eee;
                    padding: 3px 8px;
                    border-radius: 4px;
                }
                .al-http-status {
                    font-weight: 600;
                    font-size: 12px;
                }
                .al-http-status.ok { color: #4caf50; }
                .al-http-status.error { color: #f44336; }
                .al-duration {
                    color: #888;
                    font-size: 12px;
                }
                .al-expand {
                    color: #999;
                    font-size: 12px;
                }
                .al-detail {
                    padding: 16px;
                    border-top: 1px solid #eee;
                    background: #fafafa;
                }
                .al-section {
                    margin-bottom: 16px;
                }
                .al-section:last-child {
                    margin-bottom: 0;
                }
                .al-section h4 {
                    margin: 0 0 8px 0;
                    color: #666;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .al-headers {
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                    background: #f0f0f0;
                    padding: 10px;
                    border-radius: 4px;
                }
                .al-json {
                    background: #282c34;
                    color: #abb2bf;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                    overflow-x: auto;
                    max-height: 300px;
                    overflow-y: auto;
                }
                .al-error-box {
                    background: #ffebee;
                    color: #c62828;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                }
                .al-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                .al-actions button {
                    padding: 6px 12px;
                    font-size: 12px;
                    cursor: pointer;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 4px;
                }
                .al-actions button:hover {
                    background: #f5f5f5;
                }
                .al-empty {
                    text-align: center;
                    padding: 40px;
                    color: #888;
                }
                .al-toast {
                    position: fixed;
                    bottom: 60px;
                    right: 20px;
                    background: #333;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 13px;
                    animation: fadeIn 0.2s ease;
                    z-index: 1000;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
            <div class="api-logger">
                <div class="al-toolbar">
                    <input type="text" class="al-filter-input" id="al-filter" placeholder="Filter requests...">
                    <select class="al-select" id="al-service-filter">
                        <option value="">All Services</option>
                        <option value="html-graph">html-graph</option>
                        <option value="text-transform">text-transform</option>
                        <option value="llms">llms</option>
                    </select>
                    <button class="al-btn" id="al-clear">🗑 Clear</button>
                    <button class="al-btn" id="al-export">📥 Export</button>
                </div>
                <div class="al-stats" id="al-stats">
                    <span class="al-stat">
                        <span class="al-stat-label">Requests:</span>
                        <span class="al-stat-value" id="stat-total">0</span>
                    </span>
                    <span class="al-stat">
                        <span class="al-stat-label">Avg:</span>
                        <span class="al-stat-value" id="stat-avg">0ms</span>
                    </span>
                    <span class="al-stat">
                        <span class="al-stat-label">Errors:</span>
                        <span class="al-stat-value error" id="stat-errors">0</span>
                    </span>
                </div>
                <div class="al-list" id="al-list"></div>
            </div>
        `;
        this.bindElements();
    }

    bindElements() {
        this.$filter = this.querySelector('#al-filter');
        this.$serviceFilter = this.querySelector('#al-service-filter');
        this.$clearBtn = this.querySelector('#al-clear');
        this.$exportBtn = this.querySelector('#al-export');
        this.$list = this.querySelector('#al-list');
        this.$statTotal = this.querySelector('#stat-total');
        this.$statAvg = this.querySelector('#stat-avg');
        this.$statErrors = this.querySelector('#stat-errors');
    }

    setupEventListeners() {
        this._boundHandlers.onApiRequest = this.onApiRequest.bind(this);
        this._boundHandlers.onApiResponse = this.onApiResponse.bind(this);
        this._boundHandlers.onApiError = this.onApiError.bind(this);

        this.events.on('api-request', this._boundHandlers.onApiRequest);
        this.events.on('api-response', this._boundHandlers.onApiResponse);
        this.events.on('api-error', this._boundHandlers.onApiError);

        // DOM listeners
        this.$filter.addEventListener('input', () => this.renderRequestList());
        this.$serviceFilter.addEventListener('change', () => this.renderRequestList());
        this.$clearBtn.addEventListener('click', () => this.clearLog());
        this.$exportBtn.addEventListener('click', () => this.exportLog());
    }

    cleanup() {
        this.events.off('api-request', this._boundHandlers.onApiRequest);
        this.events.off('api-response', this._boundHandlers.onApiResponse);
        this.events.off('api-error', this._boundHandlers.onApiError);
    }

    onApiRequest(detail) {
        this.state.requests.set(detail.id, {
            ...detail,
            status: 'pending',
            timestamp: Date.now()
        });
        this.renderRequestList();
    }

    onApiResponse(detail) {
        const request = this.state.requests.get(detail.id);
        if (request) {
            request.response = detail;
            request.status = detail.status >= 200 && detail.status < 400 ? 'success' : 'error';
            this.renderRequestList();
        }
    }

    onApiError(detail) {
        const request = this.state.requests.get(detail.id);
        if (request) {
            request.error = detail;
            request.status = 'error';
            this.renderRequestList();
        }
    }

    getFilteredRequests() {
        const filter = this.$filter.value.toLowerCase();
        const serviceFilter = this.$serviceFilter.value;

        return Array.from(this.state.requests.values())
            .filter(req => {
                if (filter) {
                    const searchText = JSON.stringify(req).toLowerCase();
                    if (!searchText.includes(filter)) return false;
                }
                if (serviceFilter && req.service !== serviceFilter) return false;
                return true;
            })
            .sort((a, b) => b.id - a.id);
    }

    getStats() {
        const requests = Array.from(this.state.requests.values());
        const completed = requests.filter(r => r.status !== 'pending');
        const errors = requests.filter(r => r.status === 'error');

        const totalDuration = completed
            .filter(r => r.response?.duration)
            .reduce((sum, r) => sum + r.response.duration, 0);

        const avgDuration = completed.length > 0
            ? Math.round(totalDuration / completed.filter(r => r.response?.duration).length)
            : 0;

        return {
            total: requests.length,
            avgDuration,
            errors: errors.length
        };
    }

    renderRequestList() {
        const filtered = this.getFilteredRequests();
        const stats = this.getStats();

        // Update stats
        this.$statTotal.textContent = stats.total;
        this.$statAvg.textContent = stats.avgDuration ? `${stats.avgDuration}ms` : '0ms';
        this.$statErrors.textContent = stats.errors;

        if (filtered.length === 0) {
            this.$list.innerHTML = `
                <div class="al-empty">
                    ${this.state.requests.size === 0 ? 'No API requests yet. Make an API call to see it here.' : 'No requests match your filter.'}
                </div>
            `;
            return;
        }

        this.$list.innerHTML = filtered.map(req => this.renderRequestItem(req)).join('');
    }

    renderRequestItem(request) {
        const isExpanded = this.state.expandedIds.has(request.id);
        const statusIcon = this.getStatusIcon(request.status);
        const httpStatusClass = request.response?.status >= 400 ? 'error' : 'ok';

        return `
            <div class="al-request ${request.status}" data-id="${request.id}">
                <div class="al-request-header" onclick="this.closest('api-logger').toggleExpand(${request.id})">
                    <span class="al-status ${request.status}">${statusIcon}</span>
                    <span class="al-id">#${request.id}</span>
                    <span class="al-method ${request.method}">${request.method}</span>
                    <span class="al-endpoint" title="${this.escapeHtml(request.endpoint)}">${this.truncateEndpoint(request.endpoint)}</span>
                    <span class="al-service">${request.service}</span>
                    ${request.response ? `
                        <span class="al-http-status ${httpStatusClass}">${request.response.status}</span>
                        <span class="al-duration">${request.response.duration}ms</span>
                    ` : request.error ? `
                        <span class="al-http-status error">Error</span>
                    ` : `
                        <span class="al-duration">...</span>
                    `}
                    <span class="al-expand">${isExpanded ? '▼' : '▶'}</span>
                </div>
                ${isExpanded ? this.renderRequestDetail(request) : ''}
            </div>
        `;
    }

    renderRequestDetail(request) {
        const config = this.config.getService(request.service);
        const maskedKey = config?.headerValue ? '••••••••••••' : '(not set)';

        return `
            <div class="al-detail">
                <div class="al-section">
                    <h4>Request</h4>
                    <div class="al-headers">
                        <div>${config?.headerName || 'X-API-Key'}: ${maskedKey}</div>
                        <div>Content-Type: application/json</div>
                    </div>
                    ${request.body ? `
                        <h4 style="margin-top: 12px;">Body</h4>
                        <pre class="al-json">${this.escapeHtml(JSON.stringify(request.body, null, 2))}</pre>
                    ` : ''}
                </div>

                ${request.response ? `
                    <div class="al-section">
                        <h4>Response</h4>
                        <pre class="al-json">${this.escapeHtml(JSON.stringify(request.response.data, null, 2))}</pre>
                    </div>
                ` : ''}

                ${request.error ? `
                    <div class="al-section">
                        <h4>Error</h4>
                        <div class="al-error-box">${this.escapeHtml(request.error.error)}</div>
                    </div>
                ` : ''}

                <div class="al-actions">
                    <button onclick="event.stopPropagation(); this.closest('api-logger').resendRequest(${request.id})">🔄 Resend</button>
                    <button onclick="event.stopPropagation(); this.closest('api-logger').copyCurl(${request.id})">📋 Copy cURL</button>
                    ${request.response ? `
                        <button onclick="event.stopPropagation(); this.closest('api-logger').copyResponse(${request.id})">📋 Copy Response</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'success': return '●';
            case 'error': return '✗';
            case 'pending': return '○';
            default: return '?';
        }
    }

    truncateEndpoint(endpoint) {
        if (endpoint.length <= 60) return endpoint;
        return '...' + endpoint.slice(-57);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleExpand(requestId) {
        if (this.state.expandedIds.has(requestId)) {
            this.state.expandedIds.delete(requestId);
        } else {
            this.state.expandedIds.add(requestId);
        }
        this.renderRequestList();
    }

    generateCurl(request) {
        const config = this.config.getService(request.service);
        const url = request.url || `${config.baseUrl}${request.endpoint}`;

        let curl = `curl -X ${request.method}`;
        curl += ` "${url}"`;
        curl += ` -H "Content-Type: application/json"`;

        if (config?.headerName && config?.headerValue) {
            curl += ` -H "${config.headerName}: ${config.headerValue}"`;
        }

        if (request.body) {
            curl += ` -d '${JSON.stringify(request.body)}'`;
        }

        return curl;
    }

    async resendRequest(requestId) {
        const original = this.state.requests.get(requestId);
        if (!original) return;

        try {
            await this.api.call(
                original.service,
                original.endpoint,
                original.method,
                original.body
            );
            this.showToast('Request resent');
        } catch (error) {
            this.showToast('Request failed');
        }
    }

    copyCurl(requestId) {
        const request = this.state.requests.get(requestId);
        if (request) {
            const curl = this.generateCurl(request);
            navigator.clipboard.writeText(curl).then(() => {
                this.showToast('cURL copied to clipboard');
            });
        }
    }

    copyResponse(requestId) {
        const request = this.state.requests.get(requestId);
        if (request?.response) {
            const text = JSON.stringify(request.response.data, null, 2);
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Response copied to clipboard');
            });
        }
    }

    clearLog() {
        this.state.requests.clear();
        this.state.expandedIds.clear();
        this.renderRequestList();
    }

    exportLog() {
        const data = JSON.stringify(Array.from(this.state.requests.values()), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `api-log-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showToast('API log exported');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'al-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    get events() { return window.workbench.events; }
    get api() { return window.workbench.api; }
    get config() { return window.workbench.config; }
}

customElements.define('api-logger', ApiLogger);
