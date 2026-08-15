import { cookies } from "next/headers";

import TaskManager from "@/components/TaskManager";
import AddTaskButton from "@/components/AddTaskButton";

import {
  getMyWorkspaces,
  getTasks,
} from "@/lib/api";

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

const ACCESS_TOKEN_COOKIE =
  "accessToken";

export default async function TasksPage() {
  const cookieStore =
    await cookies();

  const accessToken =
    cookieStore.get(
      ACCESS_TOKEN_COOKIE
    )?.value;

  if (!accessToken) {
    throw new Error(
      "Authentication required"
    );
  }

  const savedWorkspaceId =
    cookieStore.get(
      CURRENT_WORKSPACE_KEY
    )?.value;

  const workspaces =
    await getMyWorkspaces(
      accessToken
    );

  const savedWorkspaceExists =
    workspaces.some(
      (workspace) =>
        workspace._id ===
        savedWorkspaceId
    );

  const workspaceId =
    savedWorkspaceExists
      ? savedWorkspaceId!
      : workspaces[0]?._id;

  if (!workspaceId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-gray-900">
            No workspace found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Create or join a workspace before managing tasks.
          </p>
        </div>
      </div>
    );
  }

  const tasks =
    await getTasks(
      workspaceId,
      accessToken
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Tasks
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your tasks and projects.
          </p>
        </div>

        <div className="shrink-0">
          <AddTaskButton />
        </div>
      </div>

      {/* Task Manager */}
      <TaskManager
        tasks={tasks}
      />
    </div>
  );
}