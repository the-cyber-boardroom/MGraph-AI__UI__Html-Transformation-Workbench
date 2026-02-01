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

(function() {
    'use strict';

    // Make sure NodeDetail exists
    if (typeof NodeDetail === 'undefined') {
        console.error('[v0.1.3] NodeDetail class not found!');
        return;
    }

    console.log('[v0.1.3] Initializing NodeDetail override...');

    // UUID fallback for browsers without crypto.randomUUID
    function generateUUID() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        // Fallback implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Store original methods
    var _originalRender = NodeDetail.prototype.render;
    var _originalGetStyles = NodeDetail.prototype.getStyles;
    var _originalAttachEventHandlers = NodeDetail.prototype.attachEventHandlers;

    // Initialize v0.1.3 state
    NodeDetail.prototype.initV013State = function() {
        if (!this._v013Initialized) {
            this.state.editMode = false;
            this.state.editedDescription = '';
            this.state.showCommentForm = false;
            this.state.newCommentText = '';
            this.state.editingCommentId = null;
            this._v013Initialized = true;
        }
    };

    // Override render
    NodeDetail.prototype.render = function() {
        this.initV013State();

        // For loading/error/empty states, use original render
        if (this.state.loading || this.state.error || !this.state.node) {
            _originalRender.call(this);
            return;
        }

        var node = this.state.node;
        var nodeType = this.graphService.parseTypeFromLabel(node.label);
        var typeConfig = window.issuesApp.nodeTypes[nodeType] || {};
        var validStatuses = this.graphService.getStatusesForType(nodeType);
        var self = this;

        var outgoingLinks = this.state.links.filter(function(l) { return !self.isInverseVerb(l.verb); });
        var incomingLinks = this.state.links.filter(function(l) { return self.isInverseVerb(l.verb); });

        // Get comments from properties
        var comments = (node.properties && node.properties.comments) || [];

        // Build status options HTML
        var statusOptions = validStatuses.map(function(status) {
            var selected = node.status === status ? 'selected' : '';
            return '<option value="' + status + '" ' + selected + '>' + self.formatStatus(status) + '</option>';
        }).join('');

        // Build tags HTML
        var tagsHtml = '';
        if (node.tags && node.tags.length > 0) {
            tagsHtml = '<div class="nd-tags">' + node.tags.map(function(tag) {
                return '<span class="nd-tag">' + self.escapeHtml(tag) + '</span>';
            }).join('') + '</div>';
        }

        // Build description section with edit/preview toggle
        var descriptionHtml;
        if (this.state.editMode) {
            descriptionHtml = '<div class="nd-description-edit">' +
                '<textarea class="nd-description-textarea" id="nd-description-input" placeholder="Enter description (Markdown supported)">' +
                this.escapeHtml(this.state.editedDescription || node.description || '') +
                '</textarea>' +
                '<div class="nd-edit-actions">' +
                '<button class="nd-btn nd-btn-secondary" id="nd-cancel-edit">Cancel</button>' +
                '<button class="nd-btn nd-btn-primary" id="nd-save-description">Save</button>' +
                '</div></div>';
        } else {
            descriptionHtml = '<div class="nd-description">' +
                this.markdown.parse(node.description || 'No description provided.') +
                '</div>';
        }

        // Build comments HTML
        var commentsHtml = this.renderComments(comments);

        // Build links HTML
        var linksHtml = this.renderLinksSection(outgoingLinks, incomingLinks);

        this.innerHTML = '<style>' + this.getStyles() + '</style>' +
            '<div class="node-detail">' +
            '<div class="nd-header">' +
            '<button class="nd-back" id="nd-back">&larr; Back to List</button>' +
            '<div class="nd-actions">' +
            '<button class="nd-btn nd-btn-danger" id="nd-delete">Delete</button>' +
            '</div></div>' +

            '<div class="nd-content">' +
            '<div class="nd-main">' +

            '<div class="nd-title-row">' +
            '<span class="nd-label-badge" style="background: ' + (typeConfig.color || '#6b7280') + '">' +
            (typeConfig.icon || '📄') + ' ' + node.label +
            '</span>' +
            '<h1 class="nd-title">' + this.escapeHtml(node.title || '') + '</h1>' +
            '</div>' +

            '<div class="nd-meta">' +
            '<div class="nd-status-section">' +
            '<label>Status</label>' +
            '<select class="nd-status-select" id="nd-status">' + statusOptions + '</select>' +
            '</div>' + tagsHtml + '</div>' +

            // Task-4: Description with toggle
            '<div class="nd-section">' +
            '<h3>Description ' +
            '<div class="nd-edit-toggle">' +
            '<button class="nd-toggle-btn ' + (!this.state.editMode ? 'active' : '') + '" id="nd-preview-btn">Preview</button>' +
            '<button class="nd-toggle-btn ' + (this.state.editMode ? 'active' : '') + '" id="nd-edit-btn">Edit</button>' +
            '</div></h3>' +
            descriptionHtml +
            '</div>' +

            // Task-3: Comments section
            '<div class="nd-section">' +
            '<h3>Comments (' + comments.length + ') ' +
            '<button class="nd-btn nd-btn-small" id="nd-add-comment">+ Add Comment</button>' +
            '</h3>' +
            '<div class="nd-comments">' + commentsHtml + '</div>' +
            '</div>' +

            // Relationships
            '<div class="nd-section">' +
            '<h3>Relationships <button class="nd-btn nd-btn-small" id="nd-add-link">+ Add Link</button></h3>' +
            '<div class="nd-links">' + linksHtml + '</div>' +
            '</div>' +

            '</div>' + // nd-main

            '<div class="nd-sidebar">' +
            '<div class="nd-sidebar-section">' +
            '<h4>Details</h4>' +
            '<div class="nd-detail-row"><span class="nd-detail-label">Type</span><span class="nd-detail-value">' + this.capitalize(nodeType) + '</span></div>' +
            '<div class="nd-detail-row"><span class="nd-detail-label">Created</span><span class="nd-detail-value">' + this.formatDate(node.created_at) + '</span></div>' +
            '<div class="nd-detail-row"><span class="nd-detail-label">Updated</span><span class="nd-detail-value">' + this.formatDate(node.updated_at) + '</span></div>' +
            '<div class="nd-detail-row"><span class="nd-detail-label">ID</span><span class="nd-detail-value nd-mono">' + (node.node_id || '-') + '</span></div>' +
            '</div></div>' +

            '</div>' + // nd-content
            '</div>' + // node-detail

            (this.state.showLinkModal ? this.renderLinkModal() : '');

        this.attachEventHandlers();
    };

    // Render comments section
    NodeDetail.prototype.renderComments = function(comments) {
        var self = this;
        var html = '';

        // Add comment form if showing
        if (this.state.showCommentForm) {
            html += '<div class="nd-comment-form">' +
                '<textarea class="nd-comment-textarea" id="nd-comment-input" placeholder="Write a comment...">' +
                this.escapeHtml(this.state.newCommentText) + '</textarea>' +
                '<div class="nd-comment-form-actions">' +
                '<button class="nd-btn nd-btn-secondary nd-btn-small" id="nd-cancel-comment">Cancel</button>' +
                '<button class="nd-btn nd-btn-primary nd-btn-small" id="nd-submit-comment">Submit</button>' +
                '</div></div>';
        }

        if (comments.length === 0) {
            html += '<div class="nd-no-comments">No comments yet. Be the first to add one!</div>';
        } else {
            comments.forEach(function(comment) {
                html += self.renderComment(comment);
            });
        }

        return html;
    };

    // Render a single comment
    NodeDetail.prototype.renderComment = function(comment) {
        var isEditing = this.state.editingCommentId === comment.id;
        var isOwn = comment.author === 'human';
        var authorIcon = comment.author === 'human' ? '👤' : '🤖';

        var actionsHtml = '';
        if (isOwn) {
            actionsHtml = '<div class="nd-comment-actions">' +
                '<button class="nd-comment-edit" data-comment-id="' + comment.id + '" title="Edit">✏️</button>' +
                '<button class="nd-comment-delete" data-comment-id="' + comment.id + '" title="Delete">🗑️</button>' +
                '</div>';
        }

        var bodyHtml;
        if (isEditing) {
            bodyHtml = '<div class="nd-comment-edit-form">' +
                '<textarea class="nd-comment-textarea" id="nd-edit-comment-input">' + this.escapeHtml(comment.text) + '</textarea>' +
                '<div class="nd-comment-form-actions">' +
                '<button class="nd-btn nd-btn-secondary nd-btn-small" id="nd-cancel-edit-comment">Cancel</button>' +
                '<button class="nd-btn nd-btn-primary nd-btn-small" id="nd-save-edit-comment" data-comment-id="' + comment.id + '">Save</button>' +
                '</div></div>';
        } else {
            bodyHtml = '<div class="nd-comment-body">' + this.markdown.parse(comment.text || '') + '</div>';
        }

        return '<div class="nd-comment" data-comment-id="' + comment.id + '">' +
            '<div class="nd-comment-header">' +
            '<span class="nd-comment-author">' + authorIcon + ' ' + (comment.author || 'Unknown') + '</span>' +
            '<span class="nd-comment-time">' + this.formatDateTime(comment.created_at) + '</span>' +
            actionsHtml +
            '</div>' +
            bodyHtml +
            '</div>';
    };

    // Render links section
    NodeDetail.prototype.renderLinksSection = function(outgoingLinks, incomingLinks) {
        var self = this;
        var html = '';

        if (outgoingLinks.length > 0) {
            html += '<div class="nd-link-group"><div class="nd-link-group-title">Outgoing</div>';
            outgoingLinks.forEach(function(link) {
                html += self.renderLink(link);
            });
            html += '</div>';
        }

        if (incomingLinks.length > 0) {
            html += '<div class="nd-link-group"><div class="nd-link-group-title">Incoming</div>';
            incomingLinks.forEach(function(link) {
                html += self.renderLink(link);
            });
            html += '</div>';
        }

        if (outgoingLinks.length === 0 && incomingLinks.length === 0) {
            html = '<div class="nd-no-links">No relationships yet.</div>';
        }

        return html;
    };

    // Format date and time
    NodeDetail.prototype.formatDateTime = function(timestamp) {
        if (!timestamp) return 'Unknown';
        var date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Override attachEventHandlers
    NodeDetail.prototype.attachEventHandlers = function() {
        _originalAttachEventHandlers.call(this);
        var self = this;

        // Task-4: Description edit/preview toggle
        var previewBtn = this.querySelector('#nd-preview-btn');
        var editBtn = this.querySelector('#nd-edit-btn');

        if (previewBtn) {
            previewBtn.addEventListener('click', function() {
                self.state.editMode = false;
                self.render();
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', function() {
                self.state.editMode = true;
                self.state.editedDescription = self.state.node.description || '';
                self.render();
                setTimeout(function() {
                    var textarea = self.querySelector('#nd-description-input');
                    if (textarea) textarea.focus();
                }, 0);
            });
        }

        var cancelEditBtn = this.querySelector('#nd-cancel-edit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', function() {
                self.state.editMode = false;
                self.state.editedDescription = '';
                self.render();
            });
        }

        var saveDescBtn = this.querySelector('#nd-save-description');
        if (saveDescBtn) {
            saveDescBtn.addEventListener('click', function() {
                var textarea = self.querySelector('#nd-description-input');
                var newDescription = textarea ? textarea.value : '';
                self.saveDescription(newDescription);
            });
        }

        // Task-3: Comments handlers
        var addCommentBtn = this.querySelector('#nd-add-comment');
        if (addCommentBtn) {
            addCommentBtn.addEventListener('click', function() {
                self.state.showCommentForm = true;
                self.state.newCommentText = '';
                self.render();
                setTimeout(function() {
                    var textarea = self.querySelector('#nd-comment-input');
                    if (textarea) textarea.focus();
                }, 0);
            });
        }

        var cancelCommentBtn = this.querySelector('#nd-cancel-comment');
        if (cancelCommentBtn) {
            cancelCommentBtn.addEventListener('click', function() {
                self.state.showCommentForm = false;
                self.state.newCommentText = '';
                self.render();
            });
        }

        var submitCommentBtn = this.querySelector('#nd-submit-comment');
        if (submitCommentBtn) {
            submitCommentBtn.addEventListener('click', function() {
                var textarea = self.querySelector('#nd-comment-input');
                var text = textarea ? textarea.value : '';
                if (text.trim()) {
                    self.addComment(text);
                }
            });
        }

        // Edit comment buttons
        this.querySelectorAll('.nd-comment-edit').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                self.state.editingCommentId = btn.dataset.commentId;
                self.render();
            });
        });

        // Delete comment buttons
        this.querySelectorAll('.nd-comment-delete').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm('Delete this comment?')) {
                    self.deleteComment(btn.dataset.commentId);
                }
            });
        });

        // Cancel edit comment
        var cancelEditCommentBtn = this.querySelector('#nd-cancel-edit-comment');
        if (cancelEditCommentBtn) {
            cancelEditCommentBtn.addEventListener('click', function() {
                self.state.editingCommentId = null;
                self.render();
            });
        }

        // Save edit comment
        var saveEditCommentBtn = this.querySelector('#nd-save-edit-comment');
        if (saveEditCommentBtn) {
            saveEditCommentBtn.addEventListener('click', function() {
                var textarea = self.querySelector('#nd-edit-comment-input');
                var text = textarea ? textarea.value : '';
                var commentId = saveEditCommentBtn.dataset.commentId;
                if (text.trim() && commentId) {
                    self.updateComment(commentId, text);
                }
            });
        }
    };

    // Save description
    NodeDetail.prototype.saveDescription = async function(newDescription) {
        try {
            var response = await this.graphService.updateNode(this.state.label, {
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

    // Add a new comment
    NodeDetail.prototype.addComment = async function(text) {
        try {
            // PATCH workaround: send full properties object
            var properties = Object.assign({}, this.state.node.properties || {});
            var comments = properties.comments || [];

            var newComment = {
                id: generateUUID(),
                author: 'human',
                text: text,
                created_at: Date.now()
            };
            comments.push(newComment);
            properties.comments = comments;

            var response = await this.graphService.updateNode(this.state.label, { properties: properties });

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

    // Update an existing comment
    NodeDetail.prototype.updateComment = async function(commentId, newText) {
        try {
            var properties = Object.assign({}, this.state.node.properties || {});
            var comments = properties.comments || [];

            var commentIndex = comments.findIndex(function(c) { return c.id === commentId; });
            if (commentIndex === -1) {
                alert('Comment not found');
                return;
            }

            comments[commentIndex] = Object.assign({}, comments[commentIndex], {
                text: newText,
                updated_at: Date.now()
            });
            properties.comments = comments;

            var response = await this.graphService.updateNode(this.state.label, { properties: properties });

            if (response.success) {
                this.state.node = response.node;
                this.state.editingCommentId = null;
                this.render();
            }
        } catch (error) {
            alert('Failed to update comment: ' + error.message);
        }
    };

    // Delete a comment
    NodeDetail.prototype.deleteComment = async function(commentId) {
        try {
            var properties = Object.assign({}, this.state.node.properties || {});
            var comments = properties.comments || [];

            var newComments = comments.filter(function(c) { return c.id !== commentId; });
            properties.comments = newComments;

            var response = await this.graphService.updateNode(this.state.label, { properties: properties });

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

    // Override getStyles
    NodeDetail.prototype.getStyles = function() {
        var baseStyles = _originalGetStyles.call(this);

        var v013Styles = '\
            /* Task-4: Edit/Preview toggle */ \
            .nd-edit-toggle { \
                display: inline-flex; \
                margin-left: auto; \
                background: #252836; \
                border-radius: 4px; \
                overflow: hidden; \
            } \
            .nd-toggle-btn { \
                background: transparent; \
                border: none; \
                color: #8a9cc4; \
                padding: 4px 12px; \
                font-size: 11px; \
                cursor: pointer; \
                transition: all 0.2s; \
            } \
            .nd-toggle-btn.active { \
                background: #667eea; \
                color: white; \
            } \
            .nd-toggle-btn:hover:not(.active) { \
                background: rgba(102, 126, 234, 0.2); \
            } \
            .nd-description-edit { \
                background: #252836; \
                border-radius: 6px; \
                padding: 12px; \
            } \
            .nd-description-textarea { \
                width: 100%; \
                min-height: 200px; \
                padding: 12px; \
                border: 1px solid #3a4f6f; \
                border-radius: 4px; \
                background: #1a1a2e; \
                color: #e0e0e0; \
                font-size: 13px; \
                font-family: inherit; \
                line-height: 1.6; \
                resize: vertical; \
                box-sizing: border-box; \
            } \
            .nd-description-textarea:focus { \
                outline: none; \
                border-color: #667eea; \
            } \
            .nd-edit-actions { \
                display: flex; \
                justify-content: flex-end; \
                gap: 8px; \
                margin-top: 12px; \
            } \
            /* Task-3: Comments */ \
            .nd-comments { \
                background: #252836; \
                border-radius: 6px; \
                padding: 12px; \
            } \
            .nd-comment-form { \
                margin-bottom: 16px; \
                padding-bottom: 16px; \
                border-bottom: 1px solid #3a4f6f; \
            } \
            .nd-comment-textarea { \
                width: 100%; \
                min-height: 80px; \
                padding: 10px; \
                border: 1px solid #3a4f6f; \
                border-radius: 4px; \
                background: #1a1a2e; \
                color: #e0e0e0; \
                font-size: 13px; \
                font-family: inherit; \
                resize: vertical; \
                box-sizing: border-box; \
            } \
            .nd-comment-textarea:focus { \
                outline: none; \
                border-color: #667eea; \
            } \
            .nd-comment-form-actions { \
                display: flex; \
                justify-content: flex-end; \
                gap: 8px; \
                margin-top: 8px; \
            } \
            .nd-comment { \
                padding: 12px 0; \
                border-bottom: 1px solid #2a3f5f; \
            } \
            .nd-comment:last-child { \
                border-bottom: none; \
            } \
            .nd-comment-header { \
                display: flex; \
                align-items: center; \
                gap: 8px; \
                margin-bottom: 8px; \
            } \
            .nd-comment-author { \
                font-weight: 600; \
                font-size: 12px; \
                color: #e0e0e0; \
            } \
            .nd-comment-time { \
                font-size: 11px; \
                color: #6a7a8a; \
            } \
            .nd-comment-actions { \
                margin-left: auto; \
                display: flex; \
                gap: 4px; \
                opacity: 0; \
                transition: opacity 0.2s; \
            } \
            .nd-comment:hover .nd-comment-actions { \
                opacity: 1; \
            } \
            .nd-comment-edit, \
            .nd-comment-delete { \
                background: none; \
                border: none; \
                color: #6a7a8a; \
                cursor: pointer; \
                padding: 2px 6px; \
                font-size: 12px; \
                border-radius: 3px; \
            } \
            .nd-comment-edit:hover { \
                background: rgba(102, 126, 234, 0.2); \
                color: #667eea; \
            } \
            .nd-comment-delete:hover { \
                background: rgba(239, 68, 68, 0.2); \
                color: #ef4444; \
            } \
            .nd-comment-body { \
                font-size: 13px; \
                line-height: 1.6; \
                color: #c0c0c0; \
            } \
            .nd-comment-body p { \
                margin: 0 0 8px 0; \
            } \
            .nd-comment-body p:last-child { \
                margin-bottom: 0; \
            } \
            .nd-comment-edit-form { \
                margin-top: 8px; \
            } \
            .nd-no-comments { \
                text-align: center; \
                color: #6a7a8a; \
                padding: 20px; \
                font-size: 13px; \
            } \
            .nd-section h3 { \
                display: flex; \
                align-items: center; \
            } \
            /* Scroll fix for main content */ \
            .node-detail { \
                height: 100%; \
                display: flex; \
                flex-direction: column; \
                overflow: hidden; \
            } \
            .nd-content { \
                flex: 1 1 0; \
                min-height: 0; \
                display: flex; \
                overflow: hidden; \
            } \
            .nd-main { \
                flex: 1; \
                overflow-y: auto; \
                overflow-x: hidden; \
                padding: 24px; \
            } \
            .nd-sidebar { \
                width: 280px; \
                overflow-y: auto; \
                flex-shrink: 0; \
            } \
        ';

        return baseStyles + v013Styles;
    };

    console.log('[Issues UI v0.1.3] Node Detail with markdown toggle and comments enabled');

})();
