# ═══════════════════════════════════════════════════════════════════════════════
# Routes__Roots - REST API for root selection operations
# Phase 1: Endpoints for listing and selecting root folders
#
# Endpoints:
#   GET  /api/roots              - List all available roots
#   GET  /api/roots/with-children - List roots with issues/ folders
#   GET  /api/roots/current      - Get currently selected root
#   POST /api/roots/select       - Select a new root
# ═══════════════════════════════════════════════════════════════════════════════
from issues_fs.schemas.issues.phase_1.Schema__Root             import Schema__Root__List__Response, Schema__Root__Select__Request, Schema__Root__Select__Response, Schema__Root__Current__Response
from issues_fs.issues.phase_1.Root__Selection__Service import Root__Selection__Service
from osbot_fast_api.api.decorators.route_path                                                   import route_path
from osbot_fast_api.api.routes.Fast_API__Routes                                                 import Fast_API__Routes


TAG__ROUTES_ROOTS = 'roots'

ROUTES_PATHS__ROOTS = ['/api/roots'              ,
                       '/api/roots/with-children',
                       '/api/roots/current'      ,
                       '/api/roots/select'       ]


class Routes__Roots(Fast_API__Routes):                                           # Root selection routes
    tag     : str                      = TAG__ROUTES_ROOTS
    service : Root__Selection__Service                                           # Injected service

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots - List All Roots
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/roots')
    def roots_list(self) -> Schema__Root__List__Response:                        # List all available roots
        return self.service.get_available_roots()

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots/with-children - List Roots With Children
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/roots/with-children')
    def roots_with_children(self) -> Schema__Root__List__Response:               # List roots that have issues/ folders
        return self.service.get_roots_with_children()

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots/current - Get Current Root
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/roots/current')
    def roots_current(self) -> Schema__Root__Current__Response:                  # Get currently selected root
        return self.service.get_current_root()

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/roots/select - Select Root
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/roots/select')
    def roots_select(self                                      ,                 # Select a new root
                     request : Schema__Root__Select__Request
                ) -> Schema__Root__Select__Response:
        return self.service.set_current_root(request)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Route Setup
    # ═══════════════════════════════════════════════════════════════════════════════

    def setup_routes(self):                                                      # Configure all routes
        self.add_route_get (self.roots_list         )
        self.add_route_get (self.roots_with_children)
        self.add_route_get (self.roots_current      )
        self.add_route_post(self.roots_select       )
        return self