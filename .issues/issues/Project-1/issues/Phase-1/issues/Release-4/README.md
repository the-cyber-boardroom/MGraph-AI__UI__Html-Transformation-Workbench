# Release-4: v0.2.30 - Recursive UI Completed

**Parent:** [Phase-1: Phase 1 - GitGraph Issues](../..)

This release groups related work items into a single deliverable. Below are the direct child issues and any nested work under their features.

## Direct Child Issues

| Issue | Type | Status | Title | Summary |
|---|---|---|---|---|
| [Bug-1](issues/Bug-1) | bug | done | Add link to open API docs in UI | The UI should have a convenient link to open the FastAPI documentation page. |
| [Bug-11](issues/Bug-11) | bug | done | CRITICAL: Create Issue modal buttons not working | In v0.1.5, the Create Issue modal is completely broken: |
| [Bug-12](issues/Bug-12) | bug | done | Vis.js graph visualization renders empty canvas | In v0.1.5, the Vis.js visualization mode shows an empty canvas despite the network being created successfully. |
| [Bug-13](issues/Bug-13) | bug | todo | Kanban board filter loses focus on every keystroke | In the Kanban board, when filtering we can only type one letter at a time because the filter input loses focus on eve... |
| [Bug-14](issues/Bug-14) | bug | done | CRITICAL: Kanban drag and drop not working in v0.1.5 | Drag and drop in the Kanban board is broken. When dragging a card to another column, it fails with 404 error. |
| [Bug-2](issues/Bug-2) | bug | closed | Fix incorrect API URL path in graph-service.js | The graph-service.js is using an incorrect API base URL. |
| [Bug-4](issues/Bug-4) | bug | confirmed | when creating a 2nd issue, the 'Create *' button is not available | The UI is still showing the 'Creating' button (which doesn't allow clicking)__The fix is to reset this UI after the i... |
| [Bug-5](issues/Bug-5) | bug | done | only possible to add one issue, after that the 'Create bug' button is not available | all we see is the 'Creating message' button (which is disabled) |
| [Bug-7](issues/Bug-7) | bug | done | when creating a new message , data is lost if user clicks outside the modal window | this causes the modal window to close and we lose the data |
| [Bug-8](issues/Bug-8) | bug | done | when going from kanban to 'node detail' user should go back to the same kanban | or we break the flow |
| [Bug-9](issues/Bug-9) | bug | backlog | Graph traversal API has severe performance issues at higher depths | The `/nodes/api/nodes/{node_type}/{label}/graph?depth=N` endpoint has exponential performance degradation as depth in... |
| [Feature-12](issues/Feature-12) | feature | done | Graph Visualization | Visualize the graph of relationships between issues. |
| [Feature-3](issues/Feature-3) | feature | done | Implement Kanban board view | Create a Kanban board mini app that displays issues organized by status columns: |
| [Feature-6](issues/Feature-6) | feature | done | Create Version Viewer mini app | Create a mini app that displays version information including: |
| [Feature-7](issues/Feature-7) | feature | done | Create Issue Detail mini app | Create a mini app that displays full issue details: |
| [Task-18](issues/Task-18) | task | done | as a user I want to easily create a new issue after the creation of another one | at the  moment we go into the 'node detail' view which doesn't have a button to create new issues |
| [Task-2](issues/Task-2) | task | done | it should be possible to create an issue directly on the Kanban board | at the moment i need to go into the Issues panel |
| [Task-24](issues/Task-24) | task | in-progress | on kanban view add preview panel to show content of issue (on click) | at the moment clicking on a card opens the 'Node Detail' which is quite disruptive |
| [Task-25](issues/Task-25) | task | in-progress | on kanban board add support for the opening an issue on new tab | it should be possible to right click on the card and chose the 'open in new tab' option (of the browser).  |
| [Task-28](issues/Task-28) | task | backlog | in the kanban view add a visual clue (maybe label) to represent who the task is assigned to | so that I can easily identify the ones I'm working on and the ones Claude Code (or another agent) is working on |
| [Task-30](issues/Task-30) | task | backlog | When viewing an issue, I should be able to add new linked issue (bug_task) | this is very useful for example when I'm reviewing an issue and want to add not just a comment about it, but a bug th... |
| [Task-4](issues/Task-4) | task | done | Add markdown preview toggle for description | Enable markdown rendering for issue descriptions. |

## Feature-12 Sub-Issues

| Issue | Type | Status | Title | Summary |
|---|---|---|---|---|
| [Bug-3](issues/Feature-12/issues/Bug-3) | bug | done | Left hand side menu doesn't collapse completely | at the moment the minimise button just closes the menu but leaves the width the same. __what should happen is that it... |
| [Task-14](issues/Feature-12/issues/Task-14) | task | done | Integrate graph-service with new graph traversal API | Connect the UI to the new backend graph traversal endpoint. |
| [Task-15](issues/Feature-12/issues/Task-15) | task | done | Build D3.js force-directed graph component | Create the visual graph component using D3.js force simulation. |
| [Task-16](issues/Feature-12/issues/Task-16) | task | done | Add View Graph button to node detail header | Add a button in node-detail view to open the graph visualization centered on the current node. |
| [Task-19](issues/Feature-12/issues/Task-19) | task | done | Add Mermaid.js graph visualization option | Add Mermaid.js as an alternative graph visualization library alongside D3.js. |
| [Task-20](issues/Feature-12/issues/Task-20) | task | done | Add Vis.js graph visualization option | Add Vis.js Network as an alternative graph visualization library. |
| [Task-21](issues/Feature-12/issues/Task-21) | task | done | Add Cytoscape.js graph visualization option | Add Cytoscape.js as an alternative graph visualization library. |
| [Task-22](issues/Feature-12/issues/Task-22) | task | backlog | Add backend API to get nodes with most edges (hub nodes) | Create a new backend API endpoint that returns nodes sorted by their edge count (connectivity). |
| [Task-6](issues/Feature-12/issues/Task-6) | task | done | Create graph visualization component | Build interactive graph visualization. |
| [Task-7](issues/Feature-12/issues/Task-7) | task | done | Add View Graph button to node detail | Add navigation to graph view from issue detail. |
| [Task-8](issues/Feature-12/issues/Task-8) | task | done | Implement graph data fetching API | Backend endpoint to fetch node with connected nodes. |
