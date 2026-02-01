# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Add_Comment__Request - Request to add a comment
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                    import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text            import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Comment__Author     import Enum__Comment__Author


class Schema__Issue__Add_Comment__Request(Type_Safe):                            # Add comment request
    author : Enum__Comment__Author = Enum__Comment__Author.HUMAN                 # Comment author
    text   : Safe_Str__Text                                                            # Comment text
