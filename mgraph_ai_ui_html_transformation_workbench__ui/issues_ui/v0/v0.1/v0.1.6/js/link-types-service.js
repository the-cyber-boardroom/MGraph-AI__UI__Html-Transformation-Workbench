/**
 * Link Types Service - v0.1.6
 *
 * Purpose: Load and manage link types with source type filtering
 * Version: v0.1.6 (Issues UI)
 *
 * Features:
 * - GET /types/api/link-types: Fetch all link types from API
 * - Filter verbs by source issue type (using source_types array)
 * - Fallback to hardcoded link types if API unavailable
 *
 * The link types service manages which relationship verbs are valid
 * for different issue types (e.g., "has-task" is only valid for feature, version, etc.)
 */

(function() {
    'use strict';

    class LinkTypesService {
        constructor() {
            this._linkTypes = null;      // Raw link types from API
            this._linkTypesMap = null;   // Map of verb -> link type config
            this._loading = false;
            this._initialized = false;
        }

        /**
         * Get base URL for API calls
         */
        _getBaseUrl() {
            const config = window.issuesApp.config;
            return config?.apiBaseUrl || '/types';
        }

        /**
         * Initialize the link types service - fetch from API once
         */
        async initialize() {
            if (this._initialized || this._loading) return;

            this._loading = true;

            try {
                await this._fetchLinkTypes();
                this._initialized = true;
                console.log('[LinkTypesService] Initialized with', Object.keys(this._linkTypesMap || {}).length, 'link types');
            } catch (error) {
                console.warn('[LinkTypesService] Initialization failed, using fallback:', error.message);
                this._useFallbackLinkTypes();
                this._initialized = true;
            } finally {
                this._loading = false;
            }
        }

        /**
         * Fetch link types from API
         * GET /types/api/link-types
         */
        async _fetchLinkTypes() {
            const baseUrl = this._getBaseUrl();

            const response = await fetch(`${baseUrl}/api/link-types`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Store raw link types array
            this._linkTypes = data.link_types || data || [];

            // Build map of verb -> config for quick lookup
            this._linkTypesMap = {};
            for (const linkType of this._linkTypes) {
                const verb = linkType.name || linkType.verb;
                if (verb) {
                    this._linkTypesMap[verb] = {
                        inverse: linkType.inverse,
                        description: linkType.description,
                        source_types: linkType.source_types || [],
                        target_types: linkType.target_types || [],
                        category: linkType.category || 'general'
                    };
                }
            }

            // Update window.issuesApp.linkTypes with the new data
            window.issuesApp.linkTypes = this._linkTypesMap;

            // Emit event for components to re-render
            window.issuesApp.events.emit('link-types-loaded', {
                linkTypes: this._linkTypesMap,
                count: Object.keys(this._linkTypesMap).length
            });

            return this._linkTypesMap;
        }

        /**
         * Fallback link types when API is unavailable
         * Matches the original hardcoded values in graph-service.js
         */
        _useFallbackLinkTypes() {
            this._linkTypesMap = {
                'blocks': {
                    inverse: 'blocked-by',
                    description: 'Source prevents progress on target',
                    source_types: ['bug', 'task', 'feature'],
                    target_types: ['bug', 'task', 'feature']
                },
                'blocked-by': {
                    inverse: 'blocks',
                    description: 'Source is blocked by target',
                    source_types: ['bug', 'task', 'feature'],
                    target_types: ['bug', 'task', 'feature']
                },
                'has-task': {
                    inverse: 'task-of',
                    description: 'Feature contains sub-task',
                    source_types: ['feature', 'epic', 'story', 'project', 'release', 'version'],
                    target_types: ['task', 'bug']
                },
                'task-of': {
                    inverse: 'has-task',
                    description: 'Task belongs to feature',
                    source_types: ['task', 'bug'],
                    target_types: ['feature', 'epic', 'story', 'project', 'release', 'version']
                },
                'assigned-to': {
                    inverse: 'assignee-of',
                    description: 'Work assigned to person',
                    source_types: ['task', 'bug', 'feature', 'epic', 'story'],
                    target_types: ['person']
                },
                'assignee-of': {
                    inverse: 'assigned-to',
                    description: 'Person assigned to work',
                    source_types: ['person'],
                    target_types: ['task', 'bug', 'feature', 'epic', 'story']
                },
                'depends-on': {
                    inverse: 'dependency-of',
                    description: 'Source requires target complete first',
                    source_types: [],  // Empty = all types
                    target_types: []
                },
                'dependency-of': {
                    inverse: 'depends-on',
                    description: 'Target is dependency of source',
                    source_types: [],
                    target_types: []
                },
                'relates-to': {
                    inverse: 'relates-to',
                    description: 'General association',
                    source_types: [],  // Empty = all types
                    target_types: []
                }
            };

            // Update global linkTypes
            window.issuesApp.linkTypes = this._linkTypesMap;
        }

        /**
         * Get all link types
         */
        get linkTypes() {
            return this._linkTypesMap || {};
        }

        /**
         * Get valid verbs for a source issue type
         * Filters verbs where source_types includes the given type
         * (empty source_types means all types are valid)
         *
         * @param {string} sourceType - The issue type (e.g., 'task', 'feature', 'project')
         * @param {boolean} excludeInverse - Whether to exclude inverse verbs (default true)
         * @returns {Array<string>} Array of valid verb names
         */
        getVerbsForSourceType(sourceType, excludeInverse = true) {
            if (!this._linkTypesMap) return [];

            const verbs = [];

            for (const [verb, config] of Object.entries(this._linkTypesMap)) {
                // Skip inverse verbs if requested
                if (excludeInverse && this._isInverseVerb(verb)) {
                    continue;
                }

                // Check if source type is valid for this verb
                // Empty source_types means all types are allowed
                if (config.source_types.length === 0 ||
                    config.source_types.includes(sourceType)) {
                    verbs.push(verb);
                }
            }

            return verbs;
        }

        /**
         * Check if a verb is an inverse verb (typically not shown in UI dropdowns)
         */
        _isInverseVerb(verb) {
            const inverseVerbs = ['blocked-by', 'task-of', 'assignee-of', 'dependency-of'];
            return inverseVerbs.includes(verb);
        }

        /**
         * Get link type config for a verb
         */
        getLinkType(verb) {
            return this._linkTypesMap?.[verb] || null;
        }

        /**
         * Check if a verb is valid for a source type
         */
        isVerbValidForType(verb, sourceType) {
            const config = this.getLinkType(verb);
            if (!config) return false;

            // Empty source_types means all types are allowed
            if (config.source_types.length === 0) return true;

            return config.source_types.includes(sourceType);
        }

        /**
         * Refresh link types from API
         */
        async refreshLinkTypes() {
            this._initialized = false;
            await this.initialize();
        }

        /**
         * Check if initialized
         */
        get isInitialized() {
            return this._initialized;
        }

        /**
         * Check if loading
         */
        get isLoading() {
            return this._loading;
        }
    }

    // Create singleton instance
    window.issuesApp = window.issuesApp || {};
    window.issuesApp.linkTypesService = new LinkTypesService();

    // Initialize automatically (load once per session)
    window.issuesApp.linkTypesService.initialize();

    console.log('[Issues UI v0.1.6] LinkTypesService created');

})();
