# ═══════════════════════════════════════════════════════════════════════════════
# Issue__Repository - File-based data access for issues
# Handles reading and writing JSON files for issues and index
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                             import List
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.domains.files.safe_str.Safe_Str__File__Path                       import Safe_Str__File__Path
from osbot_utils.type_safe.type_safe_core.decorators.type_safe                                          import type_safe
from osbot_utils.utils.Files                                                                            import path_combine, file_exists, file_contents, file_create
from osbot_utils.utils.Json                                                                             import json_loads, json_dumps
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue                            import Schema__Issue
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issues__Index                    import Schema__Issues__Index
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label                            import Schema__Label
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id                     import Safe_Str__Issue_Id


class Issue__Repository(Type_Safe):                                              # File-based issue repository
    base_path : Safe_Str__File__Path                                                         # Base directory for issues

    # ═══════════════════════════════════════════════════════════════════════════════
    # Index Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def index_path(self) -> Safe_Str__File__Path:                                            # Get path to issues.json
        return path_combine(self.base_path, 'issues.json')

    def get_index(self) -> Schema__Issues__Index:                                # Load issues index
        index_file = self.index_path()
        if file_exists(index_file) is False:
            return Schema__Issues__Index()

        data = json_loads(file_contents(index_file))
        if data is None:
            return Schema__Issues__Index()

        return Schema__Issues__Index.from_json(data)

    def save_index(self, index: Schema__Issues__Index) -> bool:                  # Save issues index
        data = index.json()
        file_create(self.index_path(), json_dumps(data, indent=2))
        return True


    # ═══════════════════════════════════════════════════════════════════════════════
    # Issue Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    @type_safe
    def issue_path(self, issue_id: Safe_Str__Issue_Id) -> Safe_Str__File__Path:              # Get path to issue file
        return path_combine(self.base_path, f'{issue_id}.json')

    @type_safe
    def get_issue(self, issue_id: Safe_Str__Issue_Id) -> Schema__Issue: # Load single issue
        issue_file = self.issue_path(issue_id)
        if file_exists(issue_file) is False:
            return None

        data = json_loads(file_contents(issue_file))
        if data is None:
            return None

        return Schema__Issue.from_json(data)

    def save_issue(self, issue: Schema__Issue) -> bool:                          # Save issue to file
        if issue.issue_id:
            data = issue.json()
            file_create(self.issue_path(issue.issue_id), json_dumps(data, indent=2))
            return True
        else:
            return False

    def delete_issue(self, issue_id: Safe_Str__Issue_Id) -> bool:                # Delete issue file
        from osbot_utils.utils.Files import file_delete
        issue_file = self.issue_path(issue_id)
        if file_exists(issue_file):
            file_delete(issue_file)
            return True
        return False

    def issue_exists(self, issue_id: Safe_Str__Issue_Id) -> bool:                # Check if issue exists
        return file_exists(self.issue_path(issue_id))

    # ═══════════════════════════════════════════════════════════════════════════════
    # Label Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def labels_path(self) -> Safe_Str__File__Path:                                           # Get path to labels.json
        return path_combine(self.base_path, 'labels.json')

    def get_labels(self) -> List[Schema__Label]:                                 # Load all labels
        labels_file = self.labels_path()
        if file_exists(labels_file) is False:
            return []

        data = json_loads(file_contents(labels_file))
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
        data = {'labels': []}
        for label in labels:
            data['labels'].append({'name'       : str(label.name)       ,
                                   'color'      : str(label.color)      ,
                                   'description': str(label.description)})

        file_create(self.labels_path(), json_dumps(data, indent=2))
        return True
