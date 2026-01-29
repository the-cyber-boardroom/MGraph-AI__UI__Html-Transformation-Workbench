/**
 * Transform Config Component
 *
 * Purpose: Dynamic form generation for transform configuration
 * Story: S3
 * Version: v0.1.0
 *
 * Used by: HTML Workbench (M3), Profile Manager (M4)
 */

// Transform Types Registry
const TRANSFORM_TYPES = {
    'remove-elements': {
        name: 'Remove Elements',
        description: 'Remove HTML elements matching CSS selectors',
        category: 'structure',
        params: [
            {
                name: 'selectors',
                type: 'textarea',
                label: 'CSS Selectors (one per line)',
                placeholder: '.ad\n.banner\n[data-ad]',
                required: true,
                parse: (val) => val.split('\n').map(s => s.trim()).filter(Boolean)
            },
            {
                name: 'remove_children',
                type: 'checkbox',
                label: 'Remove element and all children',
                default: true
            },
            {
                name: 'leave_comment',
                type: 'checkbox',
                label: 'Replace with placeholder comment',
                default: false
            }
        ]
    },

    'sentiment-filter': {
        name: 'Sentiment Filter',
        description: 'Remove content with negative sentiment using LLM analysis',
        category: 'content',
        params: [
            {
                name: 'threshold',
                type: 'range',
                label: 'Negativity Threshold',
                min: 0,
                max: 1,
                step: 0.1,
                default: 0.4,
                description: '0.0 = keep all, 1.0 = remove all negative'
            },
            {
                name: 'target_elements',
                type: 'checkbox-group',
                label: 'Target Elements',
                options: [
                    { value: 'p', label: 'Paragraphs (<p>)', default: true },
                    { value: '.comment,.reply', label: 'Comments (.comment, .reply)', default: true },
                    { value: 'h1,h2,h3,h4,h5,h6', label: 'Headings (<h1>-<h6>)', default: false },
                    { value: 'li', label: 'List items (<li>)', default: false }
                ]
            },
            {
                name: 'action',
                type: 'radio',
                label: 'Action',
                options: [
                    { value: 'remove', label: 'Remove element', default: true },
                    { value: 'blur', label: 'Blur/fade content' },
                    { value: 'warn', label: 'Add warning label' }
                ]
            }
        ]
    },

    'simplify': {
        name: 'Simplify HTML',
        description: 'Remove scripts, styles, and simplify structure',
        category: 'structure',
        params: [
            {
                name: 'remove_scripts',
                type: 'checkbox',
                label: 'Remove <script> tags',
                default: true
            },
            {
                name: 'remove_styles',
                type: 'checkbox',
                label: 'Remove <style> tags and inline styles',
                default: true
            },
            {
                name: 'remove_comments',
                type: 'checkbox',
                label: 'Remove HTML comments',
                default: true
            },
            {
                name: 'flatten_divs',
                type: 'checkbox',
                label: 'Flatten nested empty divs',
                default: false
            }
        ]
    },

    'topic-filter': {
        name: 'Topic Filter',
        description: 'Keep or remove content based on topic relevance',
        category: 'content',
        params: [
            {
                name: 'topics',
                type: 'tags',
                label: 'Topics',
                placeholder: 'Enter topics...',
                required: true
            },
            {
                name: 'mode',
                type: 'radio',
                label: 'Mode',
                options: [
                    { value: 'keep', label: 'Keep only matching topics', default: true },
                    { value: 'remove', label: 'Remove matching topics' }
                ]
            },
            {
                name: 'threshold',
                type: 'range',
                label: 'Match Threshold',
                min: 0,
                max: 1,
                step: 0.1,
                default: 0.5
            }
        ]
    },

    'extract-content': {
        name: 'Extract Content',
        description: 'Extract main content, remove boilerplate',
        category: 'structure',
        params: [
            {
                name: 'auto_detect',
                type: 'checkbox',
                label: 'Auto-detect main content',
                default: true
            },
            {
                name: 'selector',
                type: 'text',
                label: 'CSS Selector (if not auto)',
                placeholder: 'article, main, .content',
                condition: { param: 'auto_detect', value: false }
            },
            {
                name: 'keep_images',
                type: 'checkbox',
                label: 'Keep images',
                default: true
            },
            {
                name: 'keep_links',
                type: 'checkbox',
                label: 'Keep links',
                default: true
            }
        ]
    },

    'blur-images': {
        name: 'Blur Images',
        description: 'Apply blur effect to images',
        category: 'visual',
        params: [
            {
                name: 'blur_amount',
                type: 'range',
                label: 'Blur Amount (px)',
                min: 1,
                max: 20,
                step: 1,
                default: 5
            },
            {
                name: 'selector',
                type: 'text',
                label: 'Image Selector',
                placeholder: 'img (all images)',
                default: 'img'
            }
        ]
    }
};

