# ═══════════════════════════════════════════════════════════════════════════════
# test_Routes__Nodes__local_data - Integration tests using real .issues folder
# IMPORTANT: These tests are READ-ONLY to protect live data
# ═══════════════════════════════════════════════════════════════════════════════

from unittest                                                                                            import TestCase
from osbot_utils.testing.Pytest                                                                          import skip_pytest
from osbot_fast_api_serverless.fast_api.Serverless__Fast_API__Config                                     import Serverless__Fast_API__Config
from osbot_utils.testing.Temp_Env_Vars                                                                   import Temp_Env_Vars
from mgraph_ai_ui_html_transformation_workbench.fast_api.Html_Transformation_Workbench__Fast_API         import Html_Transformation_Workbench__Fast_API, ENV_VAR__ISSUES__IN_MEMORY, ENV_VAR__ISSUES__PATH
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Node__Service              import Node__Service


class test_Routes__Nodes__local_data(TestCase):

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

    def test__setup__fast_api_configured(self):                                  # Verify FastAPI setup
        with self.fast_api as _:
            assert type(_)         is Html_Transformation_Workbench__Fast_API
            assert _.run_in_memory is False

    def test__setup__default_types_loaded(self):                                 # Verify default types exist
        with self.fast_api as _:
            node_types = _.type_service.list_node_types()
            type_names = [str(t.name) for t in node_types]

            assert len(node_types) >= 4                                          # At least default types
            assert 'bug'           in type_names
            assert 'task'          in type_names
            assert 'feature'       in type_names

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /nodes/api/nodes - List Nodes (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__nodes__list__returns_valid_response(self):                         # Test list returns valid structure
        with self.client as _:
            response = _.get('/nodes/api/nodes')

            assert response.status_code == 200

            data = response.json()
            assert data['success']      is True
            assert 'nodes'              in data
            assert 'total'              in data
            assert isinstance(data['nodes'], list)
            assert isinstance(data['total'], int)

    def test__nodes__list__nodes_have_required_fields(self):                     # Test nodes have expected fields
        with self.client as _:
            response = _.get('/nodes/api/nodes')
            data     = response.json()

            if data['total'] > 0:                                                # Only test if nodes exist
                node = data['nodes'][0]
                assert 'label'     in node
                assert 'node_type' in node
                assert 'title'     in node
                assert 'status'    in node

    def test__nodes__list__total_matches_count(self):                            # Test total matches actual count
        with self.client as _:
            response = _.get('/nodes/api/nodes')
            data     = response.json()

            assert data['total'] == len(data['nodes'])

    # ═══════════════════════════════════════════════════════════════════════════════
    # GET /nodes/api/types - List Types (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__types__list__returns_valid_response(self):                         # Test types endpoint
        with self.client as _:
            response = _.get('/types/api/types')

            assert response.status_code == 200

            data = response.json()
            assert isinstance(data, list)

    def test__types__list__types_have_required_fields(self):                     # Test types have expected fields
        with self.client as _:
            response = _.get('/types/api/types')
            data     = response.json()

            if len(data) > 0:
                node_type = data[0]
                assert 'name'         in node_type
                assert 'display_name' in node_type
                assert 'color'        in node_type

    # ═══════════════════════════════════════════════════════════════════════════════
    # Service Layer Tests (READ-ONLY)
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__node_service__list_nodes(self):                                    # Test service layer directly
        with self.fast_api.node_service as _:
            assert type(_) is Node__Service

            result = _.list_nodes()

            assert result.success is True
            assert result.total   >= 0
            assert isinstance(result.nodes, list)

    def test__node_service__nodes_readable(self):                                # Test nodes can be read without error
        with self.fast_api.node_service as _:
            result = _.list_nodes()

            for node_summary in result.nodes:                                    # Verify each node is properly formatted
                assert hasattr(node_summary, 'label')     or 'label'     in node_summary
                assert hasattr(node_summary, 'node_type') or 'node_type' in node_summary

    # ═══════════════════════════════════════════════════════════════════════════════
    # Regression Tests
    # ═══════════════════════════════════════════════════════════════════════════════

    def test__regression__in_parsing_nodes__bad_data_in__node_label(self):       # Original regression test
        with self.fast_api.node_service as _:
            assert type(_) is Node__Service

            result = _.list_nodes()

            assert result.total >= 0                                             # Should not crash on real data

    def test__regression__nodes_endpoint_doesnt_crash(self):                     # Ensure endpoint handles real data
        with self.client as _:
            response = _.get('/nodes/api/nodes')

            assert response.status_code == 200                                   # Should not return 500
            assert 'success' in response.json()