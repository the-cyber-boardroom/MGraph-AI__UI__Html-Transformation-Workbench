/**
 * API Explorer Mini App
 *
 * Purpose: Postman-style interface for testing and debugging API calls
 * Story: M2
 * Version: v0.1.0
 */

const ENDPOINTS = {
    'html-graph': [
        {
            path: '/flet-html-domain/html/load/{namespace}/key/{cache_key}',
            method: 'POST',
            description: 'Load HTML by cache key'
        },
        {
            path: '/flet-html-domain/html/store/{namespace}/key/{cache_key}',
            method: 'POST',
            description: 'Store HTML',
            bodyTemplate: { html: '<html>...</html>' }
        },
        {
            path: '/cache-entity/{namespace}/entities',
            method: 'GET',
            description: 'List all entities'
        },
        {
            path: '/cache-entity/{namespace}/entities/site/{domain}',
            method: 'GET',
            description: 'List pages for domain'
        },
        {
            path: '/flet-html-domain/profiles/{namespace}',
            method: 'GET',
            description: 'List profiles'
        },
        {
            path: '/flet-html-domain/profiles/{namespace}/{profile_id}',
            method: 'GET',
            description: 'Get profile'
        },
        {
            path: '/flet-html-domain/profiles/{namespace}/{profile_id}',
            method: 'POST',
            description: 'Save profile',
            bodyTemplate: { name: '', description: '', transforms: [] }
        }
    ],
    'text-transform': [],
    'llms': []
};

class ApiExplorer extends HTMLElement {

    static get appId()    { return 'api-explorer'; }
    static get navLabel() { return 'API Explorer'; }
    static get navIcon()  { return '🧪'; }

