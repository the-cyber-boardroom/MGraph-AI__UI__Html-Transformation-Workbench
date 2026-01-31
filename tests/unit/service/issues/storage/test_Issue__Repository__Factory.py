# ═══════════════════════════════════════════════════════════════════════════════
# test_Issue__Repository__Factory - Tests for repository factory
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                           import TestCase
from osbot_utils.type_safe.Type_Safe                                                                    import Type_Safe
from osbot_utils.utils.Objects                                                                          import base_types
from memory_fs.storage_fs.providers.Storage_FS__Local_Disk                                              import Storage_FS__Local_Disk
from memory_fs.storage_fs.providers.Storage_FS__Memory                                                  import Storage_FS__Memory
from mgraph_ai_ui_html_transformation_workbench.service.issues.storage.Issue__Repository__Factory       import Issue__Repository__Factory, Enum__Storage__Backend
from mgraph_ai_ui_html_transformation_workbench.service.issues.storage.Issue__Repository__Memory_FS     import Issue__Repository__Memory_FS


class test_Issue__Repository__Factory(TestCase):

    # ═══════════════════════════════════════════════════════════════════════════════
    # Initialization Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__init__(self):                                                      # Test initialization
        with Issue__Repository__Factory() as _:
            assert type(_)       is Issue__Repository__Factory
            assert base_types(_) == [Type_Safe, object]

    # ═══════════════════════════════════════════════════════════════════════════════
    # Memory Backend Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_create_memory(self):                                                # Test memory backend creation
        repo = Issue__Repository__Factory.create_memory()

        assert type(repo) is Issue__Repository__Memory_FS
        assert repo.memory_fs is not None
        assert repo.path_handler is not None

        assert type(repo.memory_fs.storage_fs) is Storage_FS__Memory

    def test_create_memory__via_generic(self):                                   # Test via generic factory
        repo = Issue__Repository__Factory.create(backend=Enum__Storage__Backend.MEMORY)

        assert type(repo) is Issue__Repository__Memory_FS

        assert type(repo.memory_fs.storage_fs) is Storage_FS__Memory

    # ═══════════════════════════════════════════════════════════════════════════════
    # Local Disk Backend Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_create_local_disk(self):                                            # Test local disk creation
        repo = Issue__Repository__Factory.create_local_disk(root_path='/tmp/test-issues')

        assert type(repo) is Issue__Repository__Memory_FS
        assert type(repo.memory_fs.storage_fs) is Storage_FS__Local_Disk

    def test_create_local_disk__via_generic(self):                               # Test via generic factory
        repo = Issue__Repository__Factory.create(backend   = Enum__Storage__Backend.LOCAL_DISK,
                                                 root_path = '/tmp/test-issues'               )

        assert type(repo) is Issue__Repository__Memory_FS

    def test_create_local_disk__missing_path(self):                              # Test error on missing path
        with self.assertRaises(ValueError) as context:
            Issue__Repository__Factory.create(backend=Enum__Storage__Backend.LOCAL_DISK)

        assert 'root_path required' in str(context.exception)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Enum Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test_enum_values(self):                                                  # Test enum values
        assert Enum__Storage__Backend.MEMORY.value     == 'memory'
        assert Enum__Storage__Backend.LOCAL_DISK.value == 'local_disk'
        assert Enum__Storage__Backend.SQLITE.value     == 'sqlite'
        #assert Enum__Storage__Backend.S3.value         == 's3'
        assert Enum__Storage__Backend.ZIP.value        == 'zip'
