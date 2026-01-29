# Story B4: Site Analysis APIs

**Story ID:** B4  
**Layer:** Backend APIs  
**Priority:** MEDIUM  
**Parallel With:** B1, B5  
**Dependencies:** B2 (Site Browsing), B3 (Page Analysis)

---

## 1. Purpose

Create backend endpoints for site-wide analysis. These APIs aggregate information across all cached pages for a domain.

**You are building:**
- Site map generation endpoint (page hierarchy)
- Site content overview endpoint (aggregated analysis)

---

## 2. Endpoints

### 2.1 Site Map Generation

```
POST /flet-html-domain/site/analyze/{namespace}/sitemap/{domain}
```

**Request:**
```json
{}
```

**Response:**
```json
{
    "success": true,
    "domain": "example.com",
    "analysis": {
        "total_pages": 15,
        "max_depth": 3,
        "hierarchy": {
            "/": {
                "cache_id": "aa27fb2a-...",
                "title": "Home",
                "children": ["/about", "/contact", "/blog"],
                "depth": 0
            },
            "/about": {
                "cache_id": "bb38gc3b-...",
                "title": "About Us",
                "children": ["/about/team", "/about/history"],
                "depth": 1
            },
            "/blog": {
                "cache_id": "cc49hd4c-...",
                "title": "Blog",
                "children": ["/blog/post-1", "/blog/post-2", "/blog/post-3"],
                "depth": 1
            },
            "/blog/post-1": {
                "cache_id": "dd50ie5d-...",
                "title": "First Post",
                "children": [],
                "depth": 2
            }
        },
        "flat_list": [
            { "path": "/", "depth": 0, "title": "Home" },
            { "path": "/about", "depth": 1, "title": "About Us" },
            { "path": "/about/team", "depth": 2, "title": "Our Team" },
            { "path": "/blog", "depth": 1, "title": "Blog" },
            { "path": "/blog/post-1", "depth": 2, "title": "First Post" }
        ],
        "orphan_pages": [
            { "path": "/old-page", "cache_id": "ee61jf6e-..." }
        ],
        "missing_parents": [
            { "path": "/products/item-1", "missing_parent": "/products" }
        ]
    },
    "saved_to": "_site-analysis/analysis/sitemap.json",
    "analyzed_at": 1768970000000
}
```

