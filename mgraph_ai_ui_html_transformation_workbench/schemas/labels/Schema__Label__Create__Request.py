# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Label__Create__Request - Request to create a new label
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                    import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text            import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Hex_Color    import Safe_Str__Hex_Color
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name   import Safe_Str__Label_Name


class Schema__Label__Create__Request(Type_Safe):                                 # Create label request
    name        : Safe_Str__Label_Name                                           # Label name
    color       : Safe_Str__Hex_Color                                            # Hex color
    description : Safe_Str__Text                                                 # Optional description
