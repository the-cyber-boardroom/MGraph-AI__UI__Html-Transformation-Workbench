# ═══════════════════════════════════════════════════════════════════════════════
# test_Html_Transformation_Workbench__Fast_API__Phase1 - Tests for Phase 1 env var support
# Tests ISSUES__ROOT_PATH environment variable handling
# ═══════════════════════════════════════════════════════════════════════════════

import os
from unittest                                                                                           import TestCase
from mgraph_ai_ui_html_transformation_workbench.fast_api.Html_Transformation_Workbench__Fast_API        import Html_Transformation_Workbench__Fast_API
from mgraph_ai_ui_html_transformation_workbench.fast_api.Html_Transformation_Workbench__Fast_API        import ENV_VAR__ISSUES__ROOT_PATH, ENV_VAR__ISSUES__PATH, ENV_VAR__ISSUES__IN_MEMORY


class test_Html_Transformation_Workbench__Fast_API__Phase_1(TestCase):

    def setUp(self):                                                             # Clear env vars before each test
        self.original_root_path = os.environ.get(ENV_VAR__ISSUES__ROOT_PATH)
        self.original_path      = os.environ.get(ENV_VAR__ISSUES__PATH)
        self.original_in_memory = os.environ.get(ENV_VAR__ISSUES__IN_MEMORY)

        if ENV_VAR__ISSUES__ROOT_PATH in os.environ:                             # Clean up env vars
            del os.environ[ENV_VAR__ISSUES__ROOT_PATH]
        if ENV_VAR__ISSUES__PATH in os.environ:
            del os.environ[ENV_VAR__ISSUES__PATH]
        if ENV_VAR__ISSUES__IN_MEMORY in os.environ:
            del os.environ[ENV_VAR__ISSUES__IN_MEMORY]

    def tearDown(self):                                                          # Restore env vars after each test
        if self.original_root_path is not None:
            os.environ[ENV_VAR__ISSUES__ROOT_PATH] = self.original_root_path
        elif ENV_VAR__ISSUES__ROOT_PATH in os.environ:
            del os.environ[ENV_VAR__ISSUES__ROOT_PATH]

        if self.original_path is not None:
            os.environ[ENV_VAR__ISSUES__PATH] = self.original_path
        elif ENV_VAR__ISSUES__PATH in os.environ:
            del os.environ[ENV_VAR__ISSUES__PATH]

        if self.original_in_memory is not None:
            os.environ[ENV_VAR__ISSUES__IN_MEMORY] = self.original_in_memory
        elif ENV_VAR__ISSUES__IN_MEMORY in os.environ:
            del os.environ[ENV_VAR__ISSUES__IN_MEMORY]

    # ═══════════════════════════════════════════════════════════════════════════════
    # Environment Variable Name Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__env_var_names(self):                                               # Test env var name constants
        assert ENV_VAR__ISSUES__ROOT_PATH == 'ISSUES__ROOT_PATH'
        assert ENV_VAR__ISSUES__PATH      == 'ISSUES__PATH'
        assert ENV_VAR__ISSUES__IN_MEMORY == 'ISSUES__IN_MEMORY'

    # ═══════════════════════════════════════════════════════════════════════════════
    # resolve_root_path Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__resolve_root_path__default_empty(self):                            # Test default is empty string
        with Html_Transformation_Workbench__Fast_API() as api:
            result = api.resolve_root_path()

        assert result == ''

    def test__resolve_root_path__from_env_var(self):                             # Test reads from env var
        os.environ[ENV_VAR__ISSUES__ROOT_PATH] = 'feature/Feature-11'

        with Html_Transformation_Workbench__Fast_API() as api:
            result = api.resolve_root_path()

        assert result == 'feature/Feature-11'

    def test__resolve_root_path__from_attribute(self):                           # Test falls back to attribute
        with Html_Transformation_Workbench__Fast_API(root_path='task/Task-1') as api:
            result = api.resolve_root_path()

        assert result == 'task/Task-1'

    def test__resolve_root_path__env_var_overrides_attribute(self):              # Test env var takes priority
        os.environ[ENV_VAR__ISSUES__ROOT_PATH] = 'from-env'

        with Html_Transformation_Workbench__Fast_API(root_path='from-attribute') as api:
            result = api.resolve_root_path()

        assert result == 'from-env'                                              # Env var wins

    # ═══════════════════════════════════════════════════════════════════════════════
    # get_current_root_path Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__get_current_root_path__returns_root_when_set(self):                # Test returns root_path when set
        with Html_Transformation_Workbench__Fast_API(root_path='my/root') as api:
            api.setup_services()                                                 # Initialize services
            result = api.get_current_root_path()

        assert result == 'my/root'

    def test__get_current_root_path__returns_issues_path_when_empty(self):       # Test returns issues_path as fallback
        with Html_Transformation_Workbench__Fast_API(issues_path='custom-issues') as api:
            api.root_path = ''                                                   # Ensure root_path is empty
            result = api.get_current_root_path()

        assert result == 'custom-issues'

    # ═══════════════════════════════════════════════════════════════════════════════
    # Integration with setup_services Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__setup_services__stores_root_path(self):                            # Test setup_services stores root
        os.environ[ENV_VAR__ISSUES__ROOT_PATH] = 'test/path'

        with Html_Transformation_Workbench__Fast_API() as api:
            api.setup_services()

        assert api.root_path == 'test/path'

    def test__setup_services__initializes_services(self):                        # Test services are created
        with Html_Transformation_Workbench__Fast_API() as api:
            api.setup_services()

        assert api.graph_repository is not None
        assert api.type_service     is not None
        assert api.node_service     is not None
        assert api.link_service     is not None

    # ═══════════════════════════════════════════════════════════════════════════════
    # resolve_storage_mode Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__resolve_storage_mode__default_memory(self):                        # Test default is in-memory
        with Html_Transformation_Workbench__Fast_API() as api:
            result = api.resolve_storage_mode()

        assert result is True

    def test__resolve_storage_mode__env_false_uses_disk(self):                   # Test 'false' env var uses disk
        os.environ[ENV_VAR__ISSUES__IN_MEMORY] = 'false'

        with Html_Transformation_Workbench__Fast_API() as api:
            result = api.resolve_storage_mode()

        assert result is False

    def test__resolve_storage_mode__env_no_uses_disk(self):                      # Test 'no' env var uses disk
        os.environ[ENV_VAR__ISSUES__IN_MEMORY] = 'no'

        with Html_Transformation_Workbench__Fast_API() as api:
            result = api.resolve_storage_mode()

        assert result is False

    # ═══════════════════════════════════════════════════════════════════════════════
    # resolve_issues_path Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__resolve_issues_path__default(self):                                # Test default issues path
        with Html_Transformation_Workbench__Fast_API() as api:
            result = api.resolve_issues_path()

        assert result == '.issues'

    def test__resolve_issues_path__from_env_var(self):                           # Test reads from env var
        os.environ[ENV_VAR__ISSUES__PATH] = '/custom/issues/path'

        with Html_Transformation_Workbench__Fast_API() as api:
            result = api.resolve_issues_path()

        assert result == '/custom/issues/path'

    def test__resolve_issues_path__from_attribute(self):                         # Test falls back to attribute
        with Html_Transformation_Workbench__Fast_API(issues_path='my-issues') as api:
            result = api.resolve_issues_path()

        assert result == 'my-issues'
