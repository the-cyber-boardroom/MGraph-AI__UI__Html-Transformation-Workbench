# ═══════════════════════════════════════════════════════════════════════════════
# Routes__Nodes - REST API for graph node operations
# Provides endpoints for node create, read, update, delete
#
# Path pattern: /api/nodes/...
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi                                                                                            import HTTPException
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types                     import Safe_Str__Node_Type, Safe_Str__Node_Label
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Create__Request             import Schema__Node__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Create__Response            import Schema__Node__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Delete__Response            import Schema__Node__Delete__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__List__Response              import Schema__Node__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Update__Request             import Schema__Node__Update__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Update__Response            import Schema__Node__Update__Response
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Node__Service             import Node__Service
from osbot_fast_api.api.decorators.route_path                                                           import route_path
from osbot_fast_api.api.routes.Fast_API__Routes                                                         import Fast_API__Routes
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node                              import Schema__Node


TAG__ROUTES_NODES = 'nodes'

ROUTES_PATHS__NODES = [f'/api/{TAG__ROUTES_NODES}'                               ,
                       f'/api/{TAG__ROUTES_NODES}/{{label}}'                     ,
                       f'/api/{TAG__ROUTES_NODES}/type/{{node_type}}'            ]


class Routes__Nodes(Fast_API__Routes):                                           # Node routes
    tag     : str          = TAG__ROUTES_NODES                                   # Route tag
    service : Node__Service                                                      # Node service

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/nodes')
    def nodes(self) -> Schema__Node__List__Response:                             # GET /api/nodes
        return self.service.list_nodes()

    @route_path('/api/nodes/type/{node_type}')
    def nodes__by_type(self                            ,                         # GET /api/nodes/type/{node_type}
                       node_type : Safe_Str__Node_Type
                  ) -> Schema__Node__List__Response:
        return self.service.list_nodes(node_type=node_type)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/nodes')
    def node__create(self                                       ,                # POST /api/nodes
                     request : Schema__Node__Create__Request
                ) -> Schema__Node__Create__Response:
        response = self.service.create_node(request)
        if response.success is False:
            raise HTTPException(status_code = 400              ,
                                detail      = response.message )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Get Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/nodes/{label}')
    def node__get(self                             ,                             # GET /api/nodes/{label}
                  label : Safe_Str__Node_Label
             ) -> Schema__Node:
        # Parse label to get type
        node_type = self.parse_label_type(label)
        if node_type is None:
            raise HTTPException(status_code = 400                       ,
                                detail      = f'Invalid label: {label}' )

        node = self.service.get_node(node_type = node_type ,
                                     label     = label     )
        if node is None:
            raise HTTPException(status_code = 404                      ,
                                detail      = f'Node not found: {label}')
        return node

    # ═══════════════════════════════════════════════════════════════════════════════
    # Update Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/nodes/{label}')
    def node__update(self                                       ,                # PATCH /api/nodes/{label}
                     label   : Safe_Str__Node_Label             ,
                     request : Schema__Node__Update__Request
                ) -> Schema__Node__Update__Response:
        node_type = self.parse_label_type(label)
        if node_type is None:
            raise HTTPException(status_code = 400                       ,
                                detail      = f'Invalid label: {label}' )

        response = self.service.update_node(node_type = node_type ,
                                            label     = label     ,
                                            request   = request   )
        if response.success is False:
            raise HTTPException(status_code = 404              ,
                                detail      = response.message )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Operation
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/nodes/{label}')
    def node__delete(self                             ,                          # DELETE /api/nodes/{label}
                     label : Safe_Str__Node_Label
                ) -> Schema__Node__Delete__Response:
        node_type = self.parse_label_type(label)
        if node_type is None:
            raise HTTPException(status_code = 400                       ,
                                detail      = f'Invalid label: {label}' )

        response = self.service.delete_node(node_type = node_type ,
                                            label     = label     )
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
        self.add_route_get   (self.nodes         )
        self.add_route_get   (self.nodes__by_type)
        self.add_route_get   (self.node__get     )
        self.add_route_post  (self.node__create  )
        self.add_route_patch (self.node__update  )
        self.add_route_delete(self.node__delete  )
        return self
