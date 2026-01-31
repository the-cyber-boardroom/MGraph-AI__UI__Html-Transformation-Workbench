# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Create__Response - Response after creating an issue
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue                            import Schema__Issue


class Schema__Issue__Create__Response(Type_Safe):                                # Create issue response
    success : bool             = False                                           # Operation success
    issue   : Schema__Issue    = None                                            # Created issue data
    message : str              = ''                                              # Error message if failed
