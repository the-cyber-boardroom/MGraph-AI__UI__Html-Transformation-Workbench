from unittest                                                                                import TestCase
from osbot_fast_api_serverless.utils.Version                                                 import version__osbot_fast_api_serverless
from osbot_utils.testing.Graph__Deterministic__Ids                                           import graph_deterministic_ids
from osbot_utils.testing.__                                                                  import __, __SKIP__
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Create__Request  import Schema__Node__Create__Request
from mgraph_ai_ui_html_transformation_workbench.schemas.graph.Schema__Node__Create__Response import Schema__Node__Create__Response
from tests.unit.Html_Transformation_Workbench__Test_Objs                                      import setup__html_transformation_workbench__test_objs


class test_Routes__Nodes__client(TestCase):

    @classmethod
    def setUpClass(cls):                                                         # Shared setup - create once
        cls.test_objs  = setup__html_transformation_workbench__test_objs()
        cls.client = cls.test_objs.fast_api__client


    def test__info__health(self):
        response = self.client.get('/info/status')
        assert response.status_code                   == 200
        assert response.json()                        == { 'environment': 'local'                            ,
                                                           'name'       : 'osbot_fast_api_serverless'        ,
                                                           'status'     : 'operational'                      ,
                                                           'version'    : version__osbot_fast_api_serverless }
        assert self.client.get('/info/health').json() == {'status': 'ok'}

    def test__regression__nodes_not_available_after_creation(self):
        with self.client as _:
            with graph_deterministic_ids():
                nodes__response_1 = _.get('/nodes/api/nodes').json()

                assert nodes__response_1 == {'message': '', 'nodes': [], 'success': True, 'total': 0}

                create__request   = Schema__Node__Create__Request(title       = 'an title'  ,
                                                                  description = 'description',
                                                                  node_type   = 'task'        )
                create__response  = self.client.post('/nodes/api/nodes', json=create__request.json())


                node_create_response = Schema__Node__Create__Response.from_json(create__response.json())

            assert node_create_response.obj() == __(success=True,
                                                       node=__(node_id='f0000009',          # the use of graph_deterministic_ids makes these ids to be deterministic
                                                               node_type='task',
                                                               node_index=1,
                                                               label='Task-1',
                                                               title='an title',
                                                               description='description',
                                                               status='backlog',
                                                               created_at=__SKIP__,
                                                               updated_at=__SKIP__,
                                                               created_by='f0000010',
                                                               tags=[],
                                                               links=[],
                                                               properties=__()),
                                                       message='')

            nodes__response_2 = _.get('/nodes/api/nodes').json()

            assert nodes__response_2 == {'message': '',
                                         'nodes': [{'label': 'Task-1',
                                                    'node_type': 'task',
                                                    'status': 'backlog',
                                                    'title': 'an title'}],
                                         'success': True,
                                         'total': 1}
