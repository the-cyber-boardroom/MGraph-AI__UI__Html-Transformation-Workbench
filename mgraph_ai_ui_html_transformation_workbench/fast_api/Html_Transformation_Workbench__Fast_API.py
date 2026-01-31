import mgraph_ai_ui_html_transformation_workbench__ui
from fastapi                                                        import Response
from osbot_utils.utils.Files                                        import path_combine, file_contents

from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Issues import Routes__Issues
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Labels import Routes__Labels
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Links import Routes__Links
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Nodes import Routes__Nodes
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Types import Routes__Types
from osbot_fast_api.api.routes.Routes__Set_Cookie                   import Routes__Set_Cookie
from starlette.responses                                            import RedirectResponse
from starlette.staticfiles                                          import StaticFiles
from osbot_fast_api.api.decorators.route_path                       import route_path
from osbot_fast_api_serverless.fast_api.Serverless__Fast_API        import Serverless__Fast_API
from mgraph_ai_ui_html_transformation_workbench.config              import UI__CONSOLE__ROUTE__CONSOLE, FAST_API__TITLE, FAST_API__DESCRIPTION, UI__CONSOLE__MAJOR__VERSION, UI__CONSOLE__LATEST__VERSION, UI__CONSOLE__ROUTE__START_PAGE
from mgraph_ai_ui_html_transformation_workbench.utils.Version       import version__mgraph_ai_service__html_transformation_workbench

ROUTES_PATHS__CONSOLE        = [f'/{UI__CONSOLE__ROUTE__CONSOLE}',
                                '/events/server']

class Html_Transformation_Workbench__Fast_API(Serverless__Fast_API):
    run_in_memory : bool = True                                 # todo: find a better place to put this option

    def setup(self):
        with self.config as _:
            _.name           = FAST_API__TITLE
            _.version        = version__mgraph_ai_service__html_transformation_workbench
            _.description    = FAST_API__DESCRIPTION

            #_.enable_api_key = False        # because of chrome-llm/manifest.json
            self.add_chrome_llm_routes()
        return super().setup()

    def setup_routes(self):
        self.add_routes(Routes__Issues)
        self.add_routes(Routes__Labels)
        self.add_routes(Routes__Links)
        self.add_routes(Routes__Nodes)
        self.add_routes(Routes__Types)
        self.add_routes(Routes__Set_Cookie)

    def add_chrome_llm_routes(self):
        def get_file(file_path):
            root_path = mgraph_ai_ui_html_transformation_workbench__ui.path
            js_path = path_combine(root_path, file_path)

            return Response(file_contents(js_path), media_type='text/javascript')

        @route_path('/service-worker.js')
        def service_worker_js():
            return get_file('chrome-llm/src/service-worker.js')


        @route_path('/workbench/chrome-llm/manifest.json')
        def manifest_json():
            return get_file('chrome-llm/manifest.json')

        self.add_route_get(service_worker_js)
        self.add_route_get(manifest_json)



    # todo: refactor to separate class (focused on setting up this static route)
    def setup_static_routes(self):


        path_static_folder  = mgraph_ai_ui_html_transformation_workbench__ui.path
        path_static         = f"/{UI__CONSOLE__ROUTE__CONSOLE}"
        path_name           = UI__CONSOLE__ROUTE__CONSOLE
        major_version       = UI__CONSOLE__MAJOR__VERSION
        latest_version      = UI__CONSOLE__LATEST__VERSION
        start_page          = UI__CONSOLE__ROUTE__START_PAGE
        path_latest_version = f"/{path_name}/{major_version}/{latest_version}/{start_page}.html"
        self.app().mount(path_static, StaticFiles(directory=path_static_folder), name=path_name)


        @route_path(path=f'/{UI__CONSOLE__ROUTE__CONSOLE}')
        def redirect_to_latest():
            return RedirectResponse(url=path_latest_version)

        self.add_route_get(redirect_to_latest)

        # todo: find way to make this deploy to the lambda function
        #self.add_static_route__dev_briefs()

    # def add_static_route__dev_briefs(self):
    #     dev_briefs__folder = path_combine(mgraph_ai_ui_html_transformation_workbench.path, '../docs/dev-briefs' )
    #     dev_briefs__path   = '/dev-briefs'
    #     self.app().mount(dev_briefs__path, StaticFiles(directory=dev_briefs__folder), name='dev-briefs')
