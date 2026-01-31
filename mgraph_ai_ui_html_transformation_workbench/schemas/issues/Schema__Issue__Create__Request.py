# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Create__Request - Request to create a new issue
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                     import List, Optional
from osbot_utils.type_safe.Type_Safe                                                            import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text                    import Safe_Str__Text
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Version                 import Safe_Str__Version
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Issue__Status               import Enum__Issue__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Checklist_Item    import Schema__Issue__Checklist_Item
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name           import Safe_Str__Label_Name


class Schema__Issue__Create__Request(Type_Safe):                                 # Create issue request
    title         : Safe_Str__Text                                               # Required title
    description   : Safe_Str__Text                                               # Optional description
    status        : Enum__Issue__Status         = Enum__Issue__Status.BACKLOG    # Initial status
    labels        : List[Safe_Str__Label_Name]                                   # Assigned labels
    targetVersion : Safe_Str__Version           = None                           # Target version
    checklist     : List[Schema__Issue__Checklist_Item]                          # Task checklist
