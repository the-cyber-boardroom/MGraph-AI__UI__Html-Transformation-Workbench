# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Update__Response - Response after updating an issue
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                           import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text   import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue   import Schema__Issue


class Schema__Issue__Update__Response(Type_Safe):                                # Update issue response
    success : bool           = False                                             # Operation success
    issue   : Schema__Issue  = None                                              # Updated issue data
    message : Safe_Str__Text = ''                                                # Error message if failed
