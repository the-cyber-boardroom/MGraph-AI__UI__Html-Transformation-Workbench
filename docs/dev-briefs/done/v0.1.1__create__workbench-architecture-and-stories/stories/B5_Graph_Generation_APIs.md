# Story B5: Graph Generation APIs

**Story ID:** B5  
**Layer:** Backend APIs  
**Priority:** MEDIUM  
**Parallel With:** B1, B2, B3, B4  
**Dependencies:** None (uses existing cache data)

---

## 1. Purpose

Create backend endpoints for generating visualization-ready graph data. These graphs are consumed by the frontend Graph Visualizer component (S2).

**You are building:**
- DOM tree graph endpoint (page structure visualization)
- Site link graph endpoint (page relationships)

---

## 2. Graph Output Format

All graphs use a common format compatible with D3.js:

```json
{
    "format": "d3",
    "nodes": [
        { "id": "node-1", "label": "html", "type": "element", "data": {...} }
    ],
    "edges": [
        { "source": "node-1", "target": "node-2", "type": "child", "data": {...} }
    ],
    "metadata": {
        "node_count": 50,
        "edge_count": 49,
        "generated_at": 1768970000000
    }
}
```

---

## 3. Endpoints

### 3.1 DOM Tree Graph

```
POST /flet-html-domain/html/graph/{namespace}/dom-tree
```

**Request:**
```json
{
    "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd",
    "max_depth": 5,
    "include_text": false,
    "collapse_threshold": 10
}
```

**Parameters:**
- `max_depth`: Maximum depth to traverse (default: 10)
- `include_text`: Include text nodes (default: false)
- `collapse_threshold`: Collapse nodes with more than N children (default: 0 = no collapse)

**Response:**
```json
{
    "success": true,
    "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd",
    "graph": {
        "format": "d3",
        "nodes": [
            {
                "id": "n0",
                "label": "html",
                "type": "element",
                "data": {
                    "tag": "html",
                    "depth": 0,
                    "child_count": 2,
                    "attributes": { "lang": "en" }
                }
            },
            {
                "id": "n1",
                "label": "head",
                "type": "element",
                "data": {
                    "tag": "head",
                    "depth": 1,
                    "child_count": 5
                }
            },
            {
                "id": "n2",
                "label": "body",
                "type": "element",
                "data": {
                    "tag": "body",
                    "depth": 1,
                    "child_count": 3,
                    "classes": ["main-body"]
                }
            },
            {
                "id": "n3",
                "label": "header",
                "type": "semantic",
                "data": {
                    "tag": "header",
                    "depth": 2,
                    "child_count": 2
                }
            }
        ],
        "edges": [
            { "source": "n0", "target": "n1", "type": "child" },
            { "source": "n0", "target": "n2", "type": "child" },
            { "source": "n2", "target": "n3", "type": "child" }
        ],
        "metadata": {
            "node_count": 50,
            "edge_count": 49,
            "max_depth_reached": 5,
            "truncated": true
        }
    },
    "saved_to": "graphs/dom-tree.json",
    "generated_at": 1768970000000
}
```

**Implementation:**
1. Load HTML from cache
2. Parse HTML into DOM tree
3. Traverse tree up to max_depth
4. Create node for each element
5. Create edge for each parent-child relationship
6. Apply collapse_threshold if set
7. Save to entity data file
8. Return graph

---

### 3.2 Site Link Graph

```
POST /flet-html-domain/site/graph/{namespace}/links/{domain}
```

**Request:**
```json
{
    "include_external": true,
    "max_external_per_domain": 5,
    "layout_hint": "force"
}
```

**Parameters:**
- `include_external`: Include external links (default: true)
- `max_external_per_domain`: Limit external links per domain (default: 10)
- `layout_hint`: Suggested layout ("force", "hierarchy", "radial")

