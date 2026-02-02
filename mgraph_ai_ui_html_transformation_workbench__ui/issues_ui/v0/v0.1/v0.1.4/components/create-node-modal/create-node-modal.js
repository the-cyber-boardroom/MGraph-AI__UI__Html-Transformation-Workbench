/**
 * Create Node Modal Override - v0.1.4
 *
 * Purpose: Fix Bug-5 - Create button disappears after first issue creation
 * Version: v0.1.4
 *
 * Bug Analysis:
 * The 'creating' state was set to true when create() was called, but was not
 * reset to false in the success path before calling close(). When the modal
 * was reopened, the state remained 'creating = true', showing a disabled button.
 *
 * Fix:
 * 1. Reset 'creating' state in _onShowModal() to ensure fresh state
 * 2. Reset 'creating' state in close() as additional safety
 * 3. Use messages service instead of inline errors where appropriate
 *
 * Namespace: window.issuesApp
 */

(function() {
    'use strict';

    // Get the CreateNodeModal class from the custom elements registry
    const CreateNodeModalClass = customElements.get('create-node-modal');
    if (!CreateNodeModalClass) {
        console.error('[v0.1.4] CreateNodeModal not found!');
        return;
    }

    // Store original methods
    const originalOnShowModal = CreateNodeModalClass.prototype._onShowModal;
    const originalClose = CreateNodeModalClass.prototype.close;
    const originalCreate = CreateNodeModalClass.prototype.create;

    // Override _onShowModal to ensure 'creating' state is reset
    CreateNodeModalClass.prototype._onShowModal = function(data) {
        // Reset ALL state including 'creating' - this is the key fix for Bug-5
        this.state = {
            visible: true,
            nodeType: data?.defaultType || 'task',
            title: '',
            description: '',
            tags: '',
            status: null,
            creating: false,  // Bug-5 fix: Explicitly reset creating state
            error: null
        };
        this.render();

        setTimeout(() => {
            this.querySelector('#cnm-title')?.focus();
        }, 100);
    };

    // Override close to ensure 'creating' state is reset
    CreateNodeModalClass.prototype.close = function() {
        this.state.creating = false;  // Bug-5 fix: Reset creating state on close
        this.state.visible = false;
        this.render();
    };

    // Override create to use messages service for success notifications
    CreateNodeModalClass.prototype.create = async function() {
        if (!this.state.title.trim()) {
            this.state.error = 'Title is required';
            this.render();
            return;
        }

        this.state.creating = true;
        this.state.error = null;
        this.render();

        try {
            const data = {
                node_type: this.state.nodeType,
                title: this.state.title.trim(),
                description: this.state.description.trim() || null
            };

            if (this.state.tags.trim()) {
                data.tags = this.state.tags.split(',').map(t => t.trim()).filter(t => t);
            }

            if (this.state.status) {
                data.status = this.state.status;
            }

            const response = await this.graphService.createNode(data);

            if (response.success) {
                // Bug-5 fix: Reset creating state BEFORE close
                this.state.creating = false;

                // Show success message via messages service if available
                if (window.issuesApp.messages) {
                    window.issuesApp.messages.add('success',
                        `${this.capitalize(this.state.nodeType)} "${response.node.label}" created successfully`
                    );
                }

                this.events.emit('navigate-to-node', { label: response.node.label });
                this.close();
                this.router.navigate('node-detail');
            } else {
                this.state.error = response.message || 'Failed to create node';
                this.state.creating = false;
                this.render();

                // Also show in messages panel if available
                if (window.issuesApp.messages) {
                    window.issuesApp.messages.add('error', response.message || 'Failed to create node');
                }
            }
        } catch (error) {
            this.state.error = error.message;
            this.state.creating = false;
            this.render();

            // Also show in messages panel if available
            if (window.issuesApp.messages) {
                window.issuesApp.messages.add('error', `Create failed: ${error.message}`);
            }
        }
    };

    // Helper to capitalize strings (in case base class doesn't have it)
    if (!CreateNodeModalClass.prototype.capitalize) {
        CreateNodeModalClass.prototype.capitalize = function(str) {
            return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
        };
    }

    console.log('[Issues UI v0.1.4] CreateNodeModal patched: Bug-5 create button state fix');

})();
