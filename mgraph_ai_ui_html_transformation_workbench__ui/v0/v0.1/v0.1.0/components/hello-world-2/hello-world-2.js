/**
 * Hello World 2 - Event Receiver
 *
 * Purpose: Validates event listening, API client, config manager, cleanup
 * Story: F5
 * Version: v0.1.0
 */

class HelloWorld2 extends HTMLElement {

    static get appId()    { return 'hello-world-2'; }
    static get navLabel() { return 'Hello 2'; }
    static get navIcon()  { return '🎯'; }

    constructor() {
        super();
        this.state = {
            receivedCount: 0,
            lastEvent: null,
            apiTestResult: null
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
        this.updateConfigDisplay();
    }

    onDeactivate() {
        // Nothing special needed
    }

    render() {
        this.innerHTML = `
            <style>
                .hello-world-2 {
                    padding: 24px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .hw-header {
                    text-align: center;
                    margin-bottom: 24px;
                }
                .hw-header h1 {
                    margin: 0;
                    color: #667eea;
                    font-size: 28px;
                }
                .hw-header p {
                    margin: 8px 0 0;
                    color: #666;
                }
                .hw-section {
                    border: 1px solid #e0e0e0;
                    padding: 16px;
                    margin: 12px 0;
                    border-radius: 8px;
                    background: #fff;
                }
                .hw-section h3 {
                    margin: 0 0 12px 0;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #eee;
                    font-size: 14px;
                    font-weight: 600;
                }
                .hw-features {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 16px 0;
                }
                .hw-features li {
                    padding: 4px 0;
                    color: #4caf50;
                }
                .hw-button {
                    padding: 10px 20px;
                    margin: 8px 8px 8px 0;
                    cursor: pointer;
                    border: none;
                    border-radius: 6px;
                    font-family: inherit;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                .hw-button-primary {
                    background: #667eea;
                    color: white;
                }
                .hw-button-primary:hover {
                    background: #5a6fd6;
                }
                .hw-button-secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .hw-button-secondary:hover {
                    background: #e0e0e0;
                }
                .hw-event-box {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                    margin-top: 12px;
                }
                .hw-config-line {
                    padding: 6px 0;
                    border-bottom: 1px solid #eee;
                }
                .hw-config-line:last-child {
                    border-bottom: none;
                }
                .hw-config-label {
                    font-weight: 600;
                    color: #555;
                }
                .success {
                    color: #4caf50;
                    font-weight: 500;
                }
                .error {
                    color: #dc3545;
                    font-weight: 500;
                }
                .info {
                    color: #2196f3;
                }
                code {
                    background: #e8e8e8;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 12px;
                }
            </style>
            <div class="hello-world-2">
                <div class="hw-header">
                    <h1>HELLO WORLD 2</h1>
                    <p>Event Receiver</p>
                </div>

                <ul class="hw-features">
                    <li>✓ Receiving events</li>
                    <li>✓ Using API client</li>
                    <li>✓ Using config manager</li>
                    <li>✓ Proper cleanup</li>
                </ul>

                <div class="hw-section">
                    <h3>Received Events</h3>
                    <p>Listening for: <code>test-event</code>, <code>hello-ping</code></p>
                    <p>Total Received: <strong id="received-count">0</strong></p>
                    <div id="last-event" class="hw-event-box">No events received yet.</div>
                </div>

                <div class="hw-section">
                    <h3>API Test</h3>
                    <button id="api-test-btn" class="hw-button hw-button-primary">🔌 Test API Connection</button>
                    <div id="api-result" style="margin-top: 12px;"></div>
                </div>

                <div class="hw-section">
                    <h3>Config Test</h3>
                    <div id="config-display">Loading...</div>
                </div>

                <div style="margin-top: 20px;">
                    <button id="nav-btn" class="hw-button hw-button-secondary">➡️ Navigate to Hello World 1</button>
                </div>
            </div>
        `;
        this.bindElements();
    }

    bindElements() {
        this.$receivedCount = this.querySelector('#received-count');
        this.$lastEvent = this.querySelector('#last-event');
        this.$apiTestBtn = this.querySelector('#api-test-btn');
        this.$apiResult = this.querySelector('#api-result');
        this.$configDisplay = this.querySelector('#config-display');
        this.$navBtn = this.querySelector('#nav-btn');
    }

    setupEventListeners() {
        // Store bound handlers for cleanup
        this._boundHandlers.onTestEvent = this.onTestEvent.bind(this);
        this._boundHandlers.onHelloPing = this.onHelloPing.bind(this);

        // Subscribe to events
        this.events.on('test-event', this._boundHandlers.onTestEvent);
        this.events.on('hello-ping', this._boundHandlers.onHelloPing);

        // DOM listeners
        this.$apiTestBtn.addEventListener('click', () => this.testApiConnection());
        this.$navBtn.addEventListener('click', () => this.router.navigate('hello-world-1'));
    }

    cleanup() {
        // IMPORTANT: Unsubscribe from events
        this.events.off('test-event', this._boundHandlers.onTestEvent);
        this.events.off('hello-ping', this._boundHandlers.onHelloPing);
    }

    onTestEvent(detail) {
        this.handleReceivedEvent('test-event', detail);
    }

    onHelloPing(detail) {
        this.handleReceivedEvent('hello-ping', detail);
    }

    handleReceivedEvent(name, detail) {
        this.state.receivedCount++;
        this.state.lastEvent = { name, detail, time: new Date().toLocaleTimeString() };
        this.updateReceivedDisplay();
    }

    updateReceivedDisplay() {
        this.$receivedCount.textContent = this.state.receivedCount;
        if (this.state.lastEvent) {
            this.$lastEvent.innerHTML = `
                <div><strong>Name:</strong> ${this.state.lastEvent.name}</div>
                <div><strong>Data:</strong> ${JSON.stringify(this.state.lastEvent.detail)}</div>
                <div><strong>Time:</strong> ${this.state.lastEvent.time}</div>
            `;
        }
    }

    async testApiConnection() {
        this.$apiResult.innerHTML = '<span class="info">Testing...</span>';
        const startTime = Date.now();

        try {
            const namespace = this.config.get('defaults.namespace');
            const result = await this.api.htmlGraph.listEntities(namespace);
            const duration = Date.now() - startTime;

            if (result.success) {
                this.$apiResult.innerHTML = `<span class="success">✓ Connected to html-graph (${duration}ms) - Found ${result.count || 0} entities</span>`;
            } else {
                this.$apiResult.innerHTML = `<span class="error">✗ API returned error: ${result.error || 'Unknown error'}</span>`;
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            this.$apiResult.innerHTML = `<span class="error">✗ Connection failed (${duration}ms): ${error.message}</span>`;
        }
    }

    updateConfigDisplay() {
        const ns = this.config.get('defaults.namespace');
        const htmlGraphUrl = this.config.get('services.html-graph.baseUrl');
        const hasApiKey = !!this.config.get('services.html-graph.headerValue');

        this.$configDisplay.innerHTML = `
            <div class="hw-config-line">
                <span class="hw-config-label">Default Namespace:</span>
                ${ns || '<em>(not set)</em>'}
            </div>
            <div class="hw-config-line">
                <span class="hw-config-label">HTML Graph URL:</span>
                ${htmlGraphUrl || '<em>(not set)</em>'}
            </div>
            <div class="hw-config-line">
                <span class="hw-config-label">API Key Configured:</span>
                ${hasApiKey ? '<span class="success">✓ Yes</span>' : '<span class="error">✗ No</span>'}
            </div>
        `;
    }

    get events() { return window.workbench.events; }
    get api()    { return window.workbench.api; }
    get config() { return window.workbench.config; }
    get router() { return window.workbench.router; }
}

customElements.define('hello-world-2', HelloWorld2);
