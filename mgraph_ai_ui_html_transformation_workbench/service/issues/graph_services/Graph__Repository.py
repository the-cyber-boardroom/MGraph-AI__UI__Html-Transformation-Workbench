# ═══════════════════════════════════════════════════════════════════════════════
# Graph__Repository - Memory-FS based data access for graph nodes
# Storage-agnostic: works with Memory, Local Disk, S3, SQLite, ZIP backends
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                             import List, Optional
from memory_fs.Memory_FS                                                                                import Memory_FS
from memory_fs.storage_fs.Storage_FS                                                                    import Storage_FS
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.type_safe_core.decorators.type_safe                                          import type_safe
from osbot_utils.utils.Json                                                                             import json_loads, json_dumps

from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types import Safe_Str__Node_Type, Safe_Str__Node_Label
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Global__Index import Schema__Global__Index
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node                              import Schema__Node
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Type                        import Schema__Node__Type
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Link__Type                        import Schema__Link__Type
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Type__Index import Schema__Type__Index
from mgraph_ai_ui_html_transformation_workbench.service.issues.storage.Path__Handler__Graph_Node import Path__Handler__Graph_Node


class Graph__Repository(Type_Safe):                                              # Memory-FS based graph repository
    memory_fs    : Memory_FS                                                     # Storage abstraction
    path_handler : Path__Handler__Graph_Node                                     # Path generation
    storage_fs   : Storage_FS             = None                                 # Set from memory_fs

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.memory_fs:
            self.storage_fs = self.memory_fs.storage_fs

    # ═══════════════════════════════════════════════════════════════════════════════
    # Node Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    @type_safe
    def node_save(self, node: Schema__Node) -> bool:                             # Save node to storage
        if not node.label:
            return False
        path    = self.path_handler.path_for_node(node_type = node.node_type ,
                                                  label     = node.label     )
        data    = node.json()
        content = json_dumps(data, indent=2)
        return self.storage_fs.file__save(path, content.encode('utf-8'))

    @type_safe
    def node_load(self                              ,                            # Load node from storage
                  node_type : Safe_Str__Node_Type   ,
                  label     : Safe_Str__Node_Label
             ) -> Schema__Node:
        path = self.path_handler.path_for_node(node_type = node_type ,
                                               label     = label     )
        if self.storage_fs.file__exists(path) is False:
            return None

        content = self.storage_fs.file__str(path)
        if not content:
            return None

        data = json_loads(content)
        if data is None:
            return None

        return Schema__Node.from_json(data)

    @type_safe
    def node_delete(self                              ,                          # Delete node from storage
                    node_type : Safe_Str__Node_Type   ,
                    label     : Safe_Str__Node_Label
               ) -> bool:
        path = self.path_handler.path_for_node(node_type = node_type ,
                                               label     = label     )
        if self.storage_fs.file__exists(path):
            return self.storage_fs.file__delete(path)
        return False

    @type_safe
    def node_exists(self                              ,                          # Check if node exists
                    node_type : Safe_Str__Node_Type   ,
                    label     : Safe_Str__Node_Label
               ) -> bool:
        path = self.path_handler.path_for_node(node_type = node_type ,
                                               label     = label     )
        return self.storage_fs.file__exists(path)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Type Index Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    @type_safe
    def type_index_load(self                              ,                      # Load per-type index
                        node_type : Safe_Str__Node_Type
                   ) -> Schema__Type__Index:
        path = self.path_handler.path_for_type_index(node_type)
        if self.storage_fs.file__exists(path) is False:
            return Schema__Type__Index(node_type=node_type)                      # Return empty index

        content = self.storage_fs.file__str(path)
        if not content:
            return Schema__Type__Index(node_type=node_type)

        data = json_loads(content)
        if data is None:
            return Schema__Type__Index(node_type=node_type)

        return Schema__Type__Index.from_json(data)

    @type_safe
    def type_index_save(self                              ,                      # Save per-type index
                        index : Schema__Type__Index
                   ) -> bool:
        path    = self.path_handler.path_for_type_index(index.node_type)
        data    = index.json()
        content = json_dumps(data, indent=2)
        return self.storage_fs.file__save(path, content.encode('utf-8'))

    # ═══════════════════════════════════════════════════════════════════════════════
    # Global Index Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def global_index_load(self) -> Schema__Global__Index:                        # Load global index
        path = self.path_handler.path_for_global_index()
        if self.storage_fs.file__exists(path) is False:
            return Schema__Global__Index()

        content = self.storage_fs.file__str(path)
        if not content:
            return Schema__Global__Index()

        data = json_loads(content)
        if data is None:
            return Schema__Global__Index()

        return Schema__Global__Index.from_json(data)

    def global_index_save(self, index: Schema__Global__Index) -> bool:           # Save global index
        path    = self.path_handler.path_for_global_index()
        data    = index.json()
        content = json_dumps(data, indent=2)
        return self.storage_fs.file__save(path, content.encode('utf-8'))

    # ═══════════════════════════════════════════════════════════════════════════════
    # Config Operations - Node Types
    # ═══════════════════════════════════════════════════════════════════════════════

    def node_types_load(self) -> List[Schema__Node__Type]:                       # Load all node types
        path = self.path_handler.path_for_node_types()
        if self.storage_fs.file__exists(path) is False:
            return []

        content = self.storage_fs.file__str(path)
        if not content:
            return []

        data = json_loads(content)
        if data is None or 'types' not in data:
            return []

        types = []
        for item in data['types']:
            types.append(Schema__Node__Type.from_json(item))
        return types

    def node_types_save(self, types: List[Schema__Node__Type]) -> bool:          # Save all node types
        path = self.path_handler.path_for_node_types()
        data = {'types': [t.json() for t in types]}
        content = json_dumps(data, indent=2)
        return self.storage_fs.file__save(path, content.encode('utf-8'))

    # ═══════════════════════════════════════════════════════════════════════════════
    # Config Operations - Link Types
    # ═══════════════════════════════════════════════════════════════════════════════

    def link_types_load(self) -> List[Schema__Link__Type]:                       # Load all link types
        path = self.path_handler.path_for_link_types()
        if self.storage_fs.file__exists(path) is False:
            return []

        content = self.storage_fs.file__str(path)
        if not content:
            return []

        data = json_loads(content)
        if data is None or 'link_types' not in data:
            return []

        types = []
        for item in data['link_types']:
            types.append(Schema__Link__Type.from_json(item))
        return types

    def link_types_save(self, types: List[Schema__Link__Type]) -> bool:          # Save all link types
        path = self.path_handler.path_for_link_types()
        data = {'link_types': [t.json() for t in types]}
        content = json_dumps(data, indent=2)
        return self.storage_fs.file__save(path, content.encode('utf-8'))

    # ═══════════════════════════════════════════════════════════════════════════════
    # Attachment Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    @type_safe
    def attachment_save(self                              ,                      # Save attachment (raw bytes)
                        node_type : Safe_Str__Node_Type   ,
                        label     : Safe_Str__Node_Label  ,
                        filename  : str                   ,
                        data      : bytes
                   ) -> bool:
        path = self.path_handler.path_for_attachment(node_type = node_type ,
                                                     label     = label     ,
                                                     filename  = filename  )
        return self.storage_fs.file__save(path, data)

    @type_safe
    def attachment_load(self                              ,                      # Load attachment
                        node_type : Safe_Str__Node_Type   ,
                        label     : Safe_Str__Node_Label  ,
                        filename  : str
                   ) -> bytes:
        path = self.path_handler.path_for_attachment(node_type = node_type ,
                                                     label     = label     ,
                                                     filename  = filename  )
        if self.storage_fs.file__exists(path) is False:
            return None
        return self.storage_fs.file__bytes(path)

    @type_safe
    def attachment_delete(self                              ,                    # Delete attachment
                          node_type : Safe_Str__Node_Type   ,
                          label     : Safe_Str__Node_Label  ,
                          filename  : str
                     ) -> bool:
        path = self.path_handler.path_for_attachment(node_type = node_type ,
                                                     label     = label     ,
                                                     filename  = filename  )
        if self.storage_fs.file__exists(path):
            return self.storage_fs.file__delete(path)
        return False

    # ═══════════════════════════════════════════════════════════════════════════════
    # Utility Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def clear_storage(self) -> None:                                             # Clear all data (for tests)
        self.storage_fs.clear()
