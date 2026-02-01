# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__List__Response - Response for listing issues
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issues__Index                    import Schema__Issues__Index


class Schema__Issue__List__Response(Type_Safe):                                  # List issues response
    success : bool               = False                                         # Operation success
    index   : Schema__Issues__Index = None                                       # Issues index data
    message : str                = ''                                            # Error message if failed
