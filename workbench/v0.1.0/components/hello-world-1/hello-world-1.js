/**
 * Hello World 1 - Event Emitter
 *
 * Purpose: Validates registration, lifecycle, event emission, navigation
 * Story: F5
 * Version: v0.1.0
 */

class HelloWorld1 extends HTMLElement {

    static get appId()    { return 'hello-world-1'; }
    static get navLabel() { return 'Hello 1'; }
    static get navIcon()  { return '👋'; }

    constructor() {
        super();
        this.state = {
            isActive: false,
            activateCount: 0,
            deactivateCount: 0,
            emittedEvents: []
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
        this.state.isActive = true;
        this.state.activateCount++;
        this.updateStatus();
    }

    onDeactivate() {
        this.state.isActive = false;
        this.state.deactivateCount++;
    }

    render() {
        this.innerHTML = `
            <style>
                .hello-world-1 {
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
                .hw-input {
                    width: 100%;
                    padding: 8px 12px;
                    margin: 6px 0;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-family: inherit;
                    font-size: 13px;
                    box-sizing: border-box;
                }
                .hw-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .hw-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 500;
                    color: #666;
                    margin-top: 12px;
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
                .hw-log {
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                    max-height: 150px;
                    overflow-y: auto;
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    line-height: 1.6;
                }
                .status-active {
                    color: #4caf50;
                    font-weight: 600;
                }
                .status-inactive {
                    color: #999;
                }
                .status-line {
                    padding: 4px 0;
                }
            </style>
            <div class="hello-world-1">
                <div class="hw-header">
                    <h1>HELLO WORLD 1</h1>
                    <p>Event Emitter</p>
                </div>

                <ul class="hw-features">
                    <li>✓ Mini app registration</li>
                    <li>✓ Lifecycle callbacks</li>
                    <li>✓ Event emission</li>
                    <li>✓ Navigation</li>
                </ul>

                <div class="hw-section">
                    <h3>Status</h3>
                    <div id="status-display">Loading...</div>
                </div>

                <div class="hw-section">
                    <h3>Actions</h3>
                    <label class="hw-label">Event Name:</label>
                    <input type="text" id="event-name" class="hw-input" value="test-event">
                    <label class="hw-label">Event Data (JSON):</label>
                    <input type="text" id="event-data" class="hw-input" value='{"message": "hello"}'>
                    <div style="margin-top: 16px;">
                        <button id="emit-btn" class="hw-button hw-button-primary">🚀 Emit Event</button>
                        <button id="nav-btn" class="hw-button hw-button-secondary">➡️ Navigate to Hello World 2</button>
                    </div>
                </div>

                <div class="hw-section">
                    <h3>Event Log (emitted from this app)</h3>
                    <div id="event-log" class="hw-log">No events emitted yet.</div>
                </div>
            </div>
        `;
        this.bindElements();
        this.updateStatus();
    }

    bindElements() {
        this.$status = this.querySelector('#status-display');
        this.$eventName = this.querySelector('#event-name');
        this.$eventData = this.querySelector('#event-data');
        this.$emitBtn = this.querySelector('#emit-btn');
        this.$navBtn = this.querySelector('#nav-btn');
        this.$eventLog = this.querySelector('#event-log');
    }

    setupEventListeners() {
        this.$emitBtn.addEventListener('click', () => this.emitTestEvent());
        this.$navBtn.addEventListener('click', () => this.navigateToHello2());
    }

    cleanup() {
        // No event subscriptions to clean up in this app
    }

    updateStatus() {
        if (!this.$status) return;
        const statusClass = this.state.isActive ? 'status-active' : 'status-inactive';
        const statusText = this.state.isActive ? '● Active' : '○ Inactive';
        this.$status.innerHTML = `
            <div class="status-line">Current State: <span class="${statusClass}">${statusText}</span></div>
            <div class="status-line">Times Activated: ${this.state.activateCount}</div>
            <div class="status-line">Times Deactivated: ${this.state.deactivateCount}</div>
        `;
    }

    emitTestEvent() {
        const eventName = this.$eventName.value.trim();
        if (!eventName) {
            alert('Please enter an event name');
            return;
        }

        let eventData = {};
        try {
            eventData = JSON.parse(this.$eventData.value);
        } catch (e) {
            eventData = { raw: this.$eventData.value };
        }

        this.events.emit(eventName, eventData);

        const timestamp = new Date().toLocaleTimeString();
        this.state.emittedEvents.unshift({ eventName, eventData, timestamp });
        this.updateEventLog();
    }

    updateEventLog() {
        if (this.state.emittedEvents.length === 0) {
            this.$eventLog.textContent = 'No events emitted yet.';
            return;
        }
        this.$eventLog.innerHTML = this.state.emittedEvents
            .slice(0, 10)
            .map(e => `<div>${e.timestamp} - Emitted '<strong>${e.eventName}</strong>' with ${JSON.stringify(e.eventData)}</div>`)
            .join('');
    }

    navigateToHello2() {
        this.router.navigate('hello-world-2');
    }

    get events() { return window.workbench.events; }
    get router() { return window.workbench.router; }
}

customElements.define('hello-world-1', HelloWorld1);
