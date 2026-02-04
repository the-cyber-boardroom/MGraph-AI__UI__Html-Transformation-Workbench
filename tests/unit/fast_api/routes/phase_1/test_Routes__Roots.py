# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Roots - Tests for Phase 1 root selection API endpoints
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase
from memory_fs.helpers.Memory_FS__In_Memory                                                             import Memory_FS__In_Memory
from osbot_utils.utils.Json                                                                             import json_dumps
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.phase_1.Routes__Roots                   import Routes__Roots, TAG__ROUTES_ROOTS, ROUTES_PATHS__ROOTS
from issues_fs.schemas.issues.phase_1.Schema__Root                     import Schema__Root__Select__Request
from issues_fs.issues.graph_services.Graph__Repository         import Graph__Repository
from issues_fs.issues.phase_1.Root__Selection__Service         import Root__Selection__Service
from issues_fs.issues.storage.Path__Handler__Graph_Node        import Path__Handler__Graph_Node


class test_Routes__Roots(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup for all tests
        cls.memory_fs    = Memory_FS__In_Memory()
        cls.path_handler = Path__Handler__Graph_Node()
        cls.repository   = Graph__Repository(memory_fs    = cls.memory_fs   ,
                                             path_handler = cls.path_handler)
        cls.service      = Root__Selection__Service(repository   = cls.repository  ,
                                                    path_handler = cls.path_handler)
        cls.routes       = Routes__Roots(service = cls.service)

    def setUp(self):                                                             # Reset storage before each test
        self.repository.clear_storage()
        self.service.current_root = ''

    # ═══════════════════════════════════════════════════════════════════════════════
    # Helper Methods
    # ═══════════════════════════════════════════════════════════════════════════════

    def create_issue_at_path(self                             ,
                             path       : str                 ,
                             label      : str = 'Test-1'      ,
                             title      : str = 'Test Issue'  ,
                             node_type  : str = 'task'
                        ) -> None:
        data    = {'label': label, 'title': title, 'node_type': node_type}
        content = json_dumps(data, indent=2)
        self.repository.storage_fs.file__save(path, content.encode('utf-8'))

    def create_standard_issue(self                              ,
                              node_type  : str = 'task'         ,
                              label      : str = 'Task-1'       ,
                              title      : str = 'Test Task'
                         ) -> str:
        path = f".issues/data/{node_type}/{label}/issue.json"
        self.create_issue_at_path(path, label=label, title=title, node_type=node_type)
        return f"data/{node_type}/{label}"

    # ═══════════════════════════════════════════════════════════════════════════════
    # Constants Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__tag_constant(self):                                                # Test tag value
        assert TAG__ROUTES_ROOTS == 'roots'
        assert self.routes.tag   == 'roots'

    def test__routes_paths_constant(self):                                       # Test route paths
        assert '/api/roots'               in ROUTES_PATHS__ROOTS
        assert '/api/roots/with-children' in ROUTES_PATHS__ROOTS
        assert '/api/roots/current'       in ROUTES_PATHS__ROOTS
        assert '/api/roots/select'        in ROUTES_PATHS__ROOTS

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots_list__returns_response(self):                                # Test returns list response
        response = self.routes.roots_list()

        assert response.success    is True
        assert response.roots      is not None
        assert int(response.total) >= 1

    def test__roots_list__includes_root(self):                                   # Test always includes root
        response = self.routes.roots_list()

        root = response.roots[0]
        assert str(root.path) == ''

    def test__roots_list__finds_issues(self):                                    # Test finds created issues
        self.create_standard_issue(node_type='task', label='Task-1')
        self.create_standard_issue(node_type='bug',  label='Bug-1')

        response = self.routes.roots_list()

        assert int(response.total) >= 3
        paths = [str(r.path) for r in response.roots]
        assert 'data/task/Task-1' in paths
        assert 'data/bug/Bug-1'   in paths

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots/with-children Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots_with_children__returns_response(self):                       # Test returns list response
        response = self.routes.roots_with_children()

        assert response.success is True
        assert response.roots   is not None

    def test__roots_with_children__empty_when_no_nested(self):                   # Test empty when no children
        self.create_standard_issue(node_type='task', label='Task-1')

        response = self.routes.roots_with_children()

        assert int(response.total) == 0

    def test__roots_with_children__finds_parents(self):                          # Test finds parents with children
        parent = ".issues/data/feature/Feature-1/issue.json"
        self.create_issue_at_path(parent, label='Feature-1', node_type='feature')

        child = ".issues/data/feature/Feature-1/issues/Task-1/issue.json"
        self.create_issue_at_path(child, label='Task-1', node_type='task')

        response = self.routes.roots_with_children()

        assert int(response.total) >= 1
        paths = [str(r.path) for r in response.roots]
        assert any('Feature-1' in p for p in paths)

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots/current Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots_current__default_is_root(self):                              # Test default current root
        response = self.routes.roots_current()

        assert response.success    is True
        assert str(response.path)  == ''
        assert str(response.label) == 'Root'

    def test__roots_current__after_selection(self):                              # Test after selecting root
        relative_path = self.create_standard_issue(node_type='task', label='Task-1')

        select_req = Schema__Root__Select__Request(path=relative_path)
        self.service.set_current_root(select_req)

        response = self.routes.roots_current()

        assert response.success          is True
        assert str(response.path)        == relative_path
        assert str(response.label)       == 'Task-1'
        assert str(response.issue_type)  == 'task'

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/roots/select Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots_select__valid_path(self):                                    # Test selecting valid path
        relative_path = self.create_standard_issue(node_type='feature', label='Feature-1')

        request  = Schema__Root__Select__Request(path=relative_path)
        response = self.routes.roots_select(request)

        assert response.success       is True
        assert str(response.path)     == relative_path
        assert str(response.previous) == ''

    def test__roots_select__invalid_path(self):                                  # Test selecting invalid path
        request  = Schema__Root__Select__Request(path='nonexistent/path')
        response = self.routes.roots_select(request)

        assert response.success is False
        assert 'Invalid' in str(response.message)

    def test__roots_select__empty_resets(self):                                  # Test empty path resets to root
        self.create_standard_issue(node_type='task', label='Task-1')             # Set a root first
        self.service.set_current_root(Schema__Root__Select__Request(path='data/task/Task-1'))

        request  = Schema__Root__Select__Request(path='')
        response = self.routes.roots_select(request)

        assert response.success       is True
        assert str(response.path)     == ''
        assert str(response.previous) == 'data/task/Task-1'

    def test__roots_select__updates_service(self):                               # Test updates service state
        relative_path = self.create_standard_issue(node_type='bug', label='Bug-1')

        request = Schema__Root__Select__Request(path=relative_path)
        self.routes.roots_select(request)

        current = self.routes.roots_current()
        assert str(current.path)  == relative_path
        assert str(current.label) == 'Bug-1'

    # ═══════════════════════════════════════════════════════════════════════════════
    # Integration Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__full_flow__list_select_current(self):                              # Test full workflow
        self.create_standard_issue(node_type='feature', label='Feature-1')       # Create some issues
        self.create_standard_issue(node_type='task',    label='Task-1')

        list_response = self.routes.roots_list()                                 # List available roots
        assert int(list_response.total) >= 3

        request = Schema__Root__Select__Request(path='data/feature/Feature-1')   # Select Feature-1
        select_response = self.routes.roots_select(request)
        assert select_response.success is True

        current_response = self.routes.roots_current()                           # Verify current
        assert str(current_response.path) == 'data/feature/Feature-1'

        request2 = Schema__Root__Select__Request(path='data/task/Task-1')        # Select Task-1
        select_response2 = self.routes.roots_select(request2)
        assert str(select_response2.previous) == 'data/feature/Feature-1'

        current_response2 = self.routes.roots_current()                          # Verify new current
        assert str(current_response2.path) == 'data/task/Task-1'