# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Label__Create__Response - Response after creating a label
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                         import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label import Schema__Label


class Schema__Label__Create__Response(Type_Safe):                                # Create label response
    success : bool            = False                                               # Operation success
    label   : Schema__Label   = None                                               # Created label
    message : Safe_Str__Text   = ''                                                  # Error message if failed
