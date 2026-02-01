# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue - Full issue data structure
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                  import List
from osbot_utils.type_safe.Type_Safe                                                         import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text                 import Safe_Str__Text
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Version              import Safe_Str__Version
from osbot_utils.type_safe.primitives.domains.identifiers.safe_int.Timestamp_Now             import Timestamp_Now
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Issue__Status            import Enum__Issue__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Checklist_Item import Schema__Issue__Checklist_Item
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Comment        import Schema__Issue__Comment
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id          import Safe_Str__Issue_Id
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name        import Safe_Str__Label_Name


class Schema__Issue(Type_Safe):                                                     # Full issue structure
    issue_id      : Safe_Str__Issue_Id                                              # Issue ID like Issue-001
    title         : Safe_Str__Text                                                  # Issue title
    description   : Safe_Str__Text                                                  # Issue description
    status        : Enum__Issue__Status             = Enum__Issue__Status.BACKLOG   # Current status
    labels        : List[Safe_Str__Label_Name]                                      # Assigned labels
    created       : Timestamp_Now                                                   # timestamp created
    updated       : Timestamp_Now                                                   # timestamp updated
    targetVersion : Safe_Str__Version               = None                          # Target version like v0.1.6
    comments      : List[Schema__Issue__Comment]                                    # Issue comments
    checklist     : List[Schema__Issue__Checklist_Item]                             # Task checklist
