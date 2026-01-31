# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Summary - Summary entry in the issues index
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                    import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text            import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Issue__Status       import Enum__Issue__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id     import Safe_Str__Issue_Id


class Schema__Issue__Summary(Type_Safe):                                              # Issue summary for index
    issue_id    : Safe_Str__Issue_Id                                                  # Issue ID like Issue-001
    title       : Safe_Str__Text                                                      # Issue title
    status      : Enum__Issue__Status = Enum__Issue__Status.BACKLOG                   # Current status
