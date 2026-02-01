/**
 * Node Detail Override - v0.1.3
 *
 * Purpose: Add markdown preview toggle and comments section
 * Version: v0.1.3 (Issues UI)
 *
 * Changes from v0.1.0:
 * - Task-4: Markdown preview toggle for description
 * - Task-3: Comments section with add/edit/delete
 *
 * Note: Uses PATCH workaround (send full properties) per backend briefing
 */

// Store original methods
const _originalRender = NodeDetail.prototype.render;
const _originalGetStyles = NodeDetail.prototype.getStyles;
const _originalAttachEventHandlers = NodeDetail.prototype.attachEventHandlers;

// Add new state properties
const _originalConstructor = NodeDetail.prototype.constructor;

// Extend state for v0.1.3 features
NodeDetail.prototype.initV013State = function() {
    if (!this._v013Initialized) {
        this.state.editMode = false;           // Task-4: Edit mode for description
        this.state.editedDescription = '';     // Task-4: Edited description text
        this.state.showCommentForm = false;    // Task-3: Show add comment form
        this.state.newCommentText = '';        // Task-3: New comment text
        this.state.editingCommentId = null;    // Task-3: ID of comment being edited
        this._v013Initialized = true;
    }
};

// Override render to add markdown toggle and comments
NodeDetail.prototype.render = function() {
    this.initV013State();

    // If no node loaded, use original render
    if (this.state.loading || this.state.error || !this.state.node) {
        _originalRender.call(this);
        return;
    }

    const node = this.state.node;
    const nodeType = this.graphService.parseTypeFromLabel(node.label);
    const typeConfig = window.issuesApp.nodeTypes[nodeType] || {};
    const validStatuses = this.graphService.getStatusesForType(nodeType);

    const outgoingLinks = this.state.links.filter(l => !this.isInverseVerb(l.verb));
    const incomingLinks = this.state.links.filter(l => this.isInverseVerb(l.verb));

    // Get comments from properties
    const comments = node.properties?.comments || [];

    this.innerHTML = `
        <style>${this.getStyles()}</style>
        <div class="node-detail">
            <div class="nd-header">
                <button class="nd-back" id="nd-back">\u{2190} Back to List</button>
                <div class="nd-actions">
                    <button class="nd-btn nd-btn-danger" id="nd-delete">Delete</button>
                </div>
            </div>

            <div class="nd-content">
                <div class="nd-main">
                    <div class="nd-title-row">
                        <span class="nd-label-badge" style="background: ${typeConfig.color || '#6b7280'}">
                            ${typeConfig.icon || '\u{1F4C4}'} ${node.label}
                        </span>
                        <h1 class="nd-title">${this.escapeHtml(node.title || '')}</h1>
                    </div>

                    <div class="nd-meta">
                        <div class="nd-status-section">
                            <label>Status</label>
                            <select class="nd-status-select" id="nd-status">
                                ${validStatuses.map(status => `
                                    <option value="${status}" ${node.status === status ? 'selected' : ''}>
                                        ${this.formatStatus(status)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        ${node.tags && node.tags.length > 0 ? `
                            <div class="nd-tags">
                                ${node.tags.map(tag => `
                                    <span class="nd-tag">${this.escapeHtml(tag)}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Task-4: Description with Edit/Preview toggle -->
                    <div class="nd-section">
                        <h3>
                            Description
                            <div class="nd-edit-toggle">
                                <button class="nd-toggle-btn ${!this.state.editMode ? 'active' : ''}"
                                        id="nd-preview-btn">Preview</button>
                                <button class="nd-toggle-btn ${this.state.editMode ? 'active' : ''}"
                                        id="nd-edit-btn">Edit</button>
                            </div>
                        </h3>
                        ${this.state.editMode ? `
                            <div class="nd-description-edit">
                                <textarea class="nd-description-textarea" id="nd-description-input"
                                          placeholder="Enter description (Markdown supported)"
                                >${this.escapeHtml(this.state.editedDescription || node.description || '')}</textarea>
                                <div class="nd-edit-actions">
                                    <button class="nd-btn nd-btn-secondary" id="nd-cancel-edit">Cancel</button>
                                    <button class="nd-btn nd-btn-primary" id="nd-save-description">Save</button>
                                </div>
                            </div>
                        ` : `
                            <div class="nd-description">
                                ${this.markdown.parse(node.description || 'No description provided.')}
                            </div>
                        `}
                    </div>

                    <!-- Task-3: Comments Section -->
                    <div class="nd-section">
                        <h3>
                            Comments (${comments.length})
                            <button class="nd-btn nd-btn-small" id="nd-add-comment">+ Add Comment</button>
                        </h3>
                        <div class="nd-comments">
                            ${this.state.showCommentForm ? `
                                <div class="nd-comment-form">
                                    <textarea class="nd-comment-textarea" id="nd-comment-input"
                                              placeholder="Write a comment...">${this.escapeHtml(this.state.newCommentText)}</textarea>
                                    <div class="nd-comment-form-actions">
                                        <button class="nd-btn nd-btn-secondary nd-btn-small" id="nd-cancel-comment">Cancel</button>
                                        <button class="nd-btn nd-btn-primary nd-btn-small" id="nd-submit-comment">Submit</button>
                                    </div>
                                </div>
                            ` : ''}

                            ${comments.length > 0 ? comments.map(comment => this.renderComment(comment)).join('') : `
                                <div class="nd-no-comments">No comments yet. Be the first to add one!</div>
                            `}
                        </div>
                    </div>

                    <!-- Relationships -->
                    <div class="nd-section">
                        <h3>
                            Relationships
                            <button class="nd-btn nd-btn-small" id="nd-add-link">+ Add Link</button>
                        </h3>
                        <div class="nd-links">
                            ${outgoingLinks.length > 0 ? `
                                <div class="nd-link-group">
                                    <div class="nd-link-group-title">Outgoing</div>
                                    ${outgoingLinks.map(link => this.renderLink(link)).join('')}
                                </div>
                            ` : ''}

                            ${incomingLinks.length > 0 ? `
                                <div class="nd-link-group">
                                    <div class="nd-link-group-title">Incoming</div>
                                    ${incomingLinks.map(link => this.renderLink(link)).join('')}
                                </div>
                            ` : ''}

                            ${this.state.links.length === 0 ? `
                                <div class="nd-no-links">No relationships yet.</div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="nd-sidebar">
                    <div class="nd-sidebar-section">
                        <h4>Details</h4>
                        <div class="nd-detail-row">
                            <span class="nd-detail-label">Type</span>
                            <span class="nd-detail-value">${this.capitalize(nodeType)}</span>
                        </div>
                        <div class="nd-detail-row">
                            <span class="nd-detail-label">Created</span>
                            <span class="nd-detail-value">${this.formatDate(node.created_at)}</span>
                        </div>
                        <div class="nd-detail-row">
                            <span class="nd-detail-label">Updated</span>
                            <span class="nd-detail-value">${this.formatDate(node.updated_at)}</span>
                        </div>
                        <div class="nd-detail-row">
                            <span class="nd-detail-label">ID</span>
                            <span class="nd-detail-value nd-mono">${node.node_id || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        ${this.state.showLinkModal ? this.renderLinkModal() : ''}
    `;

    this.attachEventHandlers();
};

// Task-3: Render a single comment
NodeDetail.prototype.renderComment = function(comment) {
    const isEditing = this.state.editingCommentId === comment.id;
    const isOwn = comment.author === 'human'; // For now, all human comments are editable

    return `
        <div class="nd-comment" data-comment-id="${comment.id}">
            <div class="nd-comment-header">
                <span class="nd-comment-author">
                    ${comment.author === 'human' ? '\u{1F464}' : '\u{1F916}'} ${comment.author || 'Unknown'}
                </span>
                <span class="nd-comment-time">${this.formatDateTime(comment.created_at)}</span>
                ${isOwn ? `
                    <div class="nd-comment-actions">
                        <button class="nd-comment-edit" data-comment-id="${comment.id}" title="Edit">\u{270F}\u{FE0F}</button>
                        <button class="nd-comment-delete" data-comment-id="${comment.id}" title="Delete">\u{1F5D1}\u{FE0F}</button>
                    </div>
                ` : ''}
            </div>
            ${isEditing ? `
                <div class="nd-comment-edit-form">
                    <textarea class="nd-comment-textarea" id="nd-edit-comment-input">${this.escapeHtml(comment.text)}</textarea>
                    <div class="nd-comment-form-actions">
                        <button class="nd-btn nd-btn-secondary nd-btn-small" id="nd-cancel-edit-comment">Cancel</button>
                        <button class="nd-btn nd-btn-primary nd-btn-small" id="nd-save-edit-comment" data-comment-id="${comment.id}">Save</button>
                    </div>
                </div>
            ` : `
                <div class="nd-comment-body">
                    ${this.markdown.parse(comment.text || '')}
                </div>
            `}
        </div>
    `;
};

// Override attachEventHandlers to add v0.1.3 handlers
NodeDetail.prototype.attachEventHandlers = function() {
    _originalAttachEventHandlers.call(this);

    const self = this;

    // Task-4: Description edit/preview toggle
    this.querySelector('#nd-preview-btn')?.addEventListener('click', () => {
        this.state.editMode = false;
        this.render();
    });

    this.querySelector('#nd-edit-btn')?.addEventListener('click', () => {
        this.state.editMode = true;
        this.state.editedDescription = this.state.node.description || '';
        this.render();
        // Focus the textarea
        setTimeout(() => {
            const textarea = this.querySelector('#nd-description-input');
            if (textarea) textarea.focus();
        }, 0);
    });

    this.querySelector('#nd-cancel-edit')?.addEventListener('click', () => {
        this.state.editMode = false;
        this.state.editedDescription = '';
        this.render();
    });

    this.querySelector('#nd-save-description')?.addEventListener('click', async () => {
        const newDescription = this.querySelector('#nd-description-input')?.value || '';
        await this.saveDescription(newDescription);
    });

    // Task-3: Comments handlers
    this.querySelector('#nd-add-comment')?.addEventListener('click', () => {
        this.state.showCommentForm = true;
        this.state.newCommentText = '';
        this.render();
        setTimeout(() => {
            const textarea = this.querySelector('#nd-comment-input');
            if (textarea) textarea.focus();
        }, 0);
    });

    this.querySelector('#nd-cancel-comment')?.addEventListener('click', () => {
        this.state.showCommentForm = false;
        this.state.newCommentText = '';
        this.render();
    });

    this.querySelector('#nd-submit-comment')?.addEventListener('click', async () => {
        const text = this.querySelector('#nd-comment-input')?.value || '';
        if (text.trim()) {
            await this.addComment(text);
        }
    });

    // Edit comment
    this.querySelectorAll('.nd-comment-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.state.editingCommentId = btn.dataset.commentId;
            this.render();
        });
    });

    // Delete comment
    this.querySelectorAll('.nd-comment-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Delete this comment?')) {
                await this.deleteComment(btn.dataset.commentId);
            }
        });
    });

    // Cancel edit comment
    this.querySelector('#nd-cancel-edit-comment')?.addEventListener('click', () => {
        this.state.editingCommentId = null;
        this.render();
    });

    // Save edit comment
    this.querySelector('#nd-save-edit-comment')?.addEventListener('click', async () => {
        const text = this.querySelector('#nd-edit-comment-input')?.value || '';
        const commentId = this.state.editingCommentId;
        if (text.trim() && commentId) {
            await this.updateComment(commentId, text);
        }
    });
};

