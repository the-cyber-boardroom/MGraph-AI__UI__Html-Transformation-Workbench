# Implementation Brief: Type-Safe Properties System

**Document:** brief-007__gitgraph-issues__type-safe-properties  
**Version:** v1.0  
**Date:** 2026-02-03  
**Author:** Architecture Session  
**Status:** Ready for Implementation  
**Related:** brief-006 (Phase 2), brief-006a (Phase 2 Backend)  
**Project:** GitGraph Issues

---

## Executive Summary

This brief introduces a **type-safe property system** for GitGraph Issues. Currently, issue properties are untyped dictionaries. This phase adds:

1. **Property Type Registry** — Built-in types (`Safe_Str__Text`, `Safe_UInt`, etc.) + custom types
2. **Custom Type Definitions** — User-defined enums, constrained strings, and constrained numbers
3. **Property Definitions per Node Type** — Each issue type declares its expected properties
4. **Runtime Validation** — All property values validated against Type_Safe classes on save
5. **UI Integration** — Appropriate input controls (dropdowns for enums, validation feedback)

---

## Key Design Decisions

### 1. Type Registry Location

**Config Files:**
```
.issues/config/
├── property-types.json     ← Custom enum/string/number definitions
├── node-types.json         ← Issue types with property definitions
└── link-types.json         ← (unchanged)
```

**Rationale:** Keep type definitions in config alongside node-types. No code changes needed to add custom types.

### 2. Built-in vs Custom Types

| Category | Source | Examples |
|----------|--------|----------|
| **Built-in** | Hardcoded in registry | `Safe_Str__Text`, `Safe_UInt`, `bool`, `List` |
| **Custom Enums** | `property-types.json` | `Enum__Agent__Type`, `Enum__Priority` |
| **Custom Strings** | `property-types.json` | `Safe_Str__Model_Name` (regex-constrained) |
| **Custom Numbers** | `property-types.json` | `Safe_UInt__Percentage` (range-constrained) |

### 3. Validation Strategy

- **Validate on save** — Not on load (backward compatibility with existing data)
- **Strict mode optional** — Config flag to reject unknown properties
- **Graceful degradation** — Unknown types treated as `Safe_Str__Text`

### 4. Backward Compatibility

- Existing `issue.json` files without typed properties continue to work
- Properties not in schema are preserved (not deleted)
- Validation errors are warnings by default, errors only in strict mode

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  .issues/config/                                             │
├─────────────────────────────────────────────────────────────┤
│  property-types.json     ← Custom enum/type definitions      │
│  node-types.json         ← Issue types with property refs    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Property__Type__Registry                                    │
├─────────────────────────────────────────────────────────────┤
│  Built-in:  Safe_Str__Text, Safe_UInt, Safe_Float, bool...  │
│  Custom:    Enum__Agent__Type, Enum__Provider, ...          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Runtime Validation                                          │
│  property_value → lookup type_ref → validate with Type_Safe │
└─────────────────────────────────────────────────────────────┘
```

---

## Task Overview

### Backend Tasks (B23-B28)

| Task | Priority | Description | Blocks UI? |
|------|----------|-------------|------------|
| **B23** | P0 | Property Type Registry + built-in types | Yes - U12 |
| **B24** | P0 | Custom type definitions (`property-types.json`) | Yes - U12, U13 |
| **B25** | P1 | Property definitions in `node-types.json` | Yes - U12, U14 |
| **B26** | P1 | Validation on `node_save()` | No |
| **B27** | P1 | `/config/api/property-types` endpoint | Yes - U12, U13 |
| **B28** | P2 | CRUD for custom enum types | Yes - U13 |

### UI Tasks (U12-U15)

| Task | Priority | Description | Depends On |
|------|----------|-------------|------------|
| **U12** | P0 | Dynamic property inputs on issue form | B23, B24, B25, B27 |
| **U13** | P2 | Custom enum type editor | B24, B27, B28 |
| **U14** | P2 | Property definition editor (in node type config) | B25 |
| **U15** | P3 | Validation error display | B26 |

---

## Parallelization Analysis

```
Week 1:
  Backend: B23 → B24 → B27 ─────────────────────────────────────┐
                                                                │
Week 2:                                                         ▼
  Backend: B25 → B26                          UI: U12 (can start)
           B28                                    
                                                                
Week 3:                                                         │
  (Backend complete)                          UI: U13, U14 ◄────┘
                                                  U15
```

### What Can Run in Parallel

| Backend Task | UI Work That Can Start |
|--------------|------------------------|
| B23/B24/B27 complete | U12 dynamic property inputs |
| B28 complete | U13 custom enum editor |
| B25 complete | U14 property definition editor |

### Backend-Only Tasks (No UI Dependency)

- B26: Validation on save (can be done anytime)

---

## Backend Task Details

### B23: Property Type Registry + Built-in Types
**Priority:** P0 (Critical)
**Blocks:** U12

**New file:** `Property__Type__Registry.py`

```python
# ═══════════════════════════════════════════════════════════════════════════════
# Property__Type__Registry - Registry of allowed property types
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                      import Dict, Type, Any, List, Tuple
from osbot_utils.type_safe.Type_Safe                                             import Type_Safe
from osbot_utils.type_safe.decorators.type_safe                                  import type_safe
from osbot_utils.type_safe.primitives.core.Safe_Str                              import Safe_Str
from osbot_utils.type_safe.primitives.core.Safe_UInt                             import Safe_UInt
from osbot_utils.type_safe.primitives.core.Safe_Int                              import Safe_Int
from osbot_utils.type_safe.primitives.core.Safe_Float                            import Safe_Float
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text     import Safe_Str__Text
from osbot_utils.type_safe.primitives.domains.web.safe_str.Safe_Str__Url         import Safe_Str__Url
from osbot_utils.type_safe.primitives.domains.web.safe_str.Safe_Str__Email       import Safe_Str__Email
from osbot_utils.type_safe.primitives.domains.files.safe_str.Safe_Str__File__Path import Safe_Str__File__Path


BUILTIN_PROPERTY_TYPES: Dict[str, Type] = {                                      # Built-in Type_Safe classes
    # Strings
    'Safe_Str'            : Safe_Str           ,
    'Safe_Str__Text'      : Safe_Str__Text     ,
    'Safe_Str__Url'       : Safe_Str__Url      ,
    'Safe_Str__Email'     : Safe_Str__Email    ,
    'Safe_Str__File_Path' : Safe_Str__File__Path,
    
    # Numbers
    'Safe_Int'            : Safe_Int           ,
    'Safe_UInt'           : Safe_UInt          ,
    'Safe_Float'          : Safe_Float         ,
    
    # Boolean
    'bool'                : bool               ,
    
    # Collections (element type specified separately)
    'List'                : list               ,
    'Dict'                : dict               ,
}


class Property__Type__Registry(Type_Safe):                                       # Registry for property types
    builtin_types  : Dict[str, Type]           = None                            # Built-in Type_Safe classes
    custom_enums   : Dict[str, List[str]]      = None                            # Custom enum definitions
    custom_strings : Dict[str, dict]           = None                            # Constrained string defs
    custom_numbers : Dict[str, dict]           = None                            # Constrained number defs
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.builtin_types is None:
            self.builtin_types  = dict(BUILTIN_PROPERTY_TYPES)
        if self.custom_enums is None:
            self.custom_enums   = {}
        if self.custom_strings is None:
            self.custom_strings = {}
        if self.custom_numbers is None:
            self.custom_numbers = {}
    
    @type_safe
    def get_type(self, type_ref: str) -> Type:                                   # Lookup type by reference
        """Get Type_Safe class for a type reference."""
        if type_ref in self.builtin_types:
            return self.builtin_types[type_ref]
        
        if type_ref in self.custom_enums:
            return self.create_enum_type(type_ref)
        
        if type_ref in self.custom_strings:
            return self.create_constrained_str(type_ref)
        
        if type_ref in self.custom_numbers:
            return self.create_constrained_number(type_ref)
        
        return None
    
    @type_safe
    def create_enum_type(self, type_ref: str) -> Type:                           # Create enum class dynamically
        """Create a runtime enum from definition."""
        from enum import Enum
        values = self.custom_enums[type_ref]
        return Enum(type_ref, {v.upper().replace('-', '_'): v for v in values})
    
    @type_safe
    def create_constrained_str(self, type_ref: str) -> Type:                     # Create constrained string type
        """Create a constrained string type from definition."""
        # Returns Safe_Str__Text for now; future: dynamic subclass with regex
        return Safe_Str__Text
    
    @type_safe
    def create_constrained_number(self, type_ref: str) -> Type:                  # Create constrained number type
        """Create a constrained number type from definition."""
        # Returns Safe_UInt for now; future: dynamic subclass with range
        return Safe_UInt
    
    @type_safe
    def validate_value(self              ,                                       # Validate property value
                       type_ref : str    ,
                       value    : Any
                  ) -> Tuple[bool, str]:
        """Validate a value against a type reference. Returns (is_valid, error_message)."""
        if type_ref in self.custom_enums:
            if value not in self.custom_enums[type_ref]:
                allowed = ', '.join(self.custom_enums[type_ref])
                return (False, f"Invalid enum value '{value}'. Allowed: {allowed}")
            return (True, '')
        
        type_class = self.get_type(type_ref)
        
        if type_class is None:
            return (False, f'Unknown type: {type_ref}')
        
        try:
            type_class(value)
            return (True, '')
        except Exception as e:
            return (False, str(e))
    
    @type_safe
    def is_enum_type(self, type_ref: str) -> bool:                               # Check if type is enum
        """Check if a type reference is an enum."""
        return type_ref in self.custom_enums
    
    @type_safe
    def get_enum_values(self, type_ref: str) -> List[str]:                       # Get enum allowed values
        """Get allowed values for an enum type."""
        return self.custom_enums.get(type_ref, [])
