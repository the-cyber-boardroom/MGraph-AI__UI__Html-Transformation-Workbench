# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Issues - Tests for Phase 1 child issue API endpoints
# Tests /api/issues/children and /api/issues/convert
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase
from memory_fs.helpers.Memory_FS__In_Memory                                                             import Memory_FS__In_Memory
from osbot_utils.utils.Json                                                                             import json_dumps
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.phase_1.Routes__Issues                  import Routes__Issues, ROUTES_PATHS__ISSUES, TAG__ROUTES_ISSUES
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.phase_1.Schema__Issue__Children          import Schema__Add_Child__Request, Schema__List_Children__Request, Schema__Convert__Request
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository         import Graph__Repository
from mgraph_ai_ui_html_transformation_workbench.service.issues.phase_1.Issue__Children__Service         import Issue__Children__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.storage.Path__Handler__Graph_Node        import Path__Handler__Graph_Node


class test_Routes__Issues(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup for all tests
        cls.memory_fs    = Memory_FS__In_Memory()
        cls.path_handler = Path__Handler__Graph_Node()
        cls.repository   = Graph__Repository(memory_fs    = cls.memory_fs   ,
                                             path_handler = cls.path_handler)
        cls.service      = Issue__Children__Service(repository   = cls.repository  ,
                                                    path_handler = cls.path_handler)
        cls.routes       = Routes__Issues(service = cls.service)

    def setUp(self):                                                             # Reset storage before each test
        self.repository.clear_storage()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Helper Methods
    # ═══════════════════════════════════════════════════════════════════════════════

    def create_issue_at_path(self                             ,
                             path       : str                 ,
                             label      : str = 'Test-1'      ,
                             title      : str = 'Test Issue'  ,
                             node_type  : str = 'task'
                        ) -> None:
        data    = {'label': label, 'title': title, 'node_type': node_type, 'status': 'backlog'}
        content = json_dumps(data, indent=2)
        self.repository.storage_fs.file__save(path, content.encode('utf-8'))

    def create_parent_issue(self                              ,
                            node_type  : str = 'feature'      ,
                            label      : str = 'Feature-1'
                       ) -> str:
        path = f".issues/data/{node_type}/{label}/issue.json"
        self.create_issue_at_path(path, label=label, node_type=node_type)
        return f"data/{node_type}/{label}"

    # ═══════════════════════════════════════════════════════════════════════════════
    # Constants Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__tag_constant(self):                                                # Test tag value
        assert TAG__ROUTES_ISSUES == 'issues'
        assert self.routes.tag    == 'issues'

    def test__routes_paths_constant(self):                                       # Test route paths
        assert '/api/issues/children' in ROUTES_PATHS__ISSUES
        assert '/api/issues/convert'  in ROUTES_PATHS__ISSUES

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/issues/children - Add Child Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__issues_add_child__success(self):                                   # Test successful child creation
        parent_path = self.create_parent_issue(node_type='feature', label='Feature-1')

        request = Schema__Add_Child__Request(parent_path = parent_path,
                                             issue_type  = 'task'     ,
                                             title       = 'New Task' )

        response = self.routes.issues_add_child(request)

        assert response.success         is True
        assert str(response.label)      == 'Task-1'
        assert str(response.issue_type) == 'task'
        assert str(response.title)      == 'New Task'

    def test__issues_add_child__with_optional_fields(self):                      # Test with description and status
        parent_path = self.create_parent_issue(node_type='feature', label='Feature-2')

        request = Schema__Add_Child__Request(parent_path = parent_path        ,
                                             issue_type  = 'bug'              ,
                                             title       = 'Bug Report'       ,
                                             description = 'Detailed desc'    ,
                                             status      = 'confirmed'        )

        response = self.routes.issues_add_child(request)

        assert response.success    is True
        assert str(response.label) == 'Bug-1'

    def test__issues_add_child__parent_not_found(self):                          # Test error for missing parent
        request = Schema__Add_Child__Request(parent_path = 'nonexistent/path',
                                             issue_type  = 'task'            ,
                                             title       = 'Orphan Task'     )

        response = self.routes.issues_add_child(request)

        assert response.success is False
        assert 'not found'      in str(response.message).lower()

    def test__issues_add_child__to_root(self):                                   # Test adding to root
        request = Schema__Add_Child__Request(parent_path = ''            ,
                                             issue_type  = 'feature'     ,
                                             title       = 'Root Feature')

        response = self.routes.issues_add_child(request)

        assert response.success         is True
        assert str(response.label)      == 'Feature-1'

    def test__issues_add_child__multiple_children(self):                         # Test adding multiple children
        parent_path = self.create_parent_issue(node_type='feature', label='Feature-3')

        for i in range(3):
            request = Schema__Add_Child__Request(parent_path = parent_path       ,
                                                 issue_type  = 'task'            ,
                                                 title       = f'Task {i + 1}'   )
            response = self.routes.issues_add_child(request)
            assert response.success is True

        list_request  = Schema__List_Children__Request(parent_path=parent_path)  # Verify all created
        list_response = self.routes.issues_list_children(list_request)

        assert int(list_response.total) == 3

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/issues/children - List Children Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__issues_list_children__empty(self):                                 # Test empty list
        parent_path = self.create_parent_issue(node_type='task', label='Task-1')

        request  = Schema__List_Children__Request(parent_path=parent_path)
        response = self.routes.issues_list_children(request)

        assert response.success    is True
        assert int(response.total) == 0

    def test__issues_list_children__with_children(self):                         # Test listing children
        parent_path = self.create_parent_issue(node_type='feature', label='Feature-10')

        add_request = Schema__Add_Child__Request(parent_path = parent_path,       # Add some children
                                                 issue_type  = 'task'     ,
                                                 title       = 'Task A'   )
        self.routes.issues_add_child(add_request)

        add_request2 = Schema__Add_Child__Request(parent_path = parent_path,
                                                  issue_type  = 'bug'      ,
                                                  title       = 'Bug A'    )
        self.routes.issues_add_child(add_request2)

        list_request  = Schema__List_Children__Request(parent_path=parent_path)   # List children
        list_response = self.routes.issues_list_children(list_request)

        assert list_response.success    is True
        assert int(list_response.total) == 2

        labels = [c.get('label') for c in list_response.children]
        assert 'Task-1' in labels
        assert 'Bug-1'  in labels

    def test__issues_list_children__includes_metadata(self):                     # Test metadata in response
        parent_path = self.create_parent_issue(node_type='feature', label='Feature-11')

        add_request = Schema__Add_Child__Request(parent_path = parent_path   ,
                                                 issue_type  = 'task'        ,
                                                 title       = 'Detailed Task')
        self.routes.issues_add_child(add_request)

        list_request  = Schema__List_Children__Request(parent_path=parent_path)
        list_response = self.routes.issues_list_children(list_request)

        assert len(list_response.children) == 1

        child = list_response.children[0]
        assert child.get('label')     == 'Task-1'
        assert child.get('title')     == 'Detailed Task'
        assert child.get('node_type') == 'task'

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/issues/convert - Convert Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__issues_convert__success(self):                                     # Test successful conversion
        issue_path = self.create_parent_issue(node_type='task', label='Task-20')

        request  = Schema__Convert__Request(issue_path=issue_path)
        response = self.routes.issues_convert(request)

        assert response.success   is True
        assert response.converted is True
        assert 'issues'           in str(response.issues_path)

    def test__issues_convert__already_converted(self):                           # Test already converted
        issue_path = self.create_parent_issue(node_type='task', label='Task-21')

        request = Schema__Convert__Request(issue_path=issue_path)
        self.routes.issues_convert(request)                                      # First conversion

        response = self.routes.issues_convert(request)                           # Second conversion

        assert response.success   is True
        assert response.converted is False
        assert 'Already'          in str(response.message)

    def test__issues_convert__not_found(self):                                   # Test issue not found
        request  = Schema__Convert__Request(issue_path='nonexistent/path')
        response = self.routes.issues_convert(request)

        assert response.success is False
        assert 'not found'      in str(response.message).lower()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Integration Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__full_workflow__convert_add_list(self):                             # Test convert -> add -> list
        issue_path = self.create_parent_issue(node_type='feature', label='Feature-50')

        convert_request  = Schema__Convert__Request(issue_path=issue_path)       # Convert to new structure
        convert_response = self.routes.issues_convert(convert_request)
        assert convert_response.converted is True

        add_request1 = Schema__Add_Child__Request(parent_path = issue_path,      # Add children
                                                  issue_type  = 'task'    ,
                                                  title       = 'Task X'  )
        add_request2 = Schema__Add_Child__Request(parent_path = issue_path,
                                                  issue_type  = 'task'    ,
                                                  title       = 'Task Y'  )
        self.routes.issues_add_child(add_request1)
        self.routes.issues_add_child(add_request2)

        list_request  = Schema__List_Children__Request(parent_path=issue_path)   # List children
        list_response = self.routes.issues_list_children(list_request)

        assert int(list_response.total) == 2
        titles = [c.get('title') for c in list_response.children]
        assert 'Task X' in titles
        assert 'Task Y' in titles

    def test__add_without_convert__creates_folder(self):                         # Test add creates issues/ folder
        issue_path = self.create_parent_issue(node_type='feature', label='Feature-60')

        add_request = Schema__Add_Child__Request(parent_path = issue_path,       # Add child (should auto-create issues/)
                                                 issue_type  = 'bug'     ,
                                                 title       = 'Auto Bug')
        add_response = self.routes.issues_add_child(add_request)

        assert add_response.success is True

        list_request  = Schema__List_Children__Request(parent_path=issue_path)   # Verify folder was created
        list_response = self.routes.issues_list_children(list_request)

        assert int(list_response.total) == 1