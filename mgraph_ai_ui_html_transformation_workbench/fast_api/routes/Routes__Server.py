# ═══════════════════════════════════════════════════════════════════════════════
# Routes__Server - REST API for server status and health checks
# Provides endpoints for viewing server configuration and health
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi                                                                                    import HTTPException
from osbot_fast_api.api.routes.Fast_API__Routes                                                 import Fast_API__Routes
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text                    import Safe_Str__Text
from issues_fs.schemas.status.Schema__API__Info                import Schema__API__Info
from issues_fs.schemas.status.Schema__Git__Status              import Schema__Git__Status
from issues_fs.schemas.status.Schema__Index__Status            import Schema__Index__Status
from issues_fs.schemas.status.Schema__Server__Status           import Schema__Server__Status__Response
from issues_fs.schemas.status.Schema__Storage__Status          import Schema__Storage__Status
from issues_fs.schemas.status.Schema__Types__Status            import Schema__Types__Status
from issues_fs.issues.status.Server__Status__Service   import Server__Status__Service

TAG__ROUTES_SERVER = 'server'


class Routes__Server(Fast_API__Routes):                                          # Server status routes
    service : Server__Status__Service                                            # Status service
    tag     : Safe_Str__Text          = Safe_Str__Text(TAG__ROUTES_SERVER)       # Route tag

    # ═══════════════════════════════════════════════════════════════════════════════
    # Full Status Endpoint
    # ═══════════════════════════════════════════════════════════════════════════════

    def status(self) -> Schema__Server__Status__Response:           # GET /server/status
        response = self.service.get_full_status()
        if response.success is False:
            raise HTTPException(status_code = 500                   ,
                                detail      = str(response.message) )
        return response

    # ═══════════════════════════════════════════════════════════════════════════════
    # Individual Component Endpoints
    # ═══════════════════════════════════════════════════════════════════════════════

    def api(self) -> Schema__API__Info:                             # GET /server/api
        return self.service.get_api_info()

    def storage(self) -> Schema__Storage__Status:                   # GET /server/storage
        status = self.service.get_storage_status()
        if status is None:
            raise HTTPException(status_code = 503                              ,
                                detail      = 'Storage service not configured' )
        return status

    def git(self) -> Schema__Git__Status:                           # GET /server/git
        status = self.service.get_git_status()
        if status is None:
            raise HTTPException(status_code = 503                          ,
                                detail      = 'Git service not configured' )
        return status

    def types(self) -> Schema__Types__Status:                       # GET /server/types
        status = self.service.get_types_status()
        if status is None:
            raise HTTPException(status_code = 503                            ,
                                detail      = 'Types service not configured' )
        return status

    def index(self) -> Schema__Index__Status:                       # GET /server/index
        status = self.service.get_index_status()
        if status is None:
            raise HTTPException(status_code = 503                            ,
                                detail      = 'Index service not configured' )
        return status

    def setup_routes(self):
        self.add_route_get(self.status  )
        self.add_route_get(self.api     )
        self.add_route_get(self.storage )
        self.add_route_get(self.git     )
        self.add_route_get(self.types   )
        self.add_route_get(self.index   )