    constructor() {
        super();
        this.state = {
            service: 'html-graph',
            endpoint: '',
            method: 'GET',
            params: {},
            body: '',
            loading: false,
            response: null,
            error: null,
            status: null,
            duration: null
        };
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {}

    onActivate() {}
    onDeactivate() {}

    render() {
        const endpoints = ENDPOINTS[this.state.service] || [];

        this.innerHTML = `
            <style>
                .api-explorer {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .ae-section {
                    padding: 16px;
                    border-bottom: 1px solid #e0e0e0;
                }
                .ae-section-title {
                    font-weight: 600;
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 12px;
                }
                .ae-row {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 12px;
                    align-items: center;
                }
                .ae-row:last-child {
                    margin-bottom: 0;
                }
                .ae-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: #555;
                    width: 100px;
                    flex-shrink: 0;
                }
                .ae-select, .ae-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 13px;
                    font-family: inherit;
                }
                .ae-select:focus, .ae-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .ae-textarea {
                    width: 100%;
                    min-height: 120px;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                    resize: vertical;
                }
                .ae-textarea:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .ae-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                .ae-btn-primary {
                    background: #667eea;
                    color: white;
                }
                .ae-btn-primary:hover {
                    background: #5a6fd6;
                }
                .ae-btn-primary:disabled {
                    background: #a5a5a5;
                    cursor: not-allowed;
                }
                .ae-btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .ae-btn-secondary:hover {
                    background: #e0e0e0;
                }
                .ae-params {
                    display: grid;
                    grid-template-columns: 120px 1fr;
                    gap: 8px;
                    align-items: center;
                }
                .ae-param-label {
                    font-size: 12px;
                    color: #555;
                }
                .ae-response {
                    flex: 1;
                    overflow: auto;
                    padding: 16px;
                    background: #fafafa;
                }
                .ae-response-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .ae-status {
                    font-weight: 600;
                    padding: 4px 12px;
                    border-radius: 4px;
                }
                .ae-status.success {
                    background: #e8f5e9;
                    color: #4caf50;
                }
                .ae-status.error {
                    background: #ffebee;
                    color: #f44336;
                }
                .ae-duration {
                    font-size: 12px;
                    color: #888;
                }
                .ae-json {
                    background: #282c34;
                    color: #abb2bf;
                    padding: 16px;
                    border-radius: 6px;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                    overflow-x: auto;
                    max-height: 400px;
                    overflow-y: auto;
                }
                .ae-error {
                    background: #ffebee;
                    color: #c62828;
                    padding: 16px;
                    border-radius: 6px;
                }
                .ae-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                .ae-empty {
                    text-align: center;
                    padding: 40px;
                    color: #888;
                }
                .ae-toast {
                    position: fixed;
                    bottom: 60px;
                    right: 20px;
                    background: #333;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 13px;
                    z-index: 1000;
                }
            </style>
            <div class="api-explorer">
                <div class="ae-section">
                    <div class="ae-section-title">Request</div>
                    <div class="ae-row">
                        <span class="ae-label">Service</span>
                        <select class="ae-select" id="ae-service">
                            <option value="html-graph" ${this.state.service === 'html-graph' ? 'selected' : ''}>HTML Graph</option>
                            <option value="text-transform" ${this.state.service === 'text-transform' ? 'selected' : ''}>Text Transform</option>
                            <option value="llms" ${this.state.service === 'llms' ? 'selected' : ''}>LLMs</option>
                        </select>
                    </div>
                    <div class="ae-row">
                        <span class="ae-label">Endpoint</span>
                        <select class="ae-select" id="ae-endpoint-select">
                            <option value="">-- Select endpoint or type below --</option>
                            ${endpoints.map(e => `<option value="${e.path}" data-method="${e.method}">${e.method} ${e.path} - ${e.description}</option>`).join('')}
                        </select>
                    </div>
                    <div class="ae-row">
                        <span class="ae-label">Custom</span>
                        <input type="text" class="ae-input" id="ae-endpoint-input" placeholder="/custom/endpoint/{param}" value="${this.state.endpoint}">
                    </div>
                    <div class="ae-row">
                        <span class="ae-label">Method</span>
                        <select class="ae-select" id="ae-method" style="max-width: 120px;">
                            <option value="GET" ${this.state.method === 'GET' ? 'selected' : ''}>GET</option>
                            <option value="POST" ${this.state.method === 'POST' ? 'selected' : ''}>POST</option>
                            <option value="PUT" ${this.state.method === 'PUT' ? 'selected' : ''}>PUT</option>
                            <option value="DELETE" ${this.state.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
                        </select>
                    </div>
                </div>

                <div class="ae-section" id="ae-params-section">
                    <div class="ae-section-title">Path Parameters</div>
                    <div class="ae-params" id="ae-params"></div>
                </div>

                <div class="ae-section" id="ae-body-section">
                    <div class="ae-section-title">Request Body (JSON)</div>
                    <textarea class="ae-textarea" id="ae-body" placeholder='{"key": "value"}'>${this.state.body}</textarea>
                </div>

                <div class="ae-section">
                    <button class="ae-btn ae-btn-primary" id="ae-send" ${this.state.loading ? 'disabled' : ''}>
                        ${this.state.loading ? '⟳ Sending...' : '▶ Send Request'}
                    </button>
                </div>

                <div class="ae-response" id="ae-response">
                    ${this.renderResponse()}
                </div>
            </div>
        `;
        this.bindElements();
        this.updateParamsUI();
    }

    renderResponse() {
        if (this.state.loading) {
            return '<div class="ae-empty">Sending request...</div>';
        }

        if (this.state.error) {
            return `
                <div class="ae-response-header">
                    <span class="ae-status error">Error</span>
                    ${this.state.duration ? `<span class="ae-duration">${this.state.duration}ms</span>` : ''}
                </div>
                <div class="ae-error">${this.escapeHtml(this.state.error)}</div>
            `;
        }

        if (this.state.response !== null) {
            const isSuccess = this.state.status >= 200 && this.state.status < 400;
            return `
                <div class="ae-response-header">
                    <span class="ae-status ${isSuccess ? 'success' : 'error'}">${this.state.status}</span>
                    ${this.state.duration ? `<span class="ae-duration">${this.state.duration}ms</span>` : ''}
                </div>
                <pre class="ae-json">${this.escapeHtml(JSON.stringify(this.state.response, null, 2))}</pre>
                <div class="ae-actions">
                    <button class="ae-btn ae-btn-secondary" id="ae-copy-response">📋 Copy Response</button>
                    <button class="ae-btn ae-btn-secondary" id="ae-copy-curl">📋 Copy cURL</button>
                </div>
            `;
        }

        return '<div class="ae-empty">Send a request to see the response.</div>';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    bindElements() {
        this.$service = this.querySelector('#ae-service');
        this.$endpointSelect = this.querySelector('#ae-endpoint-select');
        this.$endpointInput = this.querySelector('#ae-endpoint-input');
        this.$method = this.querySelector('#ae-method');
        this.$params = this.querySelector('#ae-params');
        this.$paramsSection = this.querySelector('#ae-params-section');
        this.$body = this.querySelector('#ae-body');
        this.$bodySection = this.querySelector('#ae-body-section');
        this.$sendBtn = this.querySelector('#ae-send');
        this.$response = this.querySelector('#ae-response');
    }

    setupEventListeners() {
        this.$service.addEventListener('change', () => {
            this.state.service = this.$service.value;
            this.render();
        });

        this.$endpointSelect.addEventListener('change', () => {
            const selected = this.$endpointSelect.selectedOptions[0];
            if (selected.value) {
                this.$endpointInput.value = selected.value;
                this.state.endpoint = selected.value;
                if (selected.dataset.method) {
                    this.$method.value = selected.dataset.method;
                    this.state.method = selected.dataset.method;
                }
                this.updateParamsUI();
                this.updateBodyVisibility();

                // Set body template if available
                const endpoints = ENDPOINTS[this.state.service] || [];
                const endpoint = endpoints.find(e => e.path === selected.value);
                if (endpoint?.bodyTemplate) {
                    this.$body.value = JSON.stringify(endpoint.bodyTemplate, null, 2);
                }
            }
        });

        this.$endpointInput.addEventListener('input', () => {
            this.state.endpoint = this.$endpointInput.value;
            this.updateParamsUI();
        });

        this.$method.addEventListener('change', () => {
            this.state.method = this.$method.value;
            this.updateBodyVisibility();
        });

        this.$sendBtn.addEventListener('click', () => this.sendRequest());

        // Response actions
        this.$response.addEventListener('click', (e) => {
            if (e.target.id === 'ae-copy-response') {
                this.copyResponse();
            } else if (e.target.id === 'ae-copy-curl') {
                this.copyCurl();
            }
        });
    }

    parsePathParams(endpoint) {
        const matches = endpoint.match(/\{([^}]+)\}/g) || [];
        return matches.map(m => m.slice(1, -1));
    }

    updateParamsUI() {
        const params = this.parsePathParams(this.state.endpoint);

        if (params.length === 0) {
            this.$paramsSection.style.display = 'none';
            return;
        }

        this.$paramsSection.style.display = 'block';

        // Set defaults
        const defaults = {
            namespace: this.config.get('defaults.namespace') || 'html-cache'
        };

        this.$params.innerHTML = params.map(param => `
            <span class="ae-param-label">{${param}}</span>
            <input type="text" class="ae-input" data-param="${param}"
                placeholder="${param}" value="${this.state.params[param] || defaults[param] || ''}">
        `).join('');

        // Update params state when inputs change
        this.$params.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                this.state.params[input.dataset.param] = input.value;
            });
            // Initialize state
            this.state.params[input.dataset.param] = input.value;
        });
    }

    updateBodyVisibility() {
        this.$bodySection.style.display = this.state.method === 'GET' ? 'none' : 'block';
    }

    buildUrl(endpoint, params) {
        let url = endpoint;
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`{${key}}`, encodeURIComponent(value));
        }
        return url;
    }

    async sendRequest() {
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

            if (this.state.method !== 'GET' && this.$body.value.trim()) {
                try {
                    body = JSON.parse(this.$body.value);
                } catch (e) {
                    throw new Error('Invalid JSON in request body');
                }
            }

            const response = await this.api.call(
                this.state.service,
                endpoint,
                this.state.method,
                body
            );

            this.state.loading = false;
            this.state.response = response;
            this.state.status = 200;
            this.state.duration = Date.now() - startTime;

        } catch (error) {
            this.state.loading = false;
            this.state.error = error.message;
            this.state.status = error.status || 500;
            this.state.duration = Date.now() - startTime;
        }

        this.render();
    }

    generateCurl() {
        const config = this.config.getService(this.state.service);
        const endpoint = this.buildUrl(this.state.endpoint, this.state.params);
        const url = `${config.baseUrl}${endpoint}`;

        let curl = `curl -X ${this.state.method}`;
        curl += ` "${url}"`;
        curl += ` -H "Content-Type: application/json"`;

        if (config.headerName && config.headerValue) {
            curl += ` -H "${config.headerName}: ${config.headerValue}"`;
        }

        if (this.state.method !== 'GET' && this.$body.value.trim()) {
            curl += ` -d '${this.$body.value.replace(/'/g, "'\\''")}'`;
        }

        return curl;
    }

    copyResponse() {
        if (this.state.response) {
            navigator.clipboard.writeText(JSON.stringify(this.state.response, null, 2));
            this.showToast('Response copied to clipboard');
        }
    }

    copyCurl() {
        const curl = this.generateCurl();
        navigator.clipboard.writeText(curl);
        this.showToast('cURL copied to clipboard');
    }

    showToast(message) {
        const existing = this.querySelector('.ae-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'ae-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    get api() { return window.workbench.api; }
    get config() { return window.workbench.config; }
}

customElements.define('api-explorer', ApiExplorer);
