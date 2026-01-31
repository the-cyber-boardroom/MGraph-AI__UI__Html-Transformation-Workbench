from osbot_fast_api_serverless.deploy.Deploy__Serverless__Fast_API      import Deploy__Serverless__Fast_API
from mgraph_ai_ui_html_transformation_workbench.config                  import LAMBDA_DEPENDENCIES__HTML_TRANSFORMATION__UI, SERVICE_NAME
from mgraph_ai_ui_html_transformation_workbench.fast_api.lambda_handler import run


class Deploy__Service(Deploy__Serverless__Fast_API):


    def deploy_lambda(self):
        with super().deploy_lambda() as _:
            return _

    def handler(self):
        return run

    def lambda_dependencies(self):
        return LAMBDA_DEPENDENCIES__HTML_TRANSFORMATION__UI

    def lambda_name(self):
        return SERVICE_NAME