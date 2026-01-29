/**
 * Automation Runner Mini App
 *
 * Purpose: Run predefined automation scenarios for UI testing
 * Version: v0.1.5
 *
 * Allows triggering sequences of events/API calls from JSON templates
 * to quickly set up specific application states for testing.
 */

// Built-in automation scenarios
const AUTOMATION_SCENARIOS = [
    {
        id: 'load-sample-page',
        name: 'Load Sample HTML Page',
        description: 'Load a sample HTML page into the workbench',
        category: 'basics',
        steps: [
            {
                type: 'navigate',
                target: 'html-workbench'
            },
            {
                type: 'event',
                name: 'html-loaded',
                data: {
                    cacheKey: 'sample-page',
                    html: '<html><head><title>Sample</title></head><body><h1>Hello World</h1><p>This is a test page.</p></body></html>'
                }
            }
        ]
    },
    {
        id: 'browse-html-graph',
        name: 'Browse html-graph Site',
        description: 'Open Site Browser and load html-graph pages',
        category: 'browsing',
        steps: [
            {
                type: 'navigate',
                target: 'site-browser'
            },
            {
                type: 'delay',
                ms: 500
            },
            {
                type: 'event',
                name: 'site-loaded',
                data: {
                    domain: 'html-graph',
                    pages: []
                }
            }
        ]
    },
    {
        id: 'view-docs-architecture',
        name: 'View Architecture Docs',
        description: 'Open documentation viewer to architecture brief',
        category: 'docs',
        steps: [
            {
                type: 'navigate',
                target: 'docs-viewer'
            },
            {
                type: 'delay',
                ms: 300
            },
            {
                type: 'event',
                name: 'docs-path-change',
                data: {
                    path: 'v0.1.1__create__workbench-architecture-and-stories/part-2__ARCHITECTURE__HTML_Transformation_Workbench.md'
                }
            }
        ]
    },
    {
        id: 'test-api-endpoint',
        name: 'Test API Endpoint',
        description: 'Open API Explorer and test the entities endpoint',
        category: 'api',
        steps: [
            {
                type: 'navigate',
                target: 'api-explorer'
            },
            {
                type: 'delay',
                ms: 200
            },
            {
                type: 'api',
                service: 'html-graph',
                endpoint: '/cache-entity/html-graph/entities',
                method: 'GET'
            }
        ]
    },
    {
        id: 'open-debug-panels',
        name: 'Open Debug Panels',
        description: 'Open Events Viewer and API Logger in sidebar',
        category: 'debug',
        steps: [
            {
                type: 'sidebar',
                action: 'open',
                tab: 'events-viewer'
            },
            {
                type: 'delay',
                ms: 1000
            },
            {
                type: 'sidebar',
                action: 'open',
                tab: 'api-logger'
            }
        ]
    },
    {
        id: 'full-workflow',
        name: 'Full Workflow Demo',
        description: 'Demonstrate browsing, loading, and analyzing a page',
        category: 'demo',
        steps: [
            {
                type: 'sidebar',
                action: 'open',
                tab: 'events-viewer'
            },
            {
                type: 'navigate',
                target: 'site-browser'
            },
            {
                type: 'delay',
                ms: 1000
            },
            {
                type: 'event',
                name: 'site-browse-requested',
                data: { domain: 'html-graph' }
            },
            {
                type: 'delay',
                ms: 2000
            },
            {
                type: 'navigate',
                target: 'html-workbench'
            }
        ]
    }
];

class AutomationRunner extends HTMLElement {

    static get appId()    { return 'automation-runner'; }
    static get navLabel() { return 'Automation'; }
    static get navIcon()  { return '🤖'; }

