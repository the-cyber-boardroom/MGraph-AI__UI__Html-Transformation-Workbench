/**
 * Profile Manager Mini App
 *
 * Purpose: Create, edit, delete, and manage transformation profiles
 * Story: M4
 * Version: v0.1.0
 */

const TRANSFORM_TYPES = [
    {
        type: 'remove-elements',
        name: 'Remove Elements',
        description: 'Remove elements matching CSS selector',
        params: [
            { name: 'selector', type: 'text', label: 'CSS Selector', required: true, default: '.ad, .banner' }
        ]
    },
    {
        type: 'remove-scripts',
        name: 'Remove Scripts',
        description: 'Remove all <script> tags',
        params: []
    },
    {
        type: 'remove-styles',
        name: 'Remove Styles',
        description: 'Remove all styles and CSS',
        params: []
    },
    {
        type: 'blur-images',
        name: 'Blur Images',
        description: 'Apply blur filter to images',
        params: [
            { name: 'amount', type: 'text', label: 'Blur Amount', default: '5px' }
        ]
    },
    {
        type: 'simplify',
        name: 'Simplify HTML',
        description: 'Remove unnecessary elements and flatten structure',
        params: [
            { name: 'remove_comments', type: 'checkbox', label: 'Remove Comments', default: true },
            { name: 'remove_empty', type: 'checkbox', label: 'Remove Empty Elements', default: true }
        ]
    }
];

class ProfileManager extends HTMLElement {

    static get appId()    { return 'profile-manager'; }
    static get navLabel() { return 'Profiles'; }
    static get navIcon()  { return '📋'; }

    constructor() {
        super();
        this.state = {
            profiles: [],
            loading: false,
            search: '',
            editingProfile: null
        };
    }

    connectedCallback() {
        this.render();
        this.loadProfiles();
    }

    disconnectedCallback() {}

    onActivate() {
        this.loadProfiles();
    }

    onDeactivate() {}

    render() {
        this.innerHTML = `
            <style>
                .profile-manager {
                    display: flex;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .pm-sidebar {
                    width: 320px;
                    border-right: 1px solid #e0e0e0;
                    display: flex;
                    flex-direction: column;
                    background: #f8f9fa;
                }
                .pm-sidebar-header {
                    padding: 16px;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    gap: 8px;
                }
                .pm-search {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 13px;
                }
                .pm-search:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .pm-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                .pm-btn-primary {
                    background: #667eea;
                    color: white;
                }
                .pm-btn-primary:hover {
                    background: #5a6fd6;
                }
                .pm-btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .pm-btn-secondary:hover {
                    background: #e0e0e0;
                }
                .pm-btn-danger {
                    background: #ffebee;
                    color: #c62828;
                }
                .pm-btn-danger:hover {
                    background: #ffcdd2;
                }
                .pm-btn-icon {
                    padding: 8px;
                    min-width: auto;
                }
                .pm-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                }
                .pm-profile-item {
                    padding: 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .pm-profile-item:hover {
                    border-color: #667eea;
                }
                .pm-profile-item.active {
                    border-color: #667eea;
                    background: #f0f4ff;
                }
                .pm-profile-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .pm-profile-name {
                    font-weight: 600;
                    color: #333;
                }
                .pm-profile-actions {
                    display: flex;
                    gap: 4px;
                }
                .pm-profile-meta {
                    font-size: 11px;
                    color: #888;
                    margin-top: 4px;
                }
                .pm-profile-tags {
                    display: flex;
                    gap: 4px;
                    margin-top: 6px;
                    flex-wrap: wrap;
                }
                .pm-tag {
                    font-size: 10px;
                    background: #e8e8e8;
                    color: #555;
                    padding: 2px 8px;
                    border-radius: 10px;
                }
                .pm-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .pm-editor {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }
                .pm-editor-empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #888;
                }
                .pm-form-group {
                    margin-bottom: 20px;
                }
                .pm-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 500;
                    color: #666;
                    margin-bottom: 6px;
                }
                .pm-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: inherit;
                    box-sizing: border-box;
                }
                .pm-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .pm-textarea {
                    min-height: 80px;
                    resize: vertical;
                }
                .pm-transforms-section {
                    margin-top: 24px;
                }
                .pm-section-title {
                    font-weight: 600;
                    font-size: 14px;
                    color: #333;
                    margin-bottom: 12px;
                }
                .pm-transform-list {
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .pm-transform-item {
                    padding: 12px;
                    border-bottom: 1px solid #e0e0e0;
                    background: #fafafa;
                }
                .pm-transform-item:last-child {
                    border-bottom: none;
                }
                .pm-transform-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .pm-transform-name {
                    font-weight: 500;
                    color: #333;
                }
                .pm-transform-actions {
                    display: flex;
                    gap: 4px;
                }
                .pm-transform-params {
                    margin-top: 8px;
                    padding: 8px;
                    background: white;
                    border-radius: 4px;
                }
                .pm-transform-param {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    margin-bottom: 4px;
                }
                .pm-transform-param:last-child {
                    margin-bottom: 0;
                }
                .pm-transform-param-label {
                    font-size: 12px;
                    color: #666;
                    width: 100px;
                }
                .pm-transform-param-input {
                    flex: 1;
                    padding: 6px 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .pm-add-transform {
                    padding: 12px;
                    display: flex;
                    gap: 8px;
                }
                .pm-footer {
                    padding: 16px 24px;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    gap: 8px;
                    background: #f8f9fa;
                }
                .pm-empty {
                    text-align: center;
                    padding: 40px;
                    color: #888;
                }
                .pm-toast {
                    position: fixed;
                    bottom: 60px;
                    right: 20px;
                    background: #333;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 13px;
                    z-index: 1000;
                }
            </style>
            <div class="profile-manager">
                <div class="pm-sidebar">
                    <div class="pm-sidebar-header">
                        <input type="text" class="pm-search" id="pm-search" placeholder="Search profiles..." value="${this.state.search}">
                        <button class="pm-btn pm-btn-primary" id="pm-new">+ New</button>
                    </div>
                    <div class="pm-list" id="pm-list">
                        ${this.renderProfileList()}
                    </div>
                </div>
                <div class="pm-main">
                    ${this.state.editingProfile ? this.renderEditor() : '<div class="pm-editor-empty">Select a profile or create a new one</div>'}
                </div>
            </div>
        `;
        this.bindElements();
        this.setupEventListeners();
    }

