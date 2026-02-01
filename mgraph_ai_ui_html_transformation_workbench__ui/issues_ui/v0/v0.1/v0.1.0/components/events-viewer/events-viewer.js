/**
 * Events Viewer Mini App
 *
 * Purpose: Debugging mini app that displays all events flowing through the event bus
 * Version: v0.1.0 (Issues UI)
 *
 * Namespace: window.issuesApp
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
        this.renderEventList();
    }

    onDeactivate() {}

    render() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="events-viewer">
                <div class="ev-toolbar">
                    <input type="text" class="ev-filter-input" id="ev-filter" placeholder="Filter events...">
                    <select class="ev-select" id="ev-type-filter">
                        <option value="">All Events</option>
                    </select>
                    <button class="ev-btn ev-btn-secondary" id="ev-pause">Pause</button>
                    <button class="ev-btn ev-btn-secondary" id="ev-clear">Clear</button>
                </div>
                <div class="ev-list" id="ev-list"></div>
                <div class="ev-status">
                    <span id="ev-count">0 events</span>
                    <span id="ev-stream" class="ev-live">Live</span>
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
        this.$list = this.querySelector('#ev-list');
        this.$count = this.querySelector('#ev-count');
        this.$stream = this.querySelector('#ev-stream');
    }

    setupEventListeners() {
        this._originalEmit = this.events.emit.bind(this.events);
        const self = this;
        this.events.emit = function(name, detail) {
            self.onEventEmitted(name, detail);
            return self._originalEmit(name, detail);
        };

        this.$filter.addEventListener('input', (e) => this.onFilterChange(e));
        this.$typeFilter.addEventListener('change', (e) => this.onEventTypeChange(e));
        this.$pauseBtn.addEventListener('click', () => this.togglePause());
        this.$clearBtn.addEventListener('click', () => this.clearDisplay());
    }

    cleanup() {
        if (this._originalEmit) {
            this.events.emit = this._originalEmit;
        }
    }

    loadHistory() {
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
            if (this.state.filter) {
                const searchText = JSON.stringify(event).toLowerCase();
                if (!searchText.includes(this.state.filter)) return false;
            }
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

        const total = this.state.events.length;
        const shown = filtered.length;
        this.$count.textContent = shown === total ? `${total} events` : `${shown} of ${total} events`;
    }

    renderEventItem(event) {
        const isExpanded = this.state.expandedIds.has(event.id);
        const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        return `
            <div class="ev-event" data-id="${event.id}">
                <div class="ev-event-header" onclick="this.closest('events-viewer').toggleExpand(${event.id})">
                    <div class="ev-event-left">
                        <span class="ev-event-id">#${event.id}</span>
                        <span class="ev-event-name">${this.escapeHtml(event.name)}</span>
                    </div>
                    <span class="ev-event-time">${time}</span>
                    <span class="ev-event-expand">${isExpanded ? '-' : '+'}</span>
                </div>
                ${isExpanded ? `
                    <div class="ev-event-detail">
                        <pre class="ev-event-json">${this.escapeHtml(JSON.stringify(event.detail, null, 2))}</pre>
                    </div>
                ` : ''}
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
        this.$pauseBtn.textContent = this.state.isPaused ? 'Resume' : 'Pause';
        this.$stream.textContent = this.state.isPaused ? 'Paused' : 'Live';
        this.$stream.className = this.state.isPaused ? 'ev-paused' : 'ev-live';
    }

    clearDisplay() {
        this.state.events = [];
        this.state.expandedIds.clear();
        this.renderEventList();
    }

    getStyles() {
        return `
            .events-viewer { display: flex; flex-direction: column; height: 100%; background: #1a1a2e; color: #e0e0e0; }
            .ev-toolbar { display: flex; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #2a3f5f; background: #1e2746; align-items: center; flex-wrap: wrap; }
            .ev-filter-input { flex: 1; min-width: 150px; padding: 8px 12px; border: 1px solid #3a4f6f; border-radius: 4px; background: #252836; color: #e0e0e0; font-size: 13px; }
            .ev-filter-input:focus { outline: none; border-color: #e94560; }
            .ev-select { padding: 8px 12px; border: 1px solid #3a4f6f; border-radius: 4px; background: #252836; color: #e0e0e0; font-size: 13px; min-width: 120px; }
            .ev-btn { padding: 8px 14px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
            .ev-btn-secondary { background: #3a4f6f; color: #e0e0e0; }
            .ev-btn-secondary:hover { background: #4a5f7f; }
            .ev-list { flex: 1; overflow-y: auto; padding: 12px 16px; }
            .ev-event { border: 1px solid #2a3f5f; border-radius: 6px; margin-bottom: 8px; background: #1e2746; overflow: hidden; }
            .ev-event-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; cursor: pointer; gap: 12px; }
            .ev-event-header:hover { background: #252836; }
            .ev-event-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
            .ev-event-id { font-weight: 600; color: #6a7a8a; font-size: 11px; }
            .ev-event-name { font-weight: 600; color: #e94560; font-size: 13px; }
            .ev-event-time { color: #6a7a8a; font-size: 11px; font-family: monospace; }
            .ev-event-expand { color: #6a7a8a; font-size: 14px; font-weight: bold; }
            .ev-event-detail { padding: 12px; border-top: 1px solid #2a3f5f; background: #1a1a2e; }
            .ev-event-json { font-family: monospace; font-size: 11px; white-space: pre-wrap; background: #252836; color: #a0b0c0; padding: 12px; border-radius: 4px; overflow-x: auto; max-height: 200px; margin: 0; }
            .ev-status { padding: 10px 16px; border-top: 1px solid #2a3f5f; background: #1e2746; font-size: 12px; color: #6a7a8a; display: flex; justify-content: space-between; align-items: center; }
            .ev-live { color: #22c55e; font-weight: 500; }
            .ev-paused { color: #f59e0b; font-weight: 500; }
            .ev-empty { text-align: center; padding: 40px; color: #6a7a8a; }
        `;
    }

    get events() { return window.issuesApp.events; }
}

customElements.define('events-viewer', EventsViewer);
