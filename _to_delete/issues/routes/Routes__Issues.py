# ═══════════════════════════════════════════════════════════════════════════════
# Routes__Issues - REST API for issue CRUD operations
# Provides endpoints for issue create, read, update, delete, and comments
#
# Path pattern: /api/issues/...
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi                                                                                            import HTTPException
from osbot_fast_api.api.decorators.route_path                                                           import route_path
from osbot_fast_api.api.routes.Fast_API__Routes                                                         import Fast_API__Routes

from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Issue__Status import Enum__Issue__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue                            import Schema__Issue
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Create__Request           import Schema__Issue__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Create__Response          import Schema__Issue__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Update__Request           import Schema__Issue__Update__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Update__Response          import Schema__Issue__Update__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Add_Comment__Request      import Schema__Issue__Add_Comment__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Add_Comment__Response     import Schema__Issue__Add_Comment__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Delete__Response          import Schema__Issue__Delete__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__List__Response            import Schema__Issue__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id import Safe_Str__Issue_Id
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Service                           import Issue__Service


TAG__ROUTES_ISSUES = 'issues'

ROUTES_PATHS__ISSUES = [f'/api/{TAG__ROUTES_ISSUES}'                             ,
                        f'/api/{TAG__ROUTES_ISSUES}/{{issue_id}}'                ,
                        f'/api/{TAG__ROUTES_ISSUES}/{{issue_id}}/comments'       ,
                        f'/api/{TAG__ROUTES_ISSUES}/{{issue_id}}/status'         ]


class Routes__Issues(Fast_API__Routes):                                          # Issue routes
    tag     : str           = TAG__ROUTES_ISSUES                                 # Route tag
    service : Issue__Service                                                     # Issue service

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues')
    def issues(self) -> Schema__Issue__List__Response:                           # GET /api/issues
        return self.service.list_issues()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues')
    def issue__create(self                                            ,          # POST /api/issues
                      request: Schema__Issue__Create__Request
                 ) -> Schema__Issue__Create__Response:
        response = self.service.create_issue(request)
        if response.success is False:
            raise HTTPException(status_code = 400                 ,
                                detail      = response.message    )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Get Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues/{issue_id}')
    def issue__get(self                              ,                           # GET /api/issues/{issue_id}
                   issue_id: Safe_Str__Issue_Id
              ) -> Schema__Issue:
        issue = self.service.get_issue(issue_id)
        if issue is None:
            raise HTTPException(status_code = 404                             ,
                                detail      = f'Issue not found: {issue_id}'  )
        return issue

    # ═══════════════════════════════════════════════════════════════════════════════
    # Update Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues/{issue_id}')
    def issue__update(self                                            ,          # PATCH /api/issues/{issue_id}
                      issue_id : Safe_Str__Issue_Id                   ,
                      request  : Schema__Issue__Update__Request
                 ) -> Schema__Issue__Update__Response:
        response = self.service.update_issue(issue_id = issue_id ,
                                             request  = request  )
        if response.success is False:
            raise HTTPException(status_code = 404                 ,
                                detail      = response.message    )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues/{issue_id}')
    def issue__delete(self                              ,                        # DELETE /api/issues/{issue_id}
                      issue_id: Safe_Str__Issue_Id
                 ) -> Schema__Issue__Delete__Response:
        response = self.service.delete_issue(issue_id)
        if response.success is False:
            raise HTTPException(status_code = 404                 ,
                                detail      = response.message    )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Comment Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues/{issue_id}/comments')
    def issue__add_comment(self                                            ,     # POST /api/issues/{issue_id}/comments
                           issue_id : Safe_Str__Issue_Id                   ,
                           request  : Schema__Issue__Add_Comment__Request
                      ) -> Schema__Issue__Add_Comment__Response:
        response = self.service.add_comment(issue_id = issue_id ,
                                            request  = request  )
        if response.success is False:
            raise HTTPException(status_code = 404 if 'not found' in response.message else 400,
                                detail      = response.message                               )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Status Shorthand Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues/{issue_id}/status')
    def issue__update_status(self                                  ,             # PATCH /api/issues/{issue_id}/status
                             issue_id : Safe_Str__Issue_Id         ,
                             status   : Enum__Issue__Status
                        ) -> Schema__Issue__Update__Response:
        response = self.service.update_status(issue_id = issue_id ,
                                              status   = status   )
        if response.success is False:
            raise HTTPException(status_code = 404                 ,
                                detail      = response.message    )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Route Setup
    # ═══════════════════════════════════════════════════════════════════════════════

    def setup_routes(self):                                                      # Configure all routes
        self.add_route_get   (self.issues            )
        self.add_route_get   (self.issue__get        )
        self.add_route_post  (self.issue__create     )
        self.add_route_patch (self.issue__update     )
        self.add_route_delete(self.issue__delete     )
        self.add_route_post  (self.issue__add_comment)
        self.add_route_patch (self.issue__update_status)
        return self
