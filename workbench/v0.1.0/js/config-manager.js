/**
 * Config Manager Service
 *
 * Purpose: Configuration manager that persists settings to localStorage
 * Story: F4
 * Version: v0.1.0
 *
 * Stores API credentials, default namespace, and user preferences.
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'workbench-config';
    const MAX_RECENT = 20;

    const DEFAULT_CONFIG = {
        version: 1,
        services: {
            'html-graph': {
                baseUrl: 'https://html-graph.dev.aws.cyber-boardroom.com',
                headerName: 'X-API-Key',
                headerValue: ''
            },
            'text-transform': {
                baseUrl: 'https://text-transform.dev.aws.cyber-boardroom.com',
                headerName: 'X-API-Key',
                headerValue: ''
            },
            'llms': {
                baseUrl: 'https://llms.dev.aws.cyber-boardroom.com',
                headerName: 'X-API-Key',
                headerValue: ''
            }
        },
        defaults: {
            namespace: 'html-cache'
        },
        recent: {
            cacheKeys: [],
            domains: [],
            profiles: []
        },
        ui: {
            theme: 'light',
            sidebarCollapsed: false
        }
    };

    class ConfigManager {
        constructor() {
            this._config = null;
            this.load();
        }

        /**
         * Deep merge two objects
         * @private
         */
        _deepMerge(target, source) {
            const output = { ...target };

            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                        output[key] = this._deepMerge(target[key], source[key]);
                    } else {
                        output[key] = { ...source[key] };
                    }
                } else {
                    output[key] = source[key];
                }
            }

            return output;
        }

        /**
         * Load config from localStorage
         */
        load() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Merge with defaults to handle schema changes
                    this._config = this._deepMerge(DEFAULT_CONFIG, parsed);
                } else {
                    this._config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                }
            } catch (error) {
                console.warn('Failed to load config, using defaults:', error);
                this._config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            }

            // Emit config-loaded event if events service is available
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit('config-loaded', { config: this._config });
            }
        }

        /**
         * Save config to localStorage
         */
        save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this._config));
            } catch (error) {
                console.error('Failed to save config:', error);
            }
        }

        /**
         * Get a config value by path
         * @param {string} path - Dot-notation path (e.g., 'defaults.namespace')
         * @returns {any} The value or undefined
         */
        get(path) {
            if (!path) {
                return this._config;
            }

            const parts = path.split('.');
            let current = this._config;

            for (const part of parts) {
                if (current === undefined || current === null) {
                    return undefined;
                }
                current = current[part];
            }

            return current;
        }

        /**
         * Set a config value by path
         * @param {string} path - Dot-notation path
         * @param {any} value - Value to set
         */
        set(path, value) {
            const parts = path.split('.');
            const lastPart = parts.pop();
            let current = this._config;

            for (const part of parts) {
                if (!(part in current)) {
                    current[part] = {};
                }
                current = current[part];
            }

            const oldValue = current[lastPart];
            current[lastPart] = value;

            this.save();

            // Emit config-changed event
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit('config-changed', {
                    path,
                    value,
                    oldValue
                });
            }
        }

        /**
         * Get service configuration
         * @param {string} serviceName - Service name ('html-graph', etc.)
         * @returns {object} { baseUrl, headerName, headerValue }
         */
        getService(serviceName) {
            return this.get(`services.${serviceName}`);
        }

        /**
         * Set service configuration
         * @param {string} serviceName - Service name
         * @param {object} config - { baseUrl, headerName, headerValue }
         */
        setService(serviceName, config) {
            this.set(`services.${serviceName}`, config);
        }

        /**
         * Reset to defaults
         */
        reset() {
            this._config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            this.save();

            // Emit events
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit('config-reset', {});
                window.workbench.events.emit('config-loaded', { config: this._config });
            }
        }

        /**
         * Add to recent list (maintains max size)
         * @param {string} listName - 'cacheKeys', 'domains', or 'profiles'
         * @param {string} item - Item to add
         */
        addRecent(listName, item) {
            if (!this._config.recent[listName]) {
                this._config.recent[listName] = [];
            }

            const list = this._config.recent[listName];

            // Remove if already exists (to move to front)
            const existingIndex = list.indexOf(item);
            if (existingIndex !== -1) {
                list.splice(existingIndex, 1);
            }

            // Add to front
            list.unshift(item);

            // Trim to max size
            if (list.length > MAX_RECENT) {
                list.length = MAX_RECENT;
            }

            this.save();

            // Emit event
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit('config-changed', {
                    path: `recent.${listName}`,
                    value: list,
                    oldValue: null
                });
            }
        }

        /**
         * Get recent list
         * @param {string} listName - 'cacheKeys', 'domains', or 'profiles'
         * @returns {Array} Recent items
         */
        getRecent(listName) {
            return this.get(`recent.${listName}`) || [];
        }

        /**
         * Get all config (read-only copy)
         * @returns {object} Copy of entire config
         */
        getAll() {
            return JSON.parse(JSON.stringify(this._config));
        }
    }

    // Initialize window.workbench if not exists
    window.workbench = window.workbench || {};

    // Create and expose the config manager singleton
    window.workbench.config = new ConfigManager();

})();
