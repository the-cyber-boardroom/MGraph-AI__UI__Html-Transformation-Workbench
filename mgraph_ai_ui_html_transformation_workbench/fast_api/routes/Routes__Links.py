# ═══════════════════════════════════════════════════════════════════════════════
# Routes__Links - REST API for graph link (relationship) operations
# Provides endpoints for creating and deleting bidirectional links
#
# Path pattern: /api/nodes/{label}/links/...
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi                                                                                            import HTTPException
from osbot_fast_api.api.decorators.route_path                                                           import route_path
from osbot_fast_api.api.routes.Fast_API__Routes                                                         import Fast_API__Routes
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Link__Requests                    import Schema__Link__Create__Request, Schema__Link__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Link__Requests                    import Schema__Link__Delete__Response, Schema__Link__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.safe_str.Safe_Str__Graph_Types            import Safe_Str__Node_Type, Safe_Str__Node_Label
from mgraph_ai_ui_html_transformation_workbench.service.graph.Link__Service                             import Link__Service


TAG__ROUTES_LINKS = 'links'

ROUTES_PATHS__LINKS = [f'/api/nodes/{{label}}/links'                             ,
                       f'/api/nodes/{{label}}/links/{{target_label}}'            ]


class Routes__Links(Fast_API__Routes):                                           # Link routes
    tag     : str          = TAG__ROUTES_LINKS                                   # Route tag
    service : Link__Service                                                      # Link service

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Links Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/nodes/{label}/links')
    def links(self                             ,                                 # GET /api/nodes/{label}/links
              label : Safe_Str__Node_Label
         ) -> Schema__Link__List__Response:
        node_type = self.parse_label_type(label)
        if node_type is None:
            raise HTTPException(status_code = 400                       ,
                                detail      = f'Invalid label: {label}' )

        return self.service.list_links(node_type = node_type ,
                                       label     = label     )

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Link Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/nodes/{label}/links')
    def link__create(self                                       ,                # POST /api/nodes/{label}/links
                     label   : Safe_Str__Node_Label             ,
                     request : Schema__Link__Create__Request
                ) -> Schema__Link__Create__Response:
        node_type = self.parse_label_type(label)
        if node_type is None:
            raise HTTPException(status_code = 400                       ,
                                detail      = f'Invalid label: {label}' )

        response = self.service.create_link(source_type  = node_type ,
                                            source_label = label     ,
                                            request      = request   )
        if response.success is False:
            raise HTTPException(status_code = 400              ,
                                detail      = response.message )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Link Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/nodes/{label}/links/{target_label}')
    def link__delete(self                                    ,                   # DELETE /api/nodes/{label}/links/{target_label}
                     label        : Safe_Str__Node_Label     ,
                     target_label : Safe_Str__Node_Label
                ) -> Schema__Link__Delete__Response:
        node_type = self.parse_label_type(label)
        if node_type is None:
            raise HTTPException(status_code = 400                       ,
                                detail      = f'Invalid label: {label}' )

        response = self.service.delete_link(source_type  = node_type    ,
                                            source_label = label        ,
                                            target_label = target_label )
        if response.success is False:
            raise HTTPException(status_code = 404              ,
                                detail      = response.message )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Helper Methods
    # ═══════════════════════════════════════════════════════════════════════════════

    def parse_label_type(self                             ,                      # Extract type from label
                         label : Safe_Str__Node_Label
                    ) -> Safe_Str__Node_Type:
        label_str = str(label)
        if '-' not in label_str:
            return None
        type_part = label_str.split('-', 1)[0].lower()
        try:
            return Safe_Str__Node_Type(type_part)
        except Exception:
            return None

    # ═══════════════════════════════════════════════════════════════════════════════
    # Route Setup
    # ═══════════════════════════════════════════════════════════════════════════════

    def setup_routes(self):                                                      # Configure all routes
        self.add_route_get   (self.links        )
        self.add_route_post  (self.link__create )
        self.add_route_delete(self.link__delete )
        return self
