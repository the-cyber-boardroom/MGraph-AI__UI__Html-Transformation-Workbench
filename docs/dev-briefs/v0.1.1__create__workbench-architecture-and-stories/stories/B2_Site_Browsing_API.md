# Story B2: Site Browsing API

**Story ID:** B2  
**Layer:** Backend APIs  
**Priority:** HIGH  
**Parallel With:** B1, B3-B5  
**Dependencies:** None (uses existing cache infrastructure)

---

## 1. Purpose

Endpoint to list all cached pages for a given domain. Since cache keys are structured as `{domain}/{path}`, we can filter entities by prefix to find all pages for a site.

---

## 2. Endpoint

### List Pages by Domain

```
GET /cache-entity/{namespace}/entities/site/{domain}

Parameters:
- namespace: Cache namespace (e.g., "html-cache")
- domain: Domain to browse (e.g., "example.com")

Optional Query Params:
- sort: "path" | "date" | "size" (default: "path")
- order: "asc" | "desc" (default: "asc")
- limit: Max results (default: 100)
- offset: Pagination offset (default: 0)

Response:
{
    "success": true,
    "namespace": "html-cache",
    "domain": "example.com",
    "count": 15,
    "total": 15,
    "pages": [
        {
            "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd",
            "cache_key": "example.com/root",
            "path": "/",
            "stored_at": 1768955158133,
            "content_size": 1234,
            "content_type": "text/html"
        },
        {
            "cache_id": "bb38gc3b-...",
            "cache_key": "example.com/about",
            "path": "/about",
            "stored_at": 1768955200000,
            "content_size": 2456,
            "content_type": "text/html"
        },
        {
            "cache_id": "cc49hd4c-...",
            "cache_key": "example.com/blog/post-1",
            "path": "/blog/post-1",
            "stored_at": 1768955300000,
            "content_size": 5123,
            "content_type": "text/html"
        }
    ]
}
```

---

## 3. Implementation

### 3.1 Algorithm

```python
def list_site_pages(namespace: str, domain: str, sort: str, order: str) -> list:
    # 1. Get all cache IDs in namespace
    cache_ids = cache_client.namespace().cache_ids(namespace)
    
    # 2. Filter by domain prefix
    matching_pages = []
    for cache_id in cache_ids:
        entity = Cache__Entity(cache_id)
        metadata = entity.entry__with_metadata()
        
        cache_key = metadata.get('cache_key', '')
        
        # Check if cache_key starts with domain
        if cache_key.startswith(f"{domain}/") or cache_key == f"{domain}/root":
            # Extract path from cache_key
            path = cache_key[len(domain):]
            if path == "/root":
                path = "/"
            
            matching_pages.append({
                'cache_id': cache_id,
                'cache_key': cache_key,
                'path': path,
                'stored_at': metadata.get('stored_at'),
                'content_size': metadata.get('content_size'),
                'content_type': metadata.get('file_type')
            })
    
    # 3. Sort results
    sort_key = {
        'path': lambda x: x['path'],
        'date': lambda x: x['stored_at'],
        'size': lambda x: x['content_size']
    }.get(sort, lambda x: x['path'])
    
    matching_pages.sort(key=sort_key, reverse=(order == 'desc'))
    
    return matching_pages
```

### 3.2 Path Extraction

Cache keys are formatted as `{domain}/{path}`. Special case for root:
- `example.com/root` → path is `/`
- `example.com/about` → path is `/about`
- `example.com/blog/post-1` → path is `/blog/post-1`

---

## 4. Schema

```python
class Schema__Site__Page(BaseModel):
    cache_id: str
    cache_key: str
    path: str
    stored_at: int
    content_size: int
    content_type: Optional[str] = None

class Schema__Site__List__Response(BaseModel):
    success: bool
    namespace: str
    domain: str
    count: int
    total: int
    pages: List[Schema__Site__Page]
```

---

## 5. Acceptance Criteria

- [ ] Returns all pages matching domain
- [ ] Extracts path from cache_key correctly
- [ ] Handles root page (domain/root → /)
- [ ] Sorts by path, date, or size
- [ ] Ascending/descending order
- [ ] Pagination with limit/offset
- [ ] Returns empty list if no pages
- [ ] Performance acceptable for 100+ pages

---

*This is a backend story. Implement as FastAPI route in the existing Cache Entity API.*
