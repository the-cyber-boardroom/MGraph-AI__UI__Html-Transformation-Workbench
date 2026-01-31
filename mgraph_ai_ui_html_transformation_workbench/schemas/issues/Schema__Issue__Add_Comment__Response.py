# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Add_Comment__Response - Response after adding a comment
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                    import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text            import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Comment   import Schema__Issue__Comment


class Schema__Issue__Add_Comment__Response(Type_Safe):                           # Add comment response
    success : bool                    = False                                    # Operation success
    comment : Schema__Issue__Comment  = None                                     # Created comment
    message : Safe_Str__Text          = ''                                       # Error message if failed
