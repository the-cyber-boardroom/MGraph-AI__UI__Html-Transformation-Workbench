# Story B3: Page Analysis APIs

**Story ID:** B3  
**Layer:** Backend APIs  
**Priority:** MEDIUM  
**Parallel With:** B1, B2, B4, B5  
**Dependencies:** None (existing cache infrastructure)

---

## 1. Purpose

Create backend endpoints for analyzing individual HTML pages. These APIs extract structure, content, and link information from cached HTML.

**You are building:**
- Structure analysis endpoint (DOM tree, element counts)
- Content analysis endpoint (topics, sentiment, readability via LLM)
- Link analysis endpoint (internal/external links)

---

## 2. Endpoints

### 2.1 Structure Analysis

```
POST /flet-html-domain/html/analyze/{namespace}/structure
```

**Request:**
```json
{
    "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd"
}
```

**Response:**
```json
{
    "success": true,
    "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd",
    "analysis": {
        "element_count": 245,
        "max_depth": 12,
        "elements": {
            "div": 45,
            "span": 67,
            "p": 23,
            "a": 34,
            "img": 12,
            "script": 5,
            "style": 3
        },
        "structure": {
            "has_doctype": true,
            "has_header": true,
            "has_nav": true,
            "has_main": true,
            "has_article": false,
            "has_footer": true,
            "has_aside": false
        },
        "meta": {
            "title": "Page Title",
            "description": "Meta description...",
            "charset": "utf-8",
            "viewport": "width=device-width, initial-scale=1"
        },
        "main_content_selector": "main.content"
    },
    "saved_to": "analysis/structure.json",
    "analyzed_at": 1768970000000
}
```

**Implementation:**
1. Load HTML from cache by cache_id
2. Parse HTML using BeautifulSoup or similar
3. Count elements by tag name
4. Calculate max depth via tree traversal
5. Detect semantic structure elements
6. Extract meta information
7. Save result to entity data file
8. Return analysis

---

### 2.2 Content Analysis

```
POST /flet-html-domain/html/analyze/{namespace}/content
```

**Request:**
```json
{
    "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd"
}
```

**Response:**
```json
{
    "success": true,
    "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd",
    "analysis": {
        "word_count": 1234,
        "char_count": 7890,
        "paragraph_count": 15,
        "reading_time_minutes": 5,
        "language": "en",
        "topics": [
            { "topic": "technology", "confidence": 0.85 },
            { "topic": "artificial intelligence", "confidence": 0.72 },
            { "topic": "machine learning", "confidence": 0.65 }
        ],
        "sentiment": {
            "overall": 0.7,
            "label": "positive",
            "distribution": {
                "positive": 0.6,
                "neutral": 0.3,
                "negative": 0.1
            }
        },
        "readability": {
            "flesch_reading_ease": 45.2,
            "flesch_kincaid_grade": 12.1,
            "gunning_fog": 14.5,
            "automated_readability_index": 13.2
        },
        "entities": [
            { "text": "OpenAI", "type": "organization" },
            { "text": "GPT-4", "type": "product" },
            { "text": "San Francisco", "type": "location" }
        ],
        "keywords": ["AI", "language model", "neural network", "training"]
    },
    "saved_to": "analysis/content.json",
    "analyzed_at": 1768970000000
}
```

**Implementation:**
1. Load HTML from cache
2. Extract text content (strip tags)
3. Calculate basic stats (word count, paragraphs)
4. Call LLM API for:
   - Topic classification
   - Sentiment analysis
   - Entity extraction
   - Keyword extraction
5. Calculate readability scores (algorithmic)
6. Save result to entity data file
7. Return analysis

---

### 2.3 Link Analysis

```
POST /flet-html-domain/html/analyze/{namespace}/links
```

**Request:**
```json
{
    "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd"
}
```

**Response:**
```json
{
    "success": true,
    "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd",
    "cache_key": "example.com/about",
    "analysis": {
        "total_links": 45,
        "internal_count": 28,
        "external_count": 17,
        "internal_links": [
            { "href": "/", "text": "Home", "element": "nav a" },
            { "href": "/about", "text": "About Us", "element": "nav a" },
            { "href": "/contact", "text": "Contact", "element": "nav a" },
            { "href": "/blog/post-1", "text": "Read More", "element": "article a" }
        ],
        "external_links": [
            { "href": "https://twitter.com/example", "text": "Twitter", "domain": "twitter.com" },
            { "href": "https://github.com/example", "text": "GitHub", "domain": "github.com" }
        ],
        "link_domains": {
            "twitter.com": 3,
            "github.com": 2,
            "linkedin.com": 1
        },
        "anchor_only": 5,
        "javascript_links": 2,
        "mailto_links": 1
    },
    "saved_to": "analysis/links.json",
    "analyzed_at": 1768970000000
}
```

**Implementation:**
1. Load HTML from cache
2. Extract cache_key to determine internal domain
3. Parse all `<a>` tags
4. Classify each link:
   - Internal (same domain or relative)
   - External (different domain)
   - Anchor only (#...)
   - JavaScript (javascript:...)
   - Mailto (mailto:...)
5. Extract link text and context
6. Count links by external domain
7. Save result to entity data file
8. Return analysis

---

## 3. Data Storage

Analysis results are saved as data files on the entity:

```
Entity: example.com/about
Data Files:
  - html/raw.txt           # Original HTML (existing)
  - analysis/structure.json
  - analysis/content.json
  - analysis/links.json
```

Use existing `Cache__Entity.data__save()` method.

---

## 4. Schemas

### Schema__Analysis__Structure

```python
class Schema__Analysis__Structure(Type_Safe):
    element_count   : int
    max_depth       : int
    elements        : dict[str, int]
    structure       : Schema__Structure__Detection
    meta            : Schema__Meta__Info
    main_content_selector: Optional[str]

class Schema__Structure__Detection(Type_Safe):
    has_doctype : bool
    has_header  : bool
    has_nav     : bool
    has_main    : bool
    has_article : bool
    has_footer  : bool
    has_aside   : bool

class Schema__Meta__Info(Type_Safe):
    title       : Optional[str]
    description : Optional[str]
    charset     : Optional[str]
    viewport    : Optional[str]
```

### Schema__Analysis__Content

```python
class Schema__Analysis__Content(Type_Safe):
    word_count          : int
    char_count          : int
    paragraph_count     : int
    reading_time_minutes: int
    language            : str
    topics              : list[Schema__Topic]
    sentiment           : Schema__Sentiment
    readability         : Schema__Readability
    entities            : list[Schema__Entity]
    keywords            : list[str]

class Schema__Topic(Type_Safe):
    topic      : str
    confidence : float

class Schema__Sentiment(Type_Safe):
    overall      : float
    label        : str
    distribution : dict[str, float]

class Schema__Readability(Type_Safe):
    flesch_reading_ease        : float
    flesch_kincaid_grade       : float
    gunning_fog                : float
    automated_readability_index: float
```

### Schema__Analysis__Links

```python
class Schema__Analysis__Links(Type_Safe):
    total_links      : int
    internal_count   : int
    external_count   : int
    internal_links   : list[Schema__Link]
    external_links   : list[Schema__External__Link]
    link_domains     : dict[str, int]
    anchor_only      : int
    javascript_links : int
    mailto_links     : int

class Schema__Link(Type_Safe):
    href    : str
    text    : str
    element : str

class Schema__External__Link(Schema__Link):
    domain : str
```

---

## 5. Service Methods

```python
class Html__Analysis__Service:
    
    def analyze_structure(self, namespace: str, cache_id: str) -> Schema__Analysis__Structure__Response:
        # 1. Load HTML
        # 2. Parse and analyze
        # 3. Save to data file
        # 4. Return response
        pass
    
    def analyze_content(self, namespace: str, cache_id: str) -> Schema__Analysis__Content__Response:
        # 1. Load HTML
        # 2. Extract text
        # 3. Call LLM for analysis
        # 4. Calculate readability
        # 5. Save to data file
        # 6. Return response
        pass
    
    def analyze_links(self, namespace: str, cache_id: str) -> Schema__Analysis__Links__Response:
        # 1. Load HTML
        # 2. Get cache_key for domain detection
        # 3. Parse links
        # 4. Classify and count
        # 5. Save to data file
        # 6. Return response
        pass
```

---

## 6. Route Methods

```python
class Routes__Html__Analysis:
    
    @route_post('/flet-html-domain/html/analyze/{namespace}/structure')
    def analyze_structure(self, namespace: str, data: Schema__Analysis__Request) -> Schema__Analysis__Structure__Response:
        return self.service.analyze_structure(namespace, data.cache_id)
    
    @route_post('/flet-html-domain/html/analyze/{namespace}/content')
    def analyze_content(self, namespace: str, data: Schema__Analysis__Request) -> Schema__Analysis__Content__Response:
        return self.service.analyze_content(namespace, data.cache_id)
    
    @route_post('/flet-html-domain/html/analyze/{namespace}/links')
    def analyze_links(self, namespace: str, data: Schema__Analysis__Request) -> Schema__Analysis__Links__Response:
        return self.service.analyze_links(namespace, data.cache_id)
```

---

## 7. Acceptance Criteria

### Structure Analysis
- [ ] Counts all HTML elements by tag
- [ ] Calculates max DOM depth
- [ ] Detects semantic elements (header, nav, main, footer)
- [ ] Extracts meta information
- [ ] Saves to `analysis/structure.json`

### Content Analysis
- [ ] Counts words, characters, paragraphs
- [ ] Detects language
- [ ] Extracts topics via LLM
- [ ] Calculates sentiment via LLM
- [ ] Calculates readability scores
- [ ] Extracts named entities
- [ ] Saves to `analysis/content.json`

### Link Analysis
- [ ] Counts all links
- [ ] Classifies internal vs external
- [ ] Extracts link text and href
- [ ] Counts links by external domain
- [ ] Handles special links (anchor, javascript, mailto)
- [ ] Saves to `analysis/links.json`

---

## 8. Error Handling

```python
# Cache not found
{
    "success": false,
    "error": "cache_not_found",
    "message": "No entity found with cache_id: ..."
}

# Invalid HTML
{
    "success": false,
    "error": "parse_error",
    "message": "Failed to parse HTML: ..."
}

# LLM error (for content analysis)
{
    "success": false,
    "error": "llm_error",
    "message": "LLM analysis failed: ..."
}
```

---

*This is a backend API story. Refer to existing FLeT API patterns for implementation details.*
