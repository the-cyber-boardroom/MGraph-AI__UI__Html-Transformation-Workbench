# ═══════════════════════════════════════════════════════════════════════════════
# Schema__Issue__Status_Counts - Status count tracking
# ═══════════════════════════════════════════════════════════════════════════════

from osbot_utils.type_safe.Type_Safe                                            import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_UInt                            import Safe_UInt


class Schema__Issue__Status_Counts(Type_Safe):                                   # Counts per status
    backlog     : Safe_UInt = Safe_UInt(0)
    todo        : Safe_UInt = Safe_UInt(0)
    in_progress : Safe_UInt = Safe_UInt(0)                                       # Maps to "in-progress"
    review      : Safe_UInt = Safe_UInt(0)
    done        : Safe_UInt = Safe_UInt(0)

    def to_json_dict(self) -> dict:                                              # Convert to JSON-friendly dict
        return {'backlog'     : int(self.backlog    ),
                'todo'        : int(self.todo       ),
                'in-progress' : int(self.in_progress),
                'review'      : int(self.review     ),
                'done'        : int(self.done       )}

    @classmethod
    def from_json_dict(cls, data: dict) -> 'Schema__Issue__Status_Counts':       # Create from JSON dict
        return cls(backlog     = Safe_UInt(data.get('backlog'    , 0)),
                   todo        = Safe_UInt(data.get('todo'       , 0)),
                   in_progress = Safe_UInt(data.get('in-progress', 0)),
                   review      = Safe_UInt(data.get('review'     , 0)),
                   done        = Safe_UInt(data.get('done'       , 0)))
