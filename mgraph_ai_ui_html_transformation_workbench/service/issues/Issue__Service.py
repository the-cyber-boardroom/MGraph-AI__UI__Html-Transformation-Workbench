# ═══════════════════════════════════════════════════════════════════════════════
# Issue__Service - Business logic for issue operations
# Handles create, update, delete, and query operations
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                             import Optional
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_UInt                                                    import Safe_UInt
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text                            import Safe_Str__Text
from osbot_utils.type_safe.primitives.domains.identifiers.safe_int.Timestamp_Now                        import Timestamp_Now
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Issue__Status                       import Enum__Issue__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.identifiers.Comment_Id                          import Comment_Id
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue                            import Schema__Issue
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Summary                   import Schema__Issue__Summary
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Comment                   import Schema__Issue__Comment
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issues__Index                    import Schema__Issues__Index
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Status_Counts             import Schema__Issue__Status_Counts
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Create__Request           import Schema__Issue__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Create__Response          import Schema__Issue__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Update__Request           import Schema__Issue__Update__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Update__Response          import Schema__Issue__Update__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Add_Comment__Request      import Schema__Issue__Add_Comment__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Add_Comment__Response     import Schema__Issue__Add_Comment__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Delete__Response          import Schema__Issue__Delete__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__List__Response            import Schema__Issue__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id                     import Safe_Str__Issue_Id
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Repository                        import Issue__Repository


class Issue__Service(Type_Safe):                                                 # Issue business logic service
    repository : Issue__Repository                                               # Data access layer

    # ═══════════════════════════════════════════════════════════════════════════════
    # Query Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def list_issues(self) -> Schema__Issue__List__Response:                      # Get all issues index
        index = self.repository.get_index()
        return Schema__Issue__List__Response(success = True ,
                                             index   = index)

    def get_issue(self, issue_id: Safe_Str__Issue_Id) -> Optional[Schema__Issue]: # Get single issue
        return self.repository.get_issue(issue_id)

    def issue_exists(self, issue_id: Safe_Str__Issue_Id) -> bool:                # Check if issue exists
        return self.repository.issue_exists(issue_id)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def create_issue(self                                       ,                # Create new issue
                     request: Schema__Issue__Create__Request
                ) -> Schema__Issue__Create__Response:
        if str(request.title).strip() == '':
            return Schema__Issue__Create__Response(success = False                   ,
                                                   message = 'Title is required'     )

        index    = self.repository.get_index()
        next_num = int(index.next_id)
        issue_id = self.issue__from_number(next_num)
        now      = Timestamp_Now()

        issue = Schema__Issue(issue_id      = issue_id                           ,
                              title         = request.title                      ,
                              description   = request.description                ,
                              status        = request.status                     ,
                              labels        = list(request.labels)               ,
                              created       = now                                ,
                              updated       = now                                ,
                              targetVersion = request.targetVersion              ,
                              comments      = []                                 ,
                              checklist     = list(request.checklist)            )

        self.repository.save_issue(issue)

        summary = Schema__Issue__Summary(issue_id = issue_id      ,
                                         title    = request.title ,
                                         status   = request.status)
        index.issues.append(summary)
        index.next_id      = Safe_UInt(next_num + 1)
        index.last_updated = now

        self.update_status_counts(index)
        self.repository.save_index(index)

        return Schema__Issue__Create__Response(success = True ,
                                               issue   = issue)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Update Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def update_issue(self                                       ,                # Update existing issue
                     issue_id : Safe_Str__Issue_Id              ,
                     request  : Schema__Issue__Update__Request
                ) -> Schema__Issue__Update__Response:
        issue = self.repository.get_issue(issue_id)
        if issue is None:
            return Schema__Issue__Update__Response(success = False                               ,
                                                   message = f'Issue not found: {issue_id}'      )

        if request.title is not None:
            issue.title = request.title
        if request.description is not None:
            issue.description = request.description
        if request.status is not None:
            issue.status = request.status
        if request.labels is not None:
            issue.labels = list(request.labels)
        if request.targetVersion is not None:
            issue.targetVersion = request.targetVersion
        if request.checklist is not None:
            issue.checklist = list(request.checklist)

        issue.updated = Timestamp_Now()
        self.repository.save_issue(issue)

        if request.title is not None or request.status is not None:
            self.update_index_summary(issue_id       = issue_id      ,
                                      title          = request.title ,
                                      status         = request.status)

        return Schema__Issue__Update__Response(success = True ,
                                               issue   = issue)

    def update_status(self                                      ,                # Quick status update
                      issue_id : Safe_Str__Issue_Id             ,
                      status   : Enum__Issue__Status
                 ) -> Schema__Issue__Update__Response:
        request = Schema__Issue__Update__Request(status = status)
        return self.update_issue(issue_id = issue_id ,
                                 request  = request  )

    def update_index_summary(self                            ,                                  # Update index after issue change
                             issue_id : Safe_Str__Issue_Id   ,
                             title    : Safe_Str__Text       = None,
                             status   : Enum__Issue__Status  = None
                        ) -> bool:
        index = self.repository.get_index()

        for summary in index.issues:
            if str(summary.issue_id) == str(issue_id):
                if title is not None:
                    summary.title = title
                if status is not None:
                    summary.status = status
                break

        index.last_updated = Timestamp_Now()
        self.update_status_counts(index)
        self.repository.save_index(index)
        return True

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def delete_issue(self, issue_id: Safe_Str__Issue_Id                          # Delete issue
                ) -> Schema__Issue__Delete__Response:
        if self.repository.issue_exists(issue_id) is False:
            return Schema__Issue__Delete__Response(success  = False                         ,
                                                   deleted  = False                         ,
                                                   issue_id = issue_id                      ,
                                                   message  = f'Issue not found: {issue_id}')

        self.repository.delete_issue(issue_id)

        index = self.repository.get_index()
        index.issues = [s for s in index.issues if str(s.issue_id) != str(issue_id)]
        index.last_updated = Timestamp_Now()
        self.update_status_counts(index)
        self.repository.save_index(index)

        return Schema__Issue__Delete__Response(success  = True    ,
                                               deleted  = True    ,
                                               issue_id = issue_id)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Comment Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def add_comment(self                                              ,          # Add comment to issue
                    issue_id : Safe_Str__Issue_Id                     ,
                    request  : Schema__Issue__Add_Comment__Request
               ) -> Schema__Issue__Add_Comment__Response:
        issue = self.repository.get_issue(issue_id)
        if issue is None:
            return Schema__Issue__Add_Comment__Response(success = False                         ,
                                                        message = f'Issue not found: {issue_id}')

        if str(request.text).strip() == '':
            return Schema__Issue__Add_Comment__Response(success = False                         ,
                                                        message = 'Comment text is required'    )

        comment = Schema__Issue__Comment(author     = request.author  ,
                                         comment_id = Comment_Id.new(),
                                         issue_id   = issue_id        ,
                                         text       = request.text    )

        issue.comments.append(comment)
        issue.updated = Timestamp_Now()
        if self.repository.save_issue(issue):
            return Schema__Issue__Add_Comment__Response(success = True   ,
                                                        comment = comment)
        else:
            return Schema__Issue__Add_Comment__Response(success = False                 ,
                                                        message = 'Failed to save issue')

    # ═══════════════════════════════════════════════════════════════════════════════
    # Helper Methods
    # ═══════════════════════════════════════════════════════════════════════════════

    def update_status_counts(self, index: Schema__Issues__Index) -> None:        # Recalculate status counts
        counts = Schema__Issue__Status_Counts()

        for summary in index.issues:
            status = str(summary.status.value)
            if status == 'backlog':
                counts.backlog = Safe_UInt(int(counts.backlog) + 1)
            elif status == 'todo':
                counts.todo = Safe_UInt(int(counts.todo) + 1)
            elif status == 'in-progress':
                counts.in_progress = Safe_UInt(int(counts.in_progress) + 1)
            elif status == 'review':
                counts.review = Safe_UInt(int(counts.review) + 1)
            elif status == 'done':
                counts.done = Safe_UInt(int(counts.done) + 1)

        index.statusCounts = counts


    def issue__from_number(self, number: int) -> Safe_Str__Issue_Id:                   # Create from issue number
        return Safe_Str__Issue_Id(f"Issue-{number:03d}")
