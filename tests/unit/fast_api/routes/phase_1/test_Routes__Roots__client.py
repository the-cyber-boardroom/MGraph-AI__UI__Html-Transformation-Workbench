# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Roots__client - Integration tests for root selection API
# Uses FastAPI test client to test actual HTTP endpoints
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                import TestCase
from tests.unit.Html_Transformation_Workbench__Test_Objs                                     import setup__html_transformation_workbench__test_objs


class test_Routes__Roots__client(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup - create once
        cls.test_objs = setup__html_transformation_workbench__test_objs()
        cls.client    = cls.test_objs.fast_api__client

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots - List Available Roots
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots__list__empty_state(self):                                    # Test listing roots with no custom issues
        with self.client as _:
            response = _.get('/roots/api/roots')

            assert response.status_code == 200

            data = response.json()
            assert data['success'] is True
            assert data['total']   >= 1                                          # At least the default root
            assert len(data['roots']) >= 1

            root = data['roots'][0]                                              # First root is always default
            assert root['path']  == ''
            assert root['label'] == 'Gitrepo-1'                                  # Root issue created on startup
            assert root['issue_type'] == 'git-repo'

    def test__roots__list__with_issues(self):                                    # Test listing roots after creating issues
        with self.client as _:
            create_request = {'title': 'Test Feature', 'description': '', 'node_type': 'feature'}  # Create a feature issue first
            create_response = _.post('/nodes/api/nodes', json=create_request)
            assert create_response.status_code == 200

            roots_response = _.get('/roots/api/roots')                                 # Now list roots

            assert roots_response.status_code == 200
            data = roots_response.json()

            assert data['success'] is True
            assert data['total']   >= 2                                          # Root + new feature

            paths = [r['path'] for r in data['roots']]
            assert ''                         in paths                           # Default root
            assert any('feature' in p for p in paths)                            # Feature issue

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots/current - Get Current Root
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots__current__default(self):                                     # Test current root is default initially
        with self.client as _:
            response = _.get('/roots/api/roots/current')

            assert response.status_code == 200

            data = response.json()
            assert data['success']    is True
            assert data['path']       == ''
            assert data['issue_type'] in ('root', 'git-repo')

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/roots/select - Select Root
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots__select__valid_path(self):                                   # Test selecting a valid root
        with self.client as _:
            create_request = {'title': 'Selectable Feature', 'description': '', 'node_type': 'feature'}
            create_response = _.post('/nodes/api/nodes', json=create_request)
            assert create_response.status_code == 200

            created_node = create_response.json()['node']
            feature_path = f"data/feature/{created_node['label']}"

            select_request  = {'path': feature_path}                             # Select this feature as root
            select_response = _.post('/roots/api/roots/select', json=select_request)

            assert select_response.status_code == 200

            data = select_response.json()
            assert data['success']  is True
            assert data['path']     == feature_path
            assert data['previous'] == ''                                        # Was at default root

            current_response = _.get('/roots/api/roots/current')                       # Verify current root changed
            current_data     = current_response.json()

            assert current_data['path'] == feature_path

    def test__roots__select__invalid_path(self):                                 # Test selecting invalid path fails
        with self.client as _:
            select_request  = {'path': 'nonexistent/invalid/path'}
            select_response = _.post('/roots/api/roots/select', json=select_request)

            assert select_response.status_code == 200                            # API returns 200 with success=false

            data = select_response.json()
            assert data['success'] is False
            assert 'Invalid' in data['message'] or 'invalid' in data['message'].lower()

    def test__roots__select__reset_to_default(self):                             # Test resetting to default root
        with self.client as _:
            create_request = {'title': 'Temp Feature', 'description': '', 'node_type': 'feature'}  # First select a custom root
            create_response = _.post('/nodes/api/nodes', json=create_request)
            created_node = create_response.json()['node']
            feature_path = f"data/feature/{created_node['label']}"

            _.post('/roots/api/roots/select', json={'path': feature_path})

            select_response = _.post('/roots/api/roots/select', json={'path': ''})     # Now reset to default

            assert select_response.status_code == 200

            data = select_response.json()
            assert data['success']  is True
            assert data['path']     == ''
            assert data['previous'] == feature_path

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/roots/with-children - List Roots With Children
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__roots__with_children__empty_initially(self):                       # Test no roots with children initially
        with self.client as _:
            response = _.get('/roots/api/roots/with-children')

            assert response.status_code == 200

            data = response.json()
            assert data['success'] is True
            assert data['total']   >= 0                                         # todo clean up previous tests so that this returns 0 # No issues have children yet

    def test__roots__with_children__after_adding_child(self):                    # Test appears after adding child
        with self.client as _:
            create_request = {'title': 'Parent Feature', 'description': '', 'node_type': 'feature'}  # Create parent feature
            create_response = _.post('/nodes/api/nodes', json=create_request)
            created_node = create_response.json()['node']
            parent_path = f"data/feature/{created_node['label']}"

            child_request = {'parent_path': parent_path, 'issue_type': 'task', 'title': 'Child Task'}   # Add child to it
            child_response = _.post('/issues/api/issues/children', json=child_request)

            assert child_response.json()['success'] is True

            roots_response = _.get('/roots/api/roots/with-children')                   # Now check roots with children

            assert roots_response.status_code == 200

            data = roots_response.json()
            assert data['success'] is True
            assert data['total']   >= 1                                          # At least one root with children

            paths = [r['path'] for r in data['roots']]
            assert any(created_node['label'] in p for p in paths)

            delete_response = _.delete(f'/nodes/api/nodes/{created_node['label']}')
            assert delete_response.json() == {'deleted': True, 'label': created_node['label'], 'message': '', 'success': True}

    # ═══════════════════════════════════════════════════════════════════════════════
    # Full Workflow Test
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__workflow__list_select_current_reset(self):                         # Test complete root selection workflow
        with self.client as _:
            initial_roots = _.get('/roots/api/roots').json()                           # 1. List available roots
            assert initial_roots['success'] is True
            initial_count = initial_roots['total']

            create_request = {'title': 'Workflow Feature', 'description': 'For workflow test', 'node_type': 'feature'}
            create_response = _.post('/nodes/api/nodes', json=create_request)    # 2. Create a new feature
            assert create_response.status_code == 200
            feature_label = create_response.json()['node']['label']
            feature_path  = f"data/feature/{feature_label}"

            updated_roots = _.get('/roots/api/roots').json()                           # 3. Verify it appears in roots
            assert updated_roots['total'] == initial_count + 1

            labels = [r['label'] for r in updated_roots['roots']]
            assert feature_label in labels

            select_response = _.post('/roots/api/roots/select', json={'path': feature_path})   # 4. Select this feature as root
            assert select_response.json()['success'] is True

            current = _.get('/roots/api/roots/current').json()                         # 5. Verify current root
            assert current['path']  == feature_path
            assert current['label'] == feature_label

            reset_response = _.post('/roots/api/roots/select', json={'path': ''})      # 6. Reset to default
            assert reset_response.json()['success']  is True
            assert reset_response.json()['previous'] == feature_path

            final_current = _.get('/roots/api/roots/current').json()                   # 7. Verify back to default
            assert final_current['path'] == ''