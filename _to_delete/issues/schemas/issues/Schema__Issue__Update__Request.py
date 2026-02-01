# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Update__Request - Request to update an issue (partial update)
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                     import List
from osbot_utils.type_safe.Type_Safe                                                            import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text                    import Safe_Str__Text
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Version                 import Safe_Str__Version
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Issue__Status               import Enum__Issue__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Checklist_Item    import Schema__Issue__Checklist_Item
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name           import Safe_Str__Label_Name


class Schema__Issue__Update__Request(Type_Safe):                            # Update issue request
    title         : Safe_Str__Text                      = None              # New title
    description   : Safe_Str__Text                      = None              # New description
    status        : Enum__Issue__Status                 = None              # New status
    labels        : List[Safe_Str__Label_Name]          = None              # New labels
    targetVersion : Safe_Str__Version                   = None              # New target version
    checklist     : List[Schema__Issue__Checklist_Item] = None              # New checklist
