# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Issues__client - Integration tests for child issue API
# Uses FastAPI test client to test actual HTTP endpoints
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                import TestCase
from tests.unit.Html_Transformation_Workbench__Test_Objs                                     import setup__html_transformation_workbench__test_objs


class test_Routes__Issues__client(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup - create once
        cls.test_objs = setup__html_transformation_workbench__test_objs()
        cls.client    = cls.test_objs.fast_api__client

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/issues/children - Add Child Issue
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__issues__add_child__success(self):                                  # Test adding child to a parent issue
        with self.client as _:
            parent_request = {'title': 'Parent Feature', 'description': 'A parent', 'node_type': 'feature'}  # First create a parent issue
            parent_response = _.post('/nodes/api/nodes', json=parent_request)

            assert parent_response.status_code == 200
            parent_node = parent_response.json()['node']
            parent_path = f"data/feature/{parent_node['label']}"

            child_request = {'parent_path': parent_path     ,                    # Now add a child to it
                             'issue_type' : 'task'          ,
                             'title'      : 'Child Task'    ,
                             'description': 'A child task'  }
            child_response = _.post('/issues/api/issues/children', json=child_request)

            assert child_response.status_code == 200

            data = child_response.json()
            assert data['success']    is True
            assert data['label']      == 'Task-1'
            assert data['issue_type'] == 'task'
            assert data['title']      == 'Child Task'
            assert 'issues/Task-1'    in data['path']

    def test__issues__add_child__multiple_children(self):                        # Test adding multiple children
        with self.client as _:
            parent_request = {'title': 'Multi-Child Parent', 'description': '', 'node_type': 'feature'}
            parent_response = _.post('/nodes/api/nodes', json=parent_request)
            parent_node = parent_response.json()['node']
            parent_path = f"data/feature/{parent_node['label']}"

            child1_response = _.post('/issues/api/issues/children',                     # Add first child
                                     json={'parent_path': parent_path, 'issue_type': 'task', 'title': 'Task One'})
            child2_response = _.post('/issues/api/issues/children',                     # Add second child
                                     json={'parent_path': parent_path, 'issue_type': 'task', 'title': 'Task Two'})
            child3_response = _.post('/issues/api/issues/children',                     # Add third child (different type)
                                     json={'parent_path': parent_path, 'issue_type': 'bug', 'title': 'Bug One'})

            assert child1_response.json()['label'] == 'Task-1'
            assert child2_response.json()['label'] == 'Task-2'
            assert child3_response.json()['label'] == 'Bug-1'                    # Different type, separate numbering

    def test__issues__add_child__parent_not_found(self):                         # Test error when parent doesn't exist
        with self.client as _:
            child_request = {'parent_path': 'nonexistent/path',
                             'issue_type' : 'task'            ,
                             'title'      : 'Orphan Task'     }
            child_response = _.post('/issues/api/issues/children', json=child_request)

            assert child_response.status_code == 200                             # API returns 200 with success=false

            data = child_response.json()
            assert data['success'] is False
            assert 'not found' in data['message'].lower()

    def test__issues__add_child__to_root(self):                                  # Test adding child to root (.issues/)
        with self.client as _:
            child_request = {'parent_path': ''               ,                   # Empty path = root
                             'issue_type' : 'feature'        ,
                             'title'      : 'Root Child'     }
            child_response = _.post('/issues/api/issues/children', json=child_request)

            assert child_response.status_code == 200

            data = child_response.json()
            assert data['success']    is True
            assert data['issue_type'] == 'feature'
            assert 'issues/'          in data['path']

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /api/issues/children - List Children
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__issues__list_children__empty(self):                                # Test listing children when none exist
        with self.client as _:
            parent_request = {'title': 'Empty Parent', 'description': '', 'node_type': 'feature'}
            parent_response = _.post('/nodes/api/nodes', json=parent_request)
            from osbot_utils.utils.Dev import pprint

            parent_node = parent_response.json()['node']
            parent_path = f"data/feature/{parent_node['label']}"

            list_response = _.post('/issues/api/issues/children/list', json={'parent_path': parent_path})

            assert list_response.status_code == 200

            data = list_response.json()
            assert data['success'] is True
            assert data['total']   == 0
            assert data['children'] == []

    def test__issues__list_children__with_children(self):                        # Test listing children after adding
        with self.client as _:
            parent_request = {'title': 'List Test Parent', 'description': '', 'node_type': 'feature'}
            parent_response = _.post('/nodes/api/nodes', json=parent_request)
            parent_node = parent_response.json()['node']
            parent_path = f"data/feature/{parent_node['label']}"

            _.post('/issues/api/issues/children', json={'parent_path': parent_path, 'issue_type': 'task', 'title': 'Task A'})   # Add some children
            _.post('/issues/api/issues/children', json={'parent_path': parent_path, 'issue_type': 'task', 'title': 'Task B'})
            _.post('/issues/api/issues/children', json={'parent_path': parent_path, 'issue_type': 'bug',  'title': 'Bug A'})

            list_response = _.post('/issues/api/issues/children/list', json={'parent_path': parent_path})

            assert list_response.status_code == 200

            data = list_response.json()
            assert data['success'] is True
            assert data['total']   == 3

            labels = [c['label'] for c in data['children']]
            assert 'Task-1' in labels
            assert 'Task-2' in labels
            assert 'Bug-1'  in labels

            titles = [c['title'] for c in data['children']]
            assert 'Task A' in titles
            assert 'Task B' in titles
            assert 'Bug A'  in titles

    # ═══════════════════════════════════════════════════════════════════════════════
    # POST /api/issues/convert - Convert to New Structure
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__issues__convert__success(self):                                    # Test converting issue to new structure
        with self.client as _:
            issue_request = {'title': 'Convertible Issue', 'description': '', 'node_type': 'task'}
            issue_response = _.post('/nodes/api/nodes', json=issue_request)
            issue_node = issue_response.json()['node']
            issue_path = f"data/task/{issue_node['label']}"

            convert_response = _.post('/issues/api/issues/convert', json={'issue_path': issue_path})

            assert convert_response.status_code == 200

            data = convert_response.json()
            assert data['success']   is True
            assert data['converted'] is True
            assert 'issues'          in data['issues_path']
            assert 'Created'         in data['message'] or data['message'] == ''

    def test__issues__convert__already_converted(self):                          # Test converting already-converted issue
        with self.client as _:
            issue_request = {'title': 'Already Converted', 'description': '', 'node_type': 'feature'}
            issue_response = _.post('/nodes/api/nodes', json=issue_request)
            issue_node = issue_response.json()['node']
            issue_path = f"data/feature/{issue_node['label']}"

            _.post('/issues/api/issues/convert', json={'issue_path': issue_path})       # First conversion

            convert_response = _.post('/issues/api/issues/convert', json={'issue_path': issue_path})  # Second conversion

            assert convert_response.status_code == 200

            data = convert_response.json()
            assert data['success']   is True
            assert data['converted'] is False                                    # Not newly converted
            assert 'Already'         in data['message']

    def test__issues__convert__not_found(self):                                  # Test converting non-existent issue
        with self.client as _:
            convert_response = _.post('/issues/api/issues/convert', json={'issue_path': 'nonexistent/path'})

            assert convert_response.status_code == 200

            data = convert_response.json()
            assert data['success'] is False
            assert 'not found' in data['message'].lower()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Full Workflow Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__workflow__create_parent_add_children_list(self):                   # Test complete parent-child workflow
        with self.client as _:
            parent_request = {'title': 'Workflow Parent', 'description': 'Parent for workflow', 'node_type': 'feature'}  # 1. Create parent issue
            parent_response = _.post('/nodes/api/nodes', json=parent_request)

            assert parent_response.status_code == 200
            parent_node = parent_response.json()['node']
            parent_path = f"data/feature/{parent_node['label']}"

            child1_request = {'parent_path': parent_path, 'issue_type': 'task', 'title': 'Implement Feature'}  # 2. Add first child
            child1_response = _.post('/issues/api/issues/children', json=child1_request)

            assert child1_response.json()['success'] is True
            assert child1_response.json()['label']   == 'Task-1'

            child2_request = {'parent_path': parent_path, 'issue_type': 'task', 'title': 'Write Tests', 'status': 'backlog'}  # 3. Add second child
            child2_response = _.post('/issues/api/issues/children', json=child2_request)

            assert child2_response.json()['success'] is True
            assert child2_response.json()['label']   == 'Task-2'

            list_response = _.post('/issues/api/issues/children/list', json={'parent_path': parent_path})  # 4. List children

            data = list_response.json()
            assert data['success'] is True
            assert data['total']   == 2

            titles = [c['title'] for c in data['children']]
            assert 'Implement Feature' in titles
            assert 'Write Tests'       in titles

    def test__workflow__convert_then_add_children(self):                         # Test convert then add children workflow
        with self.client as _:
            issue_request = {'title': 'Convert Then Add', 'description': '', 'node_type': 'task'}  # 1. Create issue
            issue_response = _.post('/nodes/api/nodes', json=issue_request)
            issue_node = issue_response.json()['node']
            issue_path = f"data/task/{issue_node['label']}"

            convert_response = _.post('/issues/api/issues/convert', json={'issue_path': issue_path})  # 2. Convert to new structure
            assert convert_response.json()['converted'] is True

            child_request = {'parent_path': issue_path, 'issue_type': 'bug', 'title': 'Sub-Bug'}  # 3. Add child
            child_response = _.post('/issues/api/issues/children', json=child_request)

            assert child_response.json()['success'] is True
            assert child_response.json()['label']   == 'Bug-1'

            list_response = _.post('/issues/api/issues/children/list', json={'parent_path': issue_path})  # 4. Verify child exists

            assert list_response.json()['total'] == 1
            assert list_response.json()['children'][0]['label'] == 'Bug-1'

    def test__workflow__nested_children(self):                                   # Test nested children (grandchildren)
        with self.client as _:
            grandparent_request = {'title': 'Grandparent', 'description': '', 'node_type': 'feature'}  # 1. Create grandparent
            grandparent_response = _.post('/nodes/api/nodes', json=grandparent_request)
            grandparent_path = f"data/feature/{grandparent_response.json()['node']['label']}"

            parent_response = _.post('/issues/api/issues/children',                     # 2. Add parent as child
                                     json={'parent_path': grandparent_path, 'issue_type': 'task', 'title': 'Parent Task'})
            parent_path = parent_response.json()['path']

            child_response = _.post('/issues/api/issues/children',                      # 3. Add child to parent (grandchild)
                                    json={'parent_path': parent_path, 'issue_type': 'bug', 'title': 'Grandchild Bug'})

            assert child_response.json()['success'] is True
            assert child_response.json()['label']   == 'Bug-1'

            grandparent_children = _.post('/issues/api/issues/children/list', json={'parent_path': grandparent_path}).json()  # 4. Verify structure
            assert grandparent_children['total'] == 1
            assert grandparent_children['children'][0]['label'] == 'Task-1'

            parent_children = _.post('/issues/api/issues/children/list', json={'parent_path': parent_path}).json()
            assert parent_children['total'] == 1
            assert parent_children['children'][0]['label'] == 'Bug-1'