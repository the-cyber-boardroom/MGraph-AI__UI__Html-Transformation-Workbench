# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Comment - Comment on an issue
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                                import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text        import Safe_Str__Text
from osbot_utils.type_safe.primitives.domains.identifiers.safe_int.Timestamp_Now    import Timestamp_Now
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Comment__Author import Enum__Comment__Author
from mgraph_ai_ui_html_transformation_workbench.schemas.identifiers.Comment_Id      import Comment_Id
from mgraph_ai_ui_html_transformation_workbench.schemas.identifiers.Issue_Id        import Issue_Id
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id import Safe_Str__Issue_Id


class Schema__Issue__Comment(Type_Safe):                                                # Single comment
    comment_id : Comment_Id
    author     : Enum__Comment__Author = Enum__Comment__Author.HUMAN                     # Comment author
    issue_id   : Safe_Str__Issue_Id     # todo this should be issue_id
    timestamp  : Timestamp_Now                                                           # ISO timestamp string
    text       : Safe_Str__Text                                                          # Comment text
