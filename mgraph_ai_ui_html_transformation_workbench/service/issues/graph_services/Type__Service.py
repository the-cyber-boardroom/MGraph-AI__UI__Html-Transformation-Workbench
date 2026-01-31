# ═══════════════════════════════════════════════════════════════════════════════
# Type__Service - Business logic for type definitions
# Manages node types (bug, task, feature) and link types (blocks, has-task)
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                             import List, Optional
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text                            import Safe_Str__Text
from osbot_utils.type_safe.primitives.domains.identifiers.Obj_Id                                        import Obj_Id
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types                     import Safe_Str__Node_Type, Safe_Str__Status, Safe_Str__Node_Type_Display, Safe_Str__Link_Verb
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Type                        import Schema__Node__Type
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Link__Type                        import Schema__Link__Type
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Hex_Color                    import Safe_Str__Hex_Color
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository         import Graph__Repository


class Type__Service(Type_Safe):                                                  # Type definition service
    repository : Graph__Repository                                               # Data access layer

    # ═══════════════════════════════════════════════════════════════════════════════
    # Node Type Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def list_node_types(self) -> List[Schema__Node__Type]:                       # Get all node types
        return self.repository.node_types_load()

    def get_node_type(self                         ,                             # Get single node type
                      name : Safe_Str__Node_Type
                 ) -> Optional[Schema__Node__Type]:
        types = self.repository.node_types_load()
        for t in types:
            if str(t.name) == str(name):
                return t
        return None

    def create_node_type(self                                 ,                  # Create new node type
                         name           : Safe_Str__Node_Type ,
                         display_name   : str                 ,
                         description    : str                 = '',
                         color          : str                 = '#888888',
                         statuses       : List[str]           = None,
                         default_status : str                 = 'backlog'
                    ) -> Schema__Node__Type:
        types = self.repository.node_types_load()

        # Check for duplicate
        for t in types:
            if str(t.name) == str(name):
                return None  # Already exists

        status_list = [Safe_Str__Status(s) for s in (statuses or ['backlog', 'in-progress', 'done'])]

        node_type = Schema__Node__Type(type_id        = Obj_Id()                              ,
                                       name           = name                                  ,
                                       display_name   = Safe_Str__Node_Type_Display(display_name),
                                       description    = Safe_Str__Text(description)          ,
                                       icon           = Safe_Str__Text('')                   ,
                                       color          = Safe_Str__Hex_Color(color)           ,
                                       statuses       = status_list                          ,
                                       default_status = Safe_Str__Status(default_status)     ,
                                       properties     = []                                   )

        types.append(node_type)
        self.repository.node_types_save(types)
        return node_type

    def delete_node_type(self                         ,                          # Delete node type
                         name : Safe_Str__Node_Type
                    ) -> bool:
        types = self.repository.node_types_load()

        # Check if any nodes of this type exist
        type_index = self.repository.type_index_load(name)
        if int(type_index.count) > 0:
            return False  # Cannot delete type with existing nodes

        # Remove type
        types = [t for t in types if str(t.name) != str(name)]
        self.repository.node_types_save(types)
        return True

    # ═══════════════════════════════════════════════════════════════════════════════
    # Link Type Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def list_link_types(self) -> List[Schema__Link__Type]:                       # Get all link types
        return self.repository.link_types_load()

    def get_link_type(self                         ,                             # Get link type by verb
                      verb : Safe_Str__Link_Verb
                 ) -> Optional[Schema__Link__Type]:
        types = self.repository.link_types_load()
        for t in types:
            if str(t.verb) == str(verb):
                return t
        return None

    def create_link_type(self                                 ,                  # Create new link type
                         verb          : Safe_Str__Link_Verb  ,
                         inverse_verb  : str                  ,
                         description   : str                  = '',
                         source_types  : List[str]            = None,
                         target_types  : List[str]            = None
                    ) -> Schema__Link__Type:
        types = self.repository.link_types_load()

        # Check for duplicate
        for t in types:
            if str(t.verb) == str(verb):
                return None  # Already exists

        source_list = [Safe_Str__Node_Type(s) for s in (source_types or [])]
        target_list = [Safe_Str__Node_Type(t) for t in (target_types or [])]

        link_type = Schema__Link__Type(link_type_id = Obj_Id()                          ,
                                       verb         = verb                              ,
                                       inverse_verb = Safe_Str__Link_Verb(inverse_verb) ,
                                       description  = Safe_Str__Text(description)       ,
                                       source_types = source_list                       ,
                                       target_types = target_list                       )

        types.append(link_type)
        self.repository.link_types_save(types)
        return link_type

    # ═══════════════════════════════════════════════════════════════════════════════
    # Default Type Initialization
    # ═══════════════════════════════════════════════════════════════════════════════

    def initialize_default_types(self) -> None:                                  # Set up default types
        # Check if already initialized
        if len(self.repository.node_types_load()) > 0:
            return

        # Create default node types
        self.create_node_type(name           = Safe_Str__Node_Type('bug')          ,
                              display_name   = 'Bug'                               ,
                              description    = 'Defect or error in the system'     ,
                              color          = '#ef4444'                           ,
                              statuses       = ['backlog', 'confirmed', 'in-progress', 'testing', 'resolved', 'closed'],
                              default_status = 'backlog'                           )

        self.create_node_type(name           = Safe_Str__Node_Type('task')         ,
                              display_name   = 'Task'                              ,
                              description    = 'Unit of work to be completed'      ,
                              color          = '#3b82f6'                           ,
                              statuses       = ['backlog', 'todo', 'in-progress', 'review', 'done'],
                              default_status = 'backlog'                           )

        self.create_node_type(name           = Safe_Str__Node_Type('feature')      ,
                              display_name   = 'Feature'                           ,
                              description    = 'High-level capability'             ,
                              color          = '#22c55e'                           ,
                              statuses       = ['proposed', 'approved', 'in-progress', 'released'],
                              default_status = 'proposed'                          )

        self.create_node_type(name           = Safe_Str__Node_Type('person')       ,
                              display_name   = 'Person'                            ,
                              description    = 'Human or agent identity'           ,
                              color          = '#8b5cf6'                           ,
                              statuses       = ['active', 'inactive']              ,
                              default_status = 'active'                            )

        # Create default link types
        self.create_link_type(verb         = Safe_Str__Link_Verb('blocks')          ,
                              inverse_verb = 'blocked-by'                           ,
                              description  = 'Prevents progress on target'          ,
                              source_types = ['bug', 'task']                        ,
                              target_types = ['task', 'feature']                    )

        self.create_link_type(verb         = Safe_Str__Link_Verb('has-task')        ,
                              inverse_verb = 'task-of'                              ,
                              description  = 'Contains as sub-work'                 ,
                              source_types = ['feature']                            ,
                              target_types = ['task']                               )

        self.create_link_type(verb         = Safe_Str__Link_Verb('assigned-to')     ,
                              inverse_verb = 'assignee-of'                          ,
                              description  = 'Work assigned to person/agent'        ,
                              source_types = ['bug', 'task', 'feature']             ,
                              target_types = ['person']                             )

        self.create_link_type(verb         = Safe_Str__Link_Verb('depends-on')      ,
                              inverse_verb = 'dependency-of'                        ,
                              description  = 'Requires target to complete first'    ,
                              source_types = ['task', 'feature']                    ,
                              target_types = ['task', 'feature']                    )

        self.create_link_type(verb         = Safe_Str__Link_Verb('relates-to')      ,
                              inverse_verb = 'relates-to'                           ,
                              description  = 'General association (symmetric)'      ,
                              source_types = ['bug', 'task', 'feature']             ,
                              target_types = ['bug', 'task', 'feature']             )
