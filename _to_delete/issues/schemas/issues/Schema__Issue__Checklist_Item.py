# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Checklist_Item - Checklist item in an issue
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                         import Type_Safe
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text import Safe_Str__Text


class Schema__Issue__Checklist_Item(Type_Safe):                                  # Single checklist item
    item : Safe_Str__Text                                                        # Item text
    done : bool = False                                                          # Completion status
