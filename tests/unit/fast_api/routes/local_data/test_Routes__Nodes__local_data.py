from unittest import TestCase

from osbot_utils.testing.Pytest import skip_pytest
from osbot_utils.testing.Temp_Env_Vars import Temp_Env_Vars
from osbot_utils.utils.Env import env_vars

from mgraph_ai_ui_html_transformation_workbench.fast_api.Html_Transformation_Workbench__Fast_API import Html_Transformation_Workbench__Fast_API, ENV_VAR__ISSUES__IN_MEMORY, ENV_VAR__ISSUES__PATH
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Node__Service import Node__Service


class test_Routes__Nodes__local_data(TestCase):

    @classmethod
    def setUpClass(cls):
        skip_pytest("with real data these have quite a bit of a performance hit")
        cls.env_vars = {ENV_VAR__ISSUES__IN_MEMORY: "False",
                        ENV_VAR__ISSUES__PATH     : "."    }
        cls.temp_env_vars = Temp_Env_Vars(env_vars=cls.env_vars).set_vars()
        cls.fast_api =  Html_Transformation_Workbench__Fast_API().setup()

    @classmethod
    def tearDownClass(cls):
        cls.temp_env_vars.restore_vars()

    def test_setUpClass(self):
        with self.fast_api as _:
            assert type(_) is Html_Transformation_Workbench__Fast_API
            assert _.run_in_memory is False
            assert len(_.type_service.list_node_types()) >= 4            # 4 is the default



    def test__regression__in_parsing_nodes__bad_data_in__node_label(self):
        skip_pytest("with real data this has quite a bit of a performance hit") # todo: figure out why and add a caching layer
        with self.fast_api.node_service as _:
            assert type(_) is Node__Service
            assert _.list_nodes().total > 0