    constructor() {
        super();
        this.state = {
            scenarios: AUTOMATION_SCENARIOS,
            customScenarios: [],
            running: false,
            currentScenario: null,
            currentStep: 0,
            results: [],
            filter: ''
        };
        this._loadCustomScenarios();
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {}

    onActivate() {
        this.render();
    }

    onDeactivate() {}

    _loadCustomScenarios() {
        try {
            const saved = localStorage.getItem('automation-scenarios');
            if (saved) {
                this.state.customScenarios = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load custom scenarios:', e);
        }
    }

    _saveCustomScenarios() {
        try {
            localStorage.setItem('automation-scenarios', JSON.stringify(this.state.customScenarios));
        } catch (e) {
            console.error('Failed to save custom scenarios:', e);
        }
    }

    render() {
        const allScenarios = [...this.state.scenarios, ...this.state.customScenarios];
        const filtered = this.state.filter
            ? allScenarios.filter(s =>
                s.name.toLowerCase().includes(this.state.filter.toLowerCase()) ||
                s.description.toLowerCase().includes(this.state.filter.toLowerCase()) ||
                s.category.toLowerCase().includes(this.state.filter.toLowerCase())
            )
            : allScenarios;

        // Group by category
        const categories = {};
        for (const scenario of filtered) {
            const cat = scenario.category || 'other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(scenario);
        }

        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="automation-runner">
                <div class="ar-header">
                    <h3>Automation Runner</h3>
                    <p class="ar-subtitle">Run predefined scenarios to test UI workflows</p>
                </div>

                <div class="ar-toolbar">
                    <input type="text" class="ar-search" id="ar-search"
                        placeholder="Filter scenarios..." value="${this.escapeHtml(this.state.filter)}">
                    <button class="ar-btn ar-btn-secondary" id="ar-import">Import</button>
                </div>

                ${this.state.running ? `
                    <div class="ar-running">
                        <div class="ar-running-header">
                            <span class="ar-running-icon">⚙️</span>
                            <span>Running: ${this.escapeHtml(this.state.currentScenario?.name || '')}</span>
                        </div>
                        <div class="ar-progress">
                            <div class="ar-progress-bar" style="width: ${(this.state.currentStep / (this.state.currentScenario?.steps?.length || 1)) * 100}%"></div>
                        </div>
                        <div class="ar-step-info">
                            Step ${this.state.currentStep + 1} of ${this.state.currentScenario?.steps?.length || 0}
                        </div>
                        <button class="ar-btn ar-btn-danger" id="ar-stop">Stop</button>
                    </div>
                ` : ''}

                <div class="ar-scenarios">
                    ${Object.entries(categories).map(([category, scenarios]) => `
                        <div class="ar-category">
                            <div class="ar-category-header">${this.formatCategory(category)}</div>
                            ${scenarios.map(s => `
                                <div class="ar-scenario" data-id="${s.id}">
                                    <div class="ar-scenario-info">
                                        <div class="ar-scenario-name">${this.escapeHtml(s.name)}</div>
                                        <div class="ar-scenario-desc">${this.escapeHtml(s.description)}</div>
                                        <div class="ar-scenario-meta">${s.steps?.length || 0} steps</div>
                                    </div>
                                    <div class="ar-scenario-actions">
                                        <button class="ar-btn ar-btn-primary ar-run-btn" data-id="${s.id}">
                                            ▶ Run
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>

                ${this.state.results.length > 0 ? `
                    <div class="ar-results">
                        <div class="ar-results-header">
                            <span>Recent Results</span>
                            <button class="ar-btn-link" id="ar-clear-results">Clear</button>
                        </div>
                        ${this.state.results.slice(-5).reverse().map(r => `
                            <div class="ar-result ${r.success ? 'success' : 'error'}">
                                <span class="ar-result-icon">${r.success ? '✓' : '✗'}</span>
                                <span class="ar-result-name">${this.escapeHtml(r.name)}</span>
                                <span class="ar-result-time">${this.formatTime(r.duration)}ms</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        this.attachEventHandlers();
    }

    formatCategory(category) {
        const icons = {
            basics: '📦',
            browsing: '🌐',
            docs: '📚',
            api: '🧪',
            debug: '🔧',
            demo: '🎬',
            custom: '⚡',
            other: '📋'
        };
        const icon = icons[category] || '📋';
        return `${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    }

    formatTime(ms) {
        return ms < 1000 ? ms : (ms / 1000).toFixed(1) + 's';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    attachEventHandlers() {
        // Search filter
        this.querySelector('#ar-search')?.addEventListener('input', (e) => {
            this.state.filter = e.target.value;
            this.render();
        });

        // Import button
        this.querySelector('#ar-import')?.addEventListener('click', () => this.importScenario());

        // Stop button
        this.querySelector('#ar-stop')?.addEventListener('click', () => this.stopScenario());

        // Clear results
        this.querySelector('#ar-clear-results')?.addEventListener('click', () => {
            this.state.results = [];
            this.render();
        });

        // Run buttons
        this.querySelectorAll('.ar-run-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const allScenarios = [...this.state.scenarios, ...this.state.customScenarios];
                const scenario = allScenarios.find(s => s.id === id);
                if (scenario) {
                    this.runScenario(scenario);
                }
            });
        });
    }

    async runScenario(scenario) {
        if (this.state.running) {
            this.showToast('A scenario is already running');
            return;
        }

        this.state.running = true;
        this.state.currentScenario = scenario;
        this.state.currentStep = 0;
        this._aborted = false;
        this.render();

        const startTime = Date.now();
        let success = true;
        let error = null;

        try {
            for (let i = 0; i < scenario.steps.length; i++) {
                if (this._aborted) {
                    throw new Error('Scenario aborted');
                }

                this.state.currentStep = i;
                this.render();

                const step = scenario.steps[i];
                await this.executeStep(step);
            }
        } catch (e) {
            success = false;
            error = e.message;
            console.error('Scenario failed:', e);
        }

        const duration = Date.now() - startTime;

        this.state.results.push({
            name: scenario.name,
            success,
            error,
            duration,
            timestamp: new Date().toISOString()
        });

        this.state.running = false;
        this.state.currentScenario = null;
        this.state.currentStep = 0;
        this.render();

        // Emit completion event
        this.events.emit('automation-complete', {
            scenario: scenario.id,
            success,
            error,
            duration
        });

        this.showToast(success ? `Completed: ${scenario.name}` : `Failed: ${scenario.name}`);
    }

    async executeStep(step) {
        switch (step.type) {
            case 'navigate':
                this.router.navigate(step.target);
                break;

            case 'event':
                this.events.emit(step.name, step.data || {});
                break;

            case 'delay':
                await this.delay(step.ms || 500);
                break;

            case 'api':
                await this.api.call(step.service, step.endpoint, step.method || 'GET', step.body);
                break;

            case 'sidebar':
                if (step.action === 'open') {
                    this.router.openSidebar?.(step.tab);
                } else if (step.action === 'close') {
                    this.router.closeSidebar?.();
                }
                break;

            case 'set-value':
                const el = document.querySelector(step.selector);
                if (el) {
                    el.value = step.value;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                }
                break;

            case 'click':
                const clickEl = document.querySelector(step.selector);
                if (clickEl) {
                    clickEl.click();
                }
                break;

            default:
                console.warn('Unknown step type:', step.type);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stopScenario() {
        this._aborted = true;
        this.state.running = false;
        this.state.currentScenario = null;
        this.render();
        this.showToast('Scenario stopped');
    }

    importScenario() {
        const input = prompt('Paste scenario JSON:');
        if (!input) return;

        try {
            const scenario = JSON.parse(input);
            if (!scenario.id || !scenario.name || !scenario.steps) {
                throw new Error('Invalid scenario format');
            }
            scenario.category = scenario.category || 'custom';
            this.state.customScenarios.push(scenario);
            this._saveCustomScenarios();
            this.render();
            this.showToast('Scenario imported');
        } catch (e) {
            this.showToast('Invalid JSON: ' + e.message);
        }
    }

    showToast(message) {
        const existing = this.querySelector('.ar-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'ar-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    getStyles() {
        return `
            .automation-runner {
                display: flex;
                flex-direction: column;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #1a1a2e;
                color: #e0e0e0;
            }

            .ar-header {
                padding: 16px;
                border-bottom: 1px solid #3a3f4f;
            }

            .ar-header h3 {
                margin: 0 0 4px 0;
                font-size: 16px;
                color: #ffffff;
            }

            .ar-subtitle {
                margin: 0;
                font-size: 12px;
                color: #8a8a9a;
            }

            .ar-toolbar {
                display: flex;
                gap: 8px;
                padding: 12px 16px;
                border-bottom: 1px solid #3a3f4f;
            }

            .ar-search {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #3a3f4f;
                border-radius: 4px;
                background: #252836;
                color: #e0e0e0;
                font-size: 13px;
            }

            .ar-search:focus {
                outline: none;
                border-color: #e94560;
            }

            .ar-btn {
                padding: 8px 14px;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
            }

            .ar-btn-primary {
                background: #e94560;
                color: white;
            }

            .ar-btn-primary:hover {
                background: #d63850;
            }

            .ar-btn-secondary {
                background: #3a3f4f;
                color: #e0e0e0;
            }

            .ar-btn-secondary:hover {
                background: #4a4f5f;
            }

            .ar-btn-danger {
                background: #c62828;
                color: white;
            }

            .ar-btn-link {
                background: none;
                border: none;
                color: #e94560;
                cursor: pointer;
                font-size: 12px;
            }

            .ar-running {
                padding: 16px;
                background: #252836;
                border-bottom: 1px solid #3a3f4f;
            }

            .ar-running-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                font-weight: 500;
            }

            .ar-running-icon {
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                100% { transform: rotate(360deg); }
            }

            .ar-progress {
                height: 4px;
                background: #3a3f4f;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .ar-progress-bar {
                height: 100%;
                background: #e94560;
                transition: width 0.3s;
            }

            .ar-step-info {
                font-size: 12px;
                color: #8a8a9a;
                margin-bottom: 12px;
            }

            .ar-scenarios {
                flex: 1;
                overflow-y: auto;
                padding: 8px;
            }

            .ar-category {
                margin-bottom: 16px;
            }

            .ar-category-header {
                padding: 8px 12px;
                font-size: 11px;
                font-weight: 600;
                color: #8a8a9a;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .ar-scenario {
                display: flex;
                align-items: center;
                padding: 12px;
                background: #252836;
                border-radius: 6px;
                margin-bottom: 6px;
                transition: all 0.15s;
            }

            .ar-scenario:hover {
                background: #2f3344;
            }

            .ar-scenario-info {
                flex: 1;
            }

            .ar-scenario-name {
                font-weight: 500;
                color: #ffffff;
                margin-bottom: 2px;
            }

            .ar-scenario-desc {
                font-size: 12px;
                color: #8a8a9a;
                margin-bottom: 4px;
            }

            .ar-scenario-meta {
                font-size: 10px;
                color: #6a6a7a;
            }

            .ar-scenario-actions {
                margin-left: 12px;
            }

            .ar-results {
                border-top: 1px solid #3a3f4f;
                padding: 12px 16px;
                background: #252836;
            }

            .ar-results-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 12px;
                font-weight: 500;
                color: #8a8a9a;
            }

            .ar-result {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 12px;
                margin-bottom: 4px;
            }

            .ar-result.success {
                background: rgba(76, 175, 80, 0.15);
                color: #81c784;
            }

            .ar-result.error {
                background: rgba(244, 67, 54, 0.15);
                color: #e57373;
            }

            .ar-result-name {
                flex: 1;
            }

            .ar-result-time {
                color: #8a8a9a;
            }

            .ar-toast {
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
        `;
    }

    get events() { return window.workbench.events; }
    get api() { return window.workbench.api; }
    get router() { return window.workbench.router; }
}

customElements.define('automation-runner', AutomationRunner);
