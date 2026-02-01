/**
 * v0.1.8 Workbench Shell Override
 *
 * Purpose: Remove issues section (moved to standalone issues_ui)
 * Surgical override of v0.1.7 shell - removes issues nav section
 *
 * Changes:
 * - Removed 'issues' section from NAV_SECTIONS (now in separate issues_ui)
 * - Updated version list to include v0.1.8
 */

// Override navigation sections - removes issues section
const NAV_SECTIONS_v018 = [
    {
        id: 'main',
        label: 'Main',
        icon: '🏠',
        apps: ['html-workbench', 'site-browser', 'profile-manager']
    },
    {
        id: 'analysis',
        label: 'Analysis',
        icon: '📊',
        apps: ['page-analysis', 'site-analysis']
    },
    {
        id: 'dev',
        label: 'Development',
        icon: '🛠️',
        apps: ['api-explorer', 'docs-viewer', 'settings-panel']
    },
    {
        id: 'debug',
        label: 'Debug',
        icon: '🔍',
        apps: ['hello-world-1', 'hello-world-2']
    }
];

// Update the global NAV_SECTIONS
if (typeof NAV_SECTIONS !== 'undefined') {
    NAV_SECTIONS.length = 0;
    NAV_SECTIONS_v018.forEach(s => NAV_SECTIONS.push(s));
}

// Updated available versions
const AVAILABLE_VERSIONS_v018 = [
    { id: 'v0.1.0', label: 'v0.1.0 (Base)' },
    { id: 'v0.1.1', label: 'v0.1.1 (Analysis)' },
    { id: 'v0.1.2', label: 'v0.1.2 (UI)' },
    { id: 'v0.1.3', label: 'v0.1.3 (Docs)' },
    { id: 'v0.1.4', label: 'v0.1.4 (Fixes)' },
    { id: 'v0.1.5', label: 'v0.1.5 (Automation)' },
    { id: 'v0.1.6', label: 'v0.1.6 (Issues)' },
    { id: 'v0.1.7', label: 'v0.1.7 (Graph API)' },
    { id: 'v0.1.8', label: 'v0.1.8 (Fixes)' }
];

// Update the global AVAILABLE_VERSIONS
if (typeof AVAILABLE_VERSIONS !== 'undefined') {
    AVAILABLE_VERSIONS.length = 0;
    AVAILABLE_VERSIONS_v018.forEach(v => AVAILABLE_VERSIONS.push(v));
}

// Override render to update selected version
const originalRender_v018 = WorkbenchShell.prototype.render;
WorkbenchShell.prototype.render = function() {
    originalRender_v018.call(this);

    // Update version select to show v0.1.8 as selected
    if (this.$versionSelect) {
        this.$versionSelect.innerHTML = AVAILABLE_VERSIONS_v018.map(v =>
            `<option value="${v.id}" ${v.id === 'v0.1.8' ? 'selected' : ''}>${v.label}</option>`
        ).join('');
    }
};

console.log('[v0.1.8] Shell with issues section removed (moved to issues_ui)');
