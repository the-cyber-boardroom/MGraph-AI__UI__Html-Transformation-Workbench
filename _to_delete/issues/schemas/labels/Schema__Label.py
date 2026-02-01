# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Label - Label definition
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text                            import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Hex_Color                    import Safe_Str__Hex_Color
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name                   import Safe_Str__Label_Name


class Schema__Label(Type_Safe):                                                  # Label definition
    name        : Safe_Str__Label_Name                                           # Label name like "bug"
    color       : Safe_Str__Hex_Color                                            # Hex color like #22c55e
    description : Safe_Str__Text                                                 # Optional description
