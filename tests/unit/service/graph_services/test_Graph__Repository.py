# ═══════════════════════════════════════════════════════════════════════════════
# test_Graph__Repository - Unit tests for graph repository
# Tests node CRUD, index operations, config files, and attachments
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                            import TestCase
from osbot_utils.type_safe.Type_Safe                                                                     import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_UInt                                                     import Safe_UInt
from osbot_utils.type_safe.primitives.domains.identifiers.Obj_Id                                         import Obj_Id
from osbot_utils.type_safe.primitives.domains.identifiers.safe_int.Timestamp_Now                         import Timestamp_Now
from osbot_utils.utils.Objects                                                                           import base_classes
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types                      import Safe_Str__Node_Type, Safe_Str__Node_Label, Safe_Str__Status, Safe_Str__Node_Type_Display, Safe_Str__Link_Verb
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Global__Index                      import Schema__Global__Index
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node                               import Schema__Node
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Type                         import Schema__Node__Type
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Link__Type                         import Schema__Link__Type
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Type__Index                        import Schema__Type__Index
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Type__Summary                      import Schema__Type__Summary
from mgraph_ai_ui_html_transformation_workbench.schemas.safe_str.Safe_Str__Hex_Color                     import Safe_Str__Hex_Color
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository          import Graph__Repository
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository__Factory import Graph__Repository__Factory


