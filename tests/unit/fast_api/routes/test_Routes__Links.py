# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Links - Unit tests for link REST API routes
# Tests link CRUD endpoints using actual services with in-memory backend
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase

from osbot_utils.testing.__ import __

from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Links                               import Routes__Links
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types import Safe_Str__Link_Verb, Safe_Str__Node_Label, Safe_Str__Node_Type
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Link__Create__Request import Schema__Link__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Link__List__Response import Schema__Link__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Create__Request import Schema__Node__Create__Request
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository__Factory    import Graph__Repository__Factory
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Link__Service                 import Link__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Node__Service                 import Node__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Type__Service                 import Type__Service


class test_Routes__Links(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup - create once
        cls.repository    = Graph__Repository__Factory.create_memory()
        cls.type_service  = Type__Service(repository=cls.repository)
        cls.node_service  = Node__Service(repository=cls.repository)
        cls.link_service  = Link__Service(repository=cls.repository)
        cls.routes        = Routes__Links(service=cls.link_service)

    def setUp(self):                                                             # Reset before each test
        self.repository.clear_storage()
        self.type_service.initialize_default_types()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Initialization Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__init__(self):                                                      # Test routes initialization
        with self.routes as _:
            assert type(_)         is Routes__Links
            assert _.service       is not None
            assert _.tag           == 'links'

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Links Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__links(self):                                                       # Test GET /api/nodes/{label}/links
        self._create_bug('Bug-1')
        self._create_task('Task-1')
        self._create_link_blocks('Bug-1', 'Task-1')

        response = self.routes.links(label=Safe_Str__Node_Label('Bug-1'))

        assert response.success is True
        assert len(response.links) == 1

    def test__links__empty(self):                                                # Test list when no links
        self._create_bug('Bug-1')

        response = self.routes.links(label=Safe_Str__Node_Label('Bug-1'))

        assert response.success is True
        assert len(response.links) == 0

    def test__links__multiple(self):                                             # Test list multiple links
        self._create_bug('Bug-1')
        self._create_task('Task-1')
        self._create_task('Task-2')
        self._create_link_blocks('Bug-1', 'Task-1')
        self._create_link_blocks('Bug-1', 'Task-2')

        response = self.routes.links(label=Safe_Str__Node_Label('Bug-1'))

        assert response.success is True
        assert len(response.links) == 2

    def test__links__node_not_found(self):                                       # Test list links for non-existent node

        response = self.routes.links(label=Safe_Str__Node_Label('Bug-999'))
        assert type(response) == Schema__Link__List__Response
        assert response.obj() == __(success=False, message='Node not found: Bug-999', links=[])

        # Link service returns success=False which should be handled

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Link Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__link__create(self):                                                # Test POST /api/nodes/{label}/links
        self._create_bug('Bug-1')
        self._create_task('Task-1')

        request = Schema__Link__Create__Request(verb         = Safe_Str__Link_Verb('blocks')   ,
                                                target_label = Safe_Str__Node_Label('Task-1')  )

        response = self.routes.link__create(label   = Safe_Str__Node_Label('Bug-1')            ,
                                            request = request                                  )

        assert response.success      is True
        assert response.source_link  is not None
        assert response.target_link  is not None

    def test__link__create__has_task(self):                                      # Test create has-task link
        self._create_feature('Feature-1')
        self._create_task('Task-1')

        request = Schema__Link__Create__Request(verb         = Safe_Str__Link_Verb('has-task') ,
                                                target_label = Safe_Str__Node_Label('Task-1')  )

        response = self.routes.link__create(label   = Safe_Str__Node_Label('Feature-1')        ,
                                            request = request                                  )

        assert response.success is True
        assert str(response.source_link.verb) == 'has-task'
        assert str(response.target_link.verb) == 'task-of'

    def test__link__create__source_not_found(self):                              # Test create from non-existent source
        from fastapi import HTTPException

        self._create_task('Task-1')

        request = Schema__Link__Create__Request(verb         = Safe_Str__Link_Verb('blocks')   ,
                                                target_label = Safe_Str__Node_Label('Task-1')  )

        with self.assertRaises(HTTPException) as context:
            self.routes.link__create(label   = Safe_Str__Node_Label('Bug-999')                 ,
                                     request = request                                         )

        assert context.exception.status_code == 400

    def test__link__create__target_not_found(self):                              # Test create to non-existent target
        from fastapi import HTTPException

        self._create_bug('Bug-1')

        request = Schema__Link__Create__Request(verb         = Safe_Str__Link_Verb('blocks')   ,
                                                target_label = Safe_Str__Node_Label('Task-999'))

        with self.assertRaises(HTTPException) as context:
            self.routes.link__create(label   = Safe_Str__Node_Label('Bug-1')                   ,
                                     request = request                                         )

        assert context.exception.status_code == 400

    def test__link__create__invalid_verb(self):                                  # Test create with unknown verb
        from fastapi import HTTPException

        self._create_bug('Bug-1')
        self._create_task('Task-1')

        request = Schema__Link__Create__Request(verb         = Safe_Str__Link_Verb('unknown')  ,
                                                target_label = Safe_Str__Node_Label('Task-1')  )

        with self.assertRaises(HTTPException) as context:
            self.routes.link__create(label   = Safe_Str__Node_Label('Bug-1')                   ,
                                     request = request                                         )

        assert context.exception.status_code == 400

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Link Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__link__delete(self):                                                # Test DELETE /api/nodes/{label}/links/{target}
        self._create_bug('Bug-1')
        self._create_task('Task-1')
        self._create_link_blocks('Bug-1', 'Task-1')

        response = self.routes.link__delete(label        = Safe_Str__Node_Label('Bug-1')       ,
                                            target_label = Safe_Str__Node_Label('Task-1')      )

        assert response.success is True
        assert response.deleted is True

    def test__link__delete__verifies_removal(self):                              # Test link actually removed
        self._create_bug('Bug-1')
        self._create_task('Task-1')
        self._create_link_blocks('Bug-1', 'Task-1')

        self.routes.link__delete(label        = Safe_Str__Node_Label('Bug-1')                  ,
                                 target_label = Safe_Str__Node_Label('Task-1')                 )

        # Verify source has no links
        response = self.routes.links(label=Safe_Str__Node_Label('Bug-1'))
        assert len(response.links) == 0

    def test__link__delete__not_found(self):                                     # Test delete non-existent link
        from fastapi import HTTPException

        self._create_bug('Bug-1')
        self._create_task('Task-1')
        # No link created

        with self.assertRaises(HTTPException) as context:
            self.routes.link__delete(label        = Safe_Str__Node_Label('Bug-1')              ,
                                     target_label = Safe_Str__Node_Label('Task-1')             )

        assert context.exception.status_code == 404

    def test__link__delete__source_not_found(self):                              # Test delete from non-existent source
        from fastapi import HTTPException

        with self.assertRaises(HTTPException) as context:
            self.routes.link__delete(label        = Safe_Str__Node_Label('Bug-999')            ,
                                     target_label = Safe_Str__Node_Label('Task-1')             )

        assert context.exception.status_code == 404

    # ═══════════════════════════════════════════════════════════════════════════════
    # Parse Label Type Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__parse_label_type(self):                                            # Test label type parsing
        result = self.routes.parse_label_type(Safe_Str__Node_Label('Bug-27'))

        assert str(result) == 'bug'

    def test__parse_label_type__task(self):                                      # Test task label parsing
        result = self.routes.parse_label_type(Safe_Str__Node_Label('Task-15'))

        assert str(result) == 'task'

    # ═══════════════════════════════════════════════════════════════════════════════
    # Helper Methods
    # ═══════════════════════════════════════════════════════════════════════════════

    def _create_bug(self, label: str):                                           # Helper to create bug
        request = Schema__Node__Create__Request(node_type = Safe_Str__Node_Type('bug')         ,
                                                title     = f'Test {label}'                    )
        return self.node_service.create_node(request)

    def _create_task(self, label: str):                                          # Helper to create task
        request = Schema__Node__Create__Request(node_type = Safe_Str__Node_Type('task')        ,
                                                title     = f'Test {label}'                    )
        return self.node_service.create_node(request)

    def _create_feature(self, label: str):                                       # Helper to create feature
        request = Schema__Node__Create__Request(node_type = Safe_Str__Node_Type('feature')     ,
                                                title     = f'Test {label}'                    )
        return self.node_service.create_node(request)

    def _create_link_blocks(self, source_label: str, target_label: str):         # Helper to create blocks link
        request = Schema__Link__Create__Request(verb         = Safe_Str__Link_Verb('blocks')   ,
                                                target_label = Safe_Str__Node_Label(target_label))
        return self.link_service.create_link(source_type  = Safe_Str__Node_Type('bug')         ,
                                             source_label = Safe_Str__Node_Label(source_label) ,
                                             request      = request                            )