// Task-4: Save description
NodeDetail.prototype.saveDescription = async function(newDescription) {
    try {
        // IMPORTANT: Use PATCH workaround - send full properties object
        const currentProps = { ...this.state.node.properties };

        const response = await this.graphService.updateNode(this.state.label, {
            description: newDescription
        });

        if (response.success) {
            this.state.node = response.node;
            this.state.editMode = false;
            this.state.editedDescription = '';
            this.render();
        }
    } catch (error) {
        alert('Failed to save description: ' + error.message);
    }
};

// Task-3: Add a new comment
NodeDetail.prototype.addComment = async function(text) {
    try {
        // Get current properties (PATCH workaround)
        const properties = { ...this.state.node.properties };
        const comments = properties.comments || [];

        // Add new comment
        const newComment = {
            id: crypto.randomUUID(),
            author: 'human',
            text: text,
            created_at: Date.now()
        };
        comments.push(newComment);
        properties.comments = comments;

        // Update node with full properties
        const response = await this.graphService.updateNode(this.state.label, { properties });

        if (response.success) {
            this.state.node = response.node;
            this.state.showCommentForm = false;
            this.state.newCommentText = '';
            this.render();

            this.events.emit('comment-added', {
                nodeLabel: this.state.label,
                comment: newComment
            });
        }
    } catch (error) {
        alert('Failed to add comment: ' + error.message);
    }
};