**Implementation:**
1. Get all pages for domain using B2 site browsing API
2. Extract path from each cache_key
3. Build hierarchy tree based on path segments
4. Detect orphan pages (no links to them)
5. Detect missing parents (child exists but parent doesn't)
6. Extract page titles from cached HTML
7. Save to special `{domain}/_site-analysis` entity
8. Return analysis

---

### 2.2 Site Content Overview

```
POST /flet-html-domain/site/analyze/{namespace}/content/{domain}
```

**Request:**
```json
{
    "include_per_page": false
}
```

**Response:**
```json
{
    "success": true,
    "domain": "example.com",
    "analysis": {
        "total_pages": 15,
        "total_words": 45000,
        "total_chars": 280000,
        "avg_words_per_page": 3000,
        "avg_reading_time_minutes": 12,
        "languages": {
            "en": 14,
            "es": 1
        },
        "topic_distribution": {
            "technology": { "count": 8, "percentage": 0.53 },
            "business": { "count": 4, "percentage": 0.27 },
            "news": { "count": 2, "percentage": 0.13 },
            "other": { "count": 1, "percentage": 0.07 }
        },
        "sentiment_overview": {
            "positive": 10,
            "neutral": 4,
            "negative": 1,
            "avg_sentiment": 0.65
        },
        "content_freshness": {
            "last_7_days": 5,
            "last_30_days": 10,
            "older": 5
        },
        "readability_avg": {
            "flesch_reading_ease": 52.3,
            "flesch_kincaid_grade": 10.2
        },
        "top_keywords": [
            { "keyword": "AI", "frequency": 45 },
            { "keyword": "technology", "frequency": 38 },
            { "keyword": "software", "frequency": 32 }
        ],
        "top_entities": [
            { "entity": "OpenAI", "type": "organization", "mentions": 12 },
            { "entity": "Google", "type": "organization", "mentions": 8 }
        ]
    },
    "saved_to": "_site-analysis/analysis/content-overview.json",
    "analyzed_at": 1768970000000
}
```

**Implementation:**
1. Get all pages for domain
2. For each page, check if content analysis exists
3. If not, run content analysis (B3)
4. Aggregate all content analyses:
   - Sum word counts
   - Aggregate topics
   - Average sentiments
   - Combine keywords
   - Combine entities
5. Calculate freshness based on stored_at timestamps
6. Save to `{domain}/_site-analysis` entity
7. Return analysis

---

## 3. Data Storage

Site analysis results are saved to a special entity:

```
Entity: example.com/_site-analysis
Cache Key: example.com/_site-analysis
Data Files:
  - analysis/sitemap.json
  - analysis/content-overview.json
```

---

## 4. Schemas

### Schema__Site__Sitemap

```python
class Schema__Site__Sitemap(Type_Safe):
    total_pages     : int
    max_depth       : int
    hierarchy       : dict[str, Schema__Page__Node]
    flat_list       : list[Schema__Page__Flat]
    orphan_pages    : list[Schema__Orphan__Page]
    missing_parents : list[Schema__Missing__Parent]

class Schema__Page__Node(Type_Safe):
    cache_id : str
    title    : Optional[str]
    children : list[str]
    depth    : int

class Schema__Page__Flat(Type_Safe):
    path  : str
    depth : int
    title : Optional[str]

class Schema__Orphan__Page(Type_Safe):
    path     : str
    cache_id : str

class Schema__Missing__Parent(Type_Safe):
    path           : str
    missing_parent : str
```

### Schema__Site__Content__Overview

```python
class Schema__Site__Content__Overview(Type_Safe):
    total_pages              : int
    total_words              : int
    total_chars              : int
    avg_words_per_page       : int
    avg_reading_time_minutes : int
    languages                : dict[str, int]
    topic_distribution       : dict[str, Schema__Topic__Stat]
    sentiment_overview       : Schema__Sentiment__Overview
    content_freshness        : Schema__Content__Freshness
    readability_avg          : Schema__Readability__Avg
    top_keywords             : list[Schema__Keyword__Stat]
    top_entities             : list[Schema__Entity__Stat]

class Schema__Topic__Stat(Type_Safe):
    count      : int
    percentage : float

class Schema__Sentiment__Overview(Type_Safe):
    positive      : int
    neutral       : int
    negative      : int
    avg_sentiment : float

class Schema__Content__Freshness(Type_Safe):
    last_7_days  : int
    last_30_days : int
    older        : int

class Schema__Readability__Avg(Type_Safe):
    flesch_reading_ease  : float
    flesch_kincaid_grade : float

class Schema__Keyword__Stat(Type_Safe):
    keyword   : str
    frequency : int

class Schema__Entity__Stat(Type_Safe):
    entity   : str
    type     : str
    mentions : int
```

---

## 5. Service Methods

```python
class Site__Analysis__Service:
    
    def analyze_sitemap(self, namespace: str, domain: str) -> Schema__Site__Sitemap__Response:
        # 1. Get all pages for domain (via B2)
        # 2. Build hierarchy from paths
        # 3. Extract titles from HTML
        # 4. Detect orphans and missing parents
        # 5. Save to _site-analysis entity
        # 6. Return response
        pass
    
    def analyze_content_overview(self, namespace: str, domain: str, include_per_page: bool = False) -> Schema__Site__Content__Response:
        # 1. Get all pages for domain
        # 2. Load or generate content analysis for each
        # 3. Aggregate all metrics
        # 4. Save to _site-analysis entity
        # 5. Return response
        pass
```

---

## 6. Route Methods

```python
class Routes__Site__Analysis:
    
    @route_post('/flet-html-domain/site/analyze/{namespace}/sitemap/{domain}')
    def analyze_sitemap(self, namespace: str, domain: str) -> Schema__Site__Sitemap__Response:
        return self.service.analyze_sitemap(namespace, domain)
    
    @route_post('/flet-html-domain/site/analyze/{namespace}/content/{domain}')
    def analyze_content_overview(self, namespace: str, domain: str, data: Schema__Site__Content__Request = None) -> Schema__Site__Content__Response:
        include_per_page = data.include_per_page if data else False
        return self.service.analyze_content_overview(namespace, domain, include_per_page)
```

---

## 7. Hierarchy Building Algorithm

```python
def build_hierarchy(pages: list[dict]) -> dict:
    hierarchy = {}
    
    for page in pages:
        path = page['path']
        segments = path.strip('/').split('/')
        
        # Add all ancestor paths
        for i in range(len(segments)):
            ancestor_path = '/' + '/'.join(segments[:i+1])
            if ancestor_path not in hierarchy:
                hierarchy[ancestor_path] = {
                    'cache_id': None,
                    'children': [],
                    'depth': i
                }
        
        # Set cache_id for this page
        hierarchy[path]['cache_id'] = page['cache_id']
        
        # Add to parent's children
        if len(segments) > 1:
            parent_path = '/' + '/'.join(segments[:-1])
            if path not in hierarchy[parent_path]['children']:
                hierarchy[parent_path]['children'].append(path)
        elif path != '/':
            if path not in hierarchy.get('/', {}).get('children', []):
                hierarchy.setdefault('/', {'children': [], 'depth': 0})['children'].append(path)
    
    return hierarchy
```

---

## 8. Acceptance Criteria

### Site Map
- [ ] Lists all pages for domain
- [ ] Builds correct hierarchy from paths
- [ ] Calculates depth for each page
- [ ] Extracts page titles
- [ ] Detects orphan pages
- [ ] Detects missing parent pages
- [ ] Saves to `_site-analysis/analysis/sitemap.json`

### Content Overview
- [ ] Aggregates word counts across pages
- [ ] Calculates topic distribution
- [ ] Averages sentiment scores
- [ ] Groups pages by content freshness
- [ ] Aggregates top keywords
- [ ] Aggregates top entities
- [ ] Saves to `_site-analysis/analysis/content-overview.json`

---

## 9. Error Handling

```python
# No pages for domain
{
    "success": false,
    "error": "no_pages",
    "message": "No cached pages found for domain: example.com"
}

# Analysis in progress
{
    "success": false,
    "error": "analysis_in_progress",
    "message": "Site analysis already running for: example.com"
}
```

---

*This is a backend API story. Refer to existing FLeT API patterns for implementation details.*
