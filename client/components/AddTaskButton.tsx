"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createTask,
  getCurrentUser,
  getWorkspaceMembers,
  getMyWorkspaces,
} from "@/lib/api";

import type { User } from "@/types/user";
import type { WorkspaceMember } from "@/lib/api";

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

interface AddTaskButtonProps {
  projectId?: string;
}

export default function AddTaskButton({
  projectId,
}: AddTaskButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [status, setStatus] =
    useState<
      "todo" | "doing" | "completed"
    >("todo");

  const [
    priority,
    setPriority,
  ] = useState<
    "urgent" | "high" | "medium" | "low"
  >("medium");

  const [dueDate, setDueDate] =
    useState("");

  const [
    workspaceMembers,
    setWorkspaceMembers,
  ] = useState<WorkspaceMember[]>(
    []
  );

  const [
    selectedMembers,
    setSelectedMembers,
  ] = useState<string[]>([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(null);

  const [
    loadingMembers,
    setLoadingMembers,
  ] = useState(false);

  const [
    loadingCurrentUser,
    setLoadingCurrentUser,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setSelectedMembers([]);
    setError("");
    setCurrentUser(null);
    setWorkspaceMembers([]);
  };

  const loadWorkspaceMembers =
    async () => {
      try {
        setLoadingMembers(true);
        setError("");

        let workspaceId =
          localStorage.getItem(
            CURRENT_WORKSPACE_KEY
          );

        /*
         * If no workspace has been selected
         * yet, use the first workspace the
         * current user belongs to.
         */
        if (!workspaceId) {
          const workspaces =
            await getMyWorkspaces();

          workspaceId =
            workspaces[0]?._id || "";

          if (workspaceId) {
            localStorage.setItem(
              CURRENT_WORKSPACE_KEY,
              workspaceId
            );
          }
        }

        if (!workspaceId) {
          setWorkspaceMembers([]);
          setError(
            "No workspace is selected. Please select a workspace first."
          );
          return;
        }

        const members =
          await getWorkspaceMembers(
            workspaceId
          );

        setWorkspaceMembers(
          members
        );
      } catch (error) {
        console.error(
          "Failed to load workspace members:",
          error
        );

        setWorkspaceMembers([]);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load workspace members. Please try again."
        );
      } finally {
        setLoadingMembers(false);
      }
    };

  const loadCurrentUser =
    async () => {
      try {
        setLoadingCurrentUser(
          true
        );

        const authenticatedUser =
          await getCurrentUser();

        setCurrentUser(
          authenticatedUser
        );
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error
        );

        setCurrentUser(null);

        setError(
          "Unable to identify the current user. Please log in again."
        );
      } finally {
        setLoadingCurrentUser(
          false
        );
      }
    };

  const openModal = async () => {
    resetForm();
    setIsOpen(true);

    /*
     * Every workspace member is allowed
     * to create a task, but the reporter
     * must be the authenticated user for
     * normal members.
     */
    await Promise.all([
      loadCurrentUser(),
      loadWorkspaceMembers(),
    ]);
  };

  const toggleMember = (
    userId: string
  ) => {
    setSelectedMembers(
      (current) =>
        current.includes(userId)
          ? current.filter(
              (id) =>
                id !== userId
            )
          : [
              ...current,
              userId,
            ]
    );
  };

  const handleCreate =
    async () => {
      if (!title.trim()) {
        setError(
          "Task title is required."
        );
        return;
      }

      if (!currentUser?._id) {
        setError(
          "Unable to identify the current user. Please log in again."
        );
        return;
      }

      const workspaceId =
        localStorage.getItem(
          CURRENT_WORKSPACE_KEY
        );

      if (!workspaceId) {
        setError(
          "No workspace is selected. Please select a workspace first."
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        await createTask(
          {
            title: title.trim(),

            description:
              description.trim(),

            status,

            priority,

            dueDate: dueDate
              ? new Date(
                  dueDate
                ).toISOString()
              : undefined,

            project: projectId,

            /*
             * The authenticated user is
             * always the reporter from the
             * frontend.
             */
            reporter:
              currentUser._id,

            members:
              selectedMembers.length >
              0
                ? selectedMembers
                : undefined,
          },
          workspaceId
        );

        setIsOpen(false);
        resetForm();

        /*
         * Refresh the Server Component so
         * the task list immediately reflects
         * the newly created task.
         */
        router.refresh();
      } catch (error) {
        console.error(
          "Failed to create task:",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "";

        if (
          message
            .toLowerCase()
            .includes(
              "permission"
            ) ||
          message
            .toLowerCase()
            .includes(
              "forbidden"
            ) ||
          message
            .toLowerCase()
            .includes(
              "only workspace"
            )
        ) {
          setError(
            "You do not have permission to create this task."
          );
        } else {
          setError(
            message ||
              "Failed to create task. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };

  const handleClose = () => {
    if (loading) {
      return;
    }

    setIsOpen(false);
    resetForm();
  };

  return (
    <>
      {/* Add Task Button */}
      <button
        type="button"
        onClick={openModal}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Add Task
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-4 w-full max-w-md rounded-lg bg-white p-5 shadow-2xl sm:p-6">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Task
              </h2>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="shrink-0 text-xl text-gray-400 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="Enter task title"
                  disabled={
                    loading ||
                    loadingCurrentUser
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Enter task description"
                  rows={3}
                  disabled={
                    loading ||
                    loadingCurrentUser
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-50"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as
                        | "todo"
                        | "doing"
                        | "completed"
                    )
                  }
                  disabled={
                    loading ||
                    loadingCurrentUser
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none disabled:bg-gray-50"
                >
                  <option value="todo">
                    To Do
                  </option>

                  <option value="doing">
                    Doing
                  </option>

                  <option value="completed">
                    Completed
                  </option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target
                        .value as
                        | "urgent"
                        | "high"
                        | "medium"
                        | "low"
                    )
                  }
                  disabled={
                    loading ||
                    loadingCurrentUser
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none disabled:bg-gray-50"
                >
                  <option value="urgent">
                    Urgent
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="low">
                    Low
                  </option>
                </select>
              </div>

              {/* Members */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Members
                  </label>

                  {selectedMembers.length >
                    0 && (
                    <span className="text-xs text-gray-400">
                      {
                        selectedMembers.length
                      }{" "}
                      selected
                    </span>
                  )}
                </div>

                <div className="max-h-40 overflow-y-auto rounded-md border border-gray-300 p-2">
                  {loadingMembers ? (
                    <p className="px-2 py-3 text-sm text-gray-400">
                      Loading workspace members...
                    </p>
                  ) : workspaceMembers.length ===
                    0 ? (
                    <p className="px-2 py-3 text-sm text-gray-400">
                      No workspace members available.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {workspaceMembers.map(
                        (member) => {
                          const user =
                            member.user;

                          const isSelected =
                            selectedMembers.includes(
                              user._id
                            );

                          const displayName =
                            user.name ||
                            user.username ||
                            user.email ||
                            "Unknown user";

                          return (
                            <label
                              key={
                                user._id
                              }
                              className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition ${
                                isSelected
                                  ? "bg-gray-100"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  isSelected
                                }
                                onChange={() =>
                                  toggleMember(
                                    user._id
                                  )
                                }
                                disabled={
                                  loading ||
                                  loadingCurrentUser
                                }
                                className="h-4 w-4"
                              />

                              <div className="flex min-w-0 items-center gap-2">
                                {user.avatar ? (
                                  <img
                                    src={
                                      user.avatar
                                    }
                                    alt={
                                      displayName
                                    }
                                    className="h-7 w-7 shrink-0 rounded-full border border-gray-200 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                                    {displayName
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-gray-700">
                                    {
                                      displayName
                                    }
                                  </p>

                                  <p className="truncate text-xs text-gray-400">
                                    {
                                      user.email
                                    }
                                  </p>
                                </div>
                              </div>

                              <span className="ml-auto shrink-0 text-[11px] text-gray-400">
                                {
                                  member.role
                                }
                              </span>
                            </label>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(
                      event.target.value
                    )
                  }
                  disabled={
                    loading ||
                    loadingCurrentUser
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none disabled:bg-gray-50"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleCreate
                  }
                  disabled={
                    loading ||
                    loadingMembers ||
                    loadingCurrentUser ||
                    !currentUser
                  }
                  className="w-full rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 sm:w-auto"
                >
                  {loading
                    ? "Creating..."
                    : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}