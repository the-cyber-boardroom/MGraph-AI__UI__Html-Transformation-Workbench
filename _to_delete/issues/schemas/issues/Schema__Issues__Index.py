# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issues__Index - Main issues index structure
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                             import List, Optional
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_UInt                                                    import Safe_UInt
from osbot_utils.type_safe.primitives.domains.identifiers.safe_int.Timestamp_Now                        import Timestamp_Now
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Summary                   import Schema__Issue__Summary
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Status_Counts             import Schema__Issue__Status_Counts


class Schema__Issues__Index(Type_Safe):                                     # Issues index file structure
    last_updated  : Timestamp_Now                   = None                   # ISO timestamp of last update
    next_id       : Safe_UInt                       = Safe_UInt(1)           # Next issue number
    issues        : List[Schema__Issue__Summary]                             # Issue summaries
    status_counts : Schema__Issue__Status_Counts                             # Counts per status
