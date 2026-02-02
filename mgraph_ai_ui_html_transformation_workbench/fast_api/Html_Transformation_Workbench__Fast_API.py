# ═══════════════════════════════════════════════════════════════════════════════
# Html_Transformation_Workbench__Fast_API - Main FastAPI application
# Phase 1: Added ISSUES__ROOT_PATH env var support for root selection
# ═══════════════════════════════════════════════════════════════════════════════

import mgraph_ai_ui_html_transformation_workbench__ui
from fastapi                                                                                    import Response
from osbot_utils.utils.Env                                                                      import get_env
from osbot_utils.utils.Files                                                                    import path_combine, file_contents
from memory_fs.Memory_FS                                                                        import Memory_FS
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Comments                import Routes__Comments
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Comments__Service import Comments__Service
from osbot_fast_api_serverless.fast_api.routes.Routes__Info                                     import Routes__Info
from osbot_utils.type_safe.primitives.domains.files.safe_str.Safe_Str__File__Path               import Safe_Str__File__Path
from memory_fs.storage_fs.providers.Storage_FS__Local_Disk                                      import Storage_FS__Local_Disk
from memory_fs.storage_fs.providers.Storage_FS__Memory                                          import Storage_FS__Memory
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Links                   import Routes__Links
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Nodes                   import Routes__Nodes
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Server                  import Routes__Server
from mgraph_ai_ui_html_transformation_workbench.fast_api.routes.Routes__Types                   import Routes__Types
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Graph__Repository import Graph__Repository
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Link__Service     import Link__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Node__Service     import Node__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.graph_services.Type__Service     import Type__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Git__Status__Service      import Git__Status__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Index__Status__Service    import Index__Status__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Server__Status__Service   import Server__Status__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Storage__Status__Service  import Storage__Status__Service
from mgraph_ai_ui_html_transformation_workbench.service.issues.status.Types__Status__Service    import Types__Status__Service
from osbot_fast_api.api.routes.Routes__Set_Cookie                                               import Routes__Set_Cookie
from starlette.responses                                                                        import RedirectResponse
from starlette.staticfiles                                                                      import StaticFiles
from osbot_fast_api.api.decorators.route_path                                                   import route_path
from osbot_fast_api_serverless.fast_api.Serverless__Fast_API                                    import Serverless__Fast_API
from mgraph_ai_ui_html_transformation_workbench.config                                          import UI__CONSOLE__ROUTE__CONSOLE, FAST_API__TITLE, FAST_API__DESCRIPTION, UI__CONSOLE__MAJOR__VERSION, UI__CONSOLE__LATEST__VERSION, UI__CONSOLE__ROUTE__START_PAGE
from mgraph_ai_ui_html_transformation_workbench.utils.Version                                   import version__mgraph_ai_service__html_transformation_workbench

ROUTES_PATHS__CONSOLE = [f'/{UI__CONSOLE__ROUTE__CONSOLE}',
                         '/events/server']

# ═══════════════════════════════════════════════════════════════════════════════
# Environment Variable Names
# ═══════════════════════════════════════════════════════════════════════════════

DEFAULT__ISSUES_PATH       = '.issues'
ENV_VAR__ISSUES__IN_MEMORY = 'ISSUES__IN_MEMORY'                                 # Set to 'false' to use local disk
ENV_VAR__ISSUES__PATH      = 'ISSUES__PATH'                                      # Path to .issues folder
ENV_VAR__ISSUES__ROOT_PATH = 'ISSUES__ROOT_PATH'                                 # NEW: Default root path within issues


class Html_Transformation_Workbench__Fast_API(Serverless__Fast_API):
    run_in_memory   : bool                 = True                                # Default to memory, override via env var
    issues_path     : Safe_Str__File__Path = DEFAULT__ISSUES_PATH                # Default path, override via env var
    root_path       : Safe_Str__File__Path = ''                                  # NEW: Root path within issues (empty = use issues_path)
    memory_fs       : Memory_FS            = None

    graph_repository      : Graph__Repository    = None
    link_service          : Link__Service        = None
    node_service          : Node__Service        = None
    type_service          : Type__Service        = None
    comments_service      : Comments__Service    = None

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

            self.setup_services()

        return super().setup()

    def setup_routes(self):
        self.add_routes(Routes__Links   , service = self.link_service          )
        self.add_routes(Routes__Nodes   , service = self.node_service          )
        self.add_routes(Routes__Types   , service = self.type_service          )
        self.add_routes(Routes__Server  , service = self.server_status_service )
        self.add_routes(Routes__Comments, service = self.comments_service      )

        self.add_routes(Routes__Info)
        self.add_routes(Routes__Set_Cookie)

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create all services with proper dependency chain
    # ═══════════════════════════════════════════════════════════════════════════════

    def setup_services(self):                                                    # Initialize the service dependency chain
        use_memory  = self.resolve_storage_mode()                                # 1. Determine storage mode from env var or attribute
        issues_path = self.resolve_issues_path()                                 # 2. Determine issues path from env var or attribute
        root_path   = self.resolve_root_path()                                   # 3. NEW: Determine root path from env var or attribute

        if use_memory:                                                           # 4. Create storage backend based on configuration
            storage_fs = Storage_FS__Memory()
        else:
            self.run_in_memory = False
            storage_fs = Storage_FS__Local_Disk(root_path=issues_path)

        self.memory_fs = Memory_FS(storage_fs=storage_fs)                        # 5. Create Memory-FS wrapper

        self.graph_repository = Graph__Repository(memory_fs = self.memory_fs)    # 6. Create repository

        self.type_service     = Type__Service    (repository = self.graph_repository)  # 7. Create services
        self.node_service     = Node__Service    (repository = self.graph_repository)
        self.link_service     = Link__Service    (repository = self.graph_repository)
        self.comments_service = Comments__Service(repository = self.graph_repository)


        self.storage_status__service = Storage__Status__Service(storage_fs   = storage_fs)
        self.git_status__service     = Git__Status__Service    ()
        self.types_status__service   = Types__Status__Service  (type_service = self.type_service  )
        self.index_status__service   = Index__Status__Service  (type_service = self.type_service  ,
                                                                repository   = self.graph_repository)
        self.server_status_service   = Server__Status__Service(storage_service = self.storage_status__service,
                                                               git_service     = self.git_status__service    ,
                                                               types_service   = self.types_status__service  ,
                                                               index_service   = self.index_status__service  )

        self.type_service.initialize_default_types()                             # 8. Initialize default types (skips if already exist)

        # Store resolved root path for later use
        self.root_path = root_path

    def resolve_storage_mode(self) -> bool:                                      # Determine if using in-memory storage
        env_value = get_env(ENV_VAR__ISSUES__IN_MEMORY, None)                    # Check environment variable first

        if env_value is not None:
            return env_value.lower() not in ('false', '0', 'no', 'off')          # Any of these = use disk

        return self.run_in_memory                                                # Fall back to instance attribute

    def resolve_issues_path(self) -> str:                                        # Determine issues folder path
        env_value = get_env(ENV_VAR__ISSUES__PATH, None)                         # Check environment variable first

        if env_value:
            return env_value

        return str(self.issues_path)                                             # Fall back to instance attribute

    def resolve_root_path(self) -> str:                                          # NEW: Determine root path within issues
        env_value = get_env(ENV_VAR__ISSUES__ROOT_PATH, None)                    # Check environment variable first

        if env_value:
            return env_value

        if self.root_path:                                                       # Fall back to instance attribute
            return str(self.root_path)

        return ''                                                                # Empty = use issues_path as root

    def get_current_root_path(self) -> str:                                      # NEW: Get the current effective root path
        if self.root_path:
            return self.root_path
        return str(self.issues_path)

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