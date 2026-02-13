# Role System Refactor - Implementation Plan

## Goal
To implement a robust, configurable role system with a dedicated settings UI, allowing granular control over tool access for both main roles and add-on entitlements.

## Completed Tasks

1.  **Centralized Configuration (`src/lib/roleConfig.ts`)**
    -   Created a single source of truth for Role Definitions and Tool Mappings.
    -   Defines hierarchical `Main Roles` (Admin, Early Access, Pro, Free) with priority levels.
    -   Defines stackable `Add-on Roles` (Entitlements) that grant specific tool access.
    -   Includes visual metadata (colors, icons) for better UI.

2.  **Admin Settings Page (`src/pages/admin/RoleSettingsPage.tsx`)**
    -   New page accessible via `/admin/roles`.
    -   Allows Admins to:
        -   Toggle tool access per role via a simple UI.
        -   Edit Role Names and Descriptions.
        -   Create and Delete custom Add-on Roles.
    -   Supports saving configuration, which persists to the backend.

3.  **Backend Persistence (`api/admin-role-config.ts`)**
    -   Created an API endpoint to Save/Load the role configuration.
    -   Currently uses a JSON file storage (`database/role_config.json`) for local environments.
    -   **Note for Production:** In a serverless environment like Vercel, replace the file-system logic in this API with a database call (e.g., Supabase table) to ensure persistence across deployments.

4.  **Updated User Management (`src/pages/admin/UsersPage.tsx`)**
    -   Replaced the cluttered entitlement buttons with a clean **Multi-select Dropdown**.
    -   Now displays active add-on roles as colored badges.
    -   Uses the centralized `roleConfig` for role names and colors.

5.  **Access Control Upgrade**
    -   **`src/lib/entitlements.ts`**: Updated to dynamically derive grants from the loaded configuration.
    -   **`src/components/subscription/useSubscription.tsx`**: Updated `hasAccessToTool` to check the `roleConfig` first.
    -   **`src/components/shared/ToolGridWithHighlight.tsx`**: Tools now lock/unlock instantly based on the Admin settings.

## How to Test
1.  Navigate to **Admin > Roles** (`/admin/roles`).
2.  Select a role (e.g., "Early Access") and toggle off a tool (e.g., "AI Agent").
3.  Click **Save Changes**.
4.  Navigate to the Dashboard/Tools page as an Early Access user. The "AI Agent" tool should now be locked.
5.  Go to **Admin > Users**.
6.  Find a user and use the "Add-ons" dropdown to grant them the "AI Agent" add-on role.
7.  The user should now have access to the tool again.

## Next Steps (Production)
-   Migrate the storage logic in `api/admin-role-config.ts` to use your Postgres database (e.g., a `app_settings` table) instead of a JSON file if deploying to a serverless platform.
