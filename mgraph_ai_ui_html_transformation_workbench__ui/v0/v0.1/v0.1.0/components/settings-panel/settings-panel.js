/**
 * Settings Panel Mini App
 *
 * Purpose: Configuration panel for API credentials, default namespace, and connection testing
 * Story: M1
 * Version: v0.1.0
 */

class SettingsPanel extends HTMLElement {

    static get appId()    { return 'settings-panel'; }
    static get navLabel() { return 'Settings'; }
    static get navIcon()  { return '⚙️'; }

    constructor() {
        super();
        this.state = {
            serviceStatus: {
                'html-graph': { status: 'unknown', error: null },
                'text-transform': { status: 'unknown', error: null },
                'llms': { status: 'unknown', error: null }
            },
            showPasswords: {
                'html-graph': false,
                'text-transform': false,
                'llms': false
            }
        };
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    onActivate() {
        // Refresh form values from config
        this.populateForm();
    }

    onDeactivate() {
        // Nothing needed
    }

    render() {
        this.innerHTML = `
            <style>
                .settings-panel {
                    padding: 24px;
                    max-width: 800px;
                    margin: 0 auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .sp-header {
                    margin-bottom: 24px;
                }
                .sp-header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #333;
                }
                .sp-section {
                    margin-bottom: 24px;
                }
                .sp-section-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #667eea;
                    margin-bottom: 16px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .sp-service-card {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 16px;
                    background: #fff;
                }
                .sp-service-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #eee;
                }
                .sp-service-name {
                    font-weight: 600;
                    font-size: 16px;
                    color: #333;
                }
                .sp-service-status {
                    font-size: 13px;
                    font-weight: 500;
                    padding: 4px 12px;
                    border-radius: 12px;
                }
                .sp-service-status.ok {
                    background: #e8f5e9;
                    color: #4caf50;
                }
                .sp-service-status.error {
                    background: #ffebee;
                    color: #f44336;
                }
                .sp-service-status.unknown {
                    background: #fff3e0;
                    color: #ff9800;
                }
                .sp-service-status.testing {
                    background: #e3f2fd;
                    color: #2196f3;
                }
                .sp-form-group {
                    margin-bottom: 16px;
                }
                .sp-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 500;
                    color: #666;
                    margin-bottom: 6px;
                }
                .sp-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: inherit;
                    box-sizing: border-box;
                }
                .sp-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                .sp-input-group {
                    display: flex;
                    gap: 8px;
                }
                .sp-input-group .sp-input {
                    flex: 1;
                }
                .sp-toggle-btn {
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: #f5f5f5;
                    cursor: pointer;
                    font-size: 16px;
                }
                .sp-toggle-btn:hover {
                    background: #eee;
                }
                .sp-error-msg {
                    margin-top: 12px;
                    padding: 10px;
                    background: #ffebee;
                    color: #c62828;
                    border-radius: 6px;
                    font-size: 13px;
                }
                .sp-service-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 16px;
                }
                .sp-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                .sp-btn-primary {
                    background: #667eea;
                    color: white;
                }
                .sp-btn-primary:hover {
                    background: #5a6fd6;
                }
                .sp-btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .sp-btn-secondary:hover {
                    background: #e0e0e0;
                }
                .sp-btn-danger {
                    background: #ffebee;
                    color: #c62828;
                }
                .sp-btn-danger:hover {
                    background: #ffcdd2;
                }
                .sp-defaults {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px;
                    background: #fff;
                }
                .sp-footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid #e0e0e0;
                }
                .sp-toast {
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
            <div class="settings-panel">
                <div class="sp-header">
                    <h1>Settings</h1>
                </div>

                <div class="sp-section">
                    <div class="sp-section-title">API Configuration</div>
                    ${this.renderServiceCard('html-graph', 'HTML Graph API')}
                    ${this.renderServiceCard('text-transform', 'Text Transform API')}
                    ${this.renderServiceCard('llms', 'LLMs API')}
                </div>

                <div class="sp-section">
                    <div class="sp-section-title">Defaults</div>
                    <div class="sp-defaults">
                        <div class="sp-form-group">
                            <label class="sp-label">Default Namespace</label>
                            <input type="text" class="sp-input" id="default-namespace" placeholder="html-cache">
                        </div>
                    </div>
                </div>

                <div class="sp-footer">
                    <button class="sp-btn sp-btn-danger" id="reset-btn">🔄 Reset to Defaults</button>
                    <button class="sp-btn sp-btn-primary" id="save-btn">💾 Save All</button>
                </div>
            </div>
        `;
        this.bindElements();
        this.populateForm();
    }

    renderServiceCard(serviceId, serviceName) {
        const status = this.state.serviceStatus[serviceId];
        const showPassword = this.state.showPasswords[serviceId];

        return `
            <div class="sp-service-card" data-service="${serviceId}">
                <div class="sp-service-header">
                    <span class="sp-service-name">${serviceName}</span>
                    <span class="sp-service-status ${status.status}" id="${serviceId}-status">
                        ${this.getStatusText(status.status)}
                    </span>
                </div>

                <div class="sp-form-group">
                    <label class="sp-label">Base URL</label>
                    <input type="text" class="sp-input" id="${serviceId}-url" placeholder="https://...">
                </div>

                <div class="sp-form-group">
                    <label class="sp-label">Header Name</label>
                    <input type="text" class="sp-input" id="${serviceId}-header" placeholder="X-API-Key">
                </div>

                <div class="sp-form-group">
                    <label class="sp-label">Header Value (API Key)</label>
                    <div class="sp-input-group">
                        <input type="${showPassword ? 'text' : 'password'}" class="sp-input" id="${serviceId}-key" placeholder="Enter API key...">
                        <button type="button" class="sp-toggle-btn" onclick="this.closest('settings-panel').togglePassword('${serviceId}')">
                            ${showPassword ? '🙈' : '👁'}
                        </button>
                    </div>
                </div>

                ${status.error ? `<div class="sp-error-msg">${this.escapeHtml(status.error)}</div>` : ''}

                <div class="sp-service-actions">
                    <button class="sp-btn sp-btn-secondary" onclick="this.closest('settings-panel').testConnection('${serviceId}')">
                        Test Connection
                    </button>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        switch (status) {
            case 'ok': return '✓ OK';
            case 'error': return '✗ Failed';
            case 'testing': return '⟳ Testing...';
            default: return '⚠ N/A';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    bindElements() {
        this.$saveBtn = this.querySelector('#save-btn');
        this.$resetBtn = this.querySelector('#reset-btn');
    }

    setupEventListeners() {
        this.$saveBtn.addEventListener('click', () => this.saveAll());
        this.$resetBtn.addEventListener('click', () => this.resetToDefaults());
    }

    cleanup() {
        // Nothing needed
    }

    populateForm() {
        const services = ['html-graph', 'text-transform', 'llms'];

        services.forEach(service => {
            const config = this.config.getService(service);
            if (config) {
                const urlInput = this.querySelector(`#${service}-url`);
                const headerInput = this.querySelector(`#${service}-header`);
                const keyInput = this.querySelector(`#${service}-key`);

                if (urlInput) urlInput.value = config.baseUrl || '';
                if (headerInput) headerInput.value = config.headerName || '';
                if (keyInput) keyInput.value = config.headerValue || '';
            }
        });

        const nsInput = this.querySelector('#default-namespace');
        if (nsInput) {
            nsInput.value = this.config.get('defaults.namespace') || '';
        }
    }

    togglePassword(serviceId) {
        this.state.showPasswords[serviceId] = !this.state.showPasswords[serviceId];
        const input = this.querySelector(`#${serviceId}-key`);
        const btn = input.nextElementSibling;

        if (this.state.showPasswords[serviceId]) {
            input.type = 'text';
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁';
        }
    }

    setServiceStatus(serviceId, status, error = null) {
        this.state.serviceStatus[serviceId] = { status, error };

        const statusEl = this.querySelector(`#${serviceId}-status`);
        if (statusEl) {
            statusEl.className = `sp-service-status ${status}`;
            statusEl.textContent = this.getStatusText(status);
        }

        // Update error message
        const card = this.querySelector(`[data-service="${serviceId}"]`);
        const existingError = card.querySelector('.sp-error-msg');
        if (existingError) existingError.remove();

        if (error) {
            const errorEl = document.createElement('div');
            errorEl.className = 'sp-error-msg';
            errorEl.textContent = error;
            const actions = card.querySelector('.sp-service-actions');
            card.insertBefore(errorEl, actions);
        }
    }

    async testConnection(serviceId) {
        // First save the current values
        this.saveServiceConfig(serviceId);

        this.setServiceStatus(serviceId, 'testing');

        try {
            let response;
            if (serviceId === 'html-graph') {
                response = await this.api.call(
                    serviceId,
                    `/cache-entity/${this.config.get('defaults.namespace') || 'html-cache'}/entities`,
                    'GET'
                );
            } else {
                // For other services, try a simple health check
                response = await this.api.call(serviceId, '/health', 'GET');
            }

            if (response && (response.success !== false)) {
                this.setServiceStatus(serviceId, 'ok');
                this.showToast(`${serviceId}: Connection successful`);
            } else {
                this.setServiceStatus(serviceId, 'error', response?.error || 'Unknown error');
            }
        } catch (error) {
            this.setServiceStatus(serviceId, 'error', error.message);
        }
    }

    saveServiceConfig(serviceId) {
        const baseUrl = this.querySelector(`#${serviceId}-url`).value.trim();
        const headerName = this.querySelector(`#${serviceId}-header`).value.trim();
        const headerValue = this.querySelector(`#${serviceId}-key`).value;

        this.config.setService(serviceId, { baseUrl, headerName, headerValue });
    }

    saveAll() {
        const services = ['html-graph', 'text-transform', 'llms'];

        services.forEach(service => {
            this.saveServiceConfig(service);
        });

        const namespace = this.querySelector('#default-namespace').value.trim();
        this.config.set('defaults.namespace', namespace || 'html-cache');

        this.showToast('Settings saved');
    }

    resetToDefaults() {
        if (confirm('Reset all settings to defaults? This will clear your API keys.')) {
            this.config.reset();
            this.state.serviceStatus = {
                'html-graph': { status: 'unknown', error: null },
                'text-transform': { status: 'unknown', error: null },
                'llms': { status: 'unknown', error: null }
            };
            this.render();
            this.setupEventListeners();
            this.showToast('Settings reset to defaults');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'sp-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    get config() { return window.workbench.config; }
    get api() { return window.workbench.api; }
}

customElements.define('settings-panel', SettingsPanel);