```

**Files:** `mgraph_ai_ui_html_transformation_workbench/services/Property__Type__Registry.py`

---

### B24: Custom Type Definitions
**Priority:** P0 (Critical)
**Blocks:** U12, U13

**New config file:** `.issues/config/property-types.json`

```json
{
  "enums": {
    "Enum__Agent__Type": {
      "display_name": "Agent Type",
      "values": ["human", "genai"]
    },
    "Enum__Provider": {
      "display_name": "Provider",
      "values": ["anthropic", "openai", "google", "human", "other"]
    },
    "Enum__Priority": {
      "display_name": "Priority",
      "values": ["critical", "high", "medium", "low"]
    },
    "Enum__Status": {
      "display_name": "Status",
      "values": ["draft", "active", "completed", "archived"]
    }
  },
  "constrained_strings": {
    "Safe_Str__Model_Name": {
      "display_name": "Model Name",
      "max_length": 50,
      "regex": "^[a-z0-9-]+$"
    },
    "Safe_Str__Semver": {
      "display_name": "Semantic Version",
      "regex": "^\\d+\\.\\d+\\.\\d+$"
    }
  },
  "constrained_numbers": {
    "Safe_UInt__Percentage": {
      "display_name": "Percentage",
      "min_value": 0,
      "max_value": 100
    },
    "Safe_UInt__Token_Limit": {
      "display_name": "Token Limit",
      "min_value": 1,
      "max_value": 1000000
    }
  }
}
```

**Loader method in Registry:**

```python
    @type_safe
    def load_custom_types(self, config_path: str) -> bool:                       # Load from property-types.json
        """Load custom type definitions from config file."""
        from osbot_utils.utils.Files import file_exists
        from osbot_utils.utils.Json  import json_load_file
        
        if file_exists(config_path) is False:
            return False
        
        data = json_load_file(config_path)
        
        # Load enums
        for name, definition in data.get('enums', {}).items():
            self.custom_enums[name] = definition.get('values', [])
        
        # Load constrained strings
        for name, definition in data.get('constrained_strings', {}).items():
            self.custom_strings[name] = definition
        
        # Load constrained numbers
        for name, definition in data.get('constrained_numbers', {}).items():
            self.custom_numbers[name] = definition
        
        return True
```

---

### B25: Property Definitions in Node Types
**Priority:** P1
**Blocks:** U12, U14

**Schema for property definitions:**

```python
# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Property__Definition - Property schema for node types
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                             import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text     import Safe_Str__Text


class Schema__Property__Definition(Type_Safe):                                   # Property definition schema
    name          : Safe_Str__Text                                               # Property key (e.g., 'agent_type')
    display_name  : Safe_Str__Text                                               # UI label (e.g., 'Agent Type')
    type_ref      : Safe_Str__Text                                               # Reference to type (e.g., 'Enum__Agent__Type')
    element_type  : Safe_Str__Text            = Safe_Str__Text('')               # For List/Dict: element type ref
    required      : bool                      = False                            # Is this property required?
    default_value : Safe_Str__Text            = Safe_Str__Text('')               # JSON-encoded default
    description   : Safe_Str__Text            = Safe_Str__Text('')               # Help text for UI