**Response:**
```json
{
    "success": true,
    "domain": "example.com",
    "graph": {
        "format": "d3",
        "layout_hint": "force",
        "nodes": [
            {
                "id": "p:/",
                "label": "Home",
                "type": "page",
                "data": {
                    "path": "/",
                    "cache_id": "aa27fb2a-...",
                    "title": "Home",
                    "internal_links": 5,
                    "external_links": 3
                }
            },
            {
                "id": "p:/about",
                "label": "About",
                "type": "page",
                "data": {
                    "path": "/about",
                    "cache_id": "bb38gc3b-...",
                    "title": "About Us"
                }
            },
            {
                "id": "p:/blog",
                "label": "Blog",
                "type": "page",
                "data": {
                    "path": "/blog",
                    "cache_id": "cc49hd4c-..."
                }
            },
            {
                "id": "e:twitter.com",
                "label": "twitter.com",
                "type": "external",
                "data": {
                    "domain": "twitter.com",
                    "link_count": 3
                }
            },
            {
                "id": "e:github.com",
                "label": "github.com",
                "type": "external",
                "data": {
                    "domain": "github.com",
                    "link_count": 2
                }
            }
        ],
        "edges": [
            {
                "source": "p:/",
                "target": "p:/about",
                "type": "internal",
                "data": { "link_count": 2 }
            },
            {
                "source": "p:/",
                "target": "p:/blog",
                "type": "internal",
                "data": { "link_count": 1 }
            },
            {
                "source": "p:/about",
                "target": "p:/",
                "type": "internal",
                "data": { "link_count": 1 }
            },
            {
                "source": "p:/",
                "target": "e:twitter.com",
                "type": "external",
                "data": { "link_count": 2 }
            }
        ],
        "metadata": {
            "internal_nodes": 3,
            "external_nodes": 2,
            "internal_edges": 3,
            "external_edges": 5,
            "layout_hint": "force"
        }
    },
    "saved_to": "_site-analysis/graphs/link-graph.json",
    "generated_at": 1768970000000
}
```

**Implementation:**
1. Get all pages for domain
2. For each page, load or run link analysis (B3)
3. Build nodes for each internal page
4. Build edges for internal links between pages
5. If include_external:
   - Aggregate external domains
   - Create nodes for top external domains
   - Create edges for external links
6. Add layout hint for frontend
7. Save to `_site-analysis` entity
8. Return graph

---

## 4. Node Types

### DOM Tree Nodes

| Type | Description | Color Suggestion |
|------|-------------|------------------|
| `root` | Document root | #333 |
| `element` | Regular HTML element | #4CAF50 |
| `semantic` | Semantic element (header, nav, main, footer) | #2196F3 |
| `text` | Text node (if included) | #9E9E9E |
| `collapsed` | Collapsed group of nodes | #FF9800 |

### Link Graph Nodes

| Type | Description | Color Suggestion |
|------|-------------|------------------|
| `page` | Internal page | #4CAF50 |
| `external` | External domain | #FF5722 |
| `orphan` | Page with no incoming links | #9C27B0 |

---

## 5. Edge Types

### DOM Tree Edges

| Type | Description |
|------|-------------|
| `child` | Parent-child relationship |

### Link Graph Edges

| Type | Description |
|------|-------------|
| `internal` | Link between internal pages |
| `external` | Link to external domain |
| `bidirectional` | Both pages link to each other |

---

## 6. Schemas

### Schema__Graph

```python
class Schema__Graph(Type_Safe):
    format      : str  # "d3"
    nodes       : list[Schema__Graph__Node]
    edges       : list[Schema__Graph__Edge]
    metadata    : Schema__Graph__Metadata
    layout_hint : Optional[str]

class Schema__Graph__Node(Type_Safe):
    id    : str
    label : str
    type  : str
    data  : dict

class Schema__Graph__Edge(Type_Safe):
    source : str
    target : str
    type   : str
    data   : Optional[dict]

class Schema__Graph__Metadata(Type_Safe):
    node_count   : int
    edge_count   : int
    generated_at : int
```

### Request Schemas

