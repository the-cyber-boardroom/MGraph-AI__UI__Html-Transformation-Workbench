# ═══════════════════════════════════════════════════════════════════════════════
# Path__Handler__Graph_Node - Path generation for graph-based issue tracking
# Generates paths for the .issues/ directory structure:
#   data/{node_type}/{Label}/node.json
#   data/{node_type}/{Label}/attachments/{filename}
#   data/{node_type}/_index.json
#   config/node-types.json
#   config/link-types.json
#   _index.json
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                         import Type_Safe
from osbot_utils.type_safe.type_safe_core.decorators.type_safe                               import type_safe
from osbot_utils.type_safe.primitives.domains.files.safe_str.Safe_Str__File__Path            import Safe_Str__File__Path
from osbot_utils.type_safe.primitives.domains.files.safe_str.Safe_Str__File__Name            import Safe_Str__File__Name
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types          import Safe_Str__Node_Type, Safe_Str__Node_Label


class Path__Handler__Graph_Node(Type_Safe):                                      # Path handler for graph nodes
    base_path : Safe_Str__File__Path = '.issues'                                 # Root directory for issues

    # ═══════════════════════════════════════════════════════════════════════════════
    # Node Paths
    # ═══════════════════════════════════════════════════════════════════════════════

    @type_safe
    def path_for_node(self                              ,                        # Path to node JSON file
                      node_type : Safe_Str__Node_Type   ,                        # e.g., "bug"
                      label     : Safe_Str__Node_Label                           # e.g., "Bug-27"
                 ) -> str:
        return f"{self.base_path}/data/{node_type}/{label}/node.json"

    @type_safe
    def path_for_node_folder(self                              ,                 # Path to node folder
                             node_type : Safe_Str__Node_Type   ,
                             label     : Safe_Str__Node_Label
                        ) -> str:
        return f"{self.base_path}/data/{node_type}/{label}"

    # ═══════════════════════════════════════════════════════════════════════════════
    # Attachment Paths
    # ═══════════════════════════════════════════════════════════════════════════════

    @type_safe
    def path_for_attachment(self                              ,                  # Path to attachment file
                            node_type : Safe_Str__Node_Type   ,
                            label     : Safe_Str__Node_Label  ,
                            filename  : Safe_Str__File__Name
                       ) -> str:
        return f"{self.base_path}/data/{node_type}/{label}/attachments/{filename}"

    @type_safe
    def path_for_attachments_folder(self                              ,          # Path to attachments folder
                                    node_type : Safe_Str__Node_Type   ,
                                    label     : Safe_Str__Node_Label
                               ) -> str:
        return f"{self.base_path}/data/{node_type}/{label}/attachments"

    # ═══════════════════════════════════════════════════════════════════════════════
    # Index Paths
    # ═══════════════════════════════════════════════════════════════════════════════

    @type_safe
    def path_for_type_index(self                              ,                  # Path to per-type index
                            node_type : Safe_Str__Node_Type
                       ) -> str:
        return f"{self.base_path}/data/{node_type}/_index.json"

    def path_for_global_index(self) -> str:                                      # Path to global index
        return f"{self.base_path}/_index.json"

    @type_safe
    def path_for_type_folder(self                              ,                 # Path to type folder
                             node_type : Safe_Str__Node_Type
                        ) -> str:
        return f"{self.base_path}/data/{node_type}"

    # ═══════════════════════════════════════════════════════════════════════════════
    # Config Paths
    # ═══════════════════════════════════════════════════════════════════════════════

    def path_for_node_types(self) -> str:                                        # Path to node-types.json
        return f"{self.base_path}/config/node-types.json"

    def path_for_link_types(self) -> str:                                        # Path to link-types.json
        return f"{self.base_path}/config/link-types.json"

    def path_for_settings(self) -> str:                                          # Path to settings.json
        return f"{self.base_path}/config/settings.json"

    def path_for_config_folder(self) -> str:                                     # Path to config folder
        return f"{self.base_path}/config"

    # ═══════════════════════════════════════════════════════════════════════════════
    # Label Generation
    # ═══════════════════════════════════════════════════════════════════════════════

    @type_safe
    def label_from_type_and_index(self                              ,            # Generate label from type + index
                                  node_type  : Safe_Str__Node_Type  ,            # e.g., "bug"
                                  node_index : int                               # e.g., 27
                             ) -> Safe_Str__Node_Label:
        display_type = node_type.capitalize()                                    # "bug" → "Bug"
        return Safe_Str__Node_Label(f"{display_type}-{node_index}")              # "Bug-27"