```

**Updated node-types.json structure:**

```json
{
  "agent": {
    "node_type_id": "...",
    "name": "agent",
    "display_name": "Agent",
    "color": "#06b6d4",
    "statuses": ["active", "inactive", "archived"],
    "default_status": "active",
    "properties": [
      {
        "name": "agent_type",
        "display_name": "Agent Type",
        "type_ref": "Enum__Agent__Type",
        "required": true
      },
      {
        "name": "provider",
        "display_name": "Provider",
        "type_ref": "Enum__Provider",
        "required": true
      },
      {
        "name": "model",
        "display_name": "Model",
        "type_ref": "Safe_Str__Text",
        "required": false
      },
      {
        "name": "max_tokens",
        "display_name": "Max Tokens",
        "type_ref": "Safe_UInt__Token_Limit",
        "required": false
      },
      {
        "name": "capabilities",
        "display_name": "Capabilities",
        "type_ref": "List",
        "element_type": "Safe_Str__Text",
        "required": false
      }
    ]
  }
}
```

**Update Schema__Node__Type to include properties:**

```python
class Schema__Node__Type(Type_Safe):                                             # Node type definition
    node_type_id   : Safe_Str__Node_Type_Id                                      # Unique ID
    name           : Safe_Str__Node_Type                                         # Type name (e.g., 'task')
    display_name   : Safe_Str__Text            = Safe_Str__Text('')              # UI display name
    color          : Safe_Str__Hex_Color       = Safe_Str__Hex_Color('#6b7280')  # Badge color
    statuses       : List[str]                 = None                            # Allowed statuses
    default_status : Safe_Str__Text            = Safe_Str__Text('open')          # Default status
    properties     : List[Schema__Property__Definition] = None                   # Property definitions (NEW)
```

---

### B26: Validation on node_save()
**Priority:** P1

**Update Node__Service.node_save():**

```python
    @type_safe
    def node_save(self                     ,
                  node      : Schema__Node ,
                  validate  : bool = True
             ) -> bool:
        """Save node with optional property validation."""
        
        if validate is True:
            validation_result = self.validate_node_properties(node)
            if validation_result.is_valid is False:
                # Log warnings or raise depending on strict mode
                for error in validation_result.errors:
                    self.log_validation_error(error)
                
                if self.strict_validation is True:
                    return False
        
        return self.repository.node_save(node)
    
    @type_safe
    def validate_node_properties(self                     ,
                                 node : Schema__Node
                            ) -> Schema__Validation__Result:
        """Validate all properties against their type definitions."""
        errors = []
        
        # Get property definitions for this node type
        node_type = self.type_service.get_node_type(node.node_type)
        if node_type is None or node_type.properties is None:
            return Schema__Validation__Result(is_valid=True, errors=[])
        
        # Build lookup of property definitions
        prop_defs = {p.name: p for p in node_type.properties}
        
        # Validate each defined property
        for prop_def in node_type.properties:
            prop_name = str(prop_def.name)
            
            # Check required
            if prop_def.required is True:
                if prop_name not in node.properties or node.properties[prop_name] is None:
                    errors.append(f"Required property '{prop_name}' is missing")
                    continue
            
            # Validate value if present
            if prop_name in node.properties:
                value    = node.properties[prop_name]
                type_ref = str(prop_def.type_ref)
                
                is_valid, error_msg = self.type_registry.validate_value(type_ref, value)
                if is_valid is False:
                    errors.append(f"Property '{prop_name}': {error_msg}")
        
        return Schema__Validation__Result(
            is_valid = len(errors) == 0,
            errors   = errors
        )
```

---

### B27: Property Types Endpoint
**Priority:** P1
**Blocks:** U12, U13

**New endpoint in Routes__Types.py:**

```
GET /config/api/property-types
```

**Response schema:**

```python
class Schema__Property__Types__Response(Type_Safe):                              # API response for property types
    success  : bool
    builtin  : List[Schema__Builtin__Type__Info]
    custom   : Schema__Custom__Types
    

