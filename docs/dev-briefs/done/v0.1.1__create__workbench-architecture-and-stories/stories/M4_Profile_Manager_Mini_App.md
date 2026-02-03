# Story M4: Profile Manager Mini App

**Story ID:** M4  
**Layer:** Mini Apps  
**Priority:** HIGH  
**Parallel With:** M1-M3, M5-M7  
**Dependencies:** F1-F4, B1 (Profile APIs)

---

## 1. Purpose

Create, edit, delete, and manage transformation profiles. Profiles are reusable transformation configurations that can be applied to HTML documents. They can be identified by MitmProxy via cookie values.

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            PROFILE MANAGER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [+ New Profile]                                    Search: [_______________]   │
│                                                                                  │
├────────────────────────────────────┬────────────────────────────────────────────┤
│                                    │                                            │
│  PROFILES                          │  EDIT: clean-news                          │
│  ════════                          │  ══════════════════════════════            │
│                                    │                                            │
│  ┌──────────────────────────────┐  │  Profile ID:                               │
│  │ ► clean-news            ✎ 🗑│  │  [clean-news_____________________]         │
│  │   tags: news, readability   │  │                                            │
│  │   3 transforms              │  │  Display Name:                              │
│  └──────────────────────────────┘  │  [Clean News Articles______________]       │
│                                    │                                            │
│  ┌──────────────────────────────┐  │  Description:                              │
│  │ ► minimal-view          ✎ 🗑│  │  [Remove ads and negative comments__]      │
│  │   tags: minimal             │  │                                            │
│  │   2 transforms              │  │  Tags (comma-separated):                    │
│  └──────────────────────────────┘  │  [news, readability, clean__________]      │
│                                    │                                            │
│  ┌──────────────────────────────┐  │  ────────────────────────────────────────  │
│  │ ► focus-mode            ✎ 🗑│  │                                            │
│  │   tags: reading, focus      │  │  TRANSFORMS                                │
│  │   4 transforms              │  │  ══════════                                │
│  └──────────────────────────────┘  │                                            │
│                                    │  ┌────────────────────────────────────────┐│
│                                    │  │ 1. remove-elements              [▲][▼] ││
│                                    │  │    Selector: .ad, .banner, .sponsored  ││
│                                    │  │                              [Edit][🗑] ││
│                                    │  ├────────────────────────────────────────┤│
│                                    │  │ 2. sentiment-filter            [▲][▼] ││
│                                    │  │    Threshold: 0.4                      ││
│                                    │  │    Target: .comment, .reply            ││
│                                    │  │                              [Edit][🗑] ││
│                                    │  ├────────────────────────────────────────┤│
│                                    │  │ 3. remove-scripts              [▲][▼] ││
│                                    │  │    (no parameters)                     ││
│                                    │  │                              [Edit][🗑] ││
│                                    │  └────────────────────────────────────────┘│
│                                    │                                            │
│                                    │  [+ Add Transform]                         │
│                                    │                                            │
│                                    │  ────────────────────────────────────────  │
│                                    │                                            │
│                                    │  [💾 Save]  [📋 Duplicate]  [🗑 Delete]    │
│                                    │                                            │
└────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 3. Features

### 3.1 Profile List
- List all profiles in namespace
- Search/filter by name or tag
- Click to edit
- Delete with confirmation

### 3.2 Profile Editor
- Profile ID (unique identifier, used by MitmProxy)
- Display name
- Description
- Tags (for organization)

### 3.3 Transform Management
- Add transforms from available types
- Configure transform parameters
- Reorder transforms (up/down)
- Remove transforms

### 3.4 Actions
- Save profile (create or update)
- Duplicate profile
- Delete profile

---

## 4. Profile Schema

```javascript
{
    profile_id: "clean-news",
    name: "Clean News Articles",
    description: "Remove ads, negative comments, simplify layout",
    tags: ["news", "readability", "clean"],
    created_at: 1768970000000,
    updated_at: 1768975000000,
    transforms: [
        {
            type: "remove-elements",
            params: {
                selector: ".ad, .banner, .sponsored"
            }
        },
        {
            type: "sentiment-filter",
            params: {
                threshold: 0.4,
                target_elements: ".comment, .reply"
            }
        },
        {
            type: "remove-scripts",
            params: {}
        }
    ]
}
```

---

## 5. Available Transform Types