class TransformConfig extends HTMLElement {

    static get observedAttributes() {
        return ['transform-type', 'readonly'];
    }

    static getAvailableTypes() {
        return Object.keys(TRANSFORM_TYPES);
    }

    static getTypesByCategory(category) {
        return Object.entries(TRANSFORM_TYPES)
            .filter(([_, config]) => config.category === category)
            .map(([type]) => type);
    }

    static getTypeInfo(type) {
        return TRANSFORM_TYPES[type];
    }

    constructor() {
        super();
        this._config = {};
        this._tags = {};
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {}

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal && name === 'transform-type') {
            this.render();
        }
    }

    get transformType() { return this.getAttribute('transform-type'); }
    set transformType(val) { this.setAttribute('transform-type', val); }

    get readonly() { return this.hasAttribute('readonly'); }
    set readonly(val) {
        if (val) this.setAttribute('readonly', '');
        else this.removeAttribute('readonly');
    }

    get value() { return this._config; }
    set value(config) {
        this._config = config || {};
        if (config && config.params) {
            // Extract tags from params
            const typeConfig = TRANSFORM_TYPES[this.transformType];
            if (typeConfig) {
                typeConfig.params.forEach(param => {
                    if (param.type === 'tags' && config.params[param.name]) {
                        this._tags[param.name] = [...config.params[param.name]];
                    }
                });
            }
        }
        this.populateForm();
    }

    setTransformType(type) {
        this.transformType = type;
        this.render();
    }

    setConfig(config) {
        this.value = config;
    }

    getConfig() {
        return this.buildConfig();
    }

    render() {
        const type = this.transformType;
        const config = TRANSFORM_TYPES[type];

        if (!type) {
            this.innerHTML = `
                <style>${this.getStyles()}</style>
                <div class="transform-config tc-empty">
                    <p>Select a transform type to configure</p>
                </div>
            `;
            return;
        }

        if (!config) {
            this.innerHTML = `
                <style>${this.getStyles()}</style>
                <div class="transform-config tc-error">
                    <p>Unknown transform type: ${this.escapeHtml(type)}</p>
                </div>
            `;
            return;
        }

        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="transform-config">
                <div class="tc-header">
                    <h3>Configure Transform: ${config.name}</h3>
                    <p class="tc-description">${config.description}</p>
                    <span class="tc-category">${config.category}</span>
                </div>

                <div class="tc-form">
                    ${config.params.map(param => this.renderParam(param)).join('')}
                </div>

                <div class="tc-preview">
                    <h4>Preview:</h4>
                    <pre class="tc-json" id="tc-preview-json">${this.getPreviewJson()}</pre>
                </div>

                ${!this.readonly ? `
                    <div class="tc-actions">
                        <button class="tc-cancel" id="tc-cancel-btn">Cancel</button>
                        <button class="tc-save primary" id="tc-save-btn">Save Transform</button>
                    </div>
                ` : ''}
            </div>
        `;

        this.bindFormEvents();
        this.populateForm();
        this.updateConditionalFields();
    }

    renderParam(param) {
        const conditionAttr = param.condition
            ? `data-condition-param="${param.condition.param}" data-condition-value="${param.condition.value}"`
            : '';

        switch (param.type) {
            case 'text':
                return this.renderTextInput(param, conditionAttr);
            case 'textarea':
                return this.renderTextarea(param, conditionAttr);
            case 'checkbox':
                return this.renderCheckbox(param, conditionAttr);
            case 'checkbox-group':
                return this.renderCheckboxGroup(param, conditionAttr);
            case 'radio':
                return this.renderRadioGroup(param, conditionAttr);
            case 'range':
                return this.renderRange(param, conditionAttr);
            case 'tags':
                return this.renderTagsInput(param, conditionAttr);
            default:
                return `<p>Unknown param type: ${param.type}</p>`;
        }
    }

    renderTextInput(param, conditionAttr) {
        return `
            <div class="tc-field" data-param="${param.name}" ${conditionAttr}>
                <label for="tc-${param.name}">${param.label}${param.required ? ' *' : ''}</label>
                <input type="text"
                    id="tc-${param.name}"
                    name="${param.name}"
                    placeholder="${param.placeholder || ''}"
                    ${this.readonly ? 'disabled' : ''}>
                ${param.description ? `<p class="tc-field-desc">${param.description}</p>` : ''}
            </div>
        `;
    }

    renderTextarea(param, conditionAttr) {
        return `
            <div class="tc-field" data-param="${param.name}" ${conditionAttr}>
                <label for="tc-${param.name}">${param.label}${param.required ? ' *' : ''}</label>
                <textarea
                    id="tc-${param.name}"
                    name="${param.name}"
                    placeholder="${param.placeholder || ''}"
                    ${this.readonly ? 'disabled' : ''}></textarea>
                ${param.description ? `<p class="tc-field-desc">${param.description}</p>` : ''}
            </div>
        `;
    }

    renderCheckbox(param, conditionAttr) {
        return `
            <div class="tc-field tc-checkbox-field" data-param="${param.name}" ${conditionAttr}>
                <label>
                    <input type="checkbox"
                        id="tc-${param.name}"
                        name="${param.name}"
                        ${param.default ? 'checked' : ''}
                        ${this.readonly ? 'disabled' : ''}>
                    ${param.label}
                </label>
                ${param.description ? `<p class="tc-field-desc">${param.description}</p>` : ''}
            </div>
        `;
    }

    renderCheckboxGroup(param, conditionAttr) {
        return `
            <div class="tc-field" data-param="${param.name}" ${conditionAttr}>
                <label>${param.label}${param.required ? ' *' : ''}</label>
                <div class="tc-checkbox-group">
                    ${param.options.map(opt => `
                        <label>
                            <input type="checkbox"
                                name="${param.name}"
                                value="${opt.value}"
                                ${opt.default ? 'checked' : ''}
                                ${this.readonly ? 'disabled' : ''}>
                            ${opt.label}
                        </label>
                    `).join('')}
                </div>
                ${param.description ? `<p class="tc-field-desc">${param.description}</p>` : ''}
            </div>
        `;
    }

    renderRadioGroup(param, conditionAttr) {
        return `
            <div class="tc-field" data-param="${param.name}" ${conditionAttr}>
                <label>${param.label}${param.required ? ' *' : ''}</label>
                <div class="tc-radio-group">
                    ${param.options.map(opt => `
                        <label>
                            <input type="radio"
                                name="${param.name}"
                                value="${opt.value}"
                                ${opt.default ? 'checked' : ''}
                                ${this.readonly ? 'disabled' : ''}>
                            ${opt.label}
                        </label>
                    `).join('')}
                </div>
                ${param.description ? `<p class="tc-field-desc">${param.description}</p>` : ''}
            </div>
        `;
    }

    renderRange(param, conditionAttr) {
        const defaultVal = param.default !== undefined ? param.default : param.min;
        return `
            <div class="tc-field" data-param="${param.name}" ${conditionAttr}>
                <label for="tc-${param.name}">${param.label}</label>
                <div class="tc-range-wrapper">
                    <input type="range"
                        id="tc-${param.name}"
                        name="${param.name}"
                        min="${param.min}"
                        max="${param.max}"
                        step="${param.step}"
                        value="${defaultVal}"
                        ${this.readonly ? 'disabled' : ''}>
                    <span class="tc-range-value" id="tc-${param.name}-value">${defaultVal}</span>
                </div>
                ${param.description ? `<p class="tc-field-desc">${param.description}</p>` : ''}
            </div>
        `;
    }

    renderTagsInput(param, conditionAttr) {
        if (!this._tags[param.name]) {
            this._tags[param.name] = [];
        }
        return `
            <div class="tc-field" data-param="${param.name}" ${conditionAttr}>
                <label>${param.label}${param.required ? ' *' : ''}</label>
                <div class="tc-tags" id="tc-${param.name}-tags">
                    ${this._tags[param.name].map(tag => `
                        <span class="tc-tag">
                            ${this.escapeHtml(tag)}
                            <span class="tc-tag-remove" data-tag="${this.escapeHtml(tag)}">&times;</span>
                        </span>
                    `).join('')}
                    <input type="text"
                        class="tc-tag-input"
                        id="tc-${param.name}"
                        placeholder="${param.placeholder || 'Type and press Enter'}"
                        ${this.readonly ? 'disabled' : ''}>
                </div>
                ${param.description ? `<p class="tc-field-desc">${param.description}</p>` : ''}
            </div>
        `;
    }

    bindFormEvents() {
        // Save button
        const saveBtn = this.querySelector('#tc-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        // Cancel button
        const cancelBtn = this.querySelector('#tc-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }

        // Form changes
        this.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('change', () => this.handleChange());
            input.addEventListener('input', () => this.handleChange());
        });

        // Range value display updates
        this.querySelectorAll('input[type="range"]').forEach(range => {
            range.addEventListener('input', (e) => {
                const valueDisplay = this.querySelector(`#${range.id}-value`);
                if (valueDisplay) {
                    valueDisplay.textContent = e.target.value;
                }
            });
        });

        // Tags input
        this.querySelectorAll('.tc-tag-input').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    e.preventDefault();
                    const paramName = e.target.id.replace('tc-', '');
                    this.addTag(paramName, e.target.value.trim());
                    e.target.value = '';
                }
            });
        });

        // Tag remove buttons
        this.querySelectorAll('.tc-tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tag = e.target.dataset.tag;
                const field = e.target.closest('.tc-field');
                const paramName = field.dataset.param;
                this.removeTag(paramName, tag);
            });
        });

        // Conditional field updates
        this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateConditionalFields());
        });
    }

    addTag(paramName, tag) {
        if (!this._tags[paramName]) {
            this._tags[paramName] = [];
        }
        if (!this._tags[paramName].includes(tag)) {
            this._tags[paramName].push(tag);
            this.renderTags(paramName);
            this.handleChange();
        }
    }

    removeTag(paramName, tag) {
        if (this._tags[paramName]) {
            this._tags[paramName] = this._tags[paramName].filter(t => t !== tag);
            this.renderTags(paramName);
            this.handleChange();
        }
    }

    renderTags(paramName) {
        const container = this.querySelector(`#tc-${paramName}-tags`);
        if (!container) return;

        const input = container.querySelector('.tc-tag-input');
        const tags = this._tags[paramName] || [];

        // Remove existing tag spans
        container.querySelectorAll('.tc-tag').forEach(el => el.remove());

        // Add new tags before input
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tc-tag';
            span.innerHTML = `
                ${this.escapeHtml(tag)}
                <span class="tc-tag-remove" data-tag="${this.escapeHtml(tag)}">&times;</span>
            `;
            span.querySelector('.tc-tag-remove').addEventListener('click', () => {
                this.removeTag(paramName, tag);
            });
            container.insertBefore(span, input);
        });
    }

    updateConditionalFields() {
        this.querySelectorAll('[data-condition-param]').forEach(field => {
            const condParam = field.dataset.conditionParam;
            const condValue = field.dataset.conditionValue;
            const checkInput = this.querySelector(`#tc-${condParam}`);

            if (checkInput) {
                const currentValue = checkInput.type === 'checkbox'
                    ? checkInput.checked
                    : checkInput.value;
                const shouldShow = String(currentValue) === condValue;
                field.style.display = shouldShow ? '' : 'none';
            }
        });
    }

    populateForm() {
        if (!this._config || !this._config.params) return;

        const typeConfig = TRANSFORM_TYPES[this.transformType];
        if (!typeConfig) return;

        typeConfig.params.forEach(param => {
            const value = this._config.params[param.name];
            if (value === undefined) return;

            const input = this.querySelector(`#tc-${param.name}`);
            if (!input) return;

            switch (param.type) {
                case 'text':
                    input.value = value;
                    break;
                case 'textarea':
                    input.value = Array.isArray(value) ? value.join('\n') : value;
                    break;
                case 'checkbox':
                    input.checked = value;
                    break;
                case 'range':
                    input.value = value;
                    const valueDisplay = this.querySelector(`#tc-${param.name}-value`);
                    if (valueDisplay) valueDisplay.textContent = value;
                    break;
                case 'checkbox-group':
                    const checkboxes = this.querySelectorAll(`input[name="${param.name}"]`);
                    checkboxes.forEach(cb => {
                        cb.checked = Array.isArray(value) && value.includes(cb.value);
                    });
                    break;
                case 'radio':
                    const radio = this.querySelector(`input[name="${param.name}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                    break;
            }
        });

        this.updateConditionalFields();
        this.updatePreview();
    }

    buildConfig() {
        const type = this.transformType;
        const typeConfig = TRANSFORM_TYPES[type];
        if (!typeConfig) return null;

        const params = {};

        typeConfig.params.forEach(param => {
            const value = this.getParamValue(param.name, param);
            if (value !== undefined) {
                params[param.name] = value;
            }
        });

        return {
            type,
            params
        };
    }

    getParamValue(paramName, paramConfig) {
        const input = this.querySelector(`#tc-${paramName}`);

        switch (paramConfig.type) {
            case 'text':
                return input ? input.value : paramConfig.default || '';

            case 'textarea':
                if (!input) return [];
                const textVal = input.value;
                if (paramConfig.parse) {
                    return paramConfig.parse(textVal);
                }
                return textVal;

            case 'checkbox':
                return input ? input.checked : paramConfig.default || false;

            case 'range':
                return input ? parseFloat(input.value) : paramConfig.default;

            case 'checkbox-group':
                const checked = this.querySelectorAll(`input[name="${paramName}"]:checked`);
                return Array.from(checked).map(cb => cb.value);

            case 'radio':
                const selectedRadio = this.querySelector(`input[name="${paramName}"]:checked`);
                return selectedRadio ? selectedRadio.value : null;

            case 'tags':
                return this._tags[paramName] || [];

            default:
                return undefined;
        }
    }

    getPreviewJson() {
        const config = this.buildConfig();
        return this.escapeHtml(JSON.stringify(config, null, 2));
    }

    updatePreview() {
        const previewEl = this.querySelector('#tc-preview-json');
        if (previewEl) {
            previewEl.textContent = JSON.stringify(this.buildConfig(), null, 2);
        }
    }

    validate() {
        const typeConfig = TRANSFORM_TYPES[this.transformType];
        if (!typeConfig) {
            return { valid: false, errors: [{ message: 'Invalid transform type' }] };
        }

        const errors = [];

        for (const param of typeConfig.params) {
            // Skip conditional fields that aren't visible
            const field = this.querySelector(`[data-param="${param.name}"]`);
            if (field && field.style.display === 'none') continue;

            const value = this.getParamValue(param.name, param);

            // Required check
            if (param.required) {
                const isEmpty = value === undefined ||
                    value === '' ||
                    (Array.isArray(value) && value.length === 0);

                if (isEmpty) {
                    errors.push({
                        param: param.name,
                        message: `${param.label} is required`
                    });
                }
            }

            // Range min/max check
            if (param.type === 'range' && value !== undefined) {
                if (value < param.min || value > param.max) {
                    errors.push({
                        param: param.name,
                        message: `${param.label} must be between ${param.min} and ${param.max}`
                    });
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    reset() {
        const typeConfig = TRANSFORM_TYPES[this.transformType];
        if (!typeConfig) return;

        this._config = {};
        this._tags = {};

        typeConfig.params.forEach(param => {
            if (param.type === 'tags') {
                this._tags[param.name] = [];
            }
        });

        this.render();
    }

    handleChange() {
        this.updatePreview();
        this.dispatchEvent(new CustomEvent('change', {
            detail: { config: this.buildConfig() }
        }));
    }

    handleSave() {
        const validation = this.validate();

        if (!validation.valid) {
            this.showErrors(validation.errors);
            return;
        }

        this.dispatchEvent(new CustomEvent('save', {
            detail: { config: this.buildConfig() }
        }));
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    showErrors(errors) {
        // Clear previous errors
        this.querySelectorAll('.tc-error-msg').forEach(el => el.remove());

        errors.forEach(error => {
            const field = this.querySelector(`[data-param="${error.param}"]`);
            if (field) {
                const errorEl = document.createElement('p');
                errorEl.className = 'tc-error-msg';
                errorEl.textContent = error.message;
                field.appendChild(errorEl);
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getStyles() {
        return `
            transform-config {
                display: block;
            }

            .transform-config {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .transform-config.tc-empty,
            .transform-config.tc-error {
                padding: 40px;
                text-align: center;
                color: #666;
            }

            .tc-header {
                padding: 15px 20px;
                background: #f5f5f5;
                border-bottom: 1px solid #ddd;
                position: relative;
            }

            .tc-header h3 {
                margin: 0 0 5px 0;
                font-size: 16px;
                color: #333;
            }

            .tc-description {
                margin: 0;
                color: #666;
                font-size: 13px;
            }

            .tc-category {
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 11px;
                text-transform: uppercase;
                background: #e3f2fd;
                color: #1976d2;
                padding: 3px 8px;
                border-radius: 3px;
            }

            .tc-form {
                padding: 20px;
            }

            .tc-field {
                margin-bottom: 20px;
            }

            .tc-field:last-child {
                margin-bottom: 0;
            }

            .tc-field > label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                font-size: 13px;
                color: #333;
            }

            .tc-field input[type="text"],
            .tc-field textarea {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                font-family: inherit;
                box-sizing: border-box;
            }

            .tc-field input[type="text"]:focus,
            .tc-field textarea:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .tc-field textarea {
                min-height: 100px;
                font-family: 'SF Mono', Monaco, monospace;
                font-size: 13px;
                resize: vertical;
            }

            .tc-checkbox-field label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-weight: normal;
            }

            .tc-checkbox-group,
            .tc-radio-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 10px;
                background: #f9f9f9;
                border-radius: 6px;
            }

            .tc-checkbox-group label,
            .tc-radio-group label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: normal;
                cursor: pointer;
                font-size: 13px;
            }

            .tc-range-wrapper {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .tc-range-wrapper input[type="range"] {
                flex: 1;
                height: 6px;
                -webkit-appearance: none;
                background: #ddd;
                border-radius: 3px;
            }

            .tc-range-wrapper input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                background: #667eea;
                border-radius: 50%;
                cursor: pointer;
            }

            .tc-range-value {
                min-width: 50px;
                text-align: right;
                font-weight: 600;
                color: #667eea;
            }

            .tc-field-desc {
                margin: 6px 0 0;
                font-size: 12px;
                color: #888;
            }

            .tc-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 6px;
                min-height: 44px;
                background: #fff;
            }

            .tc-tags:focus-within {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .tc-tag {
                display: flex;
                align-items: center;
                gap: 6px;
                background: #e3f2fd;
                color: #1976d2;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 13px;
            }

            .tc-tag-remove {
                cursor: pointer;
                color: #666;
                font-size: 16px;
                line-height: 1;
            }

            .tc-tag-remove:hover {
                color: #f44336;
            }

            .tc-tags input {
                flex: 1;
                min-width: 120px;
                border: none;
                outline: none;
                font-size: 14px;
                padding: 4px;
            }

            .tc-preview {
                padding: 15px 20px;
                background: #f9f9f9;
                border-top: 1px solid #eee;
            }

            .tc-preview h4 {
                margin: 0 0 10px 0;
                font-size: 11px;
                text-transform: uppercase;
                color: #666;
                letter-spacing: 0.5px;
            }

            .tc-json {
                margin: 0;
                background: #282c34;
                color: #abb2bf;
                padding: 12px;
                border-radius: 6px;
                font-size: 12px;
                font-family: 'SF Mono', Monaco, monospace;
                overflow-x: auto;
                white-space: pre;
            }

            .tc-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 15px 20px;
                background: #f5f5f5;
                border-top: 1px solid #ddd;
            }

            .tc-actions button {
                padding: 10px 20px;
                border: 1px solid #ddd;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                background: #fff;
                transition: all 0.15s ease;
            }

            .tc-actions button:hover {
                background: #f5f5f5;
            }

            .tc-actions button.primary {
                background: #4CAF50;
                color: white;
                border-color: #4CAF50;
            }

            .tc-actions button.primary:hover {
                background: #43a047;
            }

            .tc-error-msg {
                margin: 6px 0 0;
                color: #f44336;
                font-size: 12px;
            }
        `;
    }
}

customElements.define('transform-config', TransformConfig);
