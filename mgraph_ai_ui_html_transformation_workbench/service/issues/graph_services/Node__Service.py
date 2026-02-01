# ═══════════════════════════════════════════════════════════════════════════════
# Node__Service - Business logic for node operations
# Handles create, update, delete, and query operations for graph nodes
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                             import List, Optional
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_UInt                                                    import Safe_UInt
from osbot_utils.type_safe.primitives.domains.identifiers.Obj_Id                                        import Obj_Id
from osbot_utils.type_safe.primitives.domains.identifiers.safe_int.Timestamp_Now                        import Timestamp_Now
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types                     import Safe_Str__Node_Type, Safe_Str__Node_Label
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Global__Index                     import Schema__Global__Index
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node                              import Schema__Node
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Create__Request             import Schema__Node__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Create__Response            import Schema__Node__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Delete__Response            import Schema__Node__Delete__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__List__Response              import Schema__Node__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Summary                     import Schema__Node__Summary
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Update__Request             import Schema__Node__Update__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Update__Response            import Schema__Node__Update__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Type__Summary                     import Schema__Type__Summary
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository         import Graph__Repository

# todo: refactor to Issue__Node__Service
class Node__Service(Type_Safe):                                                  # Node business logic service
    repository : Graph__Repository                                               # Data access layer

    # ═══════════════════════════════════════════════════════════════════════════════
    # Query Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def get_node(self                              ,                             # Get single node by label
                 node_type : Safe_Str__Node_Type   ,
                 label     : Safe_Str__Node_Label
            ) -> Optional[Schema__Node]:
        return self.repository.node_load(node_type = node_type ,
                                         label     = label     )

    def node_exists(self                              ,                          # Check if node exists
                    node_type : Safe_Str__Node_Type   ,
                    label     : Safe_Str__Node_Label
               ) -> bool:
        return self.repository.node_exists(node_type = node_type ,
                                           label     = label     )

    def list_nodes(self                                       ,                  # List nodes, optionally filtered by type
                   node_type : Safe_Str__Node_Type = None
              ) -> Schema__Node__List__Response:
        summaries = []

        if node_type:                                                            # List nodes of specific type
            summaries = self.list_nodes_for_type(node_type)
        else:                                                                    # List all nodes across all types
            node_types = self.repository.node_types_load()
            for nt in node_types:
                type_summaries = self.list_nodes_for_type(nt.name)
                summaries.extend(type_summaries)

        return Schema__Node__List__Response(success = True           ,
                                            nodes   = summaries      ,
                                            total   = len(summaries) )

    def list_nodes_for_type(self                              ,                  # List nodes for a specific type
                            node_type : Safe_Str__Node_Type
                       ) -> List[Schema__Node__Summary]:
        summaries = []
        labels    = self.repository.nodes_list_labels(node_type)

        for label in labels:
            node = self.repository.node_load(node_type = node_type ,
                                             label     = label     )
            if node:
                summary = Schema__Node__Summary(label     = node.label     ,
                                                node_type = node.node_type ,
                                                title     = node.title     ,
                                                status    = node.status    )
                summaries.append(summary)

        return summaries

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def create_node(self                                       ,                 # Create new node
                    request : Schema__Node__Create__Request
               ) -> Schema__Node__Create__Response:
        # Validate title is not empty
        if str(request.title).strip() == '':
            return Schema__Node__Create__Response(success = False               ,
                                                  message = 'Title is required' )

        # Validate node type exists
        node_types = self.repository.node_types_load()
        node_type_def = None
        for nt in node_types:
            if str(nt.name) == str(request.node_type):
                node_type_def = nt
                break

        if node_type_def is None:
            return Schema__Node__Create__Response(success = False                              ,
                                                  message = f'Unknown node type: {request.node_type}')

        # Get next index for this type
        type_index = self.repository.type_index_load(request.node_type)
        next_num   = int(type_index.next_index)
        label      = self.label_from_type_and_index(request.node_type, next_num)
        now        = Timestamp_Now()

        # Determine status
        status = request.status if request.status else node_type_def.default_status

        # Create node
        node = Schema__Node(node_id     = Obj_Id()                               ,
                            node_type   = request.node_type                      ,
                            node_index  = Safe_UInt(next_num)                    ,
                            label       = label                                  ,
                            title       = request.title                          ,
                            description = request.description                    ,
                            status      = status                                 ,
                            created_at  = now                                    ,
                            updated_at  = now                                    ,
                            created_by  = Obj_Id()                               ,  # TODO: actual creator
                            tags        = list(request.tags) if request.tags else [],
                            links       = []                                     ,
                            properties  = dict(request.properties) if request.properties else {})

        # Save node
        if self.repository.node_save(node) is False:
            return Schema__Node__Create__Response(success = False               ,
                                                  message = 'Failed to save node')

        # Update type index
        type_index.next_index   = Safe_UInt(next_num + 1)
        type_index.count        = Safe_UInt(int(type_index.count) + 1)
        type_index.last_updated = now
        self.repository.type_index_save(type_index)

        # Update global index
        self.update_global_index()

        return Schema__Node__Create__Response(success = True ,
                                              node    = node )

    # ═══════════════════════════════════════════════════════════════════════════════
    # Update Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def update_node(self                              ,                          # Update existing node
                    node_type : Safe_Str__Node_Type   ,
                    label     : Safe_Str__Node_Label  ,
                    request   : Schema__Node__Update__Request
               ) -> Schema__Node__Update__Response:
        node = self.repository.node_load(node_type = node_type ,
                                         label     = label     )
        if node is None:
            return Schema__Node__Update__Response(success = False                    ,
                                                  message = f'Node not found: {label}')

        # Apply updates
        if request.title is not None:
            node.title = request.title
        if request.description is not None:
            node.description = request.description
        if request.status is not None:
            node.status = request.status
        if request.tags is not None:
            node.tags = list(request.tags)
        if request.properties is not None:
            node.properties.update(request.properties)

        node.updated_at = Timestamp_Now()

        # Save
        if self.repository.node_save(node) is False:
            return Schema__Node__Update__Response(success = False                 ,
                                                  message = 'Failed to save node' )

        return Schema__Node__Update__Response(success = True ,
                                              node    = node )

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def delete_node(self                              ,                          # Delete node
                    node_type : Safe_Str__Node_Type   ,
                    label     : Safe_Str__Node_Label
               ) -> Schema__Node__Delete__Response:
        if self.repository.node_exists(node_type, label) is False:
            return Schema__Node__Delete__Response(success = False                     ,
                                                  deleted = False                     ,
                                                  label   = label                     ,
                                                  message = f'Node not found: {label}')

        # TODO: Remove links from other nodes pointing to this one

        # Delete node
        if self.repository.node_delete(node_type, label) is False:
            return Schema__Node__Delete__Response(success = False                   ,
                                                  deleted = False                   ,
                                                  label   = label                   ,
                                                  message = 'Failed to delete node' )

        # Update type index
        type_index = self.repository.type_index_load(node_type)
        type_index.count = Safe_UInt(max(0, int(type_index.count) - 1))
        type_index.last_updated = Timestamp_Now()
        self.repository.type_index_save(type_index)

        # Update global index
        self.update_global_index()

        return Schema__Node__Delete__Response(success = True  ,
                                              deleted = True  ,
                                              label   = label )

    # ═══════════════════════════════════════════════════════════════════════════════
    # Helper Methods
    # ═══════════════════════════════════════════════════════════════════════════════

    def label_from_type_and_index(self                              ,            # Generate label
                                  node_type  : Safe_Str__Node_Type  ,
                                  node_index : int
                             ) -> Safe_Str__Node_Label:
        display_type = str(node_type).capitalize()
        return Safe_Str__Node_Label(f"{display_type}-{node_index}")

    def update_global_index(self) -> None:                                       # Recalculate global index
        node_types   = self.repository.node_types_load()
        total_nodes  = 0
        type_counts  = []

        for nt in node_types:
            type_index = self.repository.type_index_load(nt.name)
            count      = int(type_index.count)
            total_nodes += count
            type_counts.append(Schema__Type__Summary(node_type = nt.name          ,
                                                     count     = Safe_UInt(count) ))

        global_index = Schema__Global__Index(total_nodes  = Safe_UInt(total_nodes) ,
                                             last_updated = Timestamp_Now()        ,
                                             type_counts  = type_counts            )

        self.repository.global_index_save(global_index)