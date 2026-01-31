# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Label__Delete__Response - Response after deleting a label
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                  import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text          import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name import Safe_Str__Label_Name


class Schema__Label__Delete__Response(Type_Safe):                                # Delete label response
    success : bool                  = False                                      # Operation success
    deleted : bool                  = False                                      # Whether label was deleted
    name    : Safe_Str__Label_Name                                               # Deleted label name
    message : Safe_Str__Text        = ''                                         # Error message if failed
