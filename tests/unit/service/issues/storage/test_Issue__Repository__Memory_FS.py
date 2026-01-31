# ═══════════════════════════════════════════════════════════════════════════════
# test_Issue__Repository__Memory_FS - Tests for Memory-FS based repository
# Uses in-memory storage - no disk I/O required!
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_UInt                                                    import Safe_UInt
from osbot_utils.type_safe.primitives.domains.identifiers.safe_int.Timestamp_Now                        import Timestamp_Now
from osbot_utils.utils.Objects                                                                          import base_types
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Issue__Status                       import Enum__Issue__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue                            import Schema__Issue
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issue__Summary                   import Schema__Issue__Summary
from mgraph_ai_ui_html_transformation_workbench.schemas.issues.Schema__Issues__Index                    import Schema__Issues__Index
from mgraph_ai_ui_html_transformation_workbench.schemas.labels.Schema__Label                            import Schema__Label
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Issue_Id                     import Safe_Str__Issue_Id
from mgraph_ai_ui_html_transformation_workbench.service.issues.storage.Issue__Repository__Factory       import Issue__Repository__Factory
from mgraph_ai_ui_html_transformation_workbench.service.issues.storage.Issue__Repository__Memory_FS     import Issue__Repository__Memory_FS


class test_Issue__Repository__Memory_FS(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared test setup
        cls.repository = Issue__Repository__Factory.create_memory()

    def setUp(self):                                                             # Reset before each test
        self.repository.clear_storage()                                          # Instant — no disk I/O

    # ═══════════════════════════════════════════════════════════════════════════════
    # Initialization Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__init__(self):                                                      # Test initialization
        with Issue__Repository__Factory.create_memory() as _:
            assert type(_)       is Issue__Repository__Memory_FS
            assert base_types(_) == [Type_Safe, object]
            assert _.memory_fs    is not None
            assert _.path_handler is not None

    # ═══════════════════════════════════════════════════════════════════════════════
    # Index Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_get_index__empty(self):                                             # Test get empty index
        index = self.repository.get_index()

        assert type(index)         is Schema__Issues__Index
        assert int(index.next_id)  == 1
        assert len(index.issues)   == 0

    def test_save_and_get_index(self):                                           # Test save/get roundtrip
        index = Schema__Issues__Index(next_id      = Safe_UInt(5)   ,
                                      last_updated = Timestamp_Now())

        summary = Schema__Issue__Summary(issue_id = Safe_Str__Issue_Id('Issue-001'),
                                         title    = 'Test issue'                   ,
                                         status   = Enum__Issue__Status.TODO       )
        index.issues.append(summary)

        self.repository.save_index(index)
        loaded = self.repository.get_index()

        assert int(loaded.next_id)       == 5
        assert len(loaded.issues)        == 1
        assert str(loaded.issues[0].issue_id) == 'Issue-001'
        assert str(loaded.issues[0].title)    == 'Test issue'

    # ═══════════════════════════════════════════════════════════════════════════════
    # Issue Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_save_and_get_issue(self):                                           # Test issue save/get
        now   = Timestamp_Now()
        issue = Schema__Issue(issue_id    = Safe_Str__Issue_Id('Issue-001'),
                              title       = 'Test bug'                     ,
                              description = 'Something is broken'          ,
                              status      = Enum__Issue__Status.BACKLOG    ,
                              labels      = []                             ,
                              created     = now                            ,
                              updated     = now                            ,
                              comments    = []                             ,
                              checklist   = []                             )

        self.repository.save_issue(issue)
        loaded = self.repository.get_issue(Safe_Str__Issue_Id('Issue-001'))

        assert loaded is not None
        assert str(loaded.issue_id)    == 'Issue-001'
        assert str(loaded.title)       == 'Test bug'
        assert str(loaded.description) == 'Something is broken'
        assert loaded.status           == Enum__Issue__Status.BACKLOG

    def test_get_issue__not_found(self):                                         # Test get non-existent
        result = self.repository.get_issue(Safe_Str__Issue_Id('Issue-999'))
        assert result is None

    def test_issue_exists(self):                                                 # Test existence check
        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-001')) is False

        now   = Timestamp_Now()
        issue = Schema__Issue(issue_id = Safe_Str__Issue_Id('Issue-001'),
                              title    = 'Test'                         ,
                              created  = now                            ,
                              updated  = now                            )
        self.repository.save_issue(issue)

        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-001')) is True

    def test_delete_issue(self):                                                 # Test issue deletion
        now   = Timestamp_Now()
        issue = Schema__Issue(issue_id = Safe_Str__Issue_Id('Issue-001'),
                              title    = 'Delete me'                    ,
                              created  = now                            ,
                              updated  = now                            )
        self.repository.save_issue(issue)
        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-001')) is True

        result = self.repository.delete_issue(Safe_Str__Issue_Id('Issue-001'))
        assert result is True
        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-001')) is False

    def test_delete_issue__not_found(self):                                      # Test delete non-existent
        result = self.repository.delete_issue(Safe_Str__Issue_Id('Issue-999'))
        assert result is False

    # ═══════════════════════════════════════════════════════════════════════════════
    # Label Operations
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_get_labels__empty(self):                                            # Test get empty labels
        labels = self.repository.get_labels()
        assert labels == []

    def test_save_and_get_labels(self):                                          # Test labels save/get
        labels = [Schema__Label(name='bug'    , color='#ef4444', description='Bug label'    ),
                  Schema__Label(name='feature', color='#22c55e', description='Feature label')]

        self.repository.save_labels(labels)
        loaded = self.repository.get_labels()

        assert len(loaded)            == 2
        assert str(loaded[0].name)    == 'bug'
        assert str(loaded[0].color)   == '#ef4444'
        assert str(loaded[1].name)    == 'feature'
        assert str(loaded[1].color)   == '#22c55e'

    # ═══════════════════════════════════════════════════════════════════════════════
    # Full Lifecycle Test
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_full_lifecycle(self):                                               # Test complete workflow
        # Create index
        index = Schema__Issues__Index(next_id = Safe_UInt(1))
        self.repository.save_index(index)

        # Create issue
        now    = Timestamp_Now()
        issue1 = Schema__Issue(issue_id = Safe_Str__Issue_Id('Issue-001'),
                               title    = 'First issue'                  ,
                               status   = Enum__Issue__Status.TODO       ,
                               created  = now                            ,
                               updated  = now                            )
        self.repository.save_issue(issue1)

        # Update index
        summary = Schema__Issue__Summary(issue_id = Safe_Str__Issue_Id('Issue-001'),
                                         title    = 'First issue'                   ,
                                         status   = Enum__Issue__Status.TODO        )
        index.issues.append(summary)
        index.next_id = Safe_UInt(2)
        self.repository.save_index(index)

        # Create second issue
        issue2 = Schema__Issue(issue_id = Safe_Str__Issue_Id('Issue-002'),
                               title    = 'Second issue'                 ,
                               status   = Enum__Issue__Status.BACKLOG    ,
                               created  = now                            ,
                               updated  = now                            )
        self.repository.save_issue(issue2)

        # Verify state
        loaded_index = self.repository.get_index()
        assert int(loaded_index.next_id) == 2
        assert len(loaded_index.issues)  == 1

        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-001')) is True
        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-002')) is True

        # Delete issue
        self.repository.delete_issue(Safe_Str__Issue_Id('Issue-001'))
        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-001')) is False
        assert self.repository.issue_exists(Safe_Str__Issue_Id('Issue-002')) is True
