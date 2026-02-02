/**
 * Create Node Modal Override - v0.1.5
 *
 * Purpose: Fix Bug-7 - Modal data lost on outside click
 * Version: v0.1.5
 *
 * Bug-7: When creating a new issue, clicking outside the modal closes it
 * and loses all entered data without warning.
 *
 * Fix Options:
 * Option A: Disable click-outside-to-close entirely (recommended - simpler)
 * Option B: Check for unsaved data and show confirmation
 *
 * Implementation: Option A - Only allow closing via Cancel button or X button
 */

(function() {
    'use strict';

    // Get the CreateNodeModal class from the custom elements registry
    const CreateNodeModalClass = customElements.get('create-node-modal');
    if (!CreateNodeModalClass) {
        console.error('[v0.1.5] CreateNodeModal not found!');
        return;
    }

    // Store original render method to patch click handler
    const _originalRender = CreateNodeModalClass.prototype.render;

    // Override render to change the overlay click behavior
    CreateNodeModalClass.prototype.render = function() {
        // Call original render
        _originalRender.call(this);

        // Bug-7 fix: Add a capturing click handler on the overlay
        // that prevents closing when there's unsaved data
        const overlay = this.querySelector('#cnm-overlay');
        if (overlay && this.state.visible && !overlay._v015Patched) {
            // Mark as patched to avoid adding multiple handlers
            overlay._v015Patched = true;

            // Add capturing handler that intercepts overlay background clicks
            overlay.addEventListener('click', (e) => {
                // Bug-7 fix: Only intercept if clicking EXACTLY on the overlay background
                if (e.target.id === 'cnm-overlay' || e.target.classList.contains('cnm-overlay')) {
                    // Check if form has any data
                    if (this.hasUnsavedData()) {
                        // Don't close - user has data entered
                        e.stopPropagation();
                        e.preventDefault();

                        // Show a subtle shake animation
                        const modal = overlay.querySelector('.cnm-modal');
                        if (modal) {
                            modal.style.animation = 'none';
                            modal.offsetHeight; // Trigger reflow
                            modal.style.animation = 'cnm-shake 0.3s ease-in-out';
                        }
                        return false;
                    }
                }
            }, true); // Capturing phase to intercept before other handlers

            // Add shake animation style if not present
            if (!document.getElementById('cnm-v015-styles')) {
                const style = document.createElement('style');
                style.id = 'cnm-v015-styles';
                style.textContent = `
                    @keyframes cnm-shake {
                        0%, 100% { transform: translateX(0); }
                        20%, 60% { transform: translateX(-5px); }
                        40%, 80% { transform: translateX(5px); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    };

    // Add method to check if form has unsaved data
    CreateNodeModalClass.prototype.hasUnsavedData = function() {
        return !!(
            (this.state.title && this.state.title.trim()) ||
            (this.state.description && this.state.description.trim()) ||
            (this.state.tags && this.state.tags.trim())
        );
    };

    console.log('[Issues UI v0.1.5] CreateNodeModal patched: Bug-7 click-outside fix');

})();
