(todo: this needs converting into a proper brief, but the context window was maxed)  

## Type-Safe Properties System 

### Architecture

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

### 1. Built-in Type Registry

Available out of the box:

```python
# ═══════════════════════════════════════════════════════════════════════════════
# Property__Type__Registry - Registry of allowed property types
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                      import Dict, Type, Any
from osbot_utils.type_safe.Type_Safe                                             import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_Str                              import Safe_Str
from osbot_utils.type_safe.primitives.core.Safe_UInt                             import Safe_UInt
from osbot_utils.type_safe.primitives.core.Safe_Int                              import Safe_Int
from osbot_utils.type_safe.primitives.core.Safe_Float                            import Safe_Float
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text     import Safe_Str__Text
from osbot_utils.type_safe.primitives.domains.web.safe_str.Safe_Str__Url         import Safe_Str__Url
from osbot_utils.type_safe.primitives.domains.web.safe_str.Safe_Str__Email       import Safe_Str__Email
from osbot_utils.type_safe.primitives.domains.files.safe_str.Safe_Str__File__Path import Safe_Str__File__Path


BUILTIN_PROPERTY_TYPES: Dict[str, Type] = {
    # Strings
    'Safe_Str'           : Safe_Str          ,
    'Safe_Str__Text'     : Safe_Str__Text    ,
    'Safe_Str__Url'      : Safe_Str__Url     ,
    'Safe_Str__Email'    : Safe_Str__Email   ,
    'Safe_Str__File_Path': Safe_Str__File__Path,
    
    # Numbers
    'Safe_Int'           : Safe_Int          ,
    'Safe_UInt'          : Safe_UInt         ,
    'Safe_Float'         : Safe_Float        ,
    
    # Boolean
    'bool'               : bool              ,
    
    # Collections (element type specified separately)
    'List'               : list              ,
    'Dict'               : dict              ,
}
```

### 2. Custom Type Definitions

**New file: `.issues/config/property-types.json`**

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

### 3. Property Definition Schema

```python
class Schema__Property__Definition(Type_Safe):
    name          : Safe_Str__Text                                               # Property key (e.g., 'agent_type')
    display_name  : Safe_Str__Text                                               # UI label (e.g., 'Agent Type')
    type_ref      : Safe_Str__Text                                               # Reference to type (e.g., 'Enum__Agent__Type')
    element_type  : Safe_Str__Text            = ''                               # For List/Dict: element type ref
    required      : bool                      = False
    default_value : Safe_Str__Text            = ''                               # JSON-encoded default
    description   : Safe_Str__Text            = ''                               # Help text
```

### 4. Node Type with Properties

**In `node-types.json`:**
```json
{
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
      "type_ref": "Safe_Str__Text"
    },
    {
      "name": "max_tokens",
      "display_name": "Max Tokens",
      "type_ref": "Safe_UInt__Token_Limit"
    },
    {
      "name": "capabilities",
      "display_name": "Capabilities",
      "type_ref": "List",
      "element_type": "Safe_Str__Text"
    }
  ]
}
```

### 5. Issue with Type-Safe Properties

**In `issue.json`:**
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

### 6. Runtime Type Registry

```python
class Property__Type__Registry(Type_Safe):
    builtin_types : Dict[str, Type]           = None                             # Built-in Type_Safe classes
    custom_enums  : Dict[str, List[str]]      = None                             # Custom enum definitions
    custom_strings: Dict[str, dict]           = None                             # Constrained string defs
    custom_numbers: Dict[str, dict]           = None                             # Constrained number defs
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.builtin_types  = dict(BUILTIN_PROPERTY_TYPES)
        self.custom_enums   = {}
        self.custom_strings = {}
        self.custom_numbers = {}
    
    def load_custom_types(self, config_path: str):                               # Load from property-types.json
        """Load custom type definitions from config."""
        # Parse and register custom types
        ...
    
    def get_type(self, type_ref: str) -> Type:                                   # Lookup type by reference
        """Get Type_Safe class for a type reference."""
        if type_ref in self.builtin_types:
            return self.builtin_types[type_ref]
        
        if type_ref in self.custom_enums:
            return self._create_enum_type(type_ref)
        
        if type_ref in self.custom_strings:
            return self._create_constrained_str(type_ref)
        
        if type_ref in self.custom_numbers:
            return self._create_constrained_number(type_ref)
        
        return None
    
    def _create_enum_type(self, type_ref: str) -> Type:                          # Create enum class dynamically
        """Create a Type_Safe enum from definition."""
        values = self.custom_enums[type_ref]
        
        # Create enum dynamically
        from enum import Enum
        return Enum(type_ref, {v.upper(): v for v in values})
    
    def validate_value(self              ,                                       # Validate property value
                       type_ref : str    ,
                       value    : Any
                  ) -> tuple[bool, str]:
        """Validate a value against a type reference. Returns (is_valid, error_message)."""
        type_class = self.get_type(type_ref)
        
        if type_class is None:
            return (False, f'Unknown type: {type_ref}')
        
        try:
            if type_ref in self.custom_enums:
                if value not in self.custom_enums[type_ref]:
                    return (False, f'Invalid enum value: {value}')
                return (True, '')
            
            # Try to construct the Type_Safe value
            type_class(value)
            return (True, '')
            
        except Exception as e:
            return (False, str(e))
```

### 7. Available Types for UI

**New endpoint:**
```
GET /config/api/property-types
```

**Response:**
```json
{
  "success": true,
  "builtin": [
    {"name": "Safe_Str__Text", "display_name": "Text", "category": "string"},
    {"name": "Safe_Str__Url", "display_name": "URL", "category": "string"},
    {"name": "Safe_UInt", "display_name": "Positive Integer", "category": "number"},
    {"name": "Safe_Float", "display_name": "Decimal", "category": "number"},
    {"name": "bool", "display_name": "Boolean", "category": "boolean"},
    {"name": "List", "display_name": "List", "category": "collection"}
  ],
  "custom": {
    "enums": [
      {"name": "Enum__Agent__Type", "display_name": "Agent Type", "values": ["human", "genai"]},
      {"name": "Enum__Provider", "display_name": "Provider", "values": ["anthropic", "openai", "google", "human"]}
    ],
    "strings": [
      {"name": "Safe_Str__Model_Name", "display_name": "Model Name", "max_length": 50}
    ],
    "numbers": [
      {"name": "Safe_UInt__Percentage", "display_name": "Percentage", "min": 0, "max": 100}
    ]
  }
}
```

### Backend Tasks

| Task | Description | Complexity |
|------|-------------|------------|
| **B23** | Property Type Registry + built-in types | Medium |
| **B24** | Custom type definitions (`property-types.json`) | Medium |
| **B25** | Property definitions in `node-types.json` | Low |
| **B26** | Validation on `node_save()` | Medium |
| **B27** | `/config/api/property-types` endpoint | Low |
| **B28** | CRUD for custom enum types | Medium |

### Summary

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
4. UI can render appropriate inputs (dropdowns for enums, etc.)
5. No raw `str`, `int`, `float` anywhere