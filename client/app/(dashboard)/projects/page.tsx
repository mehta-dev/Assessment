import { cookies } from "next/headers";

import ProjectManager from "@/components/ProjectManager";

const API_URL =
  process.env.API_SERVER_URL ||
  "http://localhost:4000";

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

const ACCESS_TOKEN_COOKIE =
  "accessToken";

export default async function ProjectsPage() {
  const cookieStore =
    await cookies();

  const accessToken =
    cookieStore.get(
      ACCESS_TOKEN_COOKIE
    )?.value;

  const savedWorkspaceId =
    cookieStore.get(
      CURRENT_WORKSPACE_KEY
    )?.value;

  if (!accessToken) {
    throw new Error(
      "Authentication required"
    );
  }

  /*
   * Get the workspaces belonging to
   * the authenticated user.
   */
  const workspacesResponse =
    await fetch(
      `${API_URL}/workspaces/mine`,
      {
        method: "GET",
        headers: {
          Cookie:
            `${ACCESS_TOKEN_COOKIE}=${accessToken}`,
        },
        cache: "no-store",
      }
    );

  if (!workspacesResponse.ok) {
    const errorText =
      await workspacesResponse.text();

    console.error(
      "Failed to fetch workspaces:",
      errorText
    );

    throw new Error(
      "Failed to fetch workspaces"
    );
  }

  const workspaces =
    await workspacesResponse.json();

  /*
   * Use the workspace stored in the
   * cookie when it is still available
   * to the authenticated user.
   *
   * Otherwise fall back to the first
   * workspace.
   */
  const savedWorkspaceExists =
    workspaces.some(
      (workspace: {
        _id: string;
      }) =>
        workspace._id ===
        savedWorkspaceId
    );

  const workspaceId =
    savedWorkspaceExists
      ? savedWorkspaceId
      : workspaces[0]?._id;

  if (!workspaceId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-gray-900">
            No workspace found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Create or join a workspace
            before creating projects.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Load projects belonging only to
   * the selected workspace.
   */
  const projectsResponse =
    await fetch(
      `${API_URL}/projects`,
      {
        method: "GET",
        headers: {
          Cookie:
            `${ACCESS_TOKEN_COOKIE}=${accessToken}`,
          "X-Workspace-Id":
            workspaceId,
        },
        cache: "no-store",
      }
    );

  if (!projectsResponse.ok) {
    const errorText =
      await projectsResponse.text();

    console.error(
      "Failed to fetch projects:",
      errorText
    );

    throw new Error(
      "Failed to fetch projects"
    );
  }

  const projects =
    await projectsResponse.json();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ProjectManager
        projects={projects}
      />
    </div>
  );
}