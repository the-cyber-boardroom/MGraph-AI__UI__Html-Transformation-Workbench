# Story B1: Profile CRUD APIs

**Story ID:** B1  
**Layer:** Backend APIs  
**Priority:** HIGH  
**Parallel With:** B2-B5  
**Dependencies:** None (uses existing cache infrastructure)

---

## 1. Purpose

Backend endpoints for creating, reading, updating, and deleting transformation profiles. Profiles are stored as data files attached to a special cache entity.

---

## 2. Storage Model

Profiles are stored as JSON files in a special entity:

```
Namespace: {namespace}
Cache Key: _profiles/transforms
Data Files:
  - profiles/clean-news.json
  - profiles/minimal-view.json
  - profiles/focus-mode.json
```

---

## 3. Endpoints

### 3.1 List All Profiles

```
GET /flet-html-domain/profiles/{namespace}

Response:
{
    "success": true,
    "namespace": "html-cache",
    "count": 3,
    "profiles": [
        {
            "profile_id": "clean-news",
            "name": "Clean News Articles",
            "description": "Remove ads and negative comments",
            "tags": ["news", "readability"],
            "transform_count": 3,
            "created_at": 1768970000000,
            "updated_at": 1768975000000
        },
        ...
    ]
}
```

### 3.2 Get Profile

```
GET /flet-html-domain/profiles/{namespace}/{profile_id}

Response:
{
    "success": true,
    "profile": {
        "profile_id": "clean-news",
        "name": "Clean News Articles",
        "description": "Remove ads and negative comments",
        "tags": ["news", "readability"],
        "created_at": 1768970000000,
        "updated_at": 1768975000000,
        "transforms": [
            {
                "type": "remove-elements",
                "params": {
                    "selector": ".ad, .banner, .sponsored"
                }
            },
            {
                "type": "sentiment-filter",
                "params": {
                    "threshold": 0.4,
                    "target_elements": ".comment"
                }
            }
        ]
    }
}
```

### 3.3 Create/Update Profile

```
POST /flet-html-domain/profiles/{namespace}/{profile_id}

Request Body:
{
    "name": "Clean News Articles",
    "description": "Remove ads and negative comments",
    "tags": ["news", "readability"],
    "transforms": [
        {
            "type": "remove-elements",
            "params": { "selector": ".ad" }
        }
    ]
}

Response:
{
    "success": true,
    "profile_id": "clean-news",
    "created": false,  // true if new, false if updated
    "message": "Profile updated"
}
```

### 3.4 Delete Profile

```
DELETE /flet-html-domain/profiles/{namespace}/{profile_id}

Response:
{
    "success": true,
    "profile_id": "clean-news",
    "message": "Profile deleted"
}
```

### 3.5 Apply Profile to Page

```
POST /flet-html-domain/profiles/{namespace}/{profile_id}/apply

Request Body:
{
    "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd"
}
OR
{
    "cache_key": "example.com/about"
}

Response:
{
    "success": true,
    "profile_id": "clean-news",
    "original_cache_id": "aa27fb2a-...",
    "transformed_cache_id": "bb38gc3b-...",
    "transforms_applied": 3,
    "original_size": 1234,
    "transformed_size": 987
}
```

### 3.6 Apply Profile to Site (Batch)

```
POST /flet-html-domain/profiles/{namespace}/{profile_id}/apply/site/{domain}

Response:
{
    "success": true,
    "profile_id": "clean-news",
    "domain": "example.com",
    "pages_found": 15,
    "pages_transformed": 14,
    "pages_failed": 1,
    "results": [
        {
            "cache_key": "example.com/about",
            "original_cache_id": "aa27fb2a-...",
            "transformed_cache_id": "bb38gc3b-...",
            "status": "success"
        },
        {
            "cache_key": "example.com/broken",
            "status": "failed",
            "error": "Parse error"
        }
    ]
}
```

---

## 4. Profile Schema

```python
class Schema__Profile(BaseModel):
    profile_id: str                      # Unique identifier
    name: str                            # Display name
    description: Optional[str] = None    # Description
    tags: List[str] = []                 # Tags for organization
    transforms: List[Schema__Transform]  # List of transforms
    created_at: int                       # Timestamp
    updated_at: int                       # Timestamp

class Schema__Transform(BaseModel):
    type: str                            # Transform type
    params: Dict[str, Any] = {}          # Parameters
```

---

## 5. Implementation Notes

### Storage
- Store profiles as JSON in `_profiles/transforms` entity
- Each profile is a separate data file: `profiles/{profile_id}.json`
- Use existing `Cache__Entity.data__add_file()` for storage

### Apply Logic
1. Load profile from storage
2. Load HTML from source cache_id or cache_key
3. For each transform in profile:
   - Apply client-side transforms (remove-elements, etc.)
   - Queue server-side transforms (sentiment-filter) for LLM
4. Save transformed HTML as new entity
5. Return both cache IDs

### Validation
- `profile_id` must be lowercase, alphanumeric with hyphens
- `profile_id` must be unique in namespace
- At least one transform required

---

## 6. Acceptance Criteria

- [ ] List all profiles in namespace
- [ ] Get single profile by ID
- [ ] Create new profile
- [ ] Update existing profile
- [ ] Delete profile
- [ ] Apply profile to single page
- [ ] Apply profile to all pages in domain
- [ ] Return transformed cache_id
- [ ] Handle errors gracefully

---

*This is a backend story. Implement as FastAPI routes in the existing HTML Graph API.*
