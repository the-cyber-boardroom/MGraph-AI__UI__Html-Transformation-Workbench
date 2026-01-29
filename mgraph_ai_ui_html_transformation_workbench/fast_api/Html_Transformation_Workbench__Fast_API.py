from osbot_utils.utils.Files import path_combine

import mgraph_ai_ui_html_transformation_workbench
import mgraph_ai_ui_html_transformation_workbench__ui
from starlette.responses                                            import RedirectResponse
from starlette.staticfiles                                          import StaticFiles
from osbot_fast_api.api.decorators.route_path                       import route_path
from osbot_fast_api_serverless.fast_api.Serverless__Fast_API        import Serverless__Fast_API
from mgraph_ai_ui_html_transformation_workbench.config              import UI__CONSOLE__ROUTE__CONSOLE, FAST_API__TITLE, FAST_API__DESCRIPTION, UI__CONSOLE__MAJOR__VERSION, UI__CONSOLE__LATEST__VERSION, UI__CONSOLE__ROUTE__START_PAGE
from mgraph_ai_ui_html_transformation_workbench.utils.Version       import version__mgraph_ai_service_html_graph

ROUTES_PATHS__CONSOLE        = [f'/{UI__CONSOLE__ROUTE__CONSOLE}',
                                '/events/server']

class Html_Transformation_Workbench__Fast_API(Serverless__Fast_API):
    run_in_memory : bool = True                                 # todo: find a better place to put this option

    def setup(self):
        with self.config as _:
            _.name           = FAST_API__TITLE
            _.version        = version__mgraph_ai_service_html_graph
            _.description    = FAST_API__DESCRIPTION
        return super().setup()




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

        self.add_static_route__dev_briefs()

    def add_static_route__dev_briefs(self):
        dev_briefs__folder = path_combine(mgraph_ai_ui_html_transformation_workbench.path, '../docs/dev-briefs' )
        dev_briefs__path   = '/dev-briefs'
        self.app().mount(dev_briefs__path, StaticFiles(directory=dev_briefs__folder), name='dev-briefs')
