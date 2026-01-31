# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Issues - Tests for issue routes
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase
from fastapi                                                                                            import HTTPException
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_Str                                                     import Safe_Str
from osbot_utils.utils.Files                                                                            import folder_create, folder_delete_all
from osbot_utils.utils.Objects                                                                          import base_types
from osbot_fast_api.api.routes.Fast_API__Routes                                                         import Fast_API__Routes
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Comment__Author                     import Enum__Comment__Author
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Issue__Status                       import Enum__Issue__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue                            import Schema__Issue
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Create__Request           import Schema__Issue__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Create__Response          import Schema__Issue__Create__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Update__Request           import Schema__Issue__Update__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Update__Response          import Schema__Issue__Update__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Add_Comment__Request      import Schema__Issue__Add_Comment__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Add_Comment__Response     import Schema__Issue__Add_Comment__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Delete__Response          import Schema__Issue__Delete__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__List__Response            import Schema__Issue__List__Response
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id                     import Safe_Str__Issue_Id
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Repository                        import Issue__Repository
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Service                           import Issue__Service
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Issues                          import Routes__Issues
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Issues                          import TAG__ROUTES_ISSUES


class test_Routes__Issues(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared test setup
        cls.test_path  = Safe_Str('/tmp/test-routes-issues')
        folder_create(cls.test_path)
        cls.repository = Issue__Repository(base_path=cls.test_path)
        cls.service    = Issue__Service(repository=cls.repository)
        cls.routes     = Routes__Issues(service=cls.service)

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
        with Routes__Issues(service=self.service) as _:
            assert type(_)         is Routes__Issues
            assert base_types(_)   == [Fast_API__Routes, Type_Safe, object]
            assert _.tag           == TAG__ROUTES_ISSUES
            assert type(_.service) is Issue__Service

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_issues(self):                                                       # Test list issues
        response = self.routes.issues()

        assert type(response)   is Schema__Issue__List__Response
        assert response.success is True

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_issue__create(self):                                                # Test create issue
        request = Schema__Issue__Create__Request(title       = 'New Issue'                   ,
                                                 description = 'Description'                 ,
                                                 status      = Enum__Issue__Status.TODO      ,
                                                 labels      = ['bug']                       )

        response = self.routes.issue__create(request)

        assert type(response)               is Schema__Issue__Create__Response
        assert response.success             is True
        assert str(response.issue.issue_id) == 'Issue-001'
        assert str(response.issue.title)    == 'New Issue'

    def test_issue__create__empty_title(self):                                   # Test empty title raises exception
        request = Schema__Issue__Create__Request(title = Safe_Str(''))

        with self.assertRaises(HTTPException) as context:
            self.routes.issue__create(request)

        assert context.exception.status_code == 400

    # ═══════════════════════════════════════════════════════════════════════════════
    # Get Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_issue__get(self):                                                   # Test get issue
        create_response = self.routes.issue__create(Schema__Issue__Create__Request(title = 'Get Test'))
        issue_id = create_response.issue.issue_id

        issue = self.routes.issue__get(issue_id)

        assert type(issue)       is Schema__Issue
        assert str(issue.title)  == 'Get Test'

    def test_issue__get__not_found(self):                                        # Test get nonexistent
        with self.assertRaises(HTTPException) as context:
            self.routes.issue__get('Issue-999')

        assert context.exception.status_code == 404

    # ═══════════════════════════════════════════════════════════════════════════════
    # Update Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_issue__update(self):                                                # Test update issue
        create_response = self.routes.issue__create(Schema__Issue__Create__Request(title = Safe_Str('Original')))
        issue_id = create_response.issue.issue_id

        update_request = Schema__Issue__Update__Request(title  = Safe_Str('Updated')               ,
                                                        status = Enum__Issue__Status.IN_PROGRESS   )

        response = self.routes.issue__update(issue_id = issue_id       ,
                                             request  = update_request )

        assert type(response)            is Schema__Issue__Update__Response
        assert response.success          is True
        assert str(response.issue.title) == 'Updated'

    def test_issue__update__not_found(self):                                     # Test update nonexistent
        update_request = Schema__Issue__Update__Request(title = Safe_Str('New'))

        with self.assertRaises(HTTPException) as context:
            self.routes.issue__update(issue_id = Safe_Str__Issue_Id('Issue-999'),
                                      request  = update_request                 )

        assert context.exception.status_code == 404

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_issue__delete(self):                                                # Test delete issue
        create_response = self.routes.issue__create(Schema__Issue__Create__Request(title = Safe_Str('Delete Me')))
        issue_id = create_response.issue.issue_id

        response = self.routes.issue__delete(issue_id)

        assert type(response)   is Schema__Issue__Delete__Response
        assert response.success is True
        assert response.deleted is True

    def test_issue__delete__not_found(self):                                     # Test delete nonexistent
        with self.assertRaises(HTTPException) as context:
            self.routes.issue__delete(Safe_Str__Issue_Id('Issue-999'))

        assert context.exception.status_code == 404

    # ═══════════════════════════════════════════════════════════════════════════════
    # Comment Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_issue__add_comment(self):                                           # Test add comment
        create_response = self.routes.issue__create(Schema__Issue__Create__Request(title = Safe_Str('Comment Test')))
        issue_id = create_response.issue.issue_id

        comment_request = Schema__Issue__Add_Comment__Request(author = Enum__Comment__Author.HUMAN,
                                                              text   = 'Test comment'   )

        response = self.routes.issue__add_comment(issue_id = issue_id       ,
                                                  request  = comment_request)

        assert type(response)             is Schema__Issue__Add_Comment__Response
        assert response.success           is True
        assert str(response.comment.text) == 'Test comment'

    def test_issue__add_comment__not_found(self):                                # Test comment on nonexistent
        comment_request = Schema__Issue__Add_Comment__Request(text = Safe_Str('Comment'))

        with self.assertRaises(HTTPException) as context:
            self.routes.issue__add_comment(issue_id = Safe_Str__Issue_Id('Issue-999'),
                                           request  = comment_request               )

        assert context.exception.status_code == 404

    # ═══════════════════════════════════════════════════════════════════════════════
    # Status Update Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_issue__update_status(self):                                         # Test status shorthand
        create_response = self.routes.issue__create(Schema__Issue__Create__Request(title = Safe_Str('Status Test')))
        issue_id = create_response.issue.issue_id

        response = self.routes.issue__update_status(issue_id = issue_id                  ,
                                                    status   = Enum__Issue__Status.DONE  )

        assert type(response)      is Schema__Issue__Update__Response
        assert response.success    is True
        assert response.issue.status == Enum__Issue__Status.DONE

    def test_issue__update_status__not_found(self):                              # Test status on nonexistent
        with self.assertRaises(HTTPException) as context:
            self.routes.issue__update_status(issue_id = Safe_Str__Issue_Id('Issue-999'),
                                             status   = Enum__Issue__Status.DONE       )

        assert context.exception.status_code == 404

    # ═══════════════════════════════════════════════════════════════════════════════
    # Integration Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_full_workflow(self):                                                # Test complete CRUD via routes
        # Create
        create_request = Schema__Issue__Create__Request(title       = 'Workflow Test'               ,
                                                        description = 'Full workflow'               ,
                                                        status      = Enum__Issue__Status.BACKLOG   )

        create_response = self.routes.issue__create(create_request)
        assert create_response.success is True
        issue_id = create_response.issue.issue_id

        # Get
        issue = self.routes.issue__get(issue_id)
        assert str(issue.title) == 'Workflow Test'

        # Update
        update_request = Schema__Issue__Update__Request(status = Enum__Issue__Status.IN_PROGRESS)
        update_response = self.routes.issue__update(issue_id = issue_id       ,
                                                    request  = update_request )
        assert update_response.success is True

        # Add comment
        comment_request = Schema__Issue__Add_Comment__Request(text = Safe_Str('Progress'))
        comment_response = self.routes.issue__add_comment(issue_id = issue_id       ,
                                                          request  = comment_request)
        assert comment_response.success is True

        # Update status shorthand
        status_response = self.routes.issue__update_status(issue_id = issue_id                  ,
                                                           status   = Enum__Issue__Status.DONE  )
        assert status_response.success is True

        # List
        list_response = self.routes.issues()
        assert len(list_response.index.issues) == 1

        # Delete
        delete_response = self.routes.issue__delete(issue_id)
        assert delete_response.success is True

        # Verify deleted
        with self.assertRaises(HTTPException):
            self.routes.issue__get(issue_id)
