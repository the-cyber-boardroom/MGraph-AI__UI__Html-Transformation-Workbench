import mgraph_ai_ui_html_transformation_workbench__ui
from osbot_utils.type_safe.primitives.domains.files.safe_str.Safe_Str__File__Path               import Safe_Str__File__Path
from fastapi                                                                                    import Response
from osbot_utils.utils.Files                                                                    import path_combine, file_contents
from memory_fs.Memory_FS                                                                        import Memory_FS
from memory_fs.storage_fs.providers.Storage_FS__Local_Disk                                      import Storage_FS__Local_Disk
from memory_fs.storage_fs.providers.Storage_FS__Memory                                          import Storage_FS__Memory
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Issues                  import Routes__Issues
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Labels                  import Routes__Labels
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Links                   import Routes__Links
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Nodes                   import Routes__Nodes
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Server import Routes__Server
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Types                   import Routes__Types
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Repository                import Issue__Repository
from mgraph_ai_ui_html_transformation_workbench.service.issues.Issue__Service                   import Issue__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.Label__Service                   import Label__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository import Graph__Repository
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Link__Service     import Link__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Node__Service     import Node__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Type__Service     import Type__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Git__Status__Service import Git__Status__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Index__Status__Service import Index__Status__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Server__Status__Service import Server__Status__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Storage__Status__Service import Storage__Status__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Types__Status__Service import Types__Status__Service
from osbot_fast_api.api.routes.Routes__Set_Cookie                                               import Routes__Set_Cookie
from starlette.responses                                                                        import RedirectResponse
from starlette.staticfiles                                                                      import StaticFiles
from osbot_fast_api.api.decorators.route_path                                                   import route_path
from osbot_fast_api_serverless.fast_api.Serverless__Fast_API                                    import Serverless__Fast_API
from mgraph_ai_ui_html_transformation_workbench.config                                          import UI__CONSOLE__ROUTE__CONSOLE, FAST_API__TITLE, FAST_API__DESCRIPTION, UI__CONSOLE__MAJOR__VERSION, UI__CONSOLE__LATEST__VERSION, UI__CONSOLE__ROUTE__START_PAGE
from mgraph_ai_ui_html_transformation_workbench.utils.Version                                   import version__mgraph_ai_service__html_transformation_workbench

ROUTES_PATHS__CONSOLE = [f'/{UI__CONSOLE__ROUTE__CONSOLE}',
                         '/events/server']

DEFAULT__ISSUES_PATH  = '.issues'

class Html_Transformation_Workbench__Fast_API(Serverless__Fast_API):
    run_in_memory   : bool                 = True                                 # todo: find a better place to put this option
    issues_path     : Safe_Str__File__Path = DEFAULT__ISSUES_PATH
    memory_fs       : Memory_FS            = None                                 # todo: refactor into separate project

    graph_repository      : Graph__Repository    = None
    issue_repository      : Issue__Repository    = None
    issue_service         : Issue__Service       = None
    label_service         : Label__Service       = None
    link_service          : Link__Service        = None
    node_service          : Node__Service        = None
    type_service          : Type__Service        = None

    storage_status__service : Storage__Status__Service = None
    git_status__service     : Git__Status__Service     = None
    types_status__service   : Types__Status__Service   = None
    index_status__service   : Index__Status__Service   = None
    server_status_service   : Server__Status__Service  = None

    def setup(self):
        with self.config as _:
            _.name           = FAST_API__TITLE
            _.version        = version__mgraph_ai_service__html_transformation_workbench
            _.description    = FAST_API__DESCRIPTION

            #_.enable_api_key = False        # because of chrome-llm/manifest.json
            #self.add_chrome_llm_routes()    # todo: refactor this into separate project
            self.setup_services()

        return super().setup()

    def setup_routes(self):
        self.add_routes(Routes__Issues, service = self.issue_service)
        self.add_routes(Routes__Labels, service = self.label_service)
        self.add_routes(Routes__Links , service = self.link_service )
        self.add_routes(Routes__Nodes , service = self.node_service )
        self.add_routes(Routes__Types , service = self.type_service )
        self.add_routes(Routes__Server, service = self.server_status_service )
        self.add_routes(Routes__Set_Cookie)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create all services with proper dependency chain
    # ═══════════════════════════════════════════════════════════════════════════════
    def setup_services(self):                                                               # Initialize the service dependency chain.

        if self.run_in_memory:                                                              # 1. Create storage backend based on configuration
            storage_fs = Storage_FS__Memory()
        else:
            storage_fs = Storage_FS__Local_Disk(root_path=self.issues_path)


        self.memory_fs = Memory_FS(storage_fs=storage_fs)                                   # 2. Create Memory-FS wrapper

        self.graph_repository = Graph__Repository(memory_fs  = self.memory_fs       )       # 3. Create repository
        self.issue_repository = Issue__Repository(base_path  = self.issues_path     )       # todo: double check this path issue
        self.issue_service    = Issue__Service   (repository = self.issue_repository)
        self.issue_repository = Issue__Repository()

        self.type_service  = Type__Service (repository=self.graph_repository)               # 4. Create services
        self.node_service  = Node__Service (repository=self.graph_repository)
        self.link_service  = Link__Service (repository=self.graph_repository)
        self.label_service = Label__Service(repository=self.issue_repository)

        self.storage_status__service = Storage__Status__Service(storage_fs= storage_fs)
        self.git_status__service     = Git__Status__Service    ()
        self.types_status__service   = Types__Status__Service(type_service = self.type_service)
        self.index_status__service   = Index__Status__Service(type_service = self.type_service)
        self.server_status_service   = Server__Status__Service(storage_service = self.storage_status__service,
                                                               git_service     = self.git_status__service    ,
                                                               types_service   = self.types_status__service  ,
                                                               index_service   = self.index_status__service  )

        # todo: see how this works, since this should be loaded from the repo
        self.type_service.initialize_default_types()                                        # 5. Initialize default types

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
