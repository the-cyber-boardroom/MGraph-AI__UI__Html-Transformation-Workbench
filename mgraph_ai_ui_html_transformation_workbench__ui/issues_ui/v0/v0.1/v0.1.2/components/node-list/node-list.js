/**
 * Node List Scroll Fix Override
 *
 * Purpose: Fix the table scroll issue when there are many issues
 * Version: v0.1.2 (Issues UI)
 *
 * The issue: The issues table doesn't scroll because the content area
 * needs explicit height constraints for overflow to work properly.
 */

// Store original getStyles
const _originalGetStyles_NodeList = NodeList.prototype.getStyles;

// Override getStyles to add scroll fixes
NodeList.prototype.getStyles = function() {
    const baseStyles = _originalGetStyles_NodeList.call(this);

    const scrollFixes = `
        /* Fix: Ensure node-list takes available height and enables scroll */
        .node-list {
            height: 100%;
            max-height: 100%;
            overflow: hidden;
        }

        /* Fix: Content area must have explicit sizing for overflow to work */
        .nl-content {
            flex: 1 1 0;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
        }

        /* Ensure table container respects overflow */
        .nl-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        /* Keep header sticky while scrolling */
        .nl-table thead {
            position: sticky;
            top: 0;
            z-index: 10;
            background: #1e2746;
        }

        .nl-table thead th {
            background: #1e2746;
        }

        /* Nice scrollbar for the content area */
        .nl-content::-webkit-scrollbar {
            width: 8px;
        }

        .nl-content::-webkit-scrollbar-track {
            background: #1a1a2e;
        }

        .nl-content::-webkit-scrollbar-thumb {
            background: #3a4f6f;
            border-radius: 4px;
        }

        .nl-content::-webkit-scrollbar-thumb:hover {
            background: #4a5f7f;
        }
    `;

    return baseStyles + scrollFixes;
};

console.log('[Issues UI v0.1.2] Node list scroll fix applied');
