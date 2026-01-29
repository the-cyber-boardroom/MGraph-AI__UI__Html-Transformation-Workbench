/**
 * Event Bus Service
 *
 * Purpose: Centralized event bus for cross-component communication
 * Story: F2
 * Version: v0.1.0
 *
 * All mini apps communicate EXCLUSIVELY through this bus - no direct method calls.
 */

(function() {
    'use strict';

    const MAX_HISTORY = 1000;

    class EventBus {
        constructor() {
            this._listeners = {};
            this._history = [];
            this._nextId = 1;
        }

        /**
         * Emit an event to all subscribers
         * @param {string} eventName - Name of the event
         * @param {object} detail - Event payload
         * @returns {number} Event ID for potential replay reference
         */
        emit(eventName, detail = {}) {
            // Create event record
            const event = {
                id: this._nextId++,
                name: eventName,
                detail: { ...detail },  // Clone to prevent mutation
                timestamp: Date.now()
            };

            // Add to history (trim if needed)
            this._history.push(event);
            if (this._history.length > MAX_HISTORY) {
                this._history.shift();
            }

            // Notify listeners
            const listeners = this._listeners[eventName] || [];
            listeners.forEach(callback => {
                try {
                    callback(event.detail);
                } catch (error) {
                    console.error(`Event handler error for '${eventName}':`, error);
                }
            });

            return event.id;
        }

        /**
         * Subscribe to an event
         * @param {string} eventName - Name of the event to listen for
         * @param {function} callback - Function to call with event detail
         */
        on(eventName, callback) {
            if (typeof callback !== 'function') {
                console.warn(`EventBus.on: callback must be a function for '${eventName}'`);
                return;
            }

            if (!this._listeners[eventName]) {
                this._listeners[eventName] = [];
            }
            this._listeners[eventName].push(callback);
        }

        /**
         * Unsubscribe from an event
         * @param {string} eventName - Name of the event
         * @param {function} callback - The same function passed to on()
         */
        off(eventName, callback) {
            if (!this._listeners[eventName]) {
                return;
            }

            const index = this._listeners[eventName].indexOf(callback);
            if (index !== -1) {
                this._listeners[eventName].splice(index, 1);
            }
        }

        /**
         * Get event history
         * @returns {Array} Array of past events
         */
        get history() {
            return [...this._history];  // Return a copy to prevent mutation
        }

        /**
         * Replay an event from history
         * @param {number} eventId - ID of the event to replay
         * @returns {boolean} True if event was found and replayed
         */
        replay(eventId) {
            const event = this._history.find(e => e.id === eventId);
            if (!event) {
                console.warn(`EventBus.replay: Event with ID ${eventId} not found`);
                return false;
            }

            // Re-emit with same name and detail
            const listeners = this._listeners[event.name] || [];
            listeners.forEach(callback => {
                try {
                    callback(event.detail);
                } catch (error) {
                    console.error(`Event handler error during replay of '${event.name}':`, error);
                }
            });

            return true;
        }

        /**
         * Clear event history
         */
        clearHistory() {
            this._history = [];
        }

        /**
         * Get listeners count for debugging
         * @param {string} eventName - Optional: specific event name
         * @returns {object|number} Listener counts
         */
        listenerCount(eventName) {
            if (eventName) {
                return (this._listeners[eventName] || []).length;
            }

            const counts = {};
            for (const name in this._listeners) {
                counts[name] = this._listeners[name].length;
            }
            return counts;
        }

        /**
         * Get all registered event names
         * @returns {Array} Array of event names that have listeners
         */
        getEventNames() {
            return Object.keys(this._listeners).filter(
                name => this._listeners[name].length > 0
            );
        }
    }

    // Initialize window.workbench if not exists
    window.workbench = window.workbench || {};

    // Create and expose the event bus singleton
    window.workbench.events = new EventBus();

    // Emit initialization event
    window.workbench.events.emit('event-bus-ready', { version: '0.1.0' });

})();
