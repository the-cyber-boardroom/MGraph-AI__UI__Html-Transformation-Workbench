# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Delete__Response - Response after deleting an issue
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text import Safe_Str__Text

from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id import Safe_Str__Issue_Id


class Schema__Issue__Delete__Response(Type_Safe):                                # Delete issue response
    success  : bool               = False                                         # Operation success
    deleted  : bool               = False                                         # Whether issue was deleted
    issue_id : Safe_Str__Issue_Id                                                # Deleted issue ID
    message  : Safe_Str__Text     = ''                                            # Error message if failed
