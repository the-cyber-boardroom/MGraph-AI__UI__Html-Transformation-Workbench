# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Types - Unit tests for type definition REST API routes
# Tests node type and link type endpoints using actual services with in-memory backend
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase

from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Types import Routes__Types
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types import Safe_Str__Node_Type, Safe_Str__Link_Verb
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Create__Request import Schema__Node__Create__Request
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository__Factory import Graph__Repository__Factory
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Node__Service import Node__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Type__Service import Type__Service


class test_Routes__Types(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup - create once
        cls.repository    = Graph__Repository__Factory.create_memory()
        cls.type_service  = Type__Service(repository=cls.repository)
        cls.node_service  = Node__Service(repository=cls.repository)
        cls.routes        = Routes__Types(service=cls.type_service)

    def setUp(self):                                                             # Reset before each test
        self.repository.clear_storage()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Initialization Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__init__(self):                                                      # Test routes initialization
        with self.routes as _:
            assert type(_)         is Routes__Types
            assert _.service       is not None
            assert _.tag           == 'types'

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Node Types Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__types(self):                                                       # Test GET /api/types
        self.type_service.initialize_default_types()

        types = self.routes.types()

        assert len(types) >= 4                                                   # bug, task, feature, person
        type_names = [str(t.name) for t in types]
        assert 'bug'  in type_names
        assert 'task' in type_names

    def test__types__empty(self):                                                # Test list when no types defined
        types = self.routes.types()

        assert types == []

    def test__types__after_custom_creation(self):                                # Test list includes custom types
        self.type_service.create_node_type(name         = Safe_Str__Node_Type('custom')        ,
                                           display_name = 'Custom Type'                        )

        types = self.routes.types()

        assert len(types) == 1
        assert str(types[0].name) == 'custom'

    # ═══════════════════════════════════════════════════════════════════════════════
    # Get Node Type Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__type__get(self):                                                   # Test GET /api/types/{name}
        self.type_service.initialize_default_types()

        node_type = self.routes.type__get(name=Safe_Str__Node_Type('bug'))

        assert node_type                   is not None
        assert str(node_type.name)         == 'bug'
        assert str(node_type.display_name) == 'Bug'

    def test__type__get__task(self):                                             # Test get task type
        self.type_service.initialize_default_types()

        node_type = self.routes.type__get(name=Safe_Str__Node_Type('task'))

        assert node_type                   is not None
        assert str(node_type.name)         == 'task'
        assert str(node_type.display_name) == 'Task'
        assert str(node_type.color)        == '#3b82f6'

    def test__type__get__feature(self):                                          # Test get feature type
        self.type_service.initialize_default_types()

        node_type = self.routes.type__get(name=Safe_Str__Node_Type('feature'))

        assert node_type                   is not None
        assert str(node_type.name)         == 'feature'
        assert str(node_type.display_name) == 'Feature'

    def test__type__get__person(self):                                           # Test get person type
        self.type_service.initialize_default_types()

        node_type = self.routes.type__get(name=Safe_Str__Node_Type('person'))

        assert node_type                   is not None
        assert str(node_type.name)         == 'person'
        assert str(node_type.display_name) == 'Person'

    def test__type__get__not_found(self):                                        # Test get non-existent type
        from fastapi import HTTPException

        self.type_service.initialize_default_types()

        with self.assertRaises(HTTPException) as context:
            self.routes.type__get(name=Safe_Str__Node_Type('nonexistent'))

        assert context.exception.status_code == 404
        assert 'not found' in str(context.exception.detail).lower()

    def test__type__get__has_statuses(self):                                     # Test type includes statuses
        self.type_service.initialize_default_types()

        node_type = self.routes.type__get(name=Safe_Str__Node_Type('bug'))

        assert len(node_type.statuses) >= 1
        statuses = [str(s) for s in node_type.statuses]
        assert 'backlog' in statuses

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Node Type Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__type__delete(self):                                                # Test DELETE /api/types/{name}
        self.type_service.create_node_type(name         = Safe_Str__Node_Type('deleteme')      ,
                                           display_name = 'Delete Me'                          )

        result = self.routes.type__delete(name=Safe_Str__Node_Type('deleteme'))

        assert result['deleted'] is True
        assert result['name']    == 'deleteme'

    def test__type__delete__verifies_removal(self):                              # Test type actually removed
        self.type_service.create_node_type(name         = Safe_Str__Node_Type('temporary')     ,
                                           display_name = 'Temporary'                          )

        self.routes.type__delete(name=Safe_Str__Node_Type('temporary'))

        # Verify type is gone
        from fastapi import HTTPException
        with self.assertRaises(HTTPException):
            self.routes.type__get(name=Safe_Str__Node_Type('temporary'))

    def test__type__delete__with_existing_nodes(self):                           # Test cannot delete type with nodes
        from fastapi import HTTPException

        self.type_service.initialize_default_types()

        # Create a node of type 'bug'
        request = Schema__Node__Create__Request(node_type = Safe_Str__Node_Type('bug')         ,
                                                title     = 'Existing bug'                     )
        self.node_service.create_node(request)

        # Try to delete 'bug' type - should fail
        with self.assertRaises(HTTPException) as context:
            self.routes.type__delete(name=Safe_Str__Node_Type('bug'))

        assert context.exception.status_code == 400

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Link Types Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__link_types(self):                                                  # Test GET /api/link-types
        self.type_service.initialize_default_types()

        link_types = self.routes.link_types()

        assert len(link_types) >= 5                                              # blocks, has-task, assigned-to, etc.
        verbs = [str(t.verb) for t in link_types]
        assert 'blocks'      in verbs
        assert 'has-task'    in verbs
        assert 'assigned-to' in verbs

    def test__link_types__empty(self):                                           # Test list when no link types
        link_types = self.routes.link_types()

        assert link_types == []

    def test__link_types__after_custom_creation(self):                           # Test list includes custom link types
        self.type_service.create_link_type(verb         = Safe_Str__Link_Verb('custom-link')   ,
                                           inverse_verb = 'custom-link-inverse'                )

        link_types = self.routes.link_types()

        assert len(link_types) == 1
        assert str(link_types[0].verb) == 'custom-link'

    # ═══════════════════════════════════════════════════════════════════════════════
    # Get Link Type Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__link_type__get(self):                                              # Test GET /api/link-types/{verb}
        self.type_service.initialize_default_types()

        link_type = self.routes.link_type__get(verb=Safe_Str__Link_Verb('blocks'))

        assert link_type                   is not None
        assert str(link_type.verb)         == 'blocks'
        assert str(link_type.inverse_verb) == 'blocked-by'

    def test__link_type__get__has_task(self):                                    # Test get has-task link type
        self.type_service.initialize_default_types()

        link_type = self.routes.link_type__get(verb=Safe_Str__Link_Verb('has-task'))

        assert link_type                   is not None
        assert str(link_type.verb)         == 'has-task'
        assert str(link_type.inverse_verb) == 'task-of'

    def test__link_type__get__assigned_to(self):                                 # Test get assigned-to link type
        self.type_service.initialize_default_types()

        link_type = self.routes.link_type__get(verb=Safe_Str__Link_Verb('assigned-to'))

        assert link_type                   is not None
        assert str(link_type.verb)         == 'assigned-to'
        assert str(link_type.inverse_verb) == 'assignee-of'

    def test__link_type__get__depends_on(self):                                  # Test get depends-on link type
        self.type_service.initialize_default_types()

        link_type = self.routes.link_type__get(verb=Safe_Str__Link_Verb('depends-on'))

        assert link_type                   is not None
        assert str(link_type.verb)         == 'depends-on'
        assert str(link_type.inverse_verb) == 'dependency-of'

    def test__link_type__get__relates_to(self):                                  # Test get relates-to (symmetric)
        self.type_service.initialize_default_types()

        link_type = self.routes.link_type__get(verb=Safe_Str__Link_Verb('relates-to'))

        assert link_type                   is not None
        assert str(link_type.verb)         == 'relates-to'
        assert str(link_type.inverse_verb) == 'relates-to'                       # Symmetric

    def test__link_type__get__not_found(self):                                   # Test get non-existent link type
        from fastapi import HTTPException

        self.type_service.initialize_default_types()

        with self.assertRaises(HTTPException) as context:
            self.routes.link_type__get(verb=Safe_Str__Link_Verb('nonexistent'))

        assert context.exception.status_code == 404
        assert 'not found' in str(context.exception.detail).lower()

    def test__link_type__get__has_source_types(self):                            # Test link type includes source types
        self.type_service.initialize_default_types()

        link_type = self.routes.link_type__get(verb=Safe_Str__Link_Verb('blocks'))

        assert len(link_type.source_types) >= 1
        source_types = [str(t) for t in link_type.source_types]
        assert 'bug' in source_types or 'task' in source_types

    def test__link_type__get__has_target_types(self):                            # Test link type includes target types
        self.type_service.initialize_default_types()

        link_type = self.routes.link_type__get(verb=Safe_Str__Link_Verb('blocks'))

        assert len(link_type.target_types) >= 1
        target_types = [str(t) for t in link_type.target_types]
        assert 'task' in target_types or 'feature' in target_types

    # ═══════════════════════════════════════════════════════════════════════════════
    # Integration Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__integration__full_workflow(self):                                  # Test full type management workflow
        # Start with no types
        assert self.routes.types() == []
        assert self.routes.link_types() == []

        # Initialize defaults
        self.type_service.initialize_default_types()

        # Verify node types
        node_types = self.routes.types()
        assert len(node_types) >= 4

        # Verify link types
        link_types = self.routes.link_types()
        assert len(link_types) >= 5

        # Get specific types
        bug_type = self.routes.type__get(name=Safe_Str__Node_Type('bug'))
        assert bug_type is not None

        blocks_type = self.routes.link_type__get(verb=Safe_Str__Link_Verb('blocks'))
        assert blocks_type is not None
