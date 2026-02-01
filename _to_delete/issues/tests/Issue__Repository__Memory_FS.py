# ═══════════════════════════════════════════════════════════════════════════════
# Issue__Repository__Memory_FS - Memory-FS based data access for issues
# Storage-agnostic: works with Memory, Local Disk, S3, SQLite, ZIP backends
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                             import List, Optional
from memory_fs.Memory_FS                                                                                import Memory_FS
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.type_safe_core.decorators.type_safe                                          import type_safe
from osbot_utils.utils.Json                                                                             import json_loads, json_dumps
from memory_fs.storage_fs.Storage_FS                                                                    import Storage_FS
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue                            import Schema__Issue
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issues__Index                    import Schema__Issues__Index
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label                            import Schema__Label
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id                     import Safe_Str__Issue_Id
from mgraph_ai_ui_html_transformation_workbench.service.issues.storage.Path__Handler__Issues            import Path__Handler__Issues


class Issue__Repository__Memory_FS(Type_Safe):                                   # Memory-FS based repository
    memory_fs    : Memory_FS                                                     # Storage abstraction
    path_handler : Path__Handler__Issues                                         # Path generation
    storage_fs   : Storage_FS             = None                                 # this will be set from the value in self.memory_fs

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.storage_fs = self.memory_fs.storage_fs
    # ═══════════════════════════════════════════════════════════════════════════════
    # Index Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def get_index(self) -> Schema__Issues__Index:                                # Load issues index
        path = self.path_handler.path_for_issues_index()
        if self.storage_fs.file__exists(path) is False:
            return Schema__Issues__Index()

        content = self.storage_fs.file__str(path)
        if not content:
            return Schema__Issues__Index()

        data = json_loads(content)
        if data is None:
            return Schema__Issues__Index()

        return Schema__Issues__Index.from_json(data)

    def save_index(self, index: Schema__Issues__Index) -> bool:                  # Save issues index
        path    = str(self.path_handler.path_for_issues_index())
        data    = index.json()
        content = json_dumps(data, indent=2)
        return self.storage_fs.file__save(path, content.encode('utf-8'))

    # ═══════════════════════════════════════════════════════════════════════════════
    # Issue Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    @type_safe
    def get_issue(self, issue_id: Safe_Str__Issue_Id) -> Optional[Schema__Issue]:# Load single issue
        path = str(self.path_handler.path_for_issue(issue_id))
        if self.storage_fs.file__exists(path) is False:
            return None

        content = self.storage_fs.file__str(path)
        if not content:
            return None

        data = json_loads(content)
        if data is None:
            return None

        return Schema__Issue.from_json(data)

    def save_issue(self, issue: Schema__Issue) -> bool:                          # Save issue
        if issue.issue_id:
            path    = str(self.path_handler.path_for_issue(issue.issue_id))
            data    = issue.json()
            content = json_dumps(data, indent=2)
            return self.storage_fs.file__save(path, content.encode('utf-8'))
        return False

    def delete_issue(self, issue_id: Safe_Str__Issue_Id) -> bool:                # Delete issue
        path = str(self.path_handler.path_for_issue(issue_id))
        if self.storage_fs.file__exists(path):
            return self.storage_fs.file__delete(path)
        return False

    def issue_exists(self, issue_id: Safe_Str__Issue_Id) -> bool:                # Check if issue exists
        path = str(self.path_handler.path_for_issue(issue_id))
        return self.storage_fs.file__exists(path)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Label Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def get_labels(self) -> List[Schema__Label]:                                 # Load all labels
        path = str(self.path_handler.path_for_labels())
        if self.storage_fs.file__exists(path) is False:
            return []

        content = self.storage_fs.file__str(path)
        if not content:
            return []

        data = json_loads(content)
        if data is None:
            return []

        labels = []
        for item in data.get('labels', []):
            label = Schema__Label(name        = item.get('name'       , ''       ),
                                  color       = item.get('color'      , '#888888'),
                                  description = item.get('description', ''       ))
            labels.append(label)

        return labels

    def save_labels(self, labels: List[Schema__Label]) -> bool:                  # Save all labels
        path = str(self.path_handler.path_for_labels())
        data = {'labels': []}
        for label in labels:
            data['labels'].append({'name'       : str(label.name)       ,
                                   'color'      : str(label.color)      ,
                                   'description': str(label.description)})

        content = json_dumps(data, indent=2)
        return self.storage_fs.file__save(path, content.encode('utf-8'))

    # ═══════════════════════════════════════════════════════════════════════════════
    # Storage Access (for tests)
    # ═══════════════════════════════════════════════════════════════════════════════

    def clear_storage(self) -> None:                                             # Clear all data (for tests)
        self.storage_fs.clear()