    renderProfileList() {
        const filtered = this.getFilteredProfiles();

        if (this.state.loading) {
            return '<div class="pm-empty">Loading profiles...</div>';
        }

        if (filtered.length === 0) {
            return '<div class="pm-empty">No profiles found</div>';
        }

        return filtered.map(profile => `
            <div class="pm-profile-item ${this.state.editingProfile?.profile_id === profile.profile_id ? 'active' : ''}"
                 data-id="${profile.profile_id}">
                <div class="pm-profile-header">
                    <span class="pm-profile-name">${this.escapeHtml(profile.name || profile.profile_id)}</span>
                </div>
                <div class="pm-profile-meta">${(profile.transforms || []).length} transforms</div>
                ${(profile.tags || []).length > 0 ? `
                    <div class="pm-profile-tags">
                        ${profile.tags.map(t => `<span class="pm-tag">${this.escapeHtml(t)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    renderEditor() {
        const profile = this.state.editingProfile;

        return `
            <div class="pm-editor">
                <div class="pm-form-group">
                    <label class="pm-label">Profile ID (used by MitmProxy)</label>
                    <input type="text" class="pm-input" id="pm-profile-id"
                        value="${this.escapeHtml(profile.profile_id || '')}"
                        placeholder="my-profile" ${profile.profile_id ? '' : ''}>
                </div>
                <div class="pm-form-group">
                    <label class="pm-label">Display Name</label>
                    <input type="text" class="pm-input" id="pm-name"
                        value="${this.escapeHtml(profile.name || '')}"
                        placeholder="My Profile">
                </div>
                <div class="pm-form-group">
                    <label class="pm-label">Description</label>
                    <textarea class="pm-input pm-textarea" id="pm-description"
                        placeholder="What does this profile do?">${this.escapeHtml(profile.description || '')}</textarea>
                </div>
                <div class="pm-form-group">
                    <label class="pm-label">Tags (comma-separated)</label>
                    <input type="text" class="pm-input" id="pm-tags"
                        value="${(profile.tags || []).join(', ')}"
                        placeholder="news, clean, readability">
                </div>

                <div class="pm-transforms-section">
                    <div class="pm-section-title">Transforms</div>
                    <div class="pm-transform-list" id="pm-transforms">
                        ${this.renderTransforms(profile.transforms || [])}
                        <div class="pm-add-transform">
                            <select class="pm-input" id="pm-add-transform-select" style="flex: 1;">
                                <option value="">-- Add Transform --</option>
                                ${TRANSFORM_TYPES.map(t => `<option value="${t.type}">${t.name}</option>`).join('')}
                            </select>
                            <button class="pm-btn pm-btn-secondary" id="pm-add-transform-btn">+ Add</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="pm-footer">
                <button class="pm-btn pm-btn-primary" id="pm-save">💾 Save</button>
                <button class="pm-btn pm-btn-secondary" id="pm-duplicate">📋 Duplicate</button>
                <button class="pm-btn pm-btn-danger" id="pm-delete">🗑 Delete</button>
            </div>
        `;
    }

    renderTransforms(transforms) {
        if (transforms.length === 0) {
            return '<div class="pm-empty" style="padding: 20px;">No transforms added yet</div>';
        }

        return transforms.map((transform, index) => {
            const typeDef = TRANSFORM_TYPES.find(t => t.type === transform.type);
            const name = typeDef?.name || transform.type;

            return `
                <div class="pm-transform-item" data-index="${index}">
                    <div class="pm-transform-header">
                        <span class="pm-transform-name">${index + 1}. ${name}</span>
                        <div class="pm-transform-actions">
                            <button class="pm-btn pm-btn-icon pm-btn-secondary" data-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>▲</button>
                            <button class="pm-btn pm-btn-icon pm-btn-secondary" data-action="down" data-index="${index}" ${index === transforms.length - 1 ? 'disabled' : ''}>▼</button>
                            <button class="pm-btn pm-btn-icon pm-btn-danger" data-action="remove" data-index="${index}">✕</button>
                        </div>
                    </div>
                    ${typeDef?.params.length > 0 ? `
                        <div class="pm-transform-params">
                            ${typeDef.params.map(param => `
                                <div class="pm-transform-param">
                                    <span class="pm-transform-param-label">${param.label || param.name}:</span>
                                    <input type="text" class="pm-transform-param-input"
                                        data-index="${index}" data-param="${param.name}"
                                        value="${this.escapeHtml(transform.params?.[param.name] || param.default || '')}">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getFilteredProfiles() {
        const search = this.state.search.toLowerCase();
        if (!search) return this.state.profiles;

        return this.state.profiles.filter(p =>
            (p.profile_id || '').toLowerCase().includes(search) ||
            (p.name || '').toLowerCase().includes(search) ||
            (p.tags || []).some(t => t.toLowerCase().includes(search))
        );
    }

    bindElements() {
        this.$search = this.querySelector('#pm-search');
        this.$newBtn = this.querySelector('#pm-new');
        this.$list = this.querySelector('#pm-list');
    }

    setupEventListeners() {
        this.$search.addEventListener('input', (e) => {
            this.state.search = e.target.value;
            this.$list.innerHTML = this.renderProfileList();
        });

        this.$newBtn.addEventListener('click', () => this.createNewProfile());

        this.$list.addEventListener('click', (e) => {
            const item = e.target.closest('.pm-profile-item');
            if (item) {
                this.selectProfile(item.dataset.id);
            }
        });

        // Editor events (delegated)
        this.addEventListener('click', (e) => {
            if (e.target.id === 'pm-save') {
                this.saveProfile();
            } else if (e.target.id === 'pm-duplicate') {
                this.duplicateProfile();
            } else if (e.target.id === 'pm-delete') {
                this.deleteProfile();
            } else if (e.target.id === 'pm-add-transform-btn') {
                this.addTransform();
            } else if (e.target.dataset.action === 'up') {
                this.moveTransform(parseInt(e.target.dataset.index), -1);
            } else if (e.target.dataset.action === 'down') {
                this.moveTransform(parseInt(e.target.dataset.index), 1);
            } else if (e.target.dataset.action === 'remove') {
                this.removeTransform(parseInt(e.target.dataset.index));
            }
        });

        // Transform param changes
        this.addEventListener('input', (e) => {
            if (e.target.classList.contains('pm-transform-param-input')) {
                const index = parseInt(e.target.dataset.index);
                const param = e.target.dataset.param;
                if (this.state.editingProfile?.transforms?.[index]) {
                    if (!this.state.editingProfile.transforms[index].params) {
                        this.state.editingProfile.transforms[index].params = {};
                    }
                    this.state.editingProfile.transforms[index].params[param] = e.target.value;
                }
            }
        });
    }

    async loadProfiles() {
        this.state.loading = true;
        this.$list.innerHTML = this.renderProfileList();

        try {
            const response = await this.api.htmlGraph.listProfiles(
                this.config.get('defaults.namespace')
            );
            this.state.profiles = response.profiles || [];
            this.events.emit('profile-list-loaded', { profiles: this.state.profiles });
        } catch (error) {
            console.error('Failed to load profiles:', error);
            this.state.profiles = [];
        }

        this.state.loading = false;
        this.$list.innerHTML = this.renderProfileList();
    }

    selectProfile(profileId) {
        const profile = this.state.profiles.find(p => p.profile_id === profileId);
        if (profile) {
            this.state.editingProfile = JSON.parse(JSON.stringify(profile));
            this.render();
        }
    }

    createNewProfile() {
        this.state.editingProfile = {
            profile_id: '',
            name: '',
            description: '',
            tags: [],
            transforms: []
        };
        this.render();
    }

    addTransform() {
        const select = this.querySelector('#pm-add-transform-select');
        const type = select.value;
        if (!type) return;

        const typeDef = TRANSFORM_TYPES.find(t => t.type === type);
        const newTransform = {
            type,
            params: {}
        };

        // Set defaults
        typeDef?.params.forEach(p => {
            if (p.default !== undefined) {
                newTransform.params[p.name] = p.default;
            }
        });

        this.state.editingProfile.transforms.push(newTransform);
        select.value = '';
        this.render();
    }

    moveTransform(index, direction) {
        const transforms = this.state.editingProfile.transforms;
        const newIndex = index + direction;

        if (newIndex < 0 || newIndex >= transforms.length) return;

        [transforms[index], transforms[newIndex]] = [transforms[newIndex], transforms[index]];
        this.render();
    }

    removeTransform(index) {
        this.state.editingProfile.transforms.splice(index, 1);
        this.render();
    }

    async saveProfile() {
        // Collect form values
        const profileId = this.querySelector('#pm-profile-id').value.trim();
        const name = this.querySelector('#pm-name').value.trim();
        const description = this.querySelector('#pm-description').value.trim();
        const tagsStr = this.querySelector('#pm-tags').value;
        const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);

        if (!profileId) {
            this.showToast('Profile ID is required');
            return;
        }

        // Validate profile ID
        if (!/^[a-z0-9-]+$/.test(profileId)) {
            this.showToast('Profile ID must be lowercase letters, numbers, and hyphens only');
            return;
        }

        const profile = {
            ...this.state.editingProfile,
            profile_id: profileId,
            name: name || profileId,
            description,
            tags
        };

        try {
            const response = await this.api.htmlGraph.saveProfile(
                this.config.get('defaults.namespace'),
                profileId,
                profile
            );

            if (response.success) {
                this.events.emit('profile-saved', { profileId });
                this.showToast('Profile saved');
                await this.loadProfiles();
                this.selectProfile(profileId);
            } else {
                this.showToast('Save failed: ' + (response.error || 'Unknown error'));
            }
        } catch (error) {
            this.showToast('Save failed: ' + error.message);
        }
    }

    duplicateProfile() {
        const profile = this.state.editingProfile;
        this.state.editingProfile = {
            ...JSON.parse(JSON.stringify(profile)),
            profile_id: profile.profile_id + '-copy',
            name: (profile.name || profile.profile_id) + ' (Copy)'
        };
        this.render();
    }

    async deleteProfile() {
        const profileId = this.state.editingProfile?.profile_id;
        if (!profileId) return;

        if (!confirm(`Delete profile "${profileId}"?`)) return;

        try {
            await this.api.htmlGraph.deleteProfile(
                this.config.get('defaults.namespace'),
                profileId
            );

            this.events.emit('profile-deleted', { profileId });
            this.state.editingProfile = null;
            await this.loadProfiles();
            this.render();
            this.showToast('Profile deleted');
        } catch (error) {
            this.showToast('Delete failed: ' + error.message);
        }
    }

    showToast(message) {
        const existing = this.querySelector('.pm-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'pm-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    get events() { return window.workbench.events; }
    get api() { return window.workbench.api; }
    get config() { return window.workbench.config; }
}

customElements.define('profile-manager', ProfileManager);