```javascript
const TRANSFORM_TYPES = [
    {
        type: 'remove-elements',
        name: 'Remove Elements',
        description: 'Remove elements matching CSS selector',
        params: [
            { name: 'selector', type: 'text', label: 'CSS Selector', required: true }
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
        type: 'sentiment-filter',
        name: 'Sentiment Filter',
        description: 'Remove content by sentiment (requires LLM)',
        params: [
            { name: 'threshold', type: 'number', label: 'Negativity Threshold', default: 0.4 },
            { name: 'target_elements', type: 'text', label: 'Target Selectors' }
        ]
    },
    {
        type: 'topic-filter',
        name: 'Topic Filter',
        description: 'Keep/remove content by topic (requires LLM)',
        params: [
            { name: 'topics', type: 'text', label: 'Topics (comma-separated)' },
            { name: 'mode', type: 'select', label: 'Mode', options: ['keep', 'remove'] }
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
```

---

## 6. Events

### Events to EMIT
| Event | When | Payload |
|-------|------|---------|
| `profile-list-loaded` | After loading profiles | `{ profiles }` |
| `profile-loaded` | After loading single profile | `{ profileId, profile }` |
| `profile-saved` | After saving | `{ profileId }` |
| `profile-deleted` | After deleting | `{ profileId }` |

### Events to LISTEN
| Event | Action |
|-------|--------|
| `profile-load-request` | Load and display profile |

---

## 7. Key Methods

```javascript
async loadProfiles() {
    const response = await this.api.htmlGraph.listProfiles(
        this.config.get('defaults.namespace')
    );
    this.setState({ profiles: response.profiles || [] });
    this.events.emit('profile-list-loaded', { profiles: response.profiles });
}

async loadProfile(profileId) {
    const response = await this.api.htmlGraph.getProfile(
        this.config.get('defaults.namespace'),
        profileId
    );
    this.setState({ editingProfile: response.profile });
    this.events.emit('profile-loaded', { profileId, profile: response.profile });
}

async saveProfile() {
    const profile = this.state.editingProfile;
    
    const response = await this.api.htmlGraph.saveProfile(
        this.config.get('defaults.namespace'),
        profile.profile_id,
        profile
    );
    
    if (response.success) {
        this.events.emit('profile-saved', { profileId: profile.profile_id });
        this.showToast('Profile saved');
        await this.loadProfiles();  // Refresh list
    }
}

async deleteProfile(profileId) {
    if (!confirm(`Delete profile "${profileId}"?`)) return;
    
    await this.api.call(
        'html-graph',
        `/flet-html-domain/profiles/${this.config.get('defaults.namespace')}/${profileId}`,
        'DELETE'
    );
    
    this.events.emit('profile-deleted', { profileId });
    this.setState({ editingProfile: null });
    await this.loadProfiles();
}

addTransform(type) {
    const transformDef = TRANSFORM_TYPES.find(t => t.type === type);
    const newTransform = {
        type,
        params: {}
    };
    
    // Set defaults
    transformDef.params.forEach(p => {
        if (p.default !== undefined) {
            newTransform.params[p.name] = p.default;
        }
    });
    
    const profile = { ...this.state.editingProfile };
    profile.transforms = [...profile.transforms, newTransform];
    this.setState({ editingProfile: profile });
}

moveTransform(index, direction) {
    const profile = { ...this.state.editingProfile };
    const transforms = [...profile.transforms];
    const newIndex = index + direction;
    
    if (newIndex < 0 || newIndex >= transforms.length) return;
    
    [transforms[index], transforms[newIndex]] = [transforms[newIndex], transforms[index]];
    profile.transforms = transforms;
    this.setState({ editingProfile: profile });
}
```

---

## 8. File Structure

```
v0.1.0/
└── components/
    └── profile-manager/
        ├── profile-manager.js
        ├── profile-manager.test.js
        └── transform-types.js      # Transform type definitions
```

---

## 9. Acceptance Criteria

- [ ] Lists all profiles in namespace
- [ ] Search filters profiles by name/tag
- [ ] Click profile to edit
- [ ] Edit profile ID, name, description, tags
- [ ] Add transforms from dropdown
- [ ] Configure transform parameters
- [ ] Reorder transforms with up/down buttons
- [ ] Remove transforms
- [ ] Save profile to API
- [ ] Duplicate profile
- [ ] Delete profile with confirmation
- [ ] New Profile creates blank profile
- [ ] Profile ID validates (no spaces, lowercase)

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
