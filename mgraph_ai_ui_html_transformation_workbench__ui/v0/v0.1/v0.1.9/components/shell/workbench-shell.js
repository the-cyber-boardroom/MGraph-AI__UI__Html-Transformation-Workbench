/**
 * v0.1.9 Workbench Shell Override
 *
 * Purpose: Update version list to include v0.1.9
 * Surgical override of v0.1.8 shell
 */

// Updated available versions
const AVAILABLE_VERSIONS_v019 = [
    { id: 'v0.1.0', label: 'v0.1.0 (Base)' },
    { id: 'v0.1.1', label: 'v0.1.1 (Analysis)' },
    { id: 'v0.1.2', label: 'v0.1.2 (UI)' },
    { id: 'v0.1.3', label: 'v0.1.3 (Docs)' },
    { id: 'v0.1.4', label: 'v0.1.4 (Fixes)' },
    { id: 'v0.1.5', label: 'v0.1.5 (Automation)' },
    { id: 'v0.1.6', label: 'v0.1.6 (Issues)' },
    { id: 'v0.1.7', label: 'v0.1.7 (Graph API)' },
    { id: 'v0.1.8', label: 'v0.1.8 (Dark Theme)' },
    { id: 'v0.1.9', label: 'v0.1.9 (API Fixes)' }
];

// Update the global AVAILABLE_VERSIONS
if (typeof AVAILABLE_VERSIONS !== 'undefined') {
    AVAILABLE_VERSIONS.length = 0;
    AVAILABLE_VERSIONS_v019.forEach(v => AVAILABLE_VERSIONS.push(v));
}

// Override render to update selected version
const originalRender_v019 = WorkbenchShell.prototype.render;
WorkbenchShell.prototype.render = function() {
    originalRender_v019.call(this);

    // Update version select to show v0.1.9 as selected
    if (this.$versionSelect) {
        this.$versionSelect.innerHTML = AVAILABLE_VERSIONS_v019.map(v =>
            `<option value="${v.id}" ${v.id === 'v0.1.9' ? 'selected' : ''}>${v.label}</option>`
        ).join('');
    }
};

console.log('[v0.1.9] Shell with API fixes and improved HTML loading');
