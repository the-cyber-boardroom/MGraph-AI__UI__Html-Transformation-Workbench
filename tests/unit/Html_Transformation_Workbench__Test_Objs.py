from fastapi                                                                    import FastAPI

from mgraph_ai_ui_html_transformation_workbench.fast_api.Html_Transformation_Workbench__Fast_API import Html_Transformation_Workbench__Fast_API
from osbot_fast_api.api.Fast_API                                                import ENV_VAR__FAST_API__AUTH__API_KEY__NAME, ENV_VAR__FAST_API__AUTH__API_KEY__VALUE
from osbot_utils.helpers.duration.decorators.capture_duration                   import capture_duration
from osbot_utils.type_safe.Type_Safe                                            import Type_Safe
from osbot_utils.type_safe.primitives.core.Safe_Float                           import Safe_Float
from osbot_utils.type_safe.primitives.domains.identifiers.Random_Guid           import Random_Guid
from osbot_utils.utils.Env                                                      import set_env

TEST_API_KEY__NAME = 'key-used-in-pytest'
TEST_API_KEY__VALUE = Random_Guid()

class Html_Transformation_Workbench__Test_Objs(Type_Safe):
    fast_api        : Html_Transformation_Workbench__Fast_API   = None
    fast_api__app   : FastAPI                                   = None
    setup_completed : bool                                      = False
    duration        : Safe_Float                                = None

html_transformation_workbench__test_objs = Html_Transformation_Workbench__Test_Objs()

def setup__html_transformation_workbench__test_objs():
    with html_transformation_workbench__test_objs as _:
        if _.setup_completed is False:

            set_env(ENV_VAR__FAST_API__AUTH__API_KEY__NAME  , TEST_API_KEY__NAME                )
            set_env(ENV_VAR__FAST_API__AUTH__API_KEY__VALUE , TEST_API_KEY__VALUE               )
            headers = { #'content_type': 'application/json',
                        TEST_API_KEY__NAME:TEST_API_KEY__VALUE}
            with capture_duration() as load_duration:
                _.fast_api         = Html_Transformation_Workbench__Fast_API().setup()
                _.fast_api__app    = _.fast_api.app()
                _.fast_api__client = _.fast_api.client(headers=headers)
                _.setup_completed  = True

            _.duration = load_duration.seconds

        return _