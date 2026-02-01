# ═══════════════════════════════════════════════════════════════════════════════
# Label__Service - Business logic for label operations
# Handles create, delete, and query operations for labels
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                             import List, Optional
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe

from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label import Schema__Label
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Create__Request import Schema__Label__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Create__Response import Schema__Label__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Delete__Response import Schema__Label__Delete__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Labels__List__Response import Schema__Labels__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name import Safe_Str__Label_Name
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Repository                        import Issue__Repository


class Label__Service(Type_Safe):                                                 # Label business logic service
    repository : Issue__Repository                                               # Data access layer

    # ═══════════════════════════════════════════════════════════════════════════════
    # Query Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def list_labels(self) -> Schema__Labels__List__Response:                     # Get all labels
        labels = self.repository.get_labels()
        return Schema__Labels__List__Response(success = True  ,
                                              labels  = labels)

    def get_label(self, name: Safe_Str__Label_Name) -> Schema__Label:  # Get single label
        labels = self.repository.get_labels()
        for label in labels:
            if str(label.name) == str(name):
                return label
        return None

    def label_exists(self, name: Safe_Str__Label_Name) -> bool:                  # Check if label exists
        return self.get_label(name) is not None

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def create_label(self, request: Schema__Label__Create__Request               # Create new label
                ) -> Schema__Label__Create__Response:
        if str(request.name).strip() == '':
            return Schema__Label__Create__Response(success = False                   ,
                                                   message = 'Label name is required')

        if self.label_exists(request.name):
            return Schema__Label__Create__Response(success = False                              ,
                                                   message = f'Label already exists: {request.name}')

        label = Schema__Label(name        = request.name       ,
                              color       = request.color      ,
                              description = request.description)

        labels = self.repository.get_labels()
        labels.append(label)
        self.repository.save_labels(labels)

        return Schema__Label__Create__Response(success = True ,
                                               label   = label)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def delete_label(self, name: Safe_Str__Label_Name                            # Delete label
                ) -> Schema__Label__Delete__Response:
        if self.label_exists(name) is False:
            return Schema__Label__Delete__Response(success = False                        ,
                                                   deleted = False                        ,
                                                   name    = name                         ,
                                                   message = f'Label not found: {name}'   )

        labels = self.repository.get_labels()
        labels = [l for l in labels if str(l.name) != str(name)]
        self.repository.save_labels(labels)

        return Schema__Label__Delete__Response(success = True ,
                                               deleted = True ,
                                               name    = name )