class Schema__Builtin__Type__Info(Type_Safe):                                    # Built-in type info
    name         : Safe_Str__Text                                                # e.g., 'Safe_Str__Text'
    display_name : Safe_Str__Text                                                # e.g., 'Text'
    category     : Safe_Str__Text                                                # 'string', 'number', 'boolean', 'collection'


class Schema__Custom__Types(Type_Safe):                                          # Custom type definitions
    enums   : List[Schema__Enum__Info]
    strings : List[Schema__Constrained__String__Info]
    numbers : List[Schema__Constrained__Number__Info]
```

**Example response:**

```json
{
  "success": true,
  "builtin": [
    {"name": "Safe_Str__Text", "display_name": "Text", "category": "string"},
    {"name": "Safe_Str__Url", "display_name": "URL", "category": "string"},
    {"name": "Safe_Str__Email", "display_name": "Email", "category": "string"},
    {"name": "Safe_UInt", "display_name": "Positive Integer", "category": "number"},
    {"name": "Safe_Int", "display_name": "Integer", "category": "number"},
    {"name": "Safe_Float", "display_name": "Decimal", "category": "number"},
    {"name": "bool", "display_name": "Boolean", "category": "boolean"},
    {"name": "List", "display_name": "List", "category": "collection"},
    {"name": "Dict", "display_name": "Dictionary", "category": "collection"}
  ],
  "custom": {
    "enums": [
      {"name": "Enum__Agent__Type", "display_name": "Agent Type", "values": ["human", "genai"]},
      {"name": "Enum__Provider", "display_name": "Provider", "values": ["anthropic", "openai", "google", "human", "other"]},
      {"name": "Enum__Priority", "display_name": "Priority", "values": ["critical", "high", "medium", "low"]}
    ],
    "strings": [
      {"name": "Safe_Str__Model_Name", "display_name": "Model Name", "max_length": 50, "regex": "^[a-z0-9-]+$"}
    ],
    "numbers": [
      {"name": "Safe_UInt__Percentage", "display_name": "Percentage", "min_value": 0, "max_value": 100},
      {"name": "Safe_UInt__Token_Limit", "display_name": "Token Limit", "min_value": 1, "max_value": 1000000}
    ]
  }
}
```

---

### B28: CRUD for Custom Enum Types
**Priority:** P2
**Blocks:** U13

**Endpoints:**

```
GET    /config/api/property-types/enums              # List all enums
GET    /config/api/property-types/enums/{name}       # Get one
POST   /config/api/property-types/enums              # Create
PUT    /config/api/property-types/enums/{name}       # Update
DELETE /config/api/property-types/enums/{name}       # Delete (if not in use)
```

**Create/Update body:**

```json
{
  "name": "Enum__Priority",
  "display_name": "Priority",
  "values": ["critical", "high", "medium", "low"]
}
```

**Delete validation:** Cannot delete enum if any node type uses it in property definitions.

---

## UI Task Details

### U12: Dynamic Property Inputs
**Priority:** P0
**Depends on:** B23, B24, B25, B27

**Changes to issue edit form:**

1. Fetch property definitions from `/config/api/property-types`
2. Fetch node type to get property schema
3. Render appropriate input for each property type:

| Type Category | Input Component |
|---------------|-----------------|
| `Safe_Str__*` | Text input |
| `Safe_Str__Url` | URL input with validation |
| `Safe_Str__Email` | Email input with validation |
| `Safe_UInt`, `Safe_Int` | Number input |
| `Safe_Float` | Number input (step="0.01") |
| `bool` | Checkbox or toggle |
| `Enum__*` | Dropdown select |
| `List` | Multi-value input (tags) |

**Example component structure:**

```jsx
function PropertyInput({ definition, value, onChange, typeRegistry }) {
  const { type_ref, display_name, required } = definition;
  
  if (typeRegistry.isEnum(type_ref)) {
    const options = typeRegistry.getEnumValues(type_ref);
    return (
      <Select 
        label={display_name}
        required={required}
        value={value}
        onChange={onChange}
        options={options}
      />
    );
  }
  
  if (type_ref === 'bool') {
    return <Checkbox label={display_name} checked={value} onChange={onChange} />;
  }
  
  if (type_ref.includes('UInt') || type_ref.includes('Int')) {
    return <NumberInput label={display_name} required={required} value={value} onChange={onChange} />;
  }
  
  // Default: text input
  return <TextInput label={display_name} required={required} value={value} onChange={onChange} />;
}
```

---

### U13: Custom Enum Type Editor
**Priority:** P2
**Depends on:** B24, B27, B28

**Features:**

- List all custom enum types
- Add new enum type (name, display_name, values)
- Edit values for existing enum
- Delete enum (with warning if in use)
- Drag-to-reorder enum values

---

### U14: Property Definition Editor
**Priority:** P2
**Depends on:** B25

**Features (within Node Type config screen):**

- List properties for node type
- Add property (name, display_name, type_ref, required, default)
- Edit existing property
- Delete property
- Reorder properties

---

### U15: Validation Error Display
**Priority:** P3
**Depends on:** B26

**Features:**

- Show validation errors inline next to inputs
- Summary of errors at form top
- Prevent save if required fields missing
- Warning icon for invalid values

---

## Example: Issue with Typed Properties

**Node type definition (in node-types.json):**

```json
{
  "name": "agent",
  "display_name": "Agent",
  "color": "#06b6d4",
  "properties": [
    {"name": "agent_type", "display_name": "Agent Type", "type_ref": "Enum__Agent__Type", "required": true},
    {"name": "provider", "display_name": "Provider", "type_ref": "Enum__Provider", "required": true},
    {"name": "model", "display_name": "Model", "type_ref": "Safe_Str__Text"},
    {"name": "max_tokens", "display_name": "Max Tokens", "type_ref": "Safe_UInt__Token_Limit"},
    {"name": "capabilities", "display_name": "Capabilities", "type_ref": "List", "element_type": "Safe_Str__Text"}
  ]
}
```

**Issue instance (in issue.json):**

```json
{
  "label": "Agent-1",
  "node_type": "agent",
  "title": "Claude (Architecture Session)",
  "status": "active",
  "properties": {
    "agent_type": "genai",
    "provider": "anthropic",
    "model": "claude-opus-4-5",
    "max_tokens": 16000,
    "capabilities": ["code", "analysis", "writing"]
  }
}
```

---

## Files Summary

### New Files

```
schemas/
└── Schema__Property__Definition.py          # B25
└── Schema__Validation__Result.py            # B26

