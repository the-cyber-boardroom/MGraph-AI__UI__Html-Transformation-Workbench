/**
 * v0.1.4 Site Browser Override
 *
 * Purpose: Fix API URL and default to html-graph with preloaded data
 * Surgical override of v0.1.0/components/site-browser/site-browser.js
 *
 * Changes:
 * - Use correct endpoint: /cache-entity/html-graph/entities
 * - Default to html-graph domain and preload on activate
 */

// Override browseDomain to use correct endpoint
SiteBrowser.prototype.browseDomain = async function(domain) {
    if (!domain) {
        this.showToast('Please enter a domain');
        return;
    }

    this.state.domain = domain;
    this.state.loading = true;
    this.state.pages = [];
    this.state.selectedPages = new Set();
    this.render();

    try {
        // Use the corrected endpoint: /cache-entity/html-graph/entities
        const response = await this.api.call(
            'html-graph',
            `/cache-entity/html-graph/entities`,
            'GET'
        );

        if (response) {
            // Filter pages by domain if needed, or show all
            let pages = [];
            if (Array.isArray(response)) {
                pages = response;
            } else if (response.entities) {
                pages = response.entities;
            } else if (response.pages) {
                pages = response.pages;
            } else if (response.data) {
                pages = Array.isArray(response.data) ? response.data : [];
            }

            // If domain specified, filter to matching domain
            if (domain && domain !== 'html-graph') {
                pages = pages.filter(p => {
                    const pageDomain = p.domain || p.site || '';
                    return pageDomain.includes(domain);
                });
            }

            this.state.pages = pages;
            this.config.addRecent('domains', domain);
            this.events.emit('site-loaded', {
                domain,
                pages: this.state.pages,
                count: this.state.pages.length
            });
        } else {
            this.state.pages = [];
        }
    } catch (error) {
        console.error('Failed to browse domain:', error);
        this.state.pages = [];
        this.showToast('Failed to load: ' + error.message);
    }

    this.state.loading = false;
    this.render();
    this.setupEventListeners();
};

// Override onActivate to default to html-graph and preload
SiteBrowser.prototype.onActivate = function() {
    // If no domain set, default to html-graph and load
    if (!this.state.domain) {
        this.state.domain = 'html-graph';
        // Update the input field
        const domainInput = this.querySelector('#sb-domain');
        if (domainInput) {
            domainInput.value = 'html-graph';
        }
        this.browseDomain('html-graph');
    }
};

// Override render to set default value for domain input
const _originalSiteBrowserRender = SiteBrowser.prototype.render;
SiteBrowser.prototype.render = function() {
    const defaultDomain = this.state.domain || 'html-graph';

    // Temporarily set domain for render
    const originalDomain = this.state.domain;
    this.state.domain = defaultDomain;

    _originalSiteBrowserRender.call(this);

    // Restore
    this.state.domain = originalDomain;
};

console.log('[v0.1.4] Site Browser updated with corrected endpoint and html-graph default');
