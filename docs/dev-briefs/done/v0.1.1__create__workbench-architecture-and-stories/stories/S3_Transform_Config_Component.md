# Story S3: Transform Config Component

**Story ID:** S3  
**Layer:** Shared Components  
**Priority:** MEDIUM  
**Parallel With:** S1, S2  
**Dependencies:** None

---

## 1. Purpose

Create a reusable component for configuring transformation parameters. This component dynamically generates forms based on transformation type.

**You are building:**
- Dynamic form generation per transform type
- Parameter validation
- Configuration preview
- Save/cancel actions

**Used by:** HTML Workbench (M3), Profile Manager (M4)

---

## 2. UI Mockup

### Remove Elements Transform

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Configure Transform: Remove Elements                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Description: Remove HTML elements matching CSS selectors                        │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  CSS Selectors (one per line):                                            │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ .advertisement                                                      │  │  │
│  │  │ .ad-banner                                                          │  │  │
│  │  │ [data-ad]                                                           │  │  │
│  │  │ #sidebar-ads                                                        │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                           │  │
│  │  Options:                                                                 │  │
│  │  [x] Remove element and all children                                     │  │
│  │  [ ] Replace with placeholder comment                                    │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  Preview:                                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  {                                                                        │  │
│  │    "type": "remove-elements",                                             │  │
│  │    "params": {                                                            │  │
│  │      "selectors": [".advertisement", ".ad-banner", "[data-ad]", ...],    │  │
│  │      "remove_children": true,                                             │  │
│  │      "leave_comment": false                                               │  │
│  │    }                                                                      │  │
│  │  }                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│                                                    [Cancel]  [💾 Save Transform] │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Sentiment Filter Transform

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Configure Transform: Sentiment Filter                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Description: Remove content with negative sentiment using LLM analysis          │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  Negativity Threshold:                                                    │  │
│  │  ├───────────────────●───────────────────┤  0.4                          │  │
│  │  0.0 (keep all)                    1.0 (remove all negative)             │  │
│  │                                                                           │  │
│  │  Target Elements:                                                         │  │
│  │  [x] Paragraphs (<p>)                                                    │  │
│  │  [x] Comments (.comment, .reply)                                         │  │
│  │  [ ] Headings (<h1>-<h6>)                                                │  │
│  │  [ ] List items (<li>)                                                   │  │
│  │                                                                           │  │
│  │  Action:                                                                  │  │
│  │  (●) Remove element                                                      │  │
│  │  ( ) Blur/fade content                                                   │  │
│  │  ( ) Add warning label                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│                                                    [Cancel]  [💾 Save Transform] │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Interface

```javascript
class TransformConfig extends HTMLElement {
    // ═══════════════════════════════════════════════════════════════════
    // Attributes
    // ═══════════════════════════════════════════════════════════════════
    
    static get observedAttributes() {
        return ['transform-type', 'readonly'];
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Properties
    // ═══════════════════════════════════════════════════════════════════
    
    get transformType() { return this.getAttribute('transform-type'); }
    set transformType(val) { this.setAttribute('transform-type', val); }
    
    get value() { return this._config; }
    set value(config) { this._config = config; this.populateForm(); }
    
    // ═══════════════════════════════════════════════════════════════════
    // Methods
    // ═══════════════════════════════════════════════════════════════════
    
    // Set transform type and render form
    setTransformType(type) { 
        this.transformType = type; 
        this.renderForm(); 
    }
    
    // Set initial values
    setConfig(config) { this.value = config; }
    
    // Get current configuration
    getConfig() { return this.buildConfig(); }
    
    // Validate current form
    validate() { /* return { valid, errors } */ }
    
    // Reset form to defaults
    reset() { /* clear form */ }
    
    // ═══════════════════════════════════════════════════════════════════
    // Events Emitted
    // ═══════════════════════════════════════════════════════════════════
    
    // this.dispatchEvent(new CustomEvent('change', { detail: { config } }))
    // this.dispatchEvent(new CustomEvent('save', { detail: { config } }))
    // this.dispatchEvent(new CustomEvent('cancel', {}))
}

customElements.define('transform-config', TransformConfig);
```

---

## 4. Transform Types Registry

```javascript
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
```

---

## 5. Dynamic Form Rendering

```javascript
renderForm() {
    const type = this.transformType;
    const config = TRANSFORM_TYPES[type];
    
    if (!config) {
        this.innerHTML = `<p class="error">Unknown transform type: ${type}</p>`;
        return;
    }
    
    this.innerHTML = `
        <div class="transform-config">
            <div class="tc-header">
                <h3>Configure Transform: ${config.name}</h3>
                <p class="tc-description">${config.description}</p>
            </div>
            
            <div class="tc-form">
                ${config.params.map(param => this.renderParam(param)).join('')}
            </div>
            
            <div class="tc-preview">
                <h4>Preview:</h4>
                <pre class="tc-json">${this.getPreviewJson()}</pre>
            </div>
            
            <div class="tc-actions">
                <button class="tc-cancel">Cancel</button>
                <button class="tc-save primary">💾 Save Transform</button>
            </div>
        </div>
    `;
    
    this.bindFormEvents();
}

renderParam(param) {
    switch (param.type) {
        case 'text':
            return this.renderTextInput(param);
        case 'textarea':
            return this.renderTextarea(param);
        case 'checkbox':
            return this.renderCheckbox(param);
        case 'checkbox-group':
            return this.renderCheckboxGroup(param);
        case 'radio':
            return this.renderRadioGroup(param);
        case 'range':
            return this.renderRange(param);
        case 'tags':
            return this.renderTagsInput(param);
        default:
            return `<p>Unknown param type: ${param.type}</p>`;
    }
}
```

