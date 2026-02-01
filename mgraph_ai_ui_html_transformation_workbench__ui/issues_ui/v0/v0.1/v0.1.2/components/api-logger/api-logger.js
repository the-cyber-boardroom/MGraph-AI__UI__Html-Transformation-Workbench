/**
 * API Logger Mini App
 *
 * Purpose: Debugging mini app that displays all API calls made by the application
 * Version: v0.1.2 (Issues UI)
 *
 * Intercepts fetch calls and displays request/response details for debugging.
 * Namespace: window.issuesApp
 */

class ApiLogger extends HTMLElement {

    static get appId()    { return 'api-logger'; }
    static get navLabel() { return 'API Log'; }
    static get navIcon()  { return '🔌'; }

    constructor() {
        super();
        this.state = {
            calls: [],
            filter: '',
            methodFilter: '',
            statusFilter: '',
            isPaused: false,
            expandedIds: new Set()
        };
        this._originalFetch = null;
        this._callId = 0;
    }

    connectedCallback() {
        this.render();
        this.setupFetchInterceptor();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    onActivate() {
        this.renderCallList();
    }

    onDeactivate() {}

    setupFetchInterceptor() {
        if (this._originalFetch) return; // Already intercepted

        this._originalFetch = window.fetch.bind(window);
        const self = this;

        window.fetch = async function(url, options = {}) {
            const callId = ++self._callId;
            const startTime = Date.now();
            const method = options.method || 'GET';

            // Create call record
            const call = {
                id: callId,
                url: url.toString(),
                method: method,
                requestHeaders: options.headers || {},
                requestBody: options.body,
                status: 'pending',
                statusCode: null,
                responseHeaders: {},
                responseBody: null,
                startTime: startTime,
                endTime: null,
                duration: null,
                error: null
            };

            if (!self.state.isPaused) {
                self.state.calls.unshift(call);
                if (self.state.calls.length > 200) {
                    self.state.calls = self.state.calls.slice(0, 200);
                }
                self.renderCallList();
            }

            try {
                const response = await self._originalFetch(url, options);
                const endTime = Date.now();

                // Clone response to read body
                const clonedResponse = response.clone();
                let responseBody;
                try {
                    responseBody = await clonedResponse.text();
                    // Try to parse as JSON for pretty display
                    try {
                        responseBody = JSON.parse(responseBody);
                    } catch (e) {
                        // Keep as text if not JSON
                    }
                } catch (e) {
                    responseBody = '[Unable to read response body]';
                }

                // Update call record
                call.status = response.ok ? 'success' : 'error';
                call.statusCode = response.status;
                call.responseHeaders = Object.fromEntries(response.headers.entries());
                call.responseBody = responseBody;
                call.endTime = endTime;
                call.duration = endTime - startTime;

                if (!self.state.isPaused) {
                    self.renderCallList();
                }

                // Emit event for other components
                if (window.issuesApp && window.issuesApp.events) {
                    window.issuesApp.events.emit('api-call', {
                        id: callId,
                        method: method,
                        url: url.toString(),
                        status: response.status,
                        duration: call.duration
                    });
                }

                return response;
            } catch (error) {
                const endTime = Date.now();

                call.status = 'error';
                call.error = error.message;
                call.endTime = endTime;
                call.duration = endTime - startTime;

                if (!self.state.isPaused) {
                    self.renderCallList();
                }

                // Emit event for errors
                if (window.issuesApp && window.issuesApp.events) {
                    window.issuesApp.events.emit('api-error', {
                        id: callId,
                        method: method,
                        url: url.toString(),
                        error: error.message
                    });
                }

                throw error;
            }
        };
    }

    cleanup() {
        if (this._originalFetch) {
            window.fetch = this._originalFetch;
            this._originalFetch = null;
        }
    }

    render() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="api-logger">
                <div class="al-toolbar">
                    <input type="text" class="al-filter-input" id="al-filter" placeholder="Filter by URL...">
                    <select class="al-select" id="al-method-filter">
                        <option value="">All Methods</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                    <select class="al-select" id="al-status-filter">
                        <option value="">All Status</option>
                        <option value="success">Success</option>
                        <option value="error">Error</option>
                        <option value="pending">Pending</option>
                    </select>
                    <button class="al-btn al-btn-secondary" id="al-pause">Pause</button>
                    <button class="al-btn al-btn-secondary" id="al-clear">Clear</button>
                </div>
                <div class="al-list" id="al-list"></div>
                <div class="al-status">
                    <span id="al-count">0 calls</span>
                    <span id="al-stream" class="al-live">Live</span>
                </div>
            </div>
        `;
        this.bindElements();
        this.attachEventHandlers();
    }

    bindElements() {
        this.$filter = this.querySelector('#al-filter');
        this.$methodFilter = this.querySelector('#al-method-filter');
        this.$statusFilter = this.querySelector('#al-status-filter');
        this.$pauseBtn = this.querySelector('#al-pause');
        this.$clearBtn = this.querySelector('#al-clear');
        this.$list = this.querySelector('#al-list');
        this.$count = this.querySelector('#al-count');
        this.$stream = this.querySelector('#al-stream');
    }

    attachEventHandlers() {
        this.$filter.addEventListener('input', (e) => {
            this.state.filter = e.target.value.toLowerCase();
            this.renderCallList();
        });

        this.$methodFilter.addEventListener('change', (e) => {
            this.state.methodFilter = e.target.value;
            this.renderCallList();
        });

        this.$statusFilter.addEventListener('change', (e) => {
            this.state.statusFilter = e.target.value;
            this.renderCallList();
        });

        this.$pauseBtn.addEventListener('click', () => this.togglePause());
        this.$clearBtn.addEventListener('click', () => this.clearCalls());
    }

    getFilteredCalls() {
        return this.state.calls.filter(call => {
            if (this.state.filter && !call.url.toLowerCase().includes(this.state.filter)) {
                return false;
            }
            if (this.state.methodFilter && call.method !== this.state.methodFilter) {
                return false;
            }
            if (this.state.statusFilter && call.status !== this.state.statusFilter) {
                return false;
            }
            return true;
        });
    }

    renderCallList() {
        const filtered = this.getFilteredCalls();

        if (filtered.length === 0) {
            this.$list.innerHTML = `
                <div class="al-empty">
                    ${this.state.calls.length === 0
                        ? 'No API calls yet. Make some requests to see them here.'
                        : 'No calls match your filter.'}
                </div>
            `;
        } else {
            this.$list.innerHTML = filtered.map(call => this.renderCallItem(call)).join('');

            // Attach expand handlers
            this.$list.querySelectorAll('.al-call-header').forEach(header => {
                header.addEventListener('click', () => {
                    const id = parseInt(header.dataset.id);
                    this.toggleExpand(id);
                });
            });
        }

        const total = this.state.calls.length;
        const shown = filtered.length;
        this.$count.textContent = shown === total ? `${total} calls` : `${shown} of ${total} calls`;
    }

    renderCallItem(call) {
        const isExpanded = this.state.expandedIds.has(call.id);
        const time = new Date(call.startTime).toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const urlPath = this.getUrlPath(call.url);
        const statusClass = call.status === 'success' ? 'al-status-success'
                         : call.status === 'error' ? 'al-status-error'
                         : 'al-status-pending';
        const methodClass = `al-method-${call.method.toLowerCase()}`;

        return `
            <div class="al-call ${statusClass}">
                <div class="al-call-header" data-id="${call.id}">
                    <div class="al-call-left">
                        <span class="al-call-method ${methodClass}">${call.method}</span>
                        <span class="al-call-url" title="${this.escapeHtml(call.url)}">${this.escapeHtml(urlPath)}</span>
                    </div>
                    <div class="al-call-right">
                        ${call.statusCode ? `<span class="al-call-code">${call.statusCode}</span>` : ''}
                        ${call.duration !== null ? `<span class="al-call-duration">${call.duration}ms</span>` : ''}
                        <span class="al-call-time">${time}</span>
                        <span class="al-call-expand">${isExpanded ? '−' : '+'}</span>
                    </div>
                </div>
                ${isExpanded ? this.renderCallDetail(call) : ''}
            </div>
        `;
    }

    renderCallDetail(call) {
        return `
            <div class="al-call-detail">
                <div class="al-detail-section">
                    <div class="al-detail-title">URL</div>
                    <div class="al-detail-value al-mono">${this.escapeHtml(call.url)}</div>
                </div>

                ${call.requestBody ? `
                    <div class="al-detail-section">
                        <div class="al-detail-title">Request Body</div>
                        <pre class="al-detail-json">${this.formatJson(call.requestBody)}</pre>
                    </div>
                ` : ''}

                ${call.responseBody ? `
                    <div class="al-detail-section">
                        <div class="al-detail-title">Response Body</div>
                        <pre class="al-detail-json">${this.formatJson(call.responseBody)}</pre>
                    </div>
                ` : ''}

                ${call.error ? `
                    <div class="al-detail-section">
                        <div class="al-detail-title">Error</div>
                        <div class="al-detail-error">${this.escapeHtml(call.error)}</div>
                    </div>
                ` : ''}

                <div class="al-detail-section">
                    <div class="al-detail-title">Response Headers</div>
                    <pre class="al-detail-json">${this.formatJson(call.responseHeaders)}</pre>
                </div>
            </div>
        `;
    }

    getUrlPath(url) {
        try {
            const parsed = new URL(url, window.location.origin);
            return parsed.pathname + parsed.search;
        } catch (e) {
            return url;
        }
    }

    formatJson(data) {
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return this.escapeHtml(data);
            }
        }
        return this.escapeHtml(JSON.stringify(data, null, 2));
    }

    escapeHtml(text) {
        if (typeof text !== 'string') text = String(text);
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleExpand(callId) {
        if (this.state.expandedIds.has(callId)) {
            this.state.expandedIds.delete(callId);
        } else {
            this.state.expandedIds.add(callId);
        }
        this.renderCallList();
    }

    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        this.$pauseBtn.textContent = this.state.isPaused ? 'Resume' : 'Pause';
        this.$stream.textContent = this.state.isPaused ? 'Paused' : 'Live';
        this.$stream.className = this.state.isPaused ? 'al-paused' : 'al-live';
    }

    clearCalls() {
        this.state.calls = [];
        this.state.expandedIds.clear();
        this.renderCallList();
    }

    getStyles() {
        return `
            .api-logger { display: flex; flex-direction: column; height: 100%; background: #1a1a2e; color: #e0e0e0; }
            .al-toolbar { display: flex; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #2a3f5f; background: #1e2746; align-items: center; flex-wrap: wrap; }
            .al-filter-input { flex: 1; min-width: 120px; padding: 8px 12px; border: 1px solid #3a4f6f; border-radius: 4px; background: #252836; color: #e0e0e0; font-size: 13px; }
            .al-filter-input:focus { outline: none; border-color: #667eea; }
            .al-select { padding: 8px 12px; border: 1px solid #3a4f6f; border-radius: 4px; background: #252836; color: #e0e0e0; font-size: 13px; min-width: 100px; }
            .al-btn { padding: 8px 14px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
            .al-btn-secondary { background: #3a4f6f; color: #e0e0e0; }
            .al-btn-secondary:hover { background: #4a5f7f; }
            .al-list { flex: 1; overflow-y: auto; padding: 12px 16px; }
            .al-call { border: 1px solid #2a3f5f; border-radius: 6px; margin-bottom: 8px; background: #1e2746; overflow: hidden; }
            .al-call.al-status-success { border-left: 3px solid #22c55e; }
            .al-call.al-status-error { border-left: 3px solid #ef4444; }
            .al-call.al-status-pending { border-left: 3px solid #f59e0b; }
            .al-call-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; cursor: pointer; gap: 12px; }
            .al-call-header:hover { background: #252836; }
            .al-call-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; overflow: hidden; }
            .al-call-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
            .al-call-method { font-weight: 600; font-size: 11px; padding: 2px 6px; border-radius: 3px; }
            .al-method-get { background: #22c55e20; color: #22c55e; }
            .al-method-post { background: #3b82f620; color: #3b82f6; }
            .al-method-put { background: #f59e0b20; color: #f59e0b; }
            .al-method-patch { background: #8b5cf620; color: #8b5cf6; }
            .al-method-delete { background: #ef444420; color: #ef4444; }
            .al-call-url { font-size: 12px; color: #a0b0c0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .al-call-code { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 3px; background: #3a4f6f; }
            .al-call-duration { font-size: 11px; color: #6a7a8a; font-family: monospace; }
            .al-call-time { font-size: 11px; color: #6a7a8a; font-family: monospace; }
            .al-call-expand { color: #6a7a8a; font-size: 14px; font-weight: bold; width: 20px; text-align: center; }
            .al-call-detail { padding: 12px; border-top: 1px solid #2a3f5f; background: #1a1a2e; }
            .al-detail-section { margin-bottom: 12px; }
            .al-detail-section:last-child { margin-bottom: 0; }
            .al-detail-title { font-size: 11px; font-weight: 600; color: #6a7a8a; text-transform: uppercase; margin-bottom: 6px; }
            .al-detail-value { font-size: 12px; color: #a0b0c0; }
            .al-detail-json { font-family: monospace; font-size: 11px; white-space: pre-wrap; background: #252836; color: #a0b0c0; padding: 12px; border-radius: 4px; overflow-x: auto; max-height: 200px; margin: 0; }
            .al-detail-error { font-size: 12px; color: #ef4444; padding: 8px 12px; background: #ef444420; border-radius: 4px; }
            .al-mono { font-family: monospace; font-size: 11px; }
            .al-status { padding: 10px 16px; border-top: 1px solid #2a3f5f; background: #1e2746; font-size: 12px; color: #6a7a8a; display: flex; justify-content: space-between; align-items: center; }
            .al-live { color: #22c55e; font-weight: 500; }
            .al-paused { color: #f59e0b; font-weight: 500; }
            .al-empty { text-align: center; padding: 40px; color: #6a7a8a; }
        `;
    }

    get events() { return window.issuesApp.events; }
}

customElements.define('api-logger', ApiLogger);

console.log('[Issues UI v0.1.2] API Logger component initialized');