// Task-3: Update an existing comment
NodeDetail.prototype.updateComment = async function(commentId, newText) {
    try {
        // Get current properties (PATCH workaround)
        const properties = { ...this.state.node.properties };
        const comments = properties.comments || [];

        // Find and update the comment
        const commentIndex = comments.findIndex(c => c.id === commentId);
        if (commentIndex === -1) {
            alert('Comment not found');
            return;
        }

        comments[commentIndex] = {
            ...comments[commentIndex],
            text: newText,
            updated_at: Date.now()
        };
        properties.comments = comments;

        // Update node with full properties
        const response = await this.graphService.updateNode(this.state.label, { properties });

        if (response.success) {
            this.state.node = response.node;
            this.state.editingCommentId = null;
            this.render();
        }
    } catch (error) {
        alert('Failed to update comment: ' + error.message);
    }
};

// Task-3: Delete a comment
NodeDetail.prototype.deleteComment = async function(commentId) {
    try {
        // Get current properties (PATCH workaround)
        const properties = { ...this.state.node.properties };
        const comments = properties.comments || [];

        // Remove the comment
        const newComments = comments.filter(c => c.id !== commentId);
        properties.comments = newComments;

        // Update node with full properties
        const response = await this.graphService.updateNode(this.state.label, { properties });

        if (response.success) {
            this.state.node = response.node;
            this.render();

            this.events.emit('comment-deleted', {
                nodeLabel: this.state.label,
                commentId: commentId
            });
        }
    } catch (error) {
        alert('Failed to delete comment: ' + error.message);
    }
};

