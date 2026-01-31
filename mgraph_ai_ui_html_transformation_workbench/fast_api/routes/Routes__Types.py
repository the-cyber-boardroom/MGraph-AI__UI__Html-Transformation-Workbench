# ═══════════════════════════════════════════════════════════════════════════════
# Routes__Types - REST API for node type and link type operations
# Provides endpoints for managing type definitions
#
# Path pattern: /api/types/... and /api/link-types/...
# ═══════════════════════════════════════════════════════════════════════════════

from typing                                                                                             import List
from fastapi                                                                                            import HTTPException
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types import Safe_Str__Node_Type, Safe_Str__Link_Verb
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Type__Service             import Type__Service
from osbot_fast_api.api.decorators.route_path                                                           import route_path
from osbot_fast_api.api.routes.Fast_API__Routes                                                         import Fast_API__Routes
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Type                        import Schema__Node__Type
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Link__Type                        import Schema__Link__Type


TAG__ROUTES_TYPES = 'types'

ROUTES_PATHS__TYPES = [f'/api/types'                                             ,
                       f'/api/types/{{name}}'                                    ,
                       f'/api/link-types'                                        ,
                       f'/api/link-types/{{verb}}'                               ]


class Routes__Types(Fast_API__Routes):                                           # Type routes
    tag     : str          = TAG__ROUTES_TYPES                                   # Route tag
    service : Type__Service                                                      # Type service

    # ═══════════════════════════════════════════════════════════════════════════════
    # Node Type Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/types')
    def types(self) -> List[Schema__Node__Type]:                                 # GET /api/types
        return self.service.list_node_types()

    @route_path('/api/types/{name}')
    def type__get(self                        ,                                  # GET /api/types/{name}
                  name : Safe_Str__Node_Type
             ) -> Schema__Node__Type:
        node_type = self.service.get_node_type(name)
        if node_type is None:
            raise HTTPException(status_code = 404                             ,
                                detail      = f'Node type not found: {name}'  )
        return node_type

    @route_path('/api/types/{name}')
    def type__delete(self                        ,                               # DELETE /api/types/{name}
                     name : Safe_Str__Node_Type
                ) -> dict:
        success = self.service.delete_node_type(name)
        if success is False:
            raise HTTPException(status_code = 400                                                ,
                                detail      = f'Cannot delete type {name}: nodes exist or not found')
        return {'deleted': True, 'name': str(name)}

    # ═══════════════════════════════════════════════════════════════════════════════
    # Link Type Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path('/api/link-types')
    def link_types(self) -> List[Schema__Link__Type]:                            # GET /api/link-types
        return self.service.list_link_types()

    @route_path('/api/link-types/{verb}')
    def link_type__get(self                        ,                             # GET /api/link-types/{verb}
                       verb : Safe_Str__Link_Verb
                  ) -> Schema__Link__Type:
        link_type = self.service.get_link_type(verb)
        if link_type is None:
            raise HTTPException(status_code = 404                             ,
                                detail      = f'Link type not found: {verb}'  )
        return link_type

    # ═══════════════════════════════════════════════════════════════════════════════
    # Route Setup
    # ═══════════════════════════════════════════════════════════════════════════════

    def setup_routes(self):                                                      # Configure all routes
        self.add_route_get   (self.types        )
        self.add_route_get   (self.type__get    )
        self.add_route_delete(self.type__delete )
        self.add_route_get   (self.link_types   )
        self.add_route_get   (self.link_type__get)
        return self
