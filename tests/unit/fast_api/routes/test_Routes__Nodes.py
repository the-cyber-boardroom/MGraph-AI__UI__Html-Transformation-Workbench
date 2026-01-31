# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Nodes - Unit tests for node REST API routes
# Tests node CRUD endpoints using actual services with in-memory backend
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase

from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Nodes import Routes__Nodes
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types import Safe_Str__Node_Type, Safe_Str__Node_Label, Safe_Str__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Create__Request import Schema__Node__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Update__Request import Schema__Node__Update__Request
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository__Factory import Graph__Repository__Factory
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Node__Service import Node__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Type__Service import Type__Service


class test_Routes__Nodes(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup - create once
        cls.repository    = Graph__Repository__Factory.create_memory()
        cls.type_service  = Type__Service(repository=cls.repository)
        cls.node_service  = Node__Service(repository=cls.repository)
        cls.routes        = Routes__Nodes(service=cls.node_service)

    def setUp(self):                                                             # Reset before each test
        self.repository.clear_storage()
        self.type_service.initialize_default_types()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Initialization Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__init__(self):                                                      # Test routes initialization
        with self.routes as _:
            assert type(_)         is Routes__Nodes
            assert _.service       is not None
            assert _.tag           == 'nodes'

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Nodes Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__nodes(self):                                                       # Test GET /api/nodes
        self._create_bug('Bug 1')
        self._create_bug('Bug 2')
        self._create_task('Task 1')

        response = self.routes.nodes()

        assert response.success is True

    def test__nodes__empty(self):                                                # Test list when no nodes
        response = self.routes.nodes()

        assert response.success is True

    def test__nodes__by_type(self):                                              # Test GET /api/nodes/type/{type}
        self._create_bug('Bug 1')
        self._create_bug('Bug 2')
        self._create_task('Task 1')

        response = self.routes.nodes__by_type(node_type=Safe_Str__Node_Type('bug'))

        assert response.success is True

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Node Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node__create(self):                                                # Test POST /api/nodes
        request = Schema__Node__Create__Request(node_type   = Safe_Str__Node_Type('bug')       ,
                                                title       = 'New bug via route'              ,
                                                description = 'Created through API'            )

        response = self.routes.node__create(request)

        assert response.success          is True
        assert response.node             is not None
        assert str(response.node.label)  == 'Bug-1'
        assert str(response.node.title)  == 'New bug via route'

    def test__node__create__with_tags(self):                                     # Test create with tags
        request = Schema__Node__Create__Request(node_type = Safe_Str__Node_Type('task')        ,
                                                title     = 'Tagged task'                      ,
                                                tags      = ['important', 'frontend']          )

        response = self.routes.node__create(request)

        assert response.success is True
        assert len(response.node.tags) == 2

    def test__node__create__missing_title(self):                                 # Test create validation
        request = Schema__Node__Create__Request(node_type = Safe_Str__Node_Type('bug')         ,
                                                title     = ''                                 )

        # Should raise HTTPException
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as context:
            self.routes.node__create(request)

        assert context.exception.status_code == 400

    # ═══════════════════════════════════════════════════════════════════════════════
    # Get Node Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node__get(self):                                                   # Test GET /api/nodes/{label}
        self._create_bug('Test bug')

        node = self.routes.node__get(label=Safe_Str__Node_Label('Bug-1'))

        assert node             is not None
        assert str(node.label)  == 'Bug-1'
        assert str(node.title)  == 'Test bug'

    def test__node__get__not_found(self):                                        # Test get non-existent
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as context:
            self.routes.node__get(label=Safe_Str__Node_Label('Bug-999'))

        assert context.exception.status_code == 404

    def test__node__get__invalid_label(self):                                    # Test get with invalid label format
        from fastapi import HTTPException
        # Note: Safe_Str__Node_Label will reject invalid format, but let's test the route behavior
        # This depends on how validation happens

    # ═══════════════════════════════════════════════════════════════════════════════
    # Update Node Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node__update(self):                                                # Test PATCH /api/nodes/{label}
        self._create_bug('Original title')

        request = Schema__Node__Update__Request(title  = 'Updated via route'                   ,
                                                status = Safe_Str__Status('confirmed')         )

        response = self.routes.node__update(label   = Safe_Str__Node_Label('Bug-1')            ,
                                            request = request                                  )

        assert response.success          is True
        assert str(response.node.title)  == 'Updated via route'
        assert str(response.node.status) == 'confirmed'

    def test__node__update__partial(self):                                       # Test partial update
        self._create_bug('Original')

        request = Schema__Node__Update__Request(status = Safe_Str__Status('testing'))

        response = self.routes.node__update(label   = Safe_Str__Node_Label('Bug-1')            ,
                                            request = request                                  )

        assert response.success          is True
        assert str(response.node.title)  == 'Original'                           # Unchanged
        assert str(response.node.status) == 'testing'                            # Updated

    def test__node__update__not_found(self):                                     # Test update non-existent
        from fastapi import HTTPException

        request = Schema__Node__Update__Request(title = 'New title')

        with self.assertRaises(HTTPException) as context:
            self.routes.node__update(label   = Safe_Str__Node_Label('Bug-999')                 ,
                                     request = request                                         )

        assert context.exception.status_code == 404

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Node Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node__delete(self):                                                # Test DELETE /api/nodes/{label}
        self._create_bug('To be deleted')

        response = self.routes.node__delete(label=Safe_Str__Node_Label('Bug-1'))

        assert response.success is True
        assert response.deleted is True
        assert str(response.label) == 'Bug-1'

    def test__node__delete__not_found(self):                                     # Test delete non-existent
        from fastapi import HTTPException

        with self.assertRaises(HTTPException) as context:
            self.routes.node__delete(label=Safe_Str__Node_Label('Bug-999'))

        assert context.exception.status_code == 404

    # ═══════════════════════════════════════════════════════════════════════════════
    # Parse Label Type Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__parse_label_type__bug(self):                                       # Test parsing bug label
        result = self.routes.parse_label_type(Safe_Str__Node_Label('Bug-27'))

        assert str(result) == 'bug'

    def test__parse_label_type__task(self):                                      # Test parsing task label
        result = self.routes.parse_label_type(Safe_Str__Node_Label('Task-100'))

        assert str(result) == 'task'

    def test__parse_label_type__feature(self):                                   # Test parsing feature label
        result = self.routes.parse_label_type(Safe_Str__Node_Label('Feature-5'))

        assert str(result) == 'feature'

    # ═══════════════════════════════════════════════════════════════════════════════
    # Helper Methods
    # ═══════════════════════════════════════════════════════════════════════════════

    def _create_bug(self, title: str):                                           # Helper to create bug
        request = Schema__Node__Create__Request(node_type = Safe_Str__Node_Type('bug')         ,
                                                title     = title                              )
        return self.node_service.create_node(request)

    def _create_task(self, title: str):                                          # Helper to create task
        request = Schema__Node__Create__Request(node_type = Safe_Str__Node_Type('task')        ,
                                                title     = title                              )
        return self.node_service.create_node(request)
