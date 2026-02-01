/**
 * v0.1.9 HTML Workbench Override
 *
 * Purpose: Use cache_id for loading HTML (new API endpoint)
 * Surgical override of v0.1.0 HTML Workbench
 *
 * Changes:
 * - Check for cache_id from sessionStorage first
 * - Use new loadHtmlById method for loading by cache_id
 * - Support both cache_id and cache_key loading
 */

// Override onActivate to check for cache_id
HtmlWorkbench.prototype.onActivate = function() {
    // Check if we have a cache_id from site browser
    const loadId = sessionStorage.getItem('workbench-load-id');
    const loadKey = sessionStorage.getItem('workbench-load-key');

    if (loadId) {
        // Clear both
        sessionStorage.removeItem('workbench-load-id');
        sessionStorage.removeItem('workbench-load-key');

        // Display the key for user reference
        this.querySelector('#cache-key-input').value = loadKey || loadId;

        // Load by cache_id
        this.loadHtmlById(loadId);
    } else if (loadKey) {
        // Fallback to cache_key if no cache_id
        sessionStorage.removeItem('workbench-load-key');
        this.querySelector('#cache-key-input').value = loadKey;
        this.loadHtml(loadKey);
    }
};

// New method to load HTML by cache_id using the correct endpoint
HtmlWorkbench.prototype.loadHtmlById = async function(cacheId) {
    if (!cacheId) {
        this.showToast('No cache ID provided');
        return;
    }

    this.state.loading = true;
    this.$beforeContent.innerHTML = '<div class="hw-loading">Loading...</div>';

    try {
        // Use the new loadHtmlById method
        const response = await this.api.htmlGraph.loadHtmlById(cacheId);

        // Handle various response formats
        let html = null;
        let found = false;

        if (response) {
            if (typeof response === 'string') {
                html = response;
                found = true;
            } else if (response.html) {
                html = response.html;
                found = true;
            } else if (response.data && response.data.html) {
                html = response.data.html;
                found = true;
            } else if (response.content) {
                html = response.content;
                found = true;
            }
        }

        if (found && html) {
            this.state = {
                ...this.state,
                loading: false,
                error: null,
                cacheKey: this.$cacheKeyInput.value || cacheId,
                cacheId: cacheId,
                originalHtml: html,
                transformedHtml: html
            };

            this.config.addRecent('cacheKeys', this.state.cacheKey);
            this.renderContent();
            this.$saveAsInput.value = this.state.cacheKey + '-transformed';

            this.events.emit('html-loaded', {
                cacheKey: this.state.cacheKey,
                cacheId: cacheId,
                html: html,
                charCount: html.length
            });

            console.log('[v0.1.9] Loaded HTML by cache_id:', cacheId, 'chars:', html.length);
        } else {
            this.state.loading = false;
            this.state.error = 'HTML not found for this cache ID';
            this.$beforeContent.innerHTML = `<div class="hw-error">${this.state.error}</div>`;
        }
    } catch (error) {
        this.state.loading = false;
        this.state.error = error.message;
        this.$beforeContent.innerHTML = `<div class="hw-error">Error: ${error.message}</div>`;
        console.error('[v0.1.9] Failed to load HTML by cache_id:', error);
    }
};

console.log('[v0.1.9] HTML Workbench: now uses cache_id for loading');
