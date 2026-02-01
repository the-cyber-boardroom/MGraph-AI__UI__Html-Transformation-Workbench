# ═══════════════════════════════════════════════════════════════════════════════
# Routes__Labels - REST API for label CRUD operations
# Provides endpoints for label create, list, and delete
#
# Path pattern: /api/labels/...
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi                                                                                            import HTTPException
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Create__Request           import Schema__Label__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Create__Response          import Schema__Label__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Delete__Response          import Schema__Label__Delete__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Labels__List__Response           import Schema__Labels__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name                   import Safe_Str__Label_Name
from osbot_fast_api.api.decorators.route_path                                                           import route_path
from osbot_fast_api.api.routes.Fast_API__Routes                                                         import Fast_API__Routes
from mgraph_ai_ui_html_transformation_workbench.service.issues.Label__Service                           import Label__Service


TAG__ROUTES_LABELS = 'labels'

ROUTES_PATHS__LABELS = [f'/api/{TAG__ROUTES_LABELS}'                ,
                        f'/api/{TAG__ROUTES_LABELS}/{{name}}'       ]


class Routes__Labels(Fast_API__Routes):                                          # Label routes
    tag     : str           = TAG__ROUTES_LABELS                                 # Route tag
    service : Label__Service                                                     # Label service

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/labels')
    def labels(self) -> Schema__Labels__List__Response:                          # GET /api/labels
        return self.service.list_labels()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/labels')
    def label__create(self                                            ,          # POST /api/labels
                      request: Schema__Label__Create__Request
                 ) -> Schema__Label__Create__Response:
        response = self.service.create_label(request)
        if response.success is False:
            raise HTTPException(status_code = 400                 ,
                                detail      = response.message    )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/labels/{name}')
    def label__delete(self                          ,                            # DELETE /api/labels/{name}
                      name: Safe_Str__Label_Name
                 ) -> Schema__Label__Delete__Response:
        response = self.service.delete_label(name)
        if response.success is False:
            raise HTTPException(status_code = 404                 ,
                                detail      = response.message    )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Route Setup
    # ═══════════════════════════════════════════════════════════════════════════════

    def setup_routes(self):                                                      # Configure all routes
        self.add_route_get   (self.labels       )
        self.add_route_post  (self.label__create)
        self.add_route_delete(self.label__delete)
        return self
