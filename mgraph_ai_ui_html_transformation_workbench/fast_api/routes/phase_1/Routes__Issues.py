# ═══════════════════════════════════════════════════════════════════════════════
# Routes__Issues - REST API for child issue and conversion operations
# Phase 1: Endpoints for hierarchical issue management
#
# Endpoints:
#   POST /api/issues/children         - Add child issue to parent
#   GET  /api/issues/children         - List children of an issue
#   POST /api/issues/convert          - Convert issue to new structure (create issues/ folder)
# ═══════════════════════════════════════════════════════════════════════════════
from issues_fs.schemas.issues.phase_1.Schema__Issue__Children   import Schema__Add_Child__Request, Schema__Issue__Child__Response, Schema__Issue__Child__Create, Schema__List_Children__Request, Schema__Issue__Children__List__Response, Schema__Convert__Request, Schema__Issue__Convert__Response
from issues_fs.issues.phase_1.Issue__Children__Service  import Issue__Children__Service
from osbot_fast_api.api.decorators.route_path                                                    import route_path
from osbot_fast_api.api.routes.Fast_API__Routes                                                  import Fast_API__Routes



TAG__ROUTES_ISSUES = 'issues'

ROUTES_PATHS__ISSUES = ['/api/issues/children',
                        '/api/issues/convert' ]


class Routes__Issues(Fast_API__Routes):                                          # Issue child management routes
    tag     : str                       = TAG__ROUTES_ISSUES
    service : Issue__Children__Service                                           # Injected service

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/issues/children - Add Child Issue
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues/children')
    def issues_add_child(self                                  ,                 # Add child issue to parent
                         request : Schema__Add_Child__Request
                    ) -> Schema__Issue__Child__Response:
        child_data = Schema__Issue__Child__Create(issue_type  = request.issue_type  ,
                                                  title       = request.title       ,
                                                  description = request.description ,
                                                  status      = request.status      )

        return self.service.add_child_issue(parent_path = request.parent_path,
                                            child_data  = child_data         )

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/issues/children - List Children
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues/children/list')
    def issues_list_children(self                                    ,           # List children of an issue
                             request : Schema__List_Children__Request
                        ) -> Schema__Issue__Children__List__Response:
        return self.service.list_children(parent_path=request.parent_path)

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/issues/convert - Convert to New Structure
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/issues/convert')
    def issues_convert(self                              ,                       # Convert issue to new structure
                       request : Schema__Convert__Request
                  ) -> Schema__Issue__Convert__Response:
        return self.service.convert_to_new_structure(issue_path=request.issue_path)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Route Setup
    # ═══════════════════════════════════════════════════════════════════════════════

    def setup_routes(self):                                                      # Configure all routes
        self.add_route_post(self.issues_add_child    )
        self.add_route_post(self.issues_list_children)
        self.add_route_post(self.issues_convert      )
        return self