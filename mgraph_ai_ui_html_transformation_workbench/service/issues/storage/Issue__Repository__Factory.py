# ═══════════════════════════════════════════════════════════════════════════════
# Issue__Repository__Factory - Factory for creating issue repositories
# Provides easy setup for different storage backends (Memory, Local Disk, S3, etc.)
# ═══════════════════════════════════════════════════════════════════════════════

from enum                                                                                           import Enum
from memory_fs.Memory_FS                                                                            import Memory_FS
from osbot_utils.type_safe.Type_Safe                                                                import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_Str                                                 import Safe_Str
from osbot_utils.type_safe.primitives.domains.files.safe_str.Safe_Str__File__Path                   import Safe_Str__File__Path

from memory_fs.helpers.Memory_FS__In_Memory import Memory_FS__In_Memory
from memory_fs.storage_fs.providers.Storage_FS__Local_Disk                                          import Storage_FS__Local_Disk
from memory_fs.storage_fs.providers.Storage_FS__Memory import Storage_FS__Memory
from memory_fs.storage_fs.providers.Storage_FS__Sqlite                                              import Storage_FS__Sqlite
from memory_fs.storage_fs.providers.Storage_FS__Zip import Storage_FS__Zip
from mgraph_ai_ui_html_transformation_workbench.service.issues.storage.Issue__Repository__Memory_FS import Issue__Repository__Memory_FS
from mgraph_ai_ui_html_transformation_workbench.service.issues.storage.Path__Handler__Issues        import Path__Handler__Issues


class Enum__Storage__Backend(str, Enum):                                         # Available storage backends
    MEMORY     = "memory"                                                        # In-memory (tests)
    LOCAL_DISK = "local_disk"                                                    # Local file system
    SQLITE     = "sqlite"                                                        # SQLite database
    #S3         = "s3"                                                            # AWS S3
    ZIP        = "zip"                                                           # ZIP archive


class Issue__Repository__Factory(Type_Safe):                                     # Factory for repositories

    # ═══════════════════════════════════════════════════════════════════════════════
    # Memory Backend (for tests)
    # ═══════════════════════════════════════════════════════════════════════════════

    @classmethod
    def create_memory(cls) -> Issue__Repository__Memory_FS:                      # Create in-memory repository
        memory_fs            = Memory_FS__In_Memory()
        return Issue__Repository__Memory_FS(memory_fs    = memory_fs)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Local Disk Backend (for development / Git workflows)
    # ═══════════════════════════════════════════════════════════════════════════════

    @classmethod
    def create_local_disk(cls                                    ,               # Create local disk repository
                          root_path: Safe_Str__File__Path
                     ) -> Issue__Repository__Memory_FS:
        memory_fs    = Memory_FS()
        storage      = Storage_FS__Local_Disk(root_path=str(root_path))
        memory_fs.storage_fs = storage

        path_handler = Path__Handler__Issues()
        return Issue__Repository__Memory_FS(memory_fs    = memory_fs   ,
                                            path_handler = path_handler)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Default (using Issue__Path__Config)
    # ═══════════════════════════════════════════════════════════════════════════════

    @classmethod
    def create_default(cls) -> Issue__Repository__Memory_FS:                     # Create with default path
        from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Path__Config import Issue__Path__Config
        path = Issue__Path__Config.ensure_issues_directory()
        return cls.create_local_disk(root_path=path)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Generic Factory Method
    # ═══════════════════════════════════════════════════════════════════════════════

    @classmethod
    def create(cls                                              ,                # Generic factory
               backend    : Enum__Storage__Backend              ,
               root_path  : Safe_Str__File__Path         = None ,
               bucket     : Safe_Str                     = None ,
               db_path    : Safe_Str__File__Path         = None ,
               zip_path   : Safe_Str__File__Path         = None
          ) -> Issue__Repository__Memory_FS:

        if backend == Enum__Storage__Backend.MEMORY:
            return cls.create_memory()

        elif backend == Enum__Storage__Backend.LOCAL_DISK:
            if root_path is None:
                raise ValueError("root_path required for LOCAL_DISK backend")
            return cls.create_local_disk(root_path=root_path)

        # elif backend == Enum__Storage__Backend.S3:
        #     if bucket is None:
        #         raise ValueError("bucket required for S3 backend")
        #     return cls.create_s3(bucket=bucket)

        elif backend == Enum__Storage__Backend.SQLITE:
            if db_path is None:
                raise ValueError("db_path required for SQLITE backend")
            return cls.create_sqlite(db_path=db_path)

        elif backend == Enum__Storage__Backend.ZIP:
            if zip_path is None:
                raise ValueError("zip_path required for ZIP backend")
            return cls.create_zip(zip_path=zip_path)

        else:
            raise ValueError(f"Unknown backend: {backend}")

    # ═══════════════════════════════════════════════════════════════════════════════
    # Additional Backends (stubs for future implementation)
    # ═══════════════════════════════════════════════════════════════════════════════

    #todo: see the best way to refactor the class Storage_FS__S3 which is currently in mgraph_ai_service_cache so that it could be used in this scenario
    # @classmethod
    # def create_s3(cls, bucket: Safe_Str) -> Issue__Repository__Memory_FS:        # Create S3 repository
    #
    #
    #     memory_fs    = Memory_FS()
    #     storage      = Storage_FS__S3(bucket_name=str(bucket))
    #     memory_fs.storage_fs = storage
    #
    #     path_handler = Path__Handler__Issues()
    #     return Issue__Repository__Memory_FS(memory_fs    = memory_fs   ,
    #                                         path_handler = path_handler)

    @classmethod
    def create_sqlite(cls                                    ,                   # Create SQLite repository
                      db_path: Safe_Str__File__Path
                 ) -> Issue__Repository__Memory_FS:

        memory_fs    = Memory_FS()
        storage      = Storage_FS__Sqlite(db_path=str(db_path))
        memory_fs.storage_fs = storage

        path_handler = Path__Handler__Issues()
        return Issue__Repository__Memory_FS(memory_fs    = memory_fs   ,
                                            path_handler = path_handler)

    @classmethod
    def create_zip(cls                                    ,                      # Create ZIP repository
                   zip_path: Safe_Str__File__Path
              ) -> Issue__Repository__Memory_FS:

        memory_fs    = Memory_FS()
        storage      = Storage_FS__Zip(zip_path=str(zip_path))
        memory_fs.storage_fs = storage

        path_handler = Path__Handler__Issues()
        return Issue__Repository__Memory_FS(memory_fs    = memory_fs   ,
                                            path_handler = path_handler)
