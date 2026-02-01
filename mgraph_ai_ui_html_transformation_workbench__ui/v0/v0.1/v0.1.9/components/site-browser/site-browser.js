/**
 * v0.1.9 Site Browser Override
 *
 * Purpose: Pass cache_id instead of cache_key when opening in workbench
 * Surgical override of v0.1.4 Site Browser
 *
 * Changes:
 * - Store cache_id along with cache_key in page data
 * - Pass cache_id when opening page in workbench
 */

// Override viewInWorkbench to pass cache_id
SiteBrowser.prototype.viewInWorkbench = function() {
    const firstSelectedKey = Array.from(this.state.selectedPages)[0];
    if (firstSelectedKey) {
        // Find the page to get its cache_id
        const page = this.state.pages.find(p => p.cache_key === firstSelectedKey);
        if (page && page.cache_id) {
            // Pass cache_id instead of cache_key
            sessionStorage.setItem('workbench-load-id', page.cache_id);
            sessionStorage.setItem('workbench-load-key', firstSelectedKey);
            console.log('[v0.1.9] Passing cache_id to workbench:', page.cache_id);
        } else {
            // Fallback to cache_key if no cache_id
            sessionStorage.setItem('workbench-load-key', firstSelectedKey);
            console.log('[v0.1.9] No cache_id found, using cache_key:', firstSelectedKey);
        }
        this.router.navigate('html-workbench');
    }
};

// Also allow clicking on a row to select and potentially view details
// Store row click handlers to get page data including cache_id

console.log('[v0.1.9] Site Browser: now passes cache_id to workbench');
