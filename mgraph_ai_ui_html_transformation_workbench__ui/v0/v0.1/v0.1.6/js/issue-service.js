/**
 * Issue Service
 *
 * Purpose: Load and manage issue data from JSON files
 * Version: v0.1.6
 *
 * Provides methods for fetching issues, labels, and filtering by status/version.
 * Uses the file system as a read-only database via GET requests.
 */

(function() {
    'use strict';

    const ISSUES_BASE_PATH = '/dev-briefs/issues';

    class IssueService {
        constructor() {
            this._issuesIndex = null;
            this._labels = null;
            this._issueCache = new Map();
        }

        /**
         * Get all issues (summary list from index)
         * @returns {Promise<Array>} Array of issue summaries
         */
        async getIssues() {
            if (!this._issuesIndex) {
                await this._loadIndex();
            }
            return this._issuesIndex?.issues || [];
        }

        /**
         * Get full issue details by ID
         * @param {string} id - Issue ID (e.g., 'issue-001')
         * @returns {Promise<Object>} Full issue object
         */
        async getIssue(id) {
            // Check cache
            if (this._issueCache.has(id)) {
                return this._issueCache.get(id);
            }

            try {
                const response = await fetch(`${ISSUES_BASE_PATH}/${id}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load issue: ${response.status}`);
                }
                const issue = await response.json();
                this._issueCache.set(id, issue);

                this._emit('issue-loaded', { id, issue });
                return issue;

            } catch (error) {
                this._emit('issue-error', { id, error: error.message });
                throw error;
            }
        }

        /**
         * Get issues filtered by status
         * @param {string} status - Status to filter by
         * @returns {Promise<Array>} Filtered issues
         */
        async getIssuesByStatus(status) {
            const issues = await this.getIssues();
            return issues.filter(i => i.status === status);
        }

        /**
         * Get issues grouped by status (for Kanban board)
         * @returns {Promise<Object>} Issues grouped by status
         */
        async getIssuesGroupedByStatus() {
            const issues = await this.getIssues();
            const grouped = {
                backlog: [],
                todo: [],
                'in-progress': [],
                review: [],
                done: []
            };

            for (const issue of issues) {
                if (grouped[issue.status]) {
                    grouped[issue.status].push(issue);
                }
            }

            return grouped;
        }

        /**
         * Get issues filtered by target version
         * @param {string} version - Version to filter by (e.g., 'v0.1.6')
         * @returns {Promise<Array>} Filtered issues
         */
        async getIssuesByVersion(version) {
            // Need to load full issue details to filter by version
            const issues = await this.getIssues();
            const result = [];

            for (const summary of issues) {
                const issue = await this.getIssue(summary.id);
                if (issue.targetVersion === version) {
                    result.push(issue);
                }
            }

            return result;
        }

        /**
         * Get all labels
         * @returns {Promise<Array>} Array of label definitions
         */
        async getLabels() {
            if (!this._labels) {
                await this._loadLabels();
            }
            return this._labels || [];
        }

        /**
         * Get label by name
         * @param {string} name - Label name
         * @returns {Promise<Object|null>} Label object or null
         */
        async getLabel(name) {
            const labels = await this.getLabels();
            return labels.find(l => l.name === name) || null;
        }

        /**
         * Get status counts
         * @returns {Promise<Object>} Status counts from index
         */
        async getStatusCounts() {
            if (!this._issuesIndex) {
                await this._loadIndex();
            }
            return this._issuesIndex?.statusCounts || {};
        }

        /**
         * Refresh data (clear cache and reload)
         */
        async refresh() {
            this._issuesIndex = null;
            this._labels = null;
            this._issueCache.clear();
            await this._loadIndex();
            await this._loadLabels();
            this._emit('issues-refreshed', {});
        }

        async _loadIndex() {
            try {
                const response = await fetch(`${ISSUES_BASE_PATH}/issues.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load issues index: ${response.status}`);
                }
                this._issuesIndex = await response.json();
                this._emit('issues-index-loaded', { count: this._issuesIndex.issues?.length || 0 });

            } catch (error) {
                console.error('Failed to load issues index:', error);
                this._issuesIndex = { issues: [], statusCounts: {} };
                this._emit('issues-error', { error: error.message });
            }
        }

        async _loadLabels() {
            try {
                const response = await fetch(`${ISSUES_BASE_PATH}/labels.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load labels: ${response.status}`);
                }
                const data = await response.json();
                this._labels = data.labels || [];
                this._emit('labels-loaded', { count: this._labels.length });

            } catch (error) {
                console.error('Failed to load labels:', error);
                this._labels = [];
            }
        }

        _emit(event, data) {
            if (window.workbench && window.workbench.events) {
                window.workbench.events.emit(event, data);
            }
        }
    }

    // Initialize workbench if needed
    window.workbench = window.workbench || {};

    // Create and expose the service instance
    window.workbench.issues = new IssueService();

    console.log('[v0.1.6] Issue service initialized');

})();
