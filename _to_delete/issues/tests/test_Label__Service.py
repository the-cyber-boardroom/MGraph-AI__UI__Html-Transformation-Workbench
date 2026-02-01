# ═══════════════════════════════════════════════════════════════════════════════
# test_Label__Service - Tests for label service business logic
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_Str                                                     import Safe_Str
from osbot_utils.utils.Files                                                                            import folder_create, folder_delete_all
from osbot_utils.utils.Objects                                                                          import base_types
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label                            import Schema__Label
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Create__Request           import Schema__Label__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Create__Response          import Schema__Label__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label__Delete__Response          import Schema__Label__Delete__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Labels__List__Response           import Schema__Labels__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name                   import Safe_Str__Label_Name
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Repository                        import Issue__Repository
from mgraph_ai_ui_html_transformation_workbench.service.issues.Label__Service                           import Label__Service


class test_Label__Service(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared test setup
        cls.test_path  = Safe_Str('/tmp/test-label-service')
        folder_create(cls.test_path)
        cls.repository = Issue__Repository(base_path=cls.test_path)
        cls.service    = Label__Service(repository=cls.repository)

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
        with Label__Service(repository=self.repository) as _:
            assert type(_)            is Label__Service
            assert base_types(_)      == [Type_Safe, object]
            assert type(_.repository) is Issue__Repository

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_list_labels__empty(self):                                           # Test list empty labels
        response = self.service.list_labels()

        assert type(response)   is Schema__Labels__List__Response
        assert response.success is True
        assert len(response.labels) == 0

    def test_list_labels(self):                                                  # Test list labels
        self.service.create_label(Schema__Label__Create__Request(name  = Safe_Str__Label_Name('bug')    ,
                                                                 color = '#ff0000'                      ))
        self.service.create_label(Schema__Label__Create__Request(name  = Safe_Str__Label_Name('feature'),
                                                                 color = '#00ff00'                      ))

        response = self.service.list_labels()

        assert response.success     is True
        assert len(response.labels) == 2

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_create_label(self):                                                 # Test create label
        request = Schema__Label__Create__Request(name        = Safe_Str__Label_Name('bug')  ,
                                                 color       = '#ff0000'                    ,
                                                 description = Safe_Str('Bug reports')      )

        response = self.service.create_label(request)

        assert type(response)           is Schema__Label__Create__Response
        assert response.success         is True
        assert type(response.label)     is Schema__Label
        assert str(response.label.name) == 'bug'
        assert str(response.label.color) == '#ff0000'

    def test_create_label__duplicate(self):                                      # Test duplicate rejected
        request = Schema__Label__Create__Request(name  = Safe_Str__Label_Name('duplicate'),
                                                 color = '#aabbcc'                        )

        self.service.create_label(request)
        response = self.service.create_label(request)

        assert response.success is False
        assert 'already exists' in response.message

    def test_create_label__empty_name(self):                                     # Test empty name rejected
        request = Schema__Label__Create__Request(name  = Safe_Str__Label_Name(''),
                                                 color = '#aabbcc'               )

        response = self.service.create_label(request)

        assert response.success is False
        assert 'required' in response.message

    # ═══════════════════════════════════════════════════════════════════════════════
    # Get Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_get_label(self):                                                    # Test get label
        self.service.create_label(Schema__Label__Create__Request(name  = Safe_Str__Label_Name('findme'),
                                                                 color = '#123456'                     ))

        label = self.service.get_label(Safe_Str__Label_Name('findme'))

        assert type(label)       is Schema__Label
        assert str(label.name)   == 'findme'
        assert str(label.color)  == '#123456'

    def test_get_label__not_found(self):                                         # Test get nonexistent
        label = self.service.get_label(Safe_Str__Label_Name('nonexistent'))
        assert label is None

    def test_label_exists(self):                                                 # Test existence check
        assert self.service.label_exists(Safe_Str__Label_Name('exists')) is False

        self.service.create_label(Schema__Label__Create__Request(name  = Safe_Str__Label_Name('exists'),
                                                                 color = '#aabbcc'                     ))

        assert self.service.label_exists(Safe_Str__Label_Name('exists')) is True

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_delete_label(self):                                                 # Test delete label
        self.service.create_label(Schema__Label__Create__Request(name  = Safe_Str__Label_Name('deleteme'),
                                                                 color = '#aabbcc'                       ))

        response = self.service.delete_label(Safe_Str__Label_Name('deleteme'))

        assert type(response)   is Schema__Label__Delete__Response
        assert response.success is True
        assert response.deleted is True

        assert self.service.label_exists(Safe_Str__Label_Name('deleteme')) is False

    def test_delete_label__not_found(self):                                      # Test delete nonexistent
        response = self.service.delete_label(Safe_Str__Label_Name('nonexistent'))

        assert response.success is False
        assert response.deleted is False
        assert 'not found' in response.message

    # ═══════════════════════════════════════════════════════════════════════════════
    # Integration Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_full_lifecycle(self):                                               # Test complete CRUD workflow
        # Create
        create_request = Schema__Label__Create__Request(name        = Safe_Str__Label_Name('lifecycle')  ,
                                                        color       = '#aabbcc'                          ,
                                                        description = Safe_Str('Test label')             )

        create_response = self.service.create_label(create_request)
        assert create_response.success is True

        # Read
        label = self.service.get_label(Safe_Str__Label_Name('lifecycle'))
        assert str(label.name) == 'lifecycle'

        # List
        list_response = self.service.list_labels()
        assert len(list_response.labels) == 1

        # Delete
        delete_response = self.service.delete_label(Safe_Str__Label_Name('lifecycle'))
        assert delete_response.success is True

        # Verify deleted
        assert self.service.label_exists(Safe_Str__Label_Name('lifecycle')) is False