// Helper: Format date and time
NodeDetail.prototype.formatDateTime = function(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Override getStyles to add v0.1.3 styles
NodeDetail.prototype.getStyles = function() {
    const baseStyles = _originalGetStyles.call(this);

    const v013Styles = `
        /* Task-4: Edit/Preview toggle */
        .nd-edit-toggle {
            display: inline-flex;
            margin-left: auto;
            background: #252836;
            border-radius: 4px;
            overflow: hidden;
        }

        .nd-toggle-btn {
            background: transparent;
            border: none;
            color: #8a9cc4;
            padding: 4px 12px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .nd-toggle-btn.active {
            background: #667eea;
            color: white;
        }

        .nd-toggle-btn:hover:not(.active) {
            background: rgba(102, 126, 234, 0.2);
        }

        .nd-description-edit {
            background: #252836;
            border-radius: 6px;
            padding: 12px;
        }

        .nd-description-textarea {
            width: 100%;
            min-height: 200px;
            padding: 12px;
            border: 1px solid #3a4f6f;
            border-radius: 4px;
            background: #1a1a2e;
            color: #e0e0e0;
            font-size: 13px;
            font-family: inherit;
            line-height: 1.6;
            resize: vertical;
        }

        .nd-description-textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        .nd-edit-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 12px;
        }

        /* Task-3: Comments */
        .nd-comments {
            background: #252836;
            border-radius: 6px;
            padding: 12px;
        }

        .nd-comment-form {
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #3a4f6f;
        }

        .nd-comment-textarea {
            width: 100%;
            min-height: 80px;
            padding: 10px;
            border: 1px solid #3a4f6f;
            border-radius: 4px;
            background: #1a1a2e;
            color: #e0e0e0;
            font-size: 13px;
            font-family: inherit;
            resize: vertical;
        }

        .nd-comment-textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        .nd-comment-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 8px;
        }

        .nd-comment {
            padding: 12px 0;
            border-bottom: 1px solid #2a3f5f;
        }

        .nd-comment:last-child {
            border-bottom: none;
        }

        .nd-comment-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }

        .nd-comment-author {
            font-weight: 600;
            font-size: 12px;
            color: #e0e0e0;
        }

        .nd-comment-time {
            font-size: 11px;
            color: #6a7a8a;
        }

        .nd-comment-actions {
            margin-left: auto;
            display: flex;
            gap: 4px;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .nd-comment:hover .nd-comment-actions {
            opacity: 1;
        }

        .nd-comment-edit,
        .nd-comment-delete {
            background: none;
            border: none;
            color: #6a7a8a;
            cursor: pointer;
            padding: 2px 6px;
            font-size: 12px;
            border-radius: 3px;
        }

        .nd-comment-edit:hover {
            background: rgba(102, 126, 234, 0.2);
            color: #667eea;
        }

        .nd-comment-delete:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }

        .nd-comment-body {
            font-size: 13px;
            line-height: 1.6;
            color: #c0c0c0;
        }

        .nd-comment-body p {
            margin: 0 0 8px 0;
        }

        .nd-comment-body p:last-child {
            margin-bottom: 0;
        }

        .nd-comment-edit-form {
            margin-top: 8px;
        }

        .nd-no-comments {
            text-align: center;
            color: #6a7a8a;
            padding: 20px;
            font-size: 13px;
        }
    `;

    return baseStyles + v013Styles;
};

console.log('[Issues UI v0.1.3] Node Detail with markdown toggle and comments enabled');