class test_Graph__Repository(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup - create once
        cls.repository = Graph__Repository__Factory.create_memory()

    def setUp(self):                                                             # Reset storage before each test
        self.repository.clear_storage()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Initialization Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__init__(self):                                                      # Test repository initialization
        with self.repository as _:
            assert type(_)            is Graph__Repository
            assert base_classes(_)    == [Type_Safe, object]
            assert _.memory_fs        is not None
            assert _.path_handler     is not None
            assert _.storage_fs       is not None

    # ═══════════════════════════════════════════════════════════════════════════════
    # Node Save Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node_save(self):                                                   # Test basic node save
        node = self._create_test_node('bug', 27, 'Bug-27', 'Test bug')

        result = self.repository.node_save(node)

        assert result is True

    def test__node_save__multiple_nodes(self):                                   # Test saving multiple nodes
        node1 = self._create_test_node('bug', 1, 'Bug-1', 'First bug')
        node2 = self._create_test_node('bug', 2, 'Bug-2', 'Second bug')
        node3 = self._create_test_node('task', 1, 'Task-1', 'First task')

        assert self.repository.node_save(node1) is True
        assert self.repository.node_save(node2) is True
        assert self.repository.node_save(node3) is True

    def test__node_save__overwrites_existing(self):                              # Test overwrite behavior
        node = self._create_test_node('bug', 1, 'Bug-1', 'Original title')
        self.repository.node_save(node)

        node.title = 'Updated title'
        result = self.repository.node_save(node)

        assert result is True

        loaded = self.repository.node_load(Safe_Str__Node_Type('bug'), Safe_Str__Node_Label('Bug-1'))
        assert str(loaded.title) == 'Updated title'

    def test__node_save__empty_label_fails(self):                                # Test empty label fails
        node = Schema__Node(node_type = Safe_Str__Node_Type('bug')               ,
                            title     = 'No label bug'                           ,
                            status    = Safe_Str__Status('backlog')              )
        # label is empty by default

        result = self.repository.node_save(node)

        assert result is False

    # ═══════════════════════════════════════════════════════════════════════════════
    # Node Load Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node_load(self):                                                   # Test basic node load
        node = self._create_test_node('bug', 27, 'Bug-27', 'Test bug for loading')
        self.repository.node_save(node)

        loaded = self.repository.node_load(node_type = Safe_Str__Node_Type('bug')    ,
                                           label     = Safe_Str__Node_Label('Bug-27'))

        assert loaded                is not None
        assert str(loaded.label)     == 'Bug-27'
        assert str(loaded.title)     == 'Test bug for loading'
        assert str(loaded.node_type) == 'bug'
        assert int(loaded.node_index) == 27

    def test__node_load__not_found(self):                                        # Test load non-existent node
        loaded = self.repository.node_load(node_type = Safe_Str__Node_Type('bug')     ,
                                           label     = Safe_Str__Node_Label('Bug-999'))

        assert loaded is None

    def test__node_load__wrong_type(self):                                       # Test load with wrong type
        node = self._create_test_node('bug', 1, 'Bug-1', 'A bug')
        self.repository.node_save(node)

        loaded = self.repository.node_load(node_type = Safe_Str__Node_Type('task')   ,
                                           label     = Safe_Str__Node_Label('Bug-1') )

        assert loaded is None                                                    # Different path, not found

    def test__node_load__preserves_all_fields(self):                             # Test all fields preserved
        node = self._create_test_node('task', 5, 'Task-5', 'Full task')
        node.description = 'Detailed description here'
        node.tags = ['urgent', 'backend']
        node.properties = {'priority': 'high', 'estimate': 4}
        self.repository.node_save(node)

        loaded = self.repository.node_load(Safe_Str__Node_Type('task'), Safe_Str__Node_Label('Task-5'))

        assert str(loaded.description) == 'Detailed description here'
        assert 'urgent'  in [str(t) for t in loaded.tags]
        assert 'backend' in [str(t) for t in loaded.tags]
        assert loaded.properties.get('priority') == 'high'
        assert loaded.properties.get('estimate') == 4

    # ═══════════════════════════════════════════════════════════════════════════════
    # Node Exists Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node_exists__true(self):                                           # Test exists returns true
        node = self._create_test_node('bug', 1, 'Bug-1', 'Exists test')
        self.repository.node_save(node)

        result = self.repository.node_exists(Safe_Str__Node_Type('bug'), Safe_Str__Node_Label('Bug-1'))

        assert result is True

    def test__node_exists__false(self):                                          # Test exists returns false
        result = self.repository.node_exists(Safe_Str__Node_Type('bug'), Safe_Str__Node_Label('Bug-999'))

        assert result is False

    # ═══════════════════════════════════════════════════════════════════════════════
    # Node Delete Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node_delete(self):                                                 # Test basic node delete
        node = self._create_test_node('task', 1, 'Task-1', 'Delete me')
        self.repository.node_save(node)

        assert self.repository.node_exists(Safe_Str__Node_Type('task'), Safe_Str__Node_Label('Task-1')) is True

        result = self.repository.node_delete(Safe_Str__Node_Type('task'), Safe_Str__Node_Label('Task-1'))

        assert result is True
        assert self.repository.node_exists(Safe_Str__Node_Type('task'), Safe_Str__Node_Label('Task-1')) is False

    def test__node_delete__not_found(self):                                      # Test delete non-existent
        result = self.repository.node_delete(Safe_Str__Node_Type('bug'), Safe_Str__Node_Label('Bug-999'))

        assert result is False

    # ═══════════════════════════════════════════════════════════════════════════════
    # Type Index Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__type_index_save(self):                                             # Test type index save
        index = Schema__Type__Index(node_type    = Safe_Str__Node_Type('bug')    ,
                                    next_index   = Safe_UInt(10)                 ,
                                    count        = Safe_UInt(9)                  ,
                                    last_updated = Timestamp_Now()               )

        result = self.repository.type_index_save(index)

        assert result is True

    def test__type_index_load(self):                                             # Test type index load
        index = Schema__Type__Index(node_type    = Safe_Str__Node_Type('task')   ,
                                    next_index   = Safe_UInt(25)                 ,
                                    count        = Safe_UInt(24)                 ,
                                    last_updated = Timestamp_Now()               )
        self.repository.type_index_save(index)

        loaded = self.repository.type_index_load(Safe_Str__Node_Type('task'))

        assert loaded                    is not None
        assert str(loaded.node_type)     == 'task'
        assert int(loaded.next_index)    == 25
        assert int(loaded.count)         == 24

    def test__type_index_load__default_for_new_type(self):                       # Test default index
        loaded = self.repository.type_index_load(Safe_Str__Node_Type('feature'))

        assert loaded                    is not None
        assert str(loaded.node_type)     == 'feature'
        assert int(loaded.next_index)    == 1                                    # Default
        assert int(loaded.count)         == 0                                    # Default

    # ═══════════════════════════════════════════════════════════════════════════════
    # Global Index Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__global_index_save(self):                                           # Test global index save
        index = Schema__Global__Index(total_nodes  = Safe_UInt(100)              ,
                                      last_updated = Timestamp_Now()             ,
                                      type_counts  = []                          )

        result = self.repository.global_index_save(index)

        assert result is True

    def test__global_index_load(self):                                           # Test global index load
        index = Schema__Global__Index(
            total_nodes  = Safe_UInt(50)                                         ,
            last_updated = Timestamp_Now()                                       ,
            type_counts  = [
                Schema__Type__Summary(node_type=Safe_Str__Node_Type('bug'), count=Safe_UInt(20)),
                Schema__Type__Summary(node_type=Safe_Str__Node_Type('task'), count=Safe_UInt(30))
            ]
        )
        self.repository.global_index_save(index)

        loaded = self.repository.global_index_load()

        assert loaded                    is not None
        assert int(loaded.total_nodes)   == 50
        assert len(loaded.type_counts)   == 2

    def test__global_index_load__default_for_empty(self):                        # Test default global index
        loaded = self.repository.global_index_load()

        assert loaded                    is not None
        assert int(loaded.total_nodes)   == 0
        assert len(loaded.type_counts)   == 0

    # ═══════════════════════════════════════════════════════════════════════════════
    # Node Types Config Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node_types_save(self):                                             # Test save node types
        types = [
            Schema__Node__Type(type_id        = Obj_Id()                              ,
                               name           = Safe_Str__Node_Type('bug')            ,
                               display_name   = Safe_Str__Node_Type_Display('Bug')    ,
                               description    = 'A defect'                            ,
                               color          = Safe_Str__Hex_Color('#ef4444')        ,
                               statuses       = [Safe_Str__Status('backlog')]         ,
                               default_status = Safe_Str__Status('backlog')           )
        ]

        result = self.repository.node_types_save(types)

        assert result is True

    def test__node_types_load(self):                                             # Test load node types
        types = [
            Schema__Node__Type(type_id        = Obj_Id()                              ,
                               name           = Safe_Str__Node_Type('task')           ,
                               display_name   = Safe_Str__Node_Type_Display('Task')   ,
                               description    = 'A unit of work'                      ,
                               color          = Safe_Str__Hex_Color('#3b82f6')        ,
                               statuses       = [Safe_Str__Status('todo'), Safe_Str__Status('done')],
                               default_status = Safe_Str__Status('todo')              )
        ]
        self.repository.node_types_save(types)

        loaded = self.repository.node_types_load()

        assert len(loaded)               == 1
        assert str(loaded[0].name)       == 'task'
        assert str(loaded[0].display_name) == 'Task'

    def test__node_types_load__empty(self):                                      # Test load when no types
        loaded = self.repository.node_types_load()

        assert loaded == []

    # ═══════════════════════════════════════════════════════════════════════════════
    # Link Types Config Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__link_types_save(self):                                             # Test save link types
        types = [
            Schema__Link__Type(link_type_id = Obj_Id()                                ,
                               verb         = Safe_Str__Link_Verb('blocks')           ,
                               inverse_verb = Safe_Str__Link_Verb('blocked-by')       ,
                               description  = 'Prevents progress'                     ,
                               source_types = [Safe_Str__Node_Type('bug')]            ,
                               target_types = [Safe_Str__Node_Type('task')]           )
        ]

        result = self.repository.link_types_save(types)

        assert result is True

    def test__link_types_load(self):                                             # Test load link types
        types = [
            Schema__Link__Type(link_type_id = Obj_Id()                                ,
                               verb         = Safe_Str__Link_Verb('has-task')         ,
                               inverse_verb = Safe_Str__Link_Verb('task-of')          ,
                               description  = 'Contains sub-work'                     ,
                               source_types = [Safe_Str__Node_Type('feature')]        ,
                               target_types = [Safe_Str__Node_Type('task')]           )
        ]
        self.repository.link_types_save(types)

        loaded = self.repository.link_types_load()

        assert len(loaded)                   == 1
        assert str(loaded[0].verb)           == 'has-task'
        assert str(loaded[0].inverse_verb)   == 'task-of'

    def test__link_types_load__empty(self):                                      # Test load when no link types
        loaded = self.repository.link_types_load()

        assert loaded == []

    # ═══════════════════════════════════════════════════════════════════════════════
    # Attachment Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__attachment_save(self):                                             # Test save attachment
        data = b'PNG file content here'

        result = self.repository.attachment_save(node_type = Safe_Str__Node_Type('bug')    ,
                                                 label     = Safe_Str__Node_Label('Bug-1') ,
                                                 filename  = 'screenshot.png'              ,
                                                 data      = data                          )

        assert result is True

    def test__attachment_load(self):                                             # Test load attachment
        data = b'Test file content for loading'
        self.repository.attachment_save(node_type = Safe_Str__Node_Type('task')   ,
                                        label     = Safe_Str__Node_Label('Task-1'),
                                        filename  = 'log.txt'                     ,
                                        data      = data                          )

        loaded = self.repository.attachment_load(node_type = Safe_Str__Node_Type('task')   ,
                                                 label     = Safe_Str__Node_Label('Task-1'),
                                                 filename  = 'log.txt'                     )

        assert loaded == data

    def test__attachment_load__not_found(self):                                  # Test load non-existent
        loaded = self.repository.attachment_load(node_type = Safe_Str__Node_Type('bug')    ,
                                                 label     = Safe_Str__Node_Label('Bug-1') ,
                                                 filename  = 'nonexistent.png'             )

        assert loaded is None

    def test__attachment_delete(self):                                           # Test delete attachment
        data = b'Delete me'
        self.repository.attachment_save(node_type = Safe_Str__Node_Type('bug')    ,
                                        label     = Safe_Str__Node_Label('Bug-1') ,
                                        filename  = 'temp.txt'                    ,
                                        data      = data                          )

        result = self.repository.attachment_delete(node_type = Safe_Str__Node_Type('bug')    ,
                                                   label     = Safe_Str__Node_Label('Bug-1') ,
                                                   filename  = 'temp.txt'                    )

        assert result is True

        loaded = self.repository.attachment_load(node_type = Safe_Str__Node_Type('bug')    ,
                                                 label     = Safe_Str__Node_Label('Bug-1') ,
                                                 filename  = 'temp.txt'                    )
        assert loaded is None

    def test__attachment_delete__not_found(self):                                # Test delete non-existent
        result = self.repository.attachment_delete(node_type = Safe_Str__Node_Type('bug')    ,
                                                   label     = Safe_Str__Node_Label('Bug-1') ,
                                                   filename  = 'nonexistent.txt'             )

        assert result is False

    # ═══════════════════════════════════════════════════════════════════════════════
    # Clear Storage Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__clear_storage(self):                                               # Test clear all data
        node = self._create_test_node('bug', 1, 'Bug-1', 'Will be cleared')
        self.repository.node_save(node)

        assert self.repository.node_exists(Safe_Str__Node_Type('bug'), Safe_Str__Node_Label('Bug-1')) is True

        self.repository.clear_storage()

        assert self.repository.node_exists(Safe_Str__Node_Type('bug'), Safe_Str__Node_Label('Bug-1')) is False

    # ═══════════════════════════════════════════════════════════════════════════════
    # Helper Methods
    # ═══════════════════════════════════════════════════════════════════════════════

    def _create_test_node(self                              ,                    # Helper to create test nodes
                          node_type  : str                  ,
                          node_index : int                  ,
                          label      : str                  ,
                          title      : str
                     ) -> Schema__Node:
        return Schema__Node(node_id    = Obj_Id()                                ,
                            node_type  = Safe_Str__Node_Type(node_type)          ,
                            node_index = Safe_UInt(node_index)                   ,
                            label      = Safe_Str__Node_Label(label)             ,
                            title      = title                                   ,
                            status     = Safe_Str__Status('backlog')             ,
                            created_at = Timestamp_Now()                         ,
                            updated_at = Timestamp_Now()                         ,
                            tags       = []                                      ,
                            links      = []                                      ,
                            properties = {}                                      )
