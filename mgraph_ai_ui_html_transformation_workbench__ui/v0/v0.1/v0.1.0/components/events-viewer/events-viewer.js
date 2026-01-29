/**
 * Events Viewer Mini App
 *
 * Purpose: Debugging mini app that displays all events flowing through the event bus
 * Story: D1
 * Version: v0.1.0
 */

class EventsViewer extends HTMLElement {

    static get appId()    { return 'events-viewer'; }
    static get navLabel() { return 'Events'; }
    static get navIcon()  { return '📡'; }

    constructor() {
        super();
        this.state = {
            events: [],
            filter: '',
            eventTypeFilter: '',
            isPaused: false,
            expandedIds: new Set()
        };
        this._boundHandlers = {};
        this._originalEmit = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadHistory();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    onActivate() {
        // Refresh display when activated
        this.renderEventList();
    }

    onDeactivate() {
        // Nothing needed
    }

    render() {
        this.innerHTML = `
            <style>
                .events-viewer {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .ev-toolbar {
                    display: flex;
                    gap: 10px;
                    padding: 12px 16px;
                    border-bottom: 1px solid #e0e0e0;
                    background: #f8f9fa;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .ev-filter-input {
                    flex: 1;
                    min-width: 200px;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 13px;
                }
                .ev-filter-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .ev-select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 13px;
                    background: white;
                    min-width: 150px;
                }
                .ev-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                .ev-btn-primary {
                    background: #667eea;
                    color: white;
                }
                .ev-btn-primary:hover {
                    background: #5a6fd6;
                }
                .ev-btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .ev-btn-secondary:hover {
                    background: #e0e0e0;
                }
                .ev-btn-warning {
                    background: #ff9800;
                    color: white;
                }
                .ev-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px 16px;
                }
                .ev-event {
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    background: white;
                    overflow: hidden;
                }
                .ev-event-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    cursor: pointer;
                    background: #fafafa;
                    gap: 12px;
                }
                .ev-event-header:hover {
                    background: #f0f0f0;
                }
                .ev-event-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 0;
                }
                .ev-event-id {
                    font-weight: 600;
                    color: #666;
                    font-size: 12px;
                    white-space: nowrap;
                }
                .ev-event-name {
                    font-weight: 600;
                    color: #667eea;
                    white-space: nowrap;
                }
                .ev-event-source {
                    font-size: 11px;
                    color: #888;
                    background: #eee;
                    padding: 2px 8px;
                    border-radius: 4px;
                    white-space: nowrap;
                }
                .ev-event-time {
                    color: #999;
                    font-size: 12px;
                    font-family: 'SF Mono', Monaco, monospace;
                    white-space: nowrap;
                }
                .ev-event-expand {
                    color: #999;
                    font-size: 12px;
                }
                .ev-event-detail {
                    padding: 12px;
                    border-top: 1px solid #eee;
                    background: #fafafa;
                }
                .ev-event-json {
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                    background: #282c34;
                    color: #abb2bf;
                    padding: 12px;
                    border-radius: 6px;
                    overflow-x: auto;
                    max-height: 300px;
                    overflow-y: auto;
                }
                .ev-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                .ev-actions button {
                    padding: 6px 12px;
                    font-size: 12px;
                    cursor: pointer;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 4px;
                }
                .ev-actions button:hover {
                    background: #f5f5f5;
                }
                .ev-status {
                    padding: 10px 16px;
                    border-top: 1px solid #e0e0e0;
                    background: #f8f9fa;
                    font-size: 12px;
                    color: #666;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .ev-live {
                    color: #4caf50;
                    font-weight: 500;
                }
                .ev-paused {
                    color: #ff9800;
                    font-weight: 500;
                }
                .ev-empty {
                    text-align: center;
                    padding: 40px;
                    color: #888;
                }
                .ev-toast {
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
            <div class="events-viewer">
                <div class="ev-toolbar">
                    <input type="text" class="ev-filter-input" id="ev-filter" placeholder="Filter events...">
                    <select class="ev-select" id="ev-type-filter">
                        <option value="">All Events</option>
                    </select>
                    <button class="ev-btn ev-btn-secondary" id="ev-pause">⏸ Pause</button>
                    <button class="ev-btn ev-btn-secondary" id="ev-clear">🗑 Clear</button>
                    <button class="ev-btn ev-btn-secondary" id="ev-export">📥 Export</button>
                </div>
                <div class="ev-list" id="ev-list"></div>
                <div class="ev-status">
                    <span id="ev-count">0 events</span>
                    <span id="ev-stream" class="ev-live">● Live</span>
                </div>
            </div>
        `;
        this.bindElements();
    }

    bindElements() {
        this.$filter = this.querySelector('#ev-filter');
        this.$typeFilter = this.querySelector('#ev-type-filter');
        this.$pauseBtn = this.querySelector('#ev-pause');
        this.$clearBtn = this.querySelector('#ev-clear');
        this.$exportBtn = this.querySelector('#ev-export');
        this.$list = this.querySelector('#ev-list');
        this.$count = this.querySelector('#ev-count');
        this.$stream = this.querySelector('#ev-stream');
    }

    setupEventListeners() {
        // Wrap the emit function to capture all events
        this._originalEmit = this.events.emit.bind(this.events);
        const self = this;
        this.events.emit = function(name, detail) {
            self.onEventEmitted(name, detail);
            return self._originalEmit(name, detail);
        };

        // DOM listeners
        this.$filter.addEventListener('input', (e) => this.onFilterChange(e));
        this.$typeFilter.addEventListener('change', (e) => this.onEventTypeChange(e));
        this.$pauseBtn.addEventListener('click', () => this.togglePause());
        this.$clearBtn.addEventListener('click', () => this.clearDisplay());
        this.$exportBtn.addEventListener('click', () => this.exportHistory());
    }

    cleanup() {
        // Restore original emit
        if (this._originalEmit) {
            this.events.emit = this._originalEmit;
        }
    }

    loadHistory() {
        // Load existing event history
        const history = this.events.history || [];
        this.state.events = history.map(e => ({
            id: e.id,
            name: e.name,
            detail: e.detail,
            timestamp: e.timestamp,
            source: e.detail?._source || 'unknown'
        })).reverse();
        this.updateEventTypes();
        this.renderEventList();
    }

    onEventEmitted(name, detail) {
        if (this.state.isPaused) return;

        const event = {
            id: (this.events.history?.length || 0) + 1,
            name,
            detail: { ...detail },
            timestamp: Date.now(),
            source: detail?._source || 'unknown'
        };

        this.state.events.unshift(event);

        // Limit to 500 events in display
        if (this.state.events.length > 500) {
            this.state.events = this.state.events.slice(0, 500);
        }

        this.updateEventTypes();
        this.renderEventList();
    }

    updateEventTypes() {
        const types = new Set(this.state.events.map(e => e.name));
        const sortedTypes = Array.from(types).sort();

        const currentValue = this.$typeFilter.value;
        this.$typeFilter.innerHTML = `
            <option value="">All Events</option>
            ${sortedTypes.map(t => `<option value="${t}" ${t === currentValue ? 'selected' : ''}>${t}</option>`).join('')}
        `;
    }

    onFilterChange(e) {
        this.state.filter = e.target.value.toLowerCase();
        this.renderEventList();
    }

    onEventTypeChange(e) {
        this.state.eventTypeFilter = e.target.value;
        this.renderEventList();
    }

    getFilteredEvents() {
        return this.state.events.filter(event => {
            // Text filter
            if (this.state.filter) {
                const searchText = JSON.stringify(event).toLowerCase();
                if (!searchText.includes(this.state.filter)) {
                    return false;
                }
            }

            // Event type filter
            if (this.state.eventTypeFilter && event.name !== this.state.eventTypeFilter) {
                return false;
            }

            return true;
        });
    }

    renderEventList() {
        const filtered = this.getFilteredEvents();

        if (filtered.length === 0) {
            this.$list.innerHTML = `
                <div class="ev-empty">
                    ${this.state.events.length === 0 ? 'No events yet. Interact with the app to see events.' : 'No events match your filter.'}
                </div>
            `;
        } else {
            this.$list.innerHTML = filtered.map(event => this.renderEventItem(event)).join('');
        }

        // Update count
        const total = this.state.events.length;
        const shown = filtered.length;
        this.$count.textContent = shown === total
            ? `${total} events`
            : `${shown} of ${total} events`;
    }

    renderEventItem(event) {
        const isExpanded = this.state.expandedIds.has(event.id);
        const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        return `
            <div class="ev-event" data-id="${event.id}">
                <div class="ev-event-header" onclick="this.closest('events-viewer').toggleExpand(${event.id})">
                    <div class="ev-event-left">
                        <span class="ev-event-id">#${event.id}</span>
                        <span class="ev-event-name">${this.escapeHtml(event.name)}</span>
                        ${event.source !== 'unknown' ? `<span class="ev-event-source">${this.escapeHtml(event.source)}</span>` : ''}
                    </div>
                    <span class="ev-event-time">${time}</span>
                    <span class="ev-event-expand">${isExpanded ? '▼' : '▶'}</span>
                </div>
                ${isExpanded ? this.renderEventDetail(event) : ''}
            </div>
        `;
    }

    renderEventDetail(event) {
        const jsonStr = JSON.stringify(event.detail, null, 2);
        return `
            <div class="ev-event-detail">
                <pre class="ev-event-json">${this.escapeHtml(jsonStr)}</pre>
                <div class="ev-actions">
                    <button onclick="event.stopPropagation(); this.closest('events-viewer').replayEvent(${event.id})">▶ Replay</button>
                    <button onclick="event.stopPropagation(); this.closest('events-viewer').copyEvent(${event.id})">📋 Copy</button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleExpand(eventId) {
        if (this.state.expandedIds.has(eventId)) {
            this.state.expandedIds.delete(eventId);
        } else {
            this.state.expandedIds.add(eventId);
        }
        this.renderEventList();
    }

    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        this.$pauseBtn.textContent = this.state.isPaused ? '▶ Resume' : '⏸ Pause';
        this.$stream.textContent = this.state.isPaused ? '⏸ Paused' : '● Live';
        this.$stream.className = this.state.isPaused ? 'ev-paused' : 'ev-live';
    }

    clearDisplay() {
        this.state.events = [];
        this.state.expandedIds.clear();
        this.renderEventList();
    }

    exportHistory() {
        const data = JSON.stringify(this.state.events, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `events-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showToast('Events exported');
    }

    replayEvent(eventId) {
        const event = this.state.events.find(e => e.id === eventId);
        if (event) {
            // Use original emit to avoid double-capturing
            this._originalEmit(event.name, event.detail);
            this.showToast(`Replayed: ${event.name}`);
        }
    }

    copyEvent(eventId) {
        const event = this.state.events.find(e => e.id === eventId);
        if (event) {
            const text = JSON.stringify(event.detail, null, 2);
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard');
            });
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'ev-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    get events() { return window.workbench.events; }
}

customElements.define('events-viewer', EventsViewer);
