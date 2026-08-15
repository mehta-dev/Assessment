import { cookies } from "next/headers";

import {
  getActivities,
  getComments,
  getMyWorkspaces,
  getSubtasks,
  getTask,
} from "@/lib/api";

import SubtaskSection from "@/components/SubtaskSection";
import CommentSection from "@/components/CommentSection";
import ActivitySection from "@/components/ActivitySection";
import BackButton from "@/components/BackButton";

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

const ACCESS_TOKEN_COOKIE =
  "accessToken";

const priorityStyles = {
  urgent: "border-red-400 text-red-500",
  high: "border-red-300 text-red-400",
  medium: "border-orange-300 text-orange-400",
  low: "border-gray-300 text-gray-400",
};

const statusLabels = {
  todo: "To Do",
  doing: "Doing",
  completed: "Completed",
  on_hold: "On Hold",
};

export default async function TaskDetailPage({
  params,
}: TaskDetailPageProps) {
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
    throw new Error(
      "No workspace found"
    );
  }

  const [
    task,
    subtasks,
    comments,
    activities,
  ] = await Promise.all([
    getTask(
      id,
      workspaceId,
      accessToken
    ),
    getSubtasks(id),
    getComments(id),
    getActivities(id),
  ]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="text-sm">
          <BackButton
            fallback="/"
            label="Back to Tasks"
          />
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {task.title}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Task details
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Task information */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Task Information
              </h2>
            </div>

            <div className="space-y-6 p-6">
              {/* Description */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  Description
                </h3>

                <p className="text-sm leading-6 text-gray-600">
                  {task.description ||
                    "No description provided."}
                </p>
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-700">
                    Status
                  </h3>

                  <span className="inline-flex rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700">
                    {
                      statusLabels[
                        task.status
                      ]
                    }
                  </span>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-700">
                    Priority
                  </h3>

                  <span
                    className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-medium capitalize ${
                      priorityStyles[
                        task.priority
                      ]
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  Due Date
                </h3>

                <p className="text-sm text-gray-600">
                  {task.dueDate
                    ? new Date(
                        task.dueDate
                      ).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "No due date"}
                </p>
              </div>

              {/* Labels */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  Labels
                </h3>

                {task.labels.length >
                0 ? (
                  <div className="flex flex-wrap gap-2">
                    {task.labels.map(
                      (label) => (
                        <span
                          key={label}
                          className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                        >
                          {label}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    No labels
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Reporter
              </h2>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-3">
                {task.reporter?.avatar ? (
                  <img
                    src={task.reporter.avatar}
                    alt={
                      task.reporter.name ||
                      task.reporter.username ||
                      "Reporter"
                    }
                    className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                    {(
                      task.reporter?.name ||
                      task.reporter?.username ||
                      task.reporter?.email ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {task.reporter?.name ||
                      task.reporter?.username ||
                      task.reporter?.email ||
                      "Unknown user"}
                  </p>

                  <p className="truncate text-sm text-gray-500">
                    {task.reporter?.email ||
                      "No email available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Members
              </h2>
            </div>

            <div className="p-5">
              {task.members.length >
              0 ? (
                <div className="space-y-3">
                  {task.members.map(
                    (member) => {
                      const displayName =
                        member.name ||
                        member.username ||
                        member.email ||
                        "Unknown user";

                      return (
                        <div
                          key={member._id}
                          className="flex items-center gap-3"
                        >
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={displayName}
                              className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                              {displayName
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {displayName}
                            </p>

                            {member.email && (
                              <p className="truncate text-xs text-gray-500">
                                {member.email}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  No members assigned
                </p>
              )}
            </div>
          </div>

          {/* Project */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Project
              </h2>
            </div>

            <div className="p-5">
              {task.project ? (
                <p className="text-sm font-medium text-gray-700">
                  {task.project.name}
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  No project assigned
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtasks */}
      <div className="mt-6">
        <SubtaskSection
          taskId={task._id}
          subtasks={subtasks}
        />
      </div>

      {/* Updates */}
      <div className="mt-6">
        <ActivitySection
          activities={activities}
        />
      </div>

      {/* Comments */}
      <div className="mt-6">
        <CommentSection
          taskId={task._id}
          comments={comments}
        />
      </div>
    </div>
  );
}