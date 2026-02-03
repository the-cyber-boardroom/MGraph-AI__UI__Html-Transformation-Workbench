# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Roots__local_data - Integration tests using real .issues folder
# IMPORTANT: These tests are READ-ONLY to protect live data
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                            import TestCase

from osbot_fast_api_serverless.fast_api.Serverless__Fast_API__Config import Serverless__Fast_API__Config
from osbot_utils.testing.Pytest                                                                          import skip_pytest
from osbot_utils.testing.Temp_Env_Vars                                                                   import Temp_Env_Vars
from mgraph_ai_ui_html_transformation_workbench.fast_api.Html_Transformation_Workbench__Fast_API         import Html_Transformation_Workbench__Fast_API, ENV_VAR__ISSUES__IN_MEMORY, ENV_VAR__ISSUES__PATH


# todo: see bug in these tests that is creating a file in .issues/.issues
class test_Routes__Roots__local_data(TestCase):

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

    def setUp(self):                                                             # Reset root selection before each test
        self.fast_api.root_selection_service.current_root = ''                   # Reset to default (in-memory only)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Setup Verification
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__setup__services_available(self):                                   # Verify services are configured
        with self.fast_api as _:
            assert _.root_selection_service is not None
            assert _.root_issue_service     is not None
            assert _.path_handler           is not None

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots - List Roots (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots__list__returns_valid_response(self):                         # Test list returns valid structure
        with self.client as _:
            response = _.get('/roots/api/roots')

            assert response.status_code == 200

            data = response.json()
            assert data['success']      is True
            assert 'roots'              in data
            assert 'total'              in data
            assert isinstance(data['roots'], list)
            assert isinstance(data['total'], int)

    def test__roots__list__always_has_default_root(self):                        # Test default root always present
        with self.client as _:
            response = _.get('/roots/api/roots')
            data     = response.json()

            assert data['total'] >= 1                                            # At least default root

            paths = [r['path'] for r in data['roots']]
            assert '' in paths                                                   # Default root has empty path

    def test__roots__list__roots_have_required_fields(self):                     # Test roots have expected fields
        with self.client as _:
            response = _.get('/roots/api/roots')
            data     = response.json()

            for root in data['roots']:
                assert 'path'         in root
                assert 'label'        in root
                assert 'title'        in root
                assert 'issue_type'   in root
                assert 'depth'        in root
                assert 'has_issues'   in root
                assert 'has_children' in root

    def test__roots__list__default_root_metadata(self):                          # Test default root has correct metadata
        with self.client as _:
            response = _.get('/roots/api/roots')
            data     = response.json()

            default_root = data['roots'][0]                                      # First root is always default

            assert default_root['path']  == ''
            assert default_root['depth'] == 0

    def test__roots__list__finds_existing_issues(self):                          # Test finds issues in .issues folder
        with self.client as _:
            response = _.get('/roots/api/roots')
            data     = response.json()

            if data['total'] > 1:                                                # If there are issues beyond default
                non_root_items = [r for r in data['roots'] if r['path'] != '']
                assert len(non_root_items) > 0

                for item in non_root_items:                                      # Each should have a label
                    assert item['label'] != ''

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots/with-children - List Roots With Children (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots__with_children__returns_valid_response(self):                # Test returns valid structure
        with self.client as _:
            response = _.get('/roots/api/roots/with-children')

            assert response.status_code == 200

            data = response.json()
            assert data['success']      is True
            assert 'roots'              in data
            assert 'total'              in data

    def test__roots__with_children__all_have_issues_folder(self):                # Test all returned roots have issues/
        with self.client as _:
            response = _.get('/roots/api/roots/with-children')
            data     = response.json()

            for root in data['roots']:
                assert root['has_issues'] is True                                # All should have issues/ folder

    def test__roots__with_children__count_matches(self):                         # Test total matches list length
        with self.client as _:
            response = _.get('/roots/api/roots/with-children')
            data     = response.json()

            assert data['total'] == len(data['roots'])

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots/current - Get Current Root (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots__current__returns_valid_response(self):                      # Test returns valid structure
        with self.client as _:
            response = _.get('/roots/api/roots/current')

            assert response.status_code == 200

            data = response.json()
            assert data['success']    is True
            assert 'path'             in data
            assert 'label'            in data
            assert 'issue_type'       in data

    def test__roots__current__default_is_root(self):                             # Test default current is root
        with self.client as _:
            response = _.get('/roots/api/roots/current')
            data     = response.json()

            assert data['path'] == ''                                            # Default root has empty path

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/roots/select - Select Root (IN-MEMORY STATE ONLY)
    # Note: This only changes in-memory state, does not modify files
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots__select__can_select_and_reset(self):                         # Test select/reset cycle
        with self.client as _:
            roots_response = _.get('/roots/api/roots')                                 # Get available roots
            data = roots_response.json()

            if data['total'] > 1:                                                # Only test if we have non-default roots
                non_default = [r for r in data['roots'] if r['path'] != ''][0]
                test_path   = non_default['path']

                select_response = _.post('/roots/api/roots/select', json={'path': test_path})  # Select a non-default root
                assert select_response.json()['success'] is True

                current_response = _.get('/roots/api/roots/current')                   # Verify it changed
                assert current_response.json()['path'] == test_path

                reset_response = _.post('/roots/api/roots/select', json={'path': ''})  # Reset to default
                assert reset_response.json()['success'] is True
                assert reset_response.json()['path']    == ''

    def test__roots__select__invalid_path_fails(self):                           # Test invalid path fails gracefully
        with self.client as _:
            response = _.post('/roots/api/roots/select', json={'path': 'nonexistent/invalid/path'})

            assert response.status_code == 200

            data = response.json()
            assert data['success'] is False

    # ═══════════════════════════════════════════════════════════════════════════════
    # Service Layer Tests (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__root_selection_service__get_available_roots(self):                 # Test service layer directly
        with self.fast_api.root_selection_service as _:
            result = _.get_available_roots()

            assert result.success is True
            assert int(result.total) >= 1
            assert len(result.roots) >= 1

    def test__root_selection_service__scan_finds_issues(self):                   # Test scanning finds real issues
        with self.fast_api.root_selection_service as _:
            folders = _.scan_for_issue_folders()

            assert isinstance(folders, list)                                     # Should return list even if empty

    # ═══════════════════════════════════════════════════════════════════════════════
    # Regression Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__regression__roots_endpoint_doesnt_crash(self):                     # Ensure endpoint handles real data
        with self.client as _:
            response = _.get('/roots/api/roots')

            assert response.status_code == 200
            assert response.json()['success'] is True

    def test__regression__current_root_doesnt_crash(self):                       # Ensure current root handles real data
        with self.client as _:
            response = _.get('/roots/api/roots/current')

            assert response.status_code == 200
            assert response.json()['success'] is True