services/
└── Property__Type__Registry.py              # B23, B24

config/ (runtime)
└── property-types.json                      # B24 (config file)
```

### Modified Files

```
Schema__Node__Type.py                        # B25 (add properties field)
Type__Service.py                             # B25, B27, B28
Node__Service.py                             # B26 (validation)
Routes__Types.py                             # B27, B28
```

---

## Success Criteria

### Backend ✓ When:

- [ ] B23: `Property__Type__Registry` loads built-in types
- [ ] B24: Custom types load from `property-types.json`
- [ ] B25: Node types include property definitions
- [ ] B26: `node_save()` validates properties against definitions
- [ ] B27: `/config/api/property-types` returns all types
- [ ] B28: CRUD endpoints work for custom enums

### UI ✓ When:

- [ ] U12: Issue form renders correct input for each property type
- [ ] U12: Enum properties show dropdown with correct options
- [ ] U13: Can create/edit/delete custom enum types
- [ ] U14: Can define properties for node types
- [ ] U15: Validation errors display inline

---

## Testing Checklist

Before merging, verify:

1. **Type Safety:** All new code passes `@type_safe` validation
2. **Backward Compatibility:** Existing issues without typed properties still load/save
3. **Validation:** Required properties enforced, enum values validated
4. **UI:** Correct input controls render for each type
5. **CRUD:** Custom enum create/update/delete works

---

## Summary

| Layer | What's Stored |
|-------|---------------|
| **property-types.json** | Custom enum, string, number type definitions |
| **node-types.json** | Property definitions referencing types by `type_ref` |
| **issue.json** | Actual property values (validated at save time) |
| **Runtime Registry** | Combines built-in + custom types for validation |

This gives users a **type-safe property system** where:

1. All values are validated against actual Type_Safe classes
2. Custom enums can be defined without code changes
3. Constrained strings/numbers can have regex/range limits
4. UI renders appropriate inputs (dropdowns for enums, etc.)
5. No raw `str`, `int`, `float` anywhere

---

*Implementation Brief v1.0*  
*Project: GitGraph Issues*  
*Feature: Type-Safe Properties System*  
*Tasks: B23-B28, U12-U15*  
*Date: 2026-02-03*
