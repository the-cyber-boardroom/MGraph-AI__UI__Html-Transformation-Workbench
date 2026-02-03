# Release-5: v0.2.31 - Dynamic Types + Link Types

This release groups related work items into a single deliverable. Below are the direct child issues and any nested work under their features.

## Direct Child Issues

| Issue | Type | Status | Title | Summary |
|---|---|---|---|---|
| [Bug-10](issues/Bug-10) | bug | todo | Cannot create user-story nodes - label validation fails | When trying to create a new user-story node, the backend returns a validation error: |
| [Feature-13](issues/Feature-13) | feature | done | Schema Extensions | Add new node types to support richer project planning. |
| [Feature-2](issues/Feature-2) | feature | done | Create markdown parser service | Extract markdown parsing functionality into a shared service that can be used by multiple components (DocsViewer, Iss... |
| [Task-13](issues/Task-13) | task | done | add better way to show user_error messages to user | at the moment there are number of cases where a pop up alert is shown. I think we will be better with an alert style... |
| [Task-23](issues/Task-23) | task | review | Use messages panel for confirmation dialogs instead of browser alerts | Replace native browser `confirm()` dialogs with inline confirmation UI in the messages panel. |
| [Task-26](issues/Task-26) | task | backlog | Add expandable error details in Messages Panel | Add a 'Show Details' toggle for error messages in the Messages Panel, similar to the API Explorer's request details. |
| [Task-27](issues/Task-27) | task | backlog | Add 'Create Issue from Error' button in Messages Panel | Add a button to error messages that allows creating a new Bug issue directly from the error. |
| [Task-29](issues/Task-29) | task | backlog | add releases mode_workflow where we package the issues in done and remove from UI | this needs some thinking and most likely some backend changes, since we should also remove those issues from the ones... |

## Feature-13 Sub-Issues

| Issue | Type | Status | Title | Summary |
|---|---|---|---|---|
| [Task-10](issues/Feature-13/issues/Task-10) | task | done | Add user-story node type | Add user-story node type for capturing user needs. |
| [Task-11](issues/Feature-13/issues/Task-11) | task | done | Add person node type with assigned-to link support | Add person node type for team members. |
| [Task-12](issues/Feature-13/issues/Task-12) | task | done | Update UI to show new node types with appropriate colors_icons | Update UI components to handle new node types. |
| [Task-9](issues/Feature-13/issues/Task-9) | task | done | Add version node type with has-feature link support | Add version node type for release milestones. |