```python
class Schema__DOM__Tree__Request(Type_Safe):
    cache_id           : str
    max_depth          : int = 10
    include_text       : bool = False
    collapse_threshold : int = 0

class Schema__Link__Graph__Request(Type_Safe):
    include_external        : bool = True
    max_external_per_domain : int = 10
    layout_hint             : str = "force"
```

---

## 7. Service Methods

```python
class Graph__Generation__Service:
    
    def generate_dom_tree(self, namespace: str, request: Schema__DOM__Tree__Request) -> Schema__Graph__Response:
        # 1. Load HTML
        # 2. Parse to DOM
        # 3. Traverse and build nodes/edges
        # 4. Apply max_depth and collapse
        # 5. Save to entity
        # 6. Return graph
        pass
    
    def generate_link_graph(self, namespace: str, domain: str, request: Schema__Link__Graph__Request) -> Schema__Graph__Response:
        # 1. Get all pages for domain
        # 2. Get link analysis for each page
        # 3. Build internal page nodes
        # 4. Build internal link edges
        # 5. Optionally add external nodes/edges
        # 6. Save to _site-analysis
        # 7. Return graph
        pass
```

---

## 8. DOM Tree Traversal Algorithm

```python
def build_dom_graph(root, max_depth=10, include_text=False, collapse_threshold=0):
    nodes = []
    edges = []
    node_id = 0
    
    def traverse(element, parent_id=None, depth=0):
        nonlocal node_id
        
        if depth > max_depth:
            return
        
        current_id = f"n{node_id}"
        node_id += 1
        
        # Determine node type
        node_type = "element"
        if element.name in ['header', 'nav', 'main', 'footer', 'article', 'section', 'aside']:
            node_type = "semantic"
        
        # Create node
        node = {
            "id": current_id,
            "label": element.name,
            "type": node_type,
            "data": {
                "tag": element.name,
                "depth": depth,
                "child_count": len(list(element.children)),
                "attributes": dict(element.attrs) if element.attrs else {}
            }
        }
        nodes.append(node)
        
        # Create edge to parent
        if parent_id:
            edges.append({
                "source": parent_id,
                "target": current_id,
                "type": "child"
            })
        
        # Handle children
        children = [c for c in element.children if hasattr(c, 'name')]
        
        if collapse_threshold > 0 and len(children) > collapse_threshold:
            # Create collapsed node
            collapsed_id = f"n{node_id}"
            node_id += 1
            nodes.append({
                "id": collapsed_id,
                "label": f"... {len(children)} children",
                "type": "collapsed",
                "data": {"child_count": len(children)}
            })
            edges.append({
                "source": current_id,
                "target": collapsed_id,
                "type": "child"
            })
        else:
            for child in children:
                traverse(child, current_id, depth + 1)
    
    traverse(root)
    return {"nodes": nodes, "edges": edges}
```

---

## 9. Acceptance Criteria

### DOM Tree Graph
- [ ] Generates valid D3-compatible graph
- [ ] Respects max_depth parameter
- [ ] Optionally includes text nodes
- [ ] Collapses large child groups
- [ ] Identifies semantic elements
- [ ] Includes element attributes
- [ ] Saves to `graphs/dom-tree.json`

### Site Link Graph
- [ ] Creates nodes for all internal pages
- [ ] Creates edges for all internal links
- [ ] Optionally includes external domains
- [ ] Limits external links per domain
- [ ] Includes layout hint
- [ ] Counts bidirectional links
- [ ] Saves to `_site-analysis/graphs/link-graph.json`

---

## 10. Error Handling

```python
# Cache not found
{
    "success": false,
    "error": "cache_not_found",
    "message": "No entity found with cache_id: ..."
}

# HTML too large
{
    "success": false,
    "error": "html_too_large",
    "message": "HTML exceeds maximum size for graph generation"
}

# No pages for domain
{
    "success": false,
    "error": "no_pages",
    "message": "No cached pages found for domain: example.com"
}
```

---

*This is a backend API story. Refer to existing FLeT API patterns for implementation details.*
