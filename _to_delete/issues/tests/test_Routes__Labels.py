# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Labels - Tests for label routes
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase
from fastapi                                                                                            import HTTPException
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_Str                                                     import Safe_Str
from osbot_utils.utils.Files                                                                            import folder_create, folder_delete_all
from osbot_utils.utils.Objects                                                                          import base_types
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Create__Request           import Schema__Label__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Create__Response          import Schema__Label__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Delete__Response          import Schema__Label__Delete__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Labels__List__Response           import Schema__Labels__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name                   import Safe_Str__Label_Name
from osbot_fast_api.api.routes.Fast_API__Routes                                                         import Fast_API__Routes
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Repository                        import Issue__Repository
from mgraph_ai_ui_html_transformation_workbench.service.issues.Label__Service                           import Label__Service
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Labels                          import Routes__Labels
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Labels                          import TAG__ROUTES_LABELS


class test_Routes__Labels(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared test setup
        cls.test_path  = Safe_Str('/tmp/test-routes-labels')
        folder_create(cls.test_path)
        cls.repository = Issue__Repository(base_path=cls.test_path)
        cls.service    = Label__Service(repository=cls.repository)
        cls.routes     = Routes__Labels(service=cls.service)

    @classmethod
    def tearDownClass(cls):                                                      # Cleanup test folder
        folder_delete_all(cls.test_path)

    def setUp(self):                                                             # Reset state before each test
        folder_delete_all(self.test_path)
        folder_create(self.test_path)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Initialization Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__init__(self):                                                      # Test initialization
        with Routes__Labels(service=self.service) as _:
            assert type(_)         is Routes__Labels
            assert base_types(_)   == [Fast_API__Routes, Type_Safe, object]
            assert _.tag           == TAG__ROUTES_LABELS
            assert type(_.service) is Label__Service

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_labels(self):                                                       # Test list labels
        response = self.routes.labels()

        assert type(response)   is Schema__Labels__List__Response
        assert response.success is True

    def test_labels__with_data(self):                                            # Test list with labels
        self.routes.label__create(Schema__Label__Create__Request(name  = Safe_Str__Label_Name('bug')    ,
                                                                 color = '#ff0000'                      ))
        self.routes.label__create(Schema__Label__Create__Request(name  = Safe_Str__Label_Name('feature'),
                                                                 color = '#00ff00'                      ))

        response = self.routes.labels()

        assert len(response.labels) == 2

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_label__create(self):                                                # Test create label
        request = Schema__Label__Create__Request(name        = Safe_Str__Label_Name('bug')  ,
                                                 color       = '#ff0000'                    ,
                                                 description = Safe_Str('Bug reports')      )

        response = self.routes.label__create(request)

        assert type(response)           is Schema__Label__Create__Response
        assert response.success         is True
        assert str(response.label.name) == 'bug'

    def test_label__create__duplicate(self):                                     # Test duplicate raises exception
        request = Schema__Label__Create__Request(name  = Safe_Str__Label_Name('dup'),
                                                 color = '#aabbcc'                  )

        self.routes.label__create(request)

        with self.assertRaises(HTTPException) as context:
            self.routes.label__create(request)

        assert context.exception.status_code == 400

    def test_label__create__empty_name(self):                                    # Test empty name raises exception
        request = Schema__Label__Create__Request(name  = Safe_Str__Label_Name(''),
                                                 color = '#aabbcc'               )

        with self.assertRaises(HTTPException) as context:
            self.routes.label__create(request)

        assert context.exception.status_code == 400

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_label__delete(self):                                                # Test delete label
        self.routes.label__create(Schema__Label__Create__Request(name  = Safe_Str__Label_Name('deleteme'),
                                                                 color = '#aabbcc'                       ))

        response = self.routes.label__delete(Safe_Str__Label_Name('deleteme'))

        assert type(response)   is Schema__Label__Delete__Response
        assert response.success is True
        assert response.deleted is True

    def test_label__delete__not_found(self):                                     # Test delete nonexistent
        with self.assertRaises(HTTPException) as context:
            self.routes.label__delete(Safe_Str__Label_Name('nonexistent'))

        assert context.exception.status_code == 404

    # ═══════════════════════════════════════════════════════════════════════════════
    # Integration Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_full_workflow(self):                                                # Test complete CRUD via routes
        # Create
        create_request = Schema__Label__Create__Request(name        = Safe_Str__Label_Name('workflow')  ,
                                                        color       = '#aabbcc'                         ,
                                                        description = Safe_Str('Test label')            )

        create_response = self.routes.label__create(create_request)
        assert create_response.success is True

        # List
        list_response = self.routes.labels()
        assert len(list_response.labels) == 1
        assert str(list_response.labels[0].name) == 'workflow'

        # Delete
        delete_response = self.routes.label__delete(Safe_Str__Label_Name('workflow'))
        assert delete_response.success is True

        # Verify deleted
        list_after = self.routes.labels()
        assert len(list_after.labels) == 0
