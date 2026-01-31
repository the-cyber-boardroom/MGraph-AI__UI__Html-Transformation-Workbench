# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Labels__List__Response - Response for listing labels
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                  import List
from osbot_utils.type_safe.Type_Safe                                         import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label import Schema__Label


class Schema__Labels__List__Response(Type_Safe):                                 # List labels response
    success : bool               = False                                         # Operation success
    labels  : List[Schema__Label]                                                # All labels
    message : Safe_Str__Text                = ''                                            # Error message if failed