---

## 6. Usage Examples

### Basic Usage

```html
<transform-config transform-type="remove-elements"></transform-config>

<script>
const config = document.querySelector('transform-config');

config.addEventListener('save', (e) => {
    console.log('Transform config:', e.detail.config);
    // {
    //   type: 'remove-elements',
    //   params: {
    //     selectors: ['.ad', '.banner'],
    //     remove_children: true,
    //     leave_comment: false
    //   }
    // }
});

config.addEventListener('cancel', () => {
    console.log('Config cancelled');
});
</script>
```

### Edit Existing Transform

```javascript
const config = document.querySelector('transform-config');
config.transformType = 'sentiment-filter';
config.value = {
    type: 'sentiment-filter',
    params: {
        threshold: 0.6,
        target_elements: ['p', '.comment,.reply'],
        action: 'blur'
    }
};
```

### Get Available Transform Types

```javascript
// Get all transform types
const types = TransformConfig.getAvailableTypes();
// ['remove-elements', 'sentiment-filter', 'simplify', ...]

// Get types by category
const structureTypes = TransformConfig.getTypesByCategory('structure');
// ['remove-elements', 'simplify', 'extract-content']
```

---

## 7. File Structure

```
v0.1.0/
└── components/
    └── shared/
        └── transform-config/
            ├── transform-config.js
            ├── transform-config.css
            ├── transform-types.js      # Transform definitions
            └── transform-config.test.js
```

---

## 8. CSS

```css
transform-config {
    display: block;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
}

.tc-header {
    padding: 15px 20px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
}

.tc-header h3 {
    margin: 0 0 5px 0;
}

.tc-description {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.tc-form {
    padding: 20px;
}

.tc-field {
    margin-bottom: 20px;
}

.tc-field label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.tc-field input[type="text"],
.tc-field textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.tc-field textarea {
    min-height: 100px;
    font-family: monospace;
}

.tc-field input[type="range"] {
    width: 100%;
}

.tc-range-value {
    display: inline-block;
    min-width: 40px;
    text-align: right;
    font-weight: bold;
}

.tc-checkbox-group,
.tc-radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tc-checkbox-group label,
.tc-radio-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: normal;
    cursor: pointer;
}

.tc-preview {
    padding: 15px 20px;
    background: #f9f9f9;
    border-top: 1px solid #eee;
}

.tc-preview h4 {
    margin: 0 0 10px 0;
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
}

.tc-json {
    background: #282c34;
    color: #abb2bf;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    overflow-x: auto;
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
    border-radius: 4px;
    cursor: pointer;
}

.tc-actions button.primary {
    background: #4CAF50;
    color: white;
    border-color: #4CAF50;
}

/* Tags input */
.tc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-height: 40px;
}

.tc-tag {
    display: flex;
    align-items: center;
    gap: 5px;
    background: #e3f2fd;
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 13px;
}

.tc-tag-remove {
    cursor: pointer;
    color: #666;
}

.tc-tags input {
    flex: 1;
    min-width: 100px;
    border: none;
    outline: none;
}
```

---

## 9. Acceptance Criteria

- [ ] Renders form based on transform type
- [ ] All param types render correctly (text, textarea, checkbox, radio, range, tags)
- [ ] Form validates required fields
- [ ] Preview shows current config as JSON
- [ ] Save button emits `save` event with config
- [ ] Cancel button emits `cancel` event
- [ ] Can set initial values via `value` property
- [ ] Conditional fields show/hide based on other params
- [ ] `change` event fires on any form change
- [ ] `getConfig()` returns current form state
- [ ] `validate()` returns validation result

---

## 10. Events

### Events Emitted

| Event | When | Detail |
|-------|------|--------|
| `change` | Any form field changes | `{ config }` |
| `save` | Save button clicked | `{ config }` |
| `cancel` | Cancel button clicked | `{}` |

### Events Listened

None (this is a passive UI component)

---

## 11. Validation

```javascript
validate() {
    const config = TRANSFORM_TYPES[this.transformType];
    const errors = [];
    
    for (const param of config.params) {
        const value = this.getParamValue(param.name);
        
        // Required check
        if (param.required && !value) {
            errors.push({
                param: param.name,
                message: `${param.label} is required`
            });
        }
        
        // Min/max for range
        if (param.type === 'range') {
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
```

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
