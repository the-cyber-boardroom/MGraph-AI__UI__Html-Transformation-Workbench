# ═══════════════════════════════════════════════════════════════════════════════
# test_Graph__Repository__Factory - Unit tests for repository factory
# Tests backend selection and repository creation
# ═══════════════════════════════════════════════════════════════════════════════

import tempfile
import os
from unittest                                                                                            import TestCase

from osbot_utils.testing.Pytest import skip_pytest
from osbot_utils.type_safe.Type_Safe                                                                     import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_UInt                                                     import Safe_UInt
from osbot_utils.utils.Objects                                                                           import base_classes
from mgraph_ai_ui_html_transformation_workbench.schemas.enums.Enum__Graph__Storage__Backend              import Enum__Graph__Storage__Backend
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Safe_Str__Graph_Types                      import Safe_Str__Node_Type, Safe_Str__Node_Label, Safe_Str__Status
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node                               import Schema__Node
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository          import Graph__Repository
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository__Factory import Graph__Repository__Factory


class test_Graph__Repository__Factory(TestCase):

    # ═══════════════════════════════════════════════════════════════════════════════
    # Initialization Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__init__(self):                                                      # Test factory class structure
        with Graph__Repository__Factory() as _:
            assert type(_)            is Graph__Repository__Factory
            assert base_classes(_)    == [Type_Safe, object]

    # ═══════════════════════════════════════════════════════════════════════════════
    # Memory Backend Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__create_memory(self):                                               # Test in-memory repository creation
        repository = Graph__Repository__Factory.create_memory()

        assert repository             is not None
        assert type(repository)       is Graph__Repository
        assert repository.memory_fs   is not None
        assert repository.path_handler is not None

    def test__create_memory__is_functional(self):                                # Test memory repo can save/load
        repository = Graph__Repository__Factory.create_memory()

        node = Schema__Node(node_type  = Safe_Str__Node_Type('bug')              ,
                            node_index = Safe_UInt(1)                            ,
                            label      = Safe_Str__Node_Label('Bug-1')           ,
                            title      = 'Test bug'                              ,
                            status     = Safe_Str__Status('backlog')             )

        save_result = repository.node_save(node)
        assert save_result is True

        loaded = repository.node_load(node_type = Safe_Str__Node_Type('bug')     ,
                                      label     = Safe_Str__Node_Label('Bug-1')  )
        assert loaded              is not None
        assert str(loaded.title)   == 'Test bug'

    def test__create_memory__multiple_independent(self):                         # Test multiple repos are independent
        repo1 = Graph__Repository__Factory.create_memory()
        repo2 = Graph__Repository__Factory.create_memory()

        node = Schema__Node(node_type  = Safe_Str__Node_Type('task')             ,
                            node_index = Safe_UInt(1)                            ,
                            label      = Safe_Str__Node_Label('Task-1')          ,
                            title      = 'Task in repo1'                         ,
                            status     = Safe_Str__Status('backlog')             )

        repo1.node_save(node)

        # repo2 should NOT have the node from repo1
        loaded = repo2.node_load(node_type = Safe_Str__Node_Type('task')         ,
                                 label     = Safe_Str__Node_Label('Task-1')      )
        assert loaded is None                                                    # Not in repo2

        # repo1 should have it
        loaded = repo1.node_load(node_type = Safe_Str__Node_Type('task')         ,
                                 label     = Safe_Str__Node_Label('Task-1')      )
        assert loaded is not None

    # ═══════════════════════════════════════════════════════════════════════════════
    # Local Disk Backend Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__create_local_disk(self):                                           # Test local disk repository creation
        with tempfile.TemporaryDirectory() as temp_dir:
            repository = Graph__Repository__Factory.create_local_disk(root_path=temp_dir)

            assert repository             is not None
            assert type(repository)       is Graph__Repository
            assert repository.memory_fs   is not None
            assert repository.path_handler is not None

    def test__create_local_disk__creates_files(self):                            # Test files are actually created
        with tempfile.TemporaryDirectory() as temp_dir:
            repository = Graph__Repository__Factory.create_local_disk(root_path=temp_dir)

            node = Schema__Node(node_type  = Safe_Str__Node_Type('bug')          ,
                                node_index = Safe_UInt(1)                        ,
                                label      = Safe_Str__Node_Label('Bug-1')       ,
                                title      = 'Disk test bug'                     ,
                                status     = Safe_Str__Status('backlog')         )

            repository.node_save(node)

            # Check that file was actually created on disk
            expected_path = os.path.join(temp_dir, '.issues', 'data', 'bug', 'Bug-1', 'node.json')
            assert os.path.exists(expected_path) is True

    # ═══════════════════════════════════════════════════════════════════════════════
    # SQLite Backend Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__create_sqlite(self):                                               # Test SQLite repository creation
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path    = os.path.join(temp_dir, 'test_issues.db')
            repository = Graph__Repository__Factory.create_sqlite(db_path=db_path)

            assert repository             is not None
            assert type(repository)       is Graph__Repository
            assert repository.memory_fs   is not None

    def test__create_sqlite__is_functional(self):                                # Test SQLite repo can save/load
        skip_pytest("Missing sqlite table setup")               # to do: fix this
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path    = os.path.join(temp_dir, 'test_issues.db')
            repository = Graph__Repository__Factory.create_sqlite(db_path=db_path)

            node = Schema__Node(node_type  = Safe_Str__Node_Type('feature')      ,
                                node_index = Safe_UInt(1)                        ,
                                label      = Safe_Str__Node_Label('Feature-1')   ,
                                title      = 'SQLite test feature'               ,
                                status     = Safe_Str__Status('proposed')        )

            repository.node_save(node)

            loaded = repository.node_load(node_type = Safe_Str__Node_Type('feature')  ,
                                          label     = Safe_Str__Node_Label('Feature-1'))
            assert loaded              is not None
            assert str(loaded.title)   == 'SQLite test feature'

    # ═══════════════════════════════════════════════════════════════════════════════
    # ZIP Backend Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__create_zip(self):                                                  # Test ZIP repository creation
        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path   = os.path.join(temp_dir, 'test_issues.zip')
            repository = Graph__Repository__Factory.create_zip(zip_path=zip_path)

            assert repository             is not None
            assert type(repository)       is Graph__Repository
            assert repository.memory_fs   is not None

    # ═══════════════════════════════════════════════════════════════════════════════
    # Generic Factory Method Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__create__memory(self):                                              # Test generic factory with MEMORY
        repository = Graph__Repository__Factory.create(backend=Enum__Graph__Storage__Backend.MEMORY)

        assert repository             is not None
        assert type(repository)       is Graph__Repository

    def test__create__local_disk(self):                                          # Test generic factory with LOCAL_DISK
        with tempfile.TemporaryDirectory() as temp_dir:
            repository = Graph__Repository__Factory.create(backend   = Enum__Graph__Storage__Backend.LOCAL_DISK,
                                                           root_path = temp_dir                                 )

            assert repository             is not None
            assert type(repository)       is Graph__Repository

    def test__create__local_disk__missing_path(self):                            # Test LOCAL_DISK without path raises
        with self.assertRaises(ValueError) as context:
            Graph__Repository__Factory.create(backend=Enum__Graph__Storage__Backend.LOCAL_DISK)

        assert 'root_path required' in str(context.exception)

    def test__create__sqlite(self):                                              # Test generic factory with SQLITE
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path    = os.path.join(temp_dir, 'test.db')
            repository = Graph__Repository__Factory.create(backend = Enum__Graph__Storage__Backend.SQLITE,
                                                           db_path = db_path                              )

            assert repository             is not None
            assert type(repository)       is Graph__Repository

    def test__create__sqlite__missing_path(self):                                # Test SQLITE without path raises
        with self.assertRaises(ValueError) as context:
            Graph__Repository__Factory.create(backend=Enum__Graph__Storage__Backend.SQLITE)

        assert 'db_path required' in str(context.exception)

    def test__create__zip(self):                                                 # Test generic factory with ZIP
        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path   = os.path.join(temp_dir, 'test.zip')
            repository = Graph__Repository__Factory.create(backend  = Enum__Graph__Storage__Backend.ZIP,
                                                           zip_path = zip_path                          )

            assert repository             is not None
            assert type(repository)       is Graph__Repository

    def test__create__zip__missing_path(self):                                   # Test ZIP without path raises
        with self.assertRaises(ValueError) as context:
            Graph__Repository__Factory.create(backend=Enum__Graph__Storage__Backend.ZIP)

        assert 'zip_path required' in str(context.exception)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Enum Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__enum__storage_backend__values(self):                               # Test enum has expected values
        assert Enum__Graph__Storage__Backend.MEMORY.value     == 'memory'
        assert Enum__Graph__Storage__Backend.LOCAL_DISK.value == 'local_disk'
        assert Enum__Graph__Storage__Backend.SQLITE.value     == 'sqlite'
        assert Enum__Graph__Storage__Backend.ZIP.value        == 'zip'
