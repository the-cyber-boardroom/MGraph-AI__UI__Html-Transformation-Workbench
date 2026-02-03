# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Issues__local_data - Integration tests using real .issues folder
# IMPORTANT: These tests are READ-ONLY to protect live data
#
# WARNING: DO NOT add tests that call:
#   - POST /api/issues/children (creates files)
#   - POST /api/issues/convert  (creates folders)
# These would modify the actual repository's .issues folder!
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                            import TestCase
from osbot_utils.testing.Pytest                                                                          import skip_pytest
from osbot_fast_api_serverless.fast_api.Serverless__Fast_API__Config                                     import Serverless__Fast_API__Config
from osbot_utils.testing.Temp_Env_Vars                                                                   import Temp_Env_Vars
from mgraph_ai_ui_html_transformation_workbench.fast_api.Html_Transformation_Workbench__Fast_API         import Html_Transformation_Workbench__Fast_API, ENV_VAR__ISSUES__IN_MEMORY, ENV_VAR__ISSUES__PATH


class test_Routes__Issues__local_data(TestCase):

    @classmethod
    def setUpClass(cls):
        skip_pytest("with real data these have quite a bit of a performance hit")
        cls.env_vars        = {ENV_VAR__ISSUES__IN_MEMORY: "False",
                               ENV_VAR__ISSUES__PATH     : "."    }
        cls.temp_env_vars   = Temp_Env_Vars(env_vars=cls.env_vars).set_vars()
        cls.fast_api_config = Serverless__Fast_API__Config(enable_api_key=False)
        cls.fast_api        = Html_Transformation_Workbench__Fast_API(config=cls.fast_api_config).setup()
        cls.client          = cls.fast_api.client()

    @classmethod
    def tearDownClass(cls):
        cls.temp_env_vars.restore_vars()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Setup Verification
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__setup__services_available(self):                                   # Verify services are configured
        with self.fast_api as _:
            assert _.issue_children_service is not None
            assert _.path_handler           is not None

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/issues/children - List Children (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__issues__list_children__root_returns_valid_response(self):          # Test listing children of root
        with self.client as _:
            response = _.post('/issues/api/issues/children/list', json={'parent_path': ''})

            assert response.status_code == 200


            data = response.json()
            assert data['success']      is True
            assert 'children'           in data
            assert 'total'              in data
            assert isinstance(data['children'], list)
            assert isinstance(data['total'], int)

    def test__issues__list_children__total_matches_count(self):                  # Test total matches actual count
        with self.client as _:
            response = _.post('/issues/api/issues/children/list', json={'parent_path': ''})
            data     = response.json()

            assert data['total'] == len(data['children'])

    def test__issues__list_children__children_have_required_fields(self):        # Test children have expected fields
        with self.client as _:
            response = _.post('/issues/api/issues/children/list', json={'parent_path': ''})
            data     = response.json()

            for child in data['children']:
                assert 'path'      in child
                assert 'label'     in child
                assert 'title'     in child
                assert 'node_type' in child

    def test__issues__list_children__existing_issue(self):                       # Test listing children of an existing issue
        with self.client as _:
            roots_response = _.get('/roots/api/roots')                                 # First find an existing issue
            roots_data     = roots_response.json()

            non_default = [r for r in roots_data['roots'] if r['path'] != '']    # Find non-default roots

            if len(non_default) > 0:
                test_path = non_default[0]['path']

                children_response = _.get('/issues/api/issues/children', json={'parent_path': test_path})

                assert children_response.status_code == 200

                data = children_response.json()
                assert data['success'] is True
                assert 'children'      in data
                assert 'total'         in data

    def test__issues__list_children__with_children_roots(self):                  # Test listing children of roots with children
        with self.client as _:
            with_children_response = _.get('/roots/api/roots/with-children')           # Find roots that have children
            with_children_data     = with_children_response.json()

            for parent in with_children_data['roots']:
                children_response = _.post('/issues/api/issues/children/list', json={'parent_path': parent['path']})

                assert children_response.status_code == 200

                data = children_response.json()
                assert data['success'] is True

                if parent['has_children'] > 0:                                   # If parent claims to have children
                    assert data['total'] > 0                                     # Should actually have children

    # ═══════════════════════════════════════════════════════════════════════════════
    # Service Layer Tests (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__issue_children_service__list_children_root(self):                  # Test service layer directly
        with self.fast_api.issue_children_service as _:
            result = _.list_children(parent_path='')

            assert result.success is True
            assert isinstance(result.children, list)
            assert int(result.total) >= 0

    def test__issue_children_service__scan_child_folders(self):                  # Test scanning for child folders
        with self.fast_api.issue_children_service as _:
            base_path     = str(_.path_handler.base_path)
            issues_folder = f"{base_path}/issues"

            folders = _.scan_child_folders(issues_folder)

            assert type(folders) is set                              # Should return Type_Safe__List even if empty

    def test__issue_children_service__resolve_paths(self):                       # Test path resolution
        with self.fast_api.issue_children_service as _:
            full = _.resolve_full_path('data/task/Task-1')                       # Test relative to full

            assert full.startswith(_.path_handler.base_path)
            assert 'data/task/Task-1' in full

            relative = _.make_relative_path(full)                                # Test full to relative

            assert relative == 'data/task/Task-1'

    def test__issue_children_service__parent_exists_root(self):                  # Test parent exists for root
        with self.fast_api.issue_children_service as _:
            base_path = str(_.path_handler.base_path)

            assert _.parent_exists(base_path) is True                            # Root always exists

    def test__issue_children_service__parent_exists_real_issues(self):           # Test parent exists for real issues
        with self.fast_api as _:
            roots = _.root_selection_service.get_available_roots()

            for root in roots.roots:
                if root.path:                                                    # Non-default roots
                    full_path = _.issue_children_service.resolve_full_path(str(root.path))
                    exists    = _.issue_children_service.parent_exists(full_path)

                    assert exists is True                                        # Should exist since it's in roots

    # ═══════════════════════════════════════════════════════════════════════════════
    # Label/Index Utilities (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__issue_children_service__extract_index_from_label(self):            # Test index extraction utility
        with self.fast_api.issue_children_service as _:
            assert int(_.extract_index_from_label('Task-1'))   == 1
            assert int(_.extract_index_from_label('Task-42'))  == 42
            assert int(_.extract_index_from_label('Bug-100'))  == 100
            assert int(_.extract_index_from_label('Feature-5')) == 5

    def test__issue_children_service__generate_label(self):                      # Test label generation utility
        with self.fast_api.issue_children_service as _:
            label1 = _.generate_child_label('/fake/path/issues', 'task')         # Test on non-existent path
            label2 = _.generate_child_label('/fake/path/issues', 'bug')
            label3 = _.generate_child_label('/fake/path/issues', 'git-repo')

            assert label1 == 'Task-1'
            assert label2 == 'Bug-1'
            assert label3 == 'GitRepo-1'                                         # Hyphenated types get combined

    # ═══════════════════════════════════════════════════════════════════════════════
    # Regression Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__regression__list_children_doesnt_crash(self):                      # Ensure endpoint handles real data
        with self.client as _:
            response = _.post('/issues/api/issues/children/list', json={'parent_path': ''})

            assert response.status_code == 200
            assert response.json()['success'] is True

    def test__regression__list_children_all_roots(self):                         # Test listing children for all roots
        with self.client as _:
            roots_response = _.get('/roots/api/roots')
            roots_data     = roots_response.json()

            for root in roots_data['roots']:                                     # List children for every root
                children_response = _.post('/issues/api/issues/children/list',
                                          json={'parent_path': root['path']})

                assert children_response.status_code == 200                      # Should not crash
                assert children_response.json()['success'] is True

    # ═══════════════════════════════════════════════════════════════════════════════
    # IMPORTANT: No Write Tests
    # ═══════════════════════════════════════════════════════════════════════════════
    #
    # DO NOT ADD TESTS FOR:
    #   - POST /api/issues/children (add_child_issue) - Creates files!
    #   - POST /api/issues/convert (convert_to_new_structure) - Creates folders!
    #
    # These operations modify the filesystem and would change the repo's .issues/
    # folder. Use the _client tests with in-memory storage for write operations.
    #
    # ═══════════════════════════════════════════════════════════════════════════════