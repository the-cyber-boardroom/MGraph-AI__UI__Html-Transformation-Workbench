# Release-1: v0.2.27 - Phase 1 Groundwork + Briefs

**Parent:** [Phase-1: Phase 1 - GitGraph Issues](../..)

This release groups related work items into a single deliverable. Below are the direct child issues and any nested work under their features.

## Direct Child Issues

| Issue | Type | Status | Title | Summary |
|---|---|---|---|---|
| [Feature-1](issues/Feature-1) | feature | done | Implement issue tracking system | Create a file-system based issue tracking system for the HTML Transformation Workbench. This enables structured commu... |
| [Feature-11](issues/Feature-11) | feature | released | Add support for capturing the current issue in the navbar (and current location) | so that when we refresh the page we don't lost where we were (at the moment we go into the v0.1.2_index.html page) |
| [Feature-4](issues/Feature-4) | feature | done | Create issue service | Create a service for loading and managing issue JSON files from the filesystem. |
| [Feature-9](issues/Feature-9) | feature | done | Backend API for issue CRUD | Create FastAPI endpoints for creating, updating, and deleting issues. This enables full issue management from the UI. |
| [Task-3](issues/Task-3) | task | done | Add comments section with add_edit_delete | Implement comments functionality for issues. |
| [Task-5](issues/Task-5) | task | done | Wire up PATCH endpoint to save changes | Connect edit form to backend API. |
| [UserStory-1](issues/UserStory-1) | user-story | draft | As a developer, I want to edit issues in the UI | ## User Story |

## Feature-11 Sub-Issues

| Issue | Type | Status | Title | Summary |
|---|---|---|---|---|
| [Task-17](issues/Feature-11/issues/Task-17) | task | backlog | Simplify comments implementation using properties deep merge | Refactor Task-3 (comments UI) to use the new backend deep merge capability. |
