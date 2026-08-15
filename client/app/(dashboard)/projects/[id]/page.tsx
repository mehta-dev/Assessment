import Link from "next/link";
import { cookies } from "next/headers";

import {
  getMyWorkspaces,
  getProject,
  getProjectTasks,
} from "@/lib/api";

import TaskTable from "@/components/TaskTable";
import AddTaskButton from "@/components/AddTaskButton";
import BackButton from "@/components/BackButton";

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

const ACCESS_TOKEN_COOKIE =
  "accessToken";

const priorityStyles = {
  none: "border-gray-300 text-gray-400",
  urgent: "border-red-400 text-red-500",
  high: "border-red-300 text-red-400",
  medium: "border-orange-300 text-orange-400",
  low: "border-gray-300 text-gray-400",
};

function getUserName(
  user:
    | string
    | {
        name?: string;
        username?: string;
        email?: string;
      }
    | undefined
) {
  if (!user) {
    return "Unknown";
  }

  if (typeof user === "string") {
    return user;
  }

  return (
    user.name ||
    user.username ||
    user.email ||
    "Unknown"
  );
}

function formatDate(date?: string) {
  if (!date) {
    return "No due date";
  }

  return new Date(
    date
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;

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

  /*
   * Get the workspaces belonging to
   * the authenticated user.
   */
  const workspaces =
    await getMyWorkspaces(
      accessToken
    );

  /*
   * Use the selected workspace when it
   * still belongs to the current user.
   * Otherwise use the first available one.
   */
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
    throw new Error(
      "No workspace found"
    );
  }

  const [project, tasks] =
    await Promise.all([
      getProject(
        id,
        workspaceId,
        accessToken
      ),

      getProjectTasks(
        id,
        workspaceId,
        accessToken
      ),
    ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
          <Link
            href="/projects"
            className="hover:text-gray-700"
          >
            Projects
          </Link>

          <span>›</span>

          <span className="max-w-full truncate text-gray-600">
            {project.name}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-gray-900">
            {project.name}
          </h1>

          <p className="mt-1 break-words text-sm text-gray-500">
            {project.description ||
              "No project description."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <BackButton
            fallback="/projects"
            label="Back"
          />
        </div>
      </div>

      {/* Project properties */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Priority
          </p>

          <div className="mt-3">
            <span
              className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-medium capitalize ${
                priorityStyles[
                  project.priority
                ]
              }`}
            >
              {project.priority ===
              "none"
                ? "No Priority"
                : project.priority}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Lead
          </p>

          <p className="mt-3 break-words text-sm font-medium text-gray-900">
            {getUserName(
              project.lead
            )}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Due Date
          </p>

          <p className="mt-3 text-sm text-gray-700">
            {formatDate(
              project.dueDate
            )}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Tasks
          </p>

          <p className="mt-3 text-sm font-medium text-gray-900">
            {tasks.length}
          </p>
        </div>
      </div>

      {/* Tasks */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">
              Tasks
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Tasks belonging to this project
            </p>
          </div>

          {/* Project-aware Add Task */}
          <AddTaskButton
            projectId={project._id}
          />
        </div>

        <div className="p-4 sm:p-6">
          <TaskTable
            tasks={tasks}
          />
        </div>
      </div>
    </div>
  );
}