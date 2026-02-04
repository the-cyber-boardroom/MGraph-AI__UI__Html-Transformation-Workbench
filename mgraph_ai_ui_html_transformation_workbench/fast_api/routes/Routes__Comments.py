# ═══════════════════════════════════════════════════════════════════════════════
# Routes__Comments - FastAPI routes for comment CRUD operations
# ═══════════════════════════════════════════════════════════════════════════════
from osbot_fast_api.api.decorators.route_path import route_path

from osbot_fast_api.api.routes.Fast_API__Routes                                                     import Fast_API__Routes
from issues_fs.schemas.graph.Safe_Str__Graph_Types                 import Safe_Str__Node_Type, Safe_Str__Node_Label
from issues_fs.schemas.issues.Schema__Comment                      import (Schema__Comment__Create__Request,
                                                                                                            Schema__Comment__Update__Request,
                                                                                                            Schema__Comment__Response,
                                                                                                            Schema__Comment__List__Response,
                                                                                                            Schema__Comment__Delete__Response)
from issues_fs.issues.graph_services.Comments__Service     import Comments__Service

class Routes__Comments(Fast_API__Routes):                                         # Comments API routes
    tag     : str               = 'comments'
    service : Comments__Service = None

    def setup_routes(self):
        self.add_route_get   (self.list_comments  )
        self.add_route_post  (self.create_comment )
        self.add_route_get   (self.get_comment    )
        self.add_route_patch (self.update_comment )
        self.add_route_delete(self.delete_comment )

    # ═══════════════════════════════════════════════════════════════════════════════
    # List Comments
    # ═══════════════════════════════════════════════════════════════════════════════
    @route_path("/api/{node_type}/{label}")
    def list_comments(self                 ,                                     # GET /comments/api/{node_type}/{label}
                      node_type : str      ,
                      label     : str
                 ) -> dict:
        """List all comments on a node."""
        try:
            response = self.service.list_comments(
                node_type = Safe_Str__Node_Type(node_type)  ,
                label     = Safe_Str__Node_Label(label)
            )
            return response.json()
        except Exception as e:
            return Schema__Comment__List__Response(success  = False           ,
                                                   comments = []              ,
                                                   total    = 0               ,
                                                   message  = f'Error: {e}'   ).json()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Create Comment
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path("/api/{node_type}/{label}")
    def create_comment(self                                           ,          # POST /comments/api/{node_type}/{label}
                       node_type : str                                ,
                       label     : str                                ,
                       request   : Schema__Comment__Create__Request
                  ) -> dict:
        """Add a new comment to a node."""
        try:
            response = self.service.create_comment(
                node_type = Safe_Str__Node_Type(node_type)  ,
                label     = Safe_Str__Node_Label(label)     ,
                request   = request
            )
            return response.json()
        except Exception as e:
            return Schema__Comment__Response(success = False         ,
                                             message = f'Error: {e}' ).json()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Get Single Comment
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path("/api/{node_type}/{label}/{comment_id}")
    def get_comment(self                  ,                                      # GET /comments/api/{node_type}/{label}/{comment_id}
                    node_type  : str      ,
                    label      : str      ,
                    comment_id : str
               ) -> dict:
        """Get a single comment by ID."""
        try:
            response = self.service.get_comment(
                node_type  = Safe_Str__Node_Type(node_type)  ,
                label      = Safe_Str__Node_Label(label)     ,
                comment_id = comment_id
            )
            return response.json()
        except Exception as e:
            return Schema__Comment__Response(success = False         ,
                                             message = f'Error: {e}' ).json()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Update Comment
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path("/api/{node_type}/{label}/{comment_id}")
    def update_comment(self                                           ,          # PATCH /comments/api/{node_type}/{label}/{comment_id}
                       node_type  : str                               ,
                       label      : str                               ,
                       comment_id : str                               ,
                       request    : Schema__Comment__Update__Request
                  ) -> dict:
        """Edit a comment's text."""
        try:
            response = self.service.update_comment(
                node_type  = Safe_Str__Node_Type(node_type)  ,
                label      = Safe_Str__Node_Label(label)     ,
                comment_id = comment_id                      ,
                request    = request
            )
            return response.json()
        except Exception as e:
            return Schema__Comment__Response(success = False         ,
                                             message = f'Error: {e}' ).json()

    # ═══════════════════════════════════════════════════════════════════════════════
    # Delete Comment
    # ═══════════════════════════════════════════════════════════════════════════════

    @route_path("/api/{node_type}/{label}/{comment_id}")
    def delete_comment(self                  ,                                   # DELETE /comments/api/{node_type}/{label}/{comment_id}
                       node_type  : str      ,
                       label      : str      ,
                       comment_id : str
                  ) -> dict:
        """Delete a comment."""
        try:
            response = self.service.delete_comment(
                node_type  = Safe_Str__Node_Type(node_type)  ,
                label      = Safe_Str__Node_Label(label)     ,
                comment_id = comment_id
            )
            return response.json()
        except Exception as e:
            return Schema__Comment__Delete__Response(success    = False           ,
                                                     deleted    = False           ,
                                                     comment_id = comment_id      ,
                                                     message    = f'Error: {e}'   ).json()