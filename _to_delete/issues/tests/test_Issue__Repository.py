# ═══════════════════════════════════════════════════════════════════════════════
# test_Issue__Repository - Tests for file-based issue repository
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_Str                                                     import Safe_Str
from osbot_utils.type_safe.primitives.core.Safe_UInt                                                    import Safe_UInt
from osbot_utils.type_safe.primitives.domains.identifiers.safe_int.Timestamp_Now                        import Timestamp_Now
from osbot_utils.utils.Files                                                                            import folder_create, folder_delete_all, path_combine, file_exists
from osbot_utils.utils.Objects                                                                          import base_types
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Issue__Status                       import Enum__Issue__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue                            import Schema__Issue
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Summary                   import Schema__Issue__Summary
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issues__Index                    import Schema__Issues__Index
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Status_Counts             import Schema__Issue__Status_Counts
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label                            import Schema__Label
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id                     import Safe_Str__Issue_Id
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Label_Name                   import Safe_Str__Label_Name
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Repository                        import Issue__Repository


class test_Issue__Repository(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared test setup
        cls.test_path = '/tmp/test-issue-repository'
        folder_create(cls.test_path)
        cls.repository = Issue__Repository(base_path=cls.test_path)

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
        with Issue__Repository(base_path=self.test_path) as _:
            assert type(_)         is Issue__Repository
            assert base_types(_)   == [Type_Safe, object]
            assert _.base_path     == self.test_path

    # ═══════════════════════════════════════════════════════════════════════════════
    # Index Operations Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_get_index__empty(self):                                             # Test get empty index
        index = self.repository.get_index()

        assert type(index)              is Schema__Issues__Index
        assert index.last_updated is None
        assert int(index.next_id) == 1
        assert len(index.issues)        == 0

    def test_save_index(self):                                                   # Test save and load index
        last_updated = Timestamp_Now()
        index = Schema__Issues__Index(last_updated  = last_updated                    ,
                                      next_id       = Safe_UInt(5)                    ,
                                      issues        = []                              ,
                                      status_counts = Schema__Issue__Status_Counts()  )

        self.repository.save_index(index)

        loaded = self.repository.get_index()

        assert loaded.last_updated == last_updated
        assert loaded.next_id       == 5

    def test_index_with_issues(self):                                            # Test index with issue summaries
        summary = Schema__Issue__Summary(issue_id = 'Issue-001'             ,
                                         title    = 'Test Issue'            ,
                                         status   = Enum__Issue__Status.TODO)

        index = Schema__Issues__Index(next_id = 2        ,
                                      issues  = [summary])

        self.repository.save_index(index)

        loaded = self.repository.get_index()

        assert len(loaded.issues)          == 1
        assert str(loaded.issues[0].issue_id) == 'Issue-001'
        assert str(loaded.issues[0].title) == 'Test Issue'
        assert loaded.issues[0].status     == Enum__Issue__Status.TODO

    # ═══════════════════════════════════════════════════════════════════════════════
    # Issue Operations Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_save_issue(self):                                                   # Test save issue
        issue = Schema__Issue(issue_id    = 'Issue-001'               ,
                              title       = 'Test Issue'              ,
                              description = 'Test description'        ,
                              status      = Enum__Issue__Status.TODO  ,
                              labels      = ['bug']                   ,
                              created     = '2024-01-15T10:00:00Z'    ,
                              updated     = '2024-01-15T10:00:00Z'    ,
                              comments    = []                        ,
                              checklist   = []                        )

        self.repository.save_issue(issue)

        assert file_exists(path_combine(self.test_path, 'Issue-001.json'))

    def test_get_issue(self):                                                    # Test get issue
        issue = Schema__Issue(issue_id    = 'Issue-002'                         ,
                              title       = 'Another Issue'                     ,
                              description = 'Description here'                  ,
                              status      = Enum__Issue__Status.IN_PROGRESS     ,
                              labels      = []                                  ,
                              created     = '2024-01-15T10:00:00Z'              ,
                              updated     = '2024-01-15T10:00:00Z'              ,
                              comments    = []                                  ,
                              checklist   = []                                  )

        self.repository.save_issue(issue)

        loaded = self.repository.get_issue('Issue-002')

        assert type(loaded)           is Schema__Issue
        assert str(loaded.issue_id) == 'Issue-002'
        assert str(loaded.title)      == 'Another Issue'
        assert loaded.status          == Enum__Issue__Status.IN_PROGRESS

    def test_get_issue__not_found(self):                                         # Test get nonexistent issue
        loaded = self.repository.get_issue('Issue-999')
        assert loaded is None

    def test_delete_issue(self):                                                 # Test delete issue
        issue = Schema__Issue(issue_id    = 'Issue-003'                     ,
                              title       = Safe_Str('Delete Me')           ,
                              description = Safe_Str('')                    ,
                              status      = Enum__Issue__Status.BACKLOG     ,
                              labels      = []                              ,
                              created     = Timestamp_Now()                 ,
                              updated     = Timestamp_Now()                 ,
                              comments    = []                              ,
                              checklist   = []                              )

        self.repository.save_issue(issue)
        assert self.repository.issue_exists('Issue-003') is True

        deleted = self.repository.delete_issue(Safe_Str__Issue_Id('Issue-003'))

        assert deleted is True
        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-003')) is False

    def test_issue_exists(self):                                                 # Test issue existence check
        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-999')) is False

        issue = Schema__Issue(issue_id    = Safe_Str__Issue_Id('Issue-004')     ,
                              title       = 'Exists'                            ,
                              description = ''                                  ,
                              status      = Enum__Issue__Status.BACKLOG         ,
                              labels      = []                                  ,
                              created     = Timestamp_Now()                     ,
                              updated     = Timestamp_Now()                     ,
                              comments    = []                                  ,
                              checklist   = []                                  )

        self.repository.save_issue(issue)

        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-004')) is True

    # ═══════════════════════════════════════════════════════════════════════════════
    # Label Operations Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_get_labels__empty(self):                                            # Test get empty labels
        labels = self.repository.get_labels()
        assert labels == []

    def test_save_labels(self):                                                  # Test save and load labels
        labels = [Schema__Label(name        = Safe_Str__Label_Name('bug')       ,
                                color       = '#ff0000'                         ,
                                description = 'Bug reports'                     ),
                  Schema__Label(name        = Safe_Str__Label_Name('feature')   ,
                                color       = '#00ff00'                         ,
                                description = Safe_Str('Feature requests')      )]

        self.repository.save_labels(labels)

        loaded = self.repository.get_labels()

        assert len(loaded)               == 2
        assert str(loaded[0].name)       == 'bug'
        assert str(loaded[0].color)      == '#ff0000'
        assert str(loaded[1].name)       == 'feature'
