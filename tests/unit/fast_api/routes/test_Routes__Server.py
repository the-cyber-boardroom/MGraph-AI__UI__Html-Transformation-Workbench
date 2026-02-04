# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Server - Unit tests for server status REST API routes
# Tests all server status endpoints using actual services
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                   import TestCase
from fastapi                                                                                    import HTTPException
from osbot_utils.type_safe.primitives.core.Safe_UInt                                            import Safe_UInt
from osbot_utils.type_safe.primitives.domains.common.safe_str.Safe_Str__Text                    import Safe_Str__Text
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Server                  import Routes__Server
from issues_fs.schemas.status.Schema__API__Info                import Schema__API__Info
from issues_fs.schemas.status.Schema__Git__Status              import Schema__Git__Status
from issues_fs.schemas.status.Schema__Index__Status            import Schema__Index__Status
from issues_fs.schemas.status.Schema__Server__Status           import Schema__Server__Status__Response
from issues_fs.schemas.status.Schema__Storage__Status          import Schema__Storage__Status
from issues_fs.schemas.status.Schema__Types__Status            import Schema__Types__Status
from issues_fs.issues.status.Git__Status__Service      import Git__Status__Service
from issues_fs.issues.status.Index__Status__Service    import Index__Status__Service
from issues_fs.issues.status.Server__Status__Service   import Server__Status__Service
from issues_fs.issues.status.Storage__Status__Service  import Storage__Status__Service
from issues_fs.issues.status.Types__Status__Service    import Types__Status__Service


# ═══════════════════════════════════════════════════════════════════════════════
# Mock Services
# ═══════════════════════════════════════════════════════════════════════════════

class Mock__Storage__Status__Service(Storage__Status__Service):
    def get_status(self):
        return Schema__Storage__Status(backend_type = Safe_Str__Text('memory'),
                                       is_connected = True                    ,
                                       is_writable  = True                    )


class Mock__Git__Status__Service(Git__Status__Service):
    def get_status(self):
        return Schema__Git__Status(is_git_repo    = True                              ,
                                   current_branch = Safe_Str__Text('main')            )


class Mock__Types__Status__Service(Types__Status__Service):
    def get_status(self):
        return Schema__Types__Status(is_initialized  = True              ,
                                     node_type_count = Safe_UInt(4)      ,
                                     link_type_count = Safe_UInt(5)      ,
                                     node_types      = []                ,
                                     link_types      = []                )


class Mock__Index__Status__Service(Index__Status__Service):
    def get_status(self):
        return Schema__Index__Status(global_index_exists = True          ,
                                     total_nodes         = Safe_UInt(42) ,
                                     type_counts         = []            )


class test_Routes__Server(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup - create once
        cls.server_service = Server__Status__Service(storage_service = Mock__Storage__Status__Service()  ,
                                                     git_service     = Mock__Git__Status__Service()      ,
                                                     types_service   = Mock__Types__Status__Service()    ,
                                                     index_service   = Mock__Index__Status__Service()    )

        cls.routes = Routes__Server(service=cls.server_service)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Initialization Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__init__(self):                                                      # Test routes initialization
        assert type(self.routes)    is Routes__Server
        assert self.routes.service  is not None
        assert str(self.routes.tag) == 'server'

    # ═══════════════════════════════════════════════════════════════════════════════
    # server__status Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__status(self):                                              # Test full status endpoint
        response = self.routes.status()

        assert type(response)   is Schema__Server__Status__Response
        assert response.success is True
        assert response.status  is not None

    def test__status__contains_all_components(self):                     # Test all components
        response = self.routes.status()
        status   = response.status

        assert status.api      is not None
        assert status.storage  is not None
        assert status.git      is not None
        assert status.types    is not None
        assert status.index    is not None

    def test__status__has_timestamp(self):                               # Test timestamp
        response = self.routes.status()

        assert str(response.status.timestamp) != ''

    # ═══════════════════════════════════════════════════════════════════════════════
    # server__api Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__api(self):                                                 # Test API info endpoint
        response = self.routes.api()

        assert type(response) is Schema__API__Info

    def test__api__has_version(self):                                    # Test API version
        response = self.routes.api()

        assert str(response.version)        != ''
        assert str(response.api_name)       != ''
        assert str(response.python_version) != ''

    # ═══════════════════════════════════════════════════════════════════════════════
    # server__storage Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__storage(self):                                             # Test storage status endpoint
        response = self.routes.storage()

        assert type(response)         is Schema__Storage__Status
        assert str(response.backend_type) == 'memory'
        assert response.is_connected  is True

    def test__storage__not_configured(self):                             # Test storage not configured
        routes = Routes__Server(service=Server__Status__Service())               # No storage service

        with self.assertRaises(HTTPException) as context:
            routes.storage()

        assert context.exception.status_code == 503

    # ═══════════════════════════════════════════════════════════════════════════════
    # server__git Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__git(self):                                                 # Test git status endpoint
        response = self.routes.git()

        assert type(response)         is Schema__Git__Status
        assert response.is_git_repo   is True
        assert str(response.current_branch) == 'main'

    def test__git__not_configured(self):                                 # Test git not configured
        routes = Routes__Server(service=Server__Status__Service())

        with self.assertRaises(HTTPException) as context:
            routes.git()

        assert context.exception.status_code == 503

    # ═══════════════════════════════════════════════════════════════════════════════
    # server__types Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__types(self):                                               # Test types status endpoint
        response = self.routes.types()

        assert type(response)              is Schema__Types__Status
        assert response.is_initialized     is True
        assert int(response.node_type_count) == 4
        assert int(response.link_type_count) == 5

    def test__types__not_configured(self):                               # Test types not configured
        routes = Routes__Server(service=Server__Status__Service())

        with self.assertRaises(HTTPException) as context:
            routes.types()

        assert context.exception.status_code == 503

    # ═══════════════════════════════════════════════════════════════════════════════
    # server__index Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__index(self):                                               # Test index status endpoint
        response = self.routes.index()

        assert type(response)            is Schema__Index__Status
        assert response.global_index_exists is True
        assert int(response.total_nodes) == 42

    def test__index__not_configured(self):                               # Test index not configured
        routes = Routes__Server(service=Server__Status__Service())

        with self.assertRaises(HTTPException) as context:
            routes.index()

        assert context.exception.status_code == 503



    # ═══════════════════════════════════════════════════════════════════════════════
    # Integration Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__integration__all_endpoints_consistent(self):                       # Test endpoint consistency
        full_status = self.routes.status()
        api_info    = self.routes.api()
        storage     = self.routes.storage()
        git         = self.routes.git()
        types       = self.routes.types()
        index       = self.routes.index()

        # Verify all return valid data
        assert full_status.success is True

        # Verify full status contains same data as individual endpoints
        assert str(full_status.status.api.version)           == str(api_info.version)
        assert str(full_status.status.storage.backend_type)  == str(storage.backend_type)
        assert full_status.status.git.is_git_repo            == git.is_git_repo
        assert int(full_status.status.types.node_type_count) == int(types.node_type_count)
        assert int(full_status.status.index.total_nodes)     == int(index.total_nodes)
