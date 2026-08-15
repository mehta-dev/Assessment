"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type {
  Task,
  TaskStatus,
} from "@/types/task";

import {
  deleteTask,
  getCurrentUser,
  getWorkspaceMembers,
  getMyWorkspaces,
  updateTask,
} from "@/lib/api";

import type {
  Workspace,
  WorkspaceMember,
} from "@/lib/api";

interface VisibleFields {
  task: boolean;
  priority: boolean;
  members: boolean;
  dueDate: boolean;
  actions: boolean;
}

interface TaskTableProps {
  tasks: Task[];
  visibleFields?: VisibleFields;
}

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

const priorityStyles = {
  urgent: "text-red-500",
  high: "text-red-400",
  medium: "text-orange-400",
  low: "text-gray-400",
};

type WorkspaceRole =
  | "owner"
  | "admin"
  | "member"
  | null;

interface MenuPosition {
  top: number;
  left: number;
}

export default function TaskTable({
  tasks,
  visibleFields = {
    task: true,
    priority: true,
    members: true,
    dueDate: true,
    actions: true,
  },
}: TaskTableProps) {
  const router = useRouter();

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(null);

  const [
    menuPosition,
    setMenuPosition,
  ] = useState<MenuPosition | null>(
    null
  );

  const [
    editingTask,
    setEditingTask,
  ] = useState<Task | null>(null);

  const [
    deletingTaskId,
    setDeletingTaskId,
  ] = useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [
    editTitle,
    setEditTitle,
  ] = useState("");

  const [
    editDescription,
    setEditDescription,
  ] = useState("");

  const [
    editStatus,
    setEditStatus,
  ] = useState<TaskStatus>("todo");

  const [
    editPriority,
    setEditPriority,
  ] = useState<
    "urgent" | "high" | "medium" | "low"
  >("medium");

  const [
    editDueDate,
    setEditDueDate,
  ] = useState("");

  const [
    editMembers,
    setEditMembers,
  ] = useState<string[]>([]);

  const [
    workspaceMembers,
    setWorkspaceMembers,
  ] = useState<WorkspaceMember[]>(
    []
  );

  const [
    loadingMembers,
    setLoadingMembers,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  /*
   * Current authenticated user and
   * workspace role.
   */
  const [
    currentUser,
    setCurrentUser,
  ] = useState<{
    _id: string;
  } | null>(null);

  const [
    workspaceRole,
    setWorkspaceRole,
  ] = useState<WorkspaceRole>(null);

  const [
    loadingPermissions,
    setLoadingPermissions,
  ] = useState(true);

  const [
    permissionError,
    setPermissionError,
  ] = useState("");

  /*
   * Load the current user's role inside
   * the currently selected workspace.
   */
  useEffect(() => {
    const loadPermissions =
      async () => {
        try {
          setLoadingPermissions(
            true
          );
          setPermissionError("");

          const [
            authenticatedUser,
            workspaces,
          ] = await Promise.all([
            getCurrentUser(),
            getMyWorkspaces(),
          ]);

          setCurrentUser({
            _id: authenticatedUser._id,
          });

          const selectedWorkspaceId =
            localStorage.getItem(
              CURRENT_WORKSPACE_KEY
            );

          let workspace: Workspace | undefined =
            workspaces.find(
              (item) =>
                item._id ===
                selectedWorkspaceId
            );

          /*
           * Fall back to the first workspace
           * when the saved selection is missing
           * or invalid.
           */
          if (!workspace) {
            workspace =
              workspaces[0];

            if (workspace) {
              localStorage.setItem(
                CURRENT_WORKSPACE_KEY,
                workspace._id
              );
            }
          }

          if (!workspace) {
            setWorkspaceRole(null);
            return;
          }

          if (
            workspace.owner._id ===
            authenticatedUser._id
          ) {
            setWorkspaceRole(
              "owner"
            );

            return;
          }

          const membership =
            workspace.members.find(
              (member) =>
                member.user._id ===
                authenticatedUser._id
            );

          setWorkspaceRole(
            membership?.role || null
          );
        } catch (error) {
          console.error(
            "Failed to load task permissions:",
            error
          );

          setCurrentUser(null);
          setWorkspaceRole(null);

          setPermissionError(
            "Unable to determine your task permissions."
          );
        } finally {
          setLoadingPermissions(
            false
          );
        }
      };

    loadPermissions();
  }, []);

  /*
   * Owner and admin can modify any task.
   */
  const canManageAllTasks =
    workspaceRole === "owner" ||
    workspaceRole === "admin";

  /*
   * A normal member can modify a task
   * only when they are the reporter or
   * one of its assigned members.
   */
  const canManageTask = (
    task: Task
  ): boolean => {
    if (canManageAllTasks) {
      return true;
    }

    if (
      workspaceRole !==
        "member" ||
      !currentUser
    ) {
      return false;
    }

    const reporterId =
      typeof task.reporter ===
      "string"
        ? task.reporter
        : task.reporter?._id;

    if (
      reporterId ===
      currentUser._id
    ) {
      return true;
    }

    return task.members.some(
      (member) => {
        const memberId =
          typeof member ===
          "string"
            ? member
            : member._id;

        return (
          memberId ===
          currentUser._id
        );
      }
    );
  };

  /*
   * Close menu when pressing Escape
   * or clicking somewhere outside it.
   */
  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      const target =
        event.target as HTMLElement;

      if (
        !target.closest(
          "[data-task-action-menu]"
        ) &&
        !target.closest(
          "[data-task-action-button]"
        )
      ) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [openMenuId]);

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const handleActionMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    taskId: string
  ) => {
    event.stopPropagation();

    if (openMenuId === taskId) {
      closeMenu();
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 150;

    /*
     * The menu is slightly smaller when
     * the current user cannot manage the task.
     */
    const activeTask =
      tasks.find(
        (task) =>
          task._id === taskId
      );

    const menuHeight =
      activeTask &&
      canManageTask(activeTask)
        ? 130
        : 45;

    let left =
      rect.right -
      menuWidth;

    let top =
      rect.bottom + 6;

    /*
     * Prevent menu from going outside
     * the viewport.
     */
    if (left < 8) {
      left = 8;
    }

    if (
      left + menuWidth >
      window.innerWidth - 8
    ) {
      left =
        window.innerWidth -
        menuWidth -
        8;
    }

    /*
     * If there isn't enough room below
     * the button, show the menu above it.
     */
    if (
      top + menuHeight >
      window.innerHeight - 8
    ) {
      top =
        rect.top -
        menuHeight -
        6;
    }

    if (top < 8) {
      top = 8;
    }

    setMenuPosition({
      top,
      left,
    });

    setOpenMenuId(taskId);
  };

  const loadWorkspaceMembers =
    async () => {
      try {
        setLoadingMembers(true);
        setActionError("");

        let workspaceId =
          localStorage.getItem(
            CURRENT_WORKSPACE_KEY
          );

        /*
         * If no workspace is selected,
         * use the first workspace available
         * to the authenticated user.
         */
        if (!workspaceId) {
          const workspaces =
            await getMyWorkspaces();

          workspaceId =
            workspaces[0]?._id ||
            "";

          if (workspaceId) {
            localStorage.setItem(
              CURRENT_WORKSPACE_KEY,
              workspaceId
            );
          }
        }

        if (!workspaceId) {
          setWorkspaceMembers([]);

          setActionError(
            "No workspace is selected."
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

        setActionError(
          error instanceof Error
            ? error.message
            : "Failed to load workspace members. Please try again."
        );
      } finally {
        setLoadingMembers(false);
      }
    };

  const handleEditClick =
    async (
      task: Task
    ) => {
      setActionError("");

      if (
        !canManageTask(task)
      ) {
        setActionError(
          "You do not have permission to edit this task."
        );

        closeMenu();

        return;
      }

      setEditTitle(task.title);

      setEditDescription(
        task.description || ""
      );

      setEditStatus(task.status);

      setEditPriority(
        task.priority
      );

      /*
       * Convert the currently assigned
       * members into their IDs.
       */
      setEditMembers(
        task.members.map(
          (member) =>
            typeof member ===
            "string"
              ? member
              : member._id
        )
      );

      if (task.dueDate) {
        const date = new Date(
          task.dueDate
        );

        const year =
          date.getFullYear();

        const month = String(
          date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
          date.getDate()
        ).padStart(2, "0");

        setEditDueDate(
          `${year}-${month}-${day}`
        );
      } else {
        setEditDueDate("");
      }

      setEditingTask(task);

      closeMenu();

      await loadWorkspaceMembers();
    };

  const toggleEditMember = (
    userId: string
  ) => {
    setEditMembers(
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

  const handleSaveEdit =
    async () => {
      if (!editingTask) {
        return;
      }

      if (
        !canManageTask(
          editingTask
        )
      ) {
        setActionError(
          "You do not have permission to edit this task."
        );

        return;
      }

      if (!editTitle.trim()) {
        setActionError(
          "Task title is required."
        );

        return;
      }

      const workspaceId =
        localStorage.getItem(
          CURRENT_WORKSPACE_KEY
        );

      if (!workspaceId) {
        setActionError(
          "No workspace is selected. Please select a workspace first."
        );

        return;
      }

      try {
        setSaving(true);
        setActionError("");

        await updateTask(
          editingTask._id,
          {
            title:
              editTitle.trim(),

            description:
              editDescription.trim(),

            status:
              editStatus,

            priority:
              editPriority,

            members:
              editMembers,

            ...(editDueDate
              ? {
                  dueDate:
                    new Date(
                      editDueDate
                    ).toISOString(),
                }
              : {}),
          },
          workspaceId
        );

        setEditingTask(null);
        setEditMembers([]);

        router.refresh();
      } catch (error) {
        console.error(
          "Failed to update task:",
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
            )
        ) {
          setActionError(
            "You do not have permission to edit this task."
          );
        } else {
          setActionError(
            message ||
              "Failed to update task. Please try again."
          );
        }
      } finally {
        setSaving(false);
      }
    };

  const handleDeleteClick = (
    task: Task
  ) => {
    setActionError("");

    if (
      !canManageTask(task)
    ) {
      setActionError(
        "You do not have permission to delete this task."
      );

      closeMenu();

      return;
    }

    setDeletingTaskId(
      task._id
    );

    closeMenu();
  };

  const handleDeleteConfirm =
    async () => {
      if (!deletingTaskId) {
        return;
      }

      const taskToDelete =
        tasks.find(
          (task) =>
            task._id ===
            deletingTaskId
        );

      if (
        !taskToDelete ||
        !canManageTask(
          taskToDelete
        )
      ) {
        setActionError(
          "You do not have permission to delete this task."
        );

        return;
      }

      const workspaceId =
        localStorage.getItem(
          CURRENT_WORKSPACE_KEY
        );

      if (!workspaceId) {
        setActionError(
          "No workspace is selected. Please select a workspace first."
        );

        return;
      }

      try {
        setSaving(true);
        setActionError("");

        await deleteTask(
          deletingTaskId,
          workspaceId
        );

        setDeletingTaskId(
          null
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Failed to delete task:",
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
            )
        ) {
          setActionError(
            "You do not have permission to delete this task."
          );
        } else {
          setActionError(
            message ||
              "Failed to delete task. Please try again."
          );
        }
      } finally {
        setSaving(false);
      }
    };

  const todoTasks =
    tasks.filter(
      (task) =>
        task.status === "todo"
    );

  const doingTasks =
    tasks.filter(
      (task) =>
        task.status === "doing"
    );

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "completed"
    );

  const sections = [
    {
      title: "To Do",
      tasks: todoTasks,
    },
    {
      title: "Doing",
      tasks: doingTasks,
    },
    {
      title: "Completed",
      tasks: completedTasks,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {sections.map(
          (section) => (
            <div
              key={section.title}
              className="min-w-0"
            >
              {/* Section Header */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-gray-500">
                  ˅
                </span>

                <h2 className="text-xl font-medium text-gray-900">
                  {section.title}
                </h2>

                <span className="text-sm text-gray-400">
                  {
                    section.tasks
                      .length
                  }
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[700px] border-collapse text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      {visibleFields.task && (
                        <th className="px-4 py-3 font-medium">
                          Task
                        </th>
                      )}

                      {visibleFields.priority && (
                        <th className="px-4 py-3 font-medium">
                          Priority
                        </th>
                      )}

                      {visibleFields.members && (
                        <th className="px-4 py-3 font-medium">
                          Members
                        </th>
                      )}

                      {visibleFields.dueDate && (
                        <th className="px-4 py-3 font-medium">
                          Due Date
                        </th>
                      )}

                      {visibleFields.actions && (
                        <th className="px-4 py-3 text-right font-medium">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {section.tasks
                      .length > 0 ? (
                      section.tasks.map(
                        (task) => (
                          <tr
                            key={
                              task._id
                            }
                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                          >
                            {/* Task */}
                            {visibleFields.task && (
                              <td className="max-w-[260px] px-4 py-3 font-medium text-gray-900">
                                <Link
                                  href={`/tasks/${task._id}`}
                                  className="block truncate hover:underline"
                                >
                                  {
                                    task.title
                                  }
                                </Link>
                              </td>
                            )}

                            {/* Priority */}
                            {visibleFields.priority && (
                              <td
                                className={`px-4 py-3 font-medium capitalize ${
                                  priorityStyles[
                                    task.priority
                                  ]
                                }`}
                              >
                                {
                                  task.priority
                                }
                              </td>
                            )}

                            {/* Members */}
                            {visibleFields.members && (
                              <td className="px-4 py-3">
                                {task
                                  .members
                                  .length >
                                0 ? (
                                  <div className="flex items-center">
                                    {task.members
                                      .slice(
                                        0,
                                        4
                                      )
                                      .map(
                                        (
                                          member,
                                          index
                                        ) => {
                                          const displayName =
                                            typeof member ===
                                            "string"
                                              ? member
                                              : member.name ||
                                                member.username ||
                                                member.email ||
                                                "User";

                                          return (
                                            <div
                                              key={
                                                typeof member ===
                                                "string"
                                                  ? member
                                                  : member._id
                                              }
                                              title={
                                                displayName
                                              }
                                              className={`relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-200 text-xs font-medium text-gray-600 ${
                                                index >
                                                0
                                                  ? "-ml-2"
                                                  : ""
                                              }`}
                                            >
                                              {typeof member !==
                                                "string" &&
                                              member.avatar ? (
                                                <img
                                                  src={
                                                    member.avatar
                                                  }
                                                  alt={
                                                    displayName
                                                  }
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                displayName
                                                  .charAt(
                                                    0
                                                  )
                                                  .toUpperCase()
                                              )}
                                            </div>
                                          );
                                        }
                                      )}

                                    {task
                                      .members
                                      .length >
                                      4 && (
                                      <span className="ml-2 text-xs text-gray-500">
                                        +
                                        {task
                                          .members
                                          .length -
                                          4}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">
                                    —
                                  </span>
                                )}
                              </td>
                            )}

                            {/* Due Date */}
                            {visibleFields.dueDate && (
                              <td className="px-4 py-3 text-gray-500">
                                {task.dueDate
                                  ? new Date(
                                      task.dueDate
                                    ).toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month:
                                          "short",
                                        year: "numeric",
                                      }
                                    )
                                  : "—"}
                              </td>
                            )}

                            {/* Actions */}
                            {visibleFields.actions && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  data-task-action-button
                                  aria-label={`Actions for ${task.title}`}
                                  onClick={(
                                    event
                                  ) =>
                                    handleActionMenu(
                                      event,
                                      task._id
                                    )
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-gray-400 transition hover:border-gray-300 hover:bg-white hover:text-gray-700"
                                >
                                  <span className="text-lg leading-none">
                                    •••
                                  </span>
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={
                            Object.values(
                              visibleFields
                            ).filter(
                              Boolean
                            ).length
                          }
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          No tasks
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Permission status */}
      {permissionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            {permissionError}
          </p>
        </div>
      )}

      {/* Floating action menu */}
      {openMenuId &&
        menuPosition &&
        (() => {
          const activeTask =
            tasks.find(
              (task) =>
                task._id ===
                openMenuId
            );

          if (!activeTask) {
            return null;
          }

          const canManage =
            canManageTask(
              activeTask
            );

          return (
            <div
              data-task-action-menu
              className="fixed z-[9999] w-40 overflow-hidden rounded-md border border-gray-200 bg-white py-1 text-left shadow-xl"
              style={{
                top:
                  menuPosition.top,
                left:
                  menuPosition.left,
              }}
            >
              <Link
                href={`/tasks/${activeTask._id}`}
                onClick={
                  closeMenu
                }
                className="block w-full px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                View details
              </Link>

              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleEditClick(
                        activeTask
                      )
                    }
                    className="block w-full px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    Edit task
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteClick(
                        activeTask
                      )
                    }
                    className="block w-full px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Delete task
                  </button>
                </>
              )}
            </div>
          );
        })()}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-4 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Task
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update the task details.
              </p>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>

                <input
                  type="text"
                  value={
                    editTitle
                  }
                  onChange={(
                    event
                  ) =>
                    setEditTitle(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={
                    editDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setEditDescription(
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  value={
                    editStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setEditStatus(
                      event.target
                        .value as TaskStatus
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
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

                  <option value="on_hold">
                    On Hold
                  </option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority
                </label>

                <select
                  value={
                    editPriority
                  }
                  onChange={(
                    event
                  ) =>
                    setEditPriority(
                      event.target
                        .value as
                        | "urgent"
                        | "high"
                        | "medium"
                        | "low"
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
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

                  {editMembers.length >
                    0 && (
                    <span className="text-xs text-gray-400">
                      {
                        editMembers.length
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
                        (
                          member
                        ) => {
                          const user =
                            member.user;

                          const isSelected =
                            editMembers.includes(
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
                                  toggleEditMember(
                                    user._id
                                  )
                                }
                                disabled={
                                  saving ||
                                  loadingMembers
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

                                  {user.email && (
                                    <p className="truncate text-xs text-gray-400">
                                      {
                                        user.email
                                      }
                                    </p>
                                  )}
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
                  value={
                    editDueDate
                  }
                  onChange={(
                    event
                  ) =>
                    setEditDueDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
                />
              </div>

              {actionError && (
                <p className="text-sm text-red-600">
                  {actionError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() => {
                    setEditingTask(
                      null
                    );

                    setEditMembers(
                      []
                    );

                    setActionError(
                      ""
                    );
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    loadingMembers
                  }
                  onClick={
                    handleSaveEdit
                  }
                  className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingTaskId && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Delete Task?
            </h2>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              This action cannot be
              undone. Are you sure
              you want to delete this
              task?
            </p>

            {actionError && (
              <p className="mt-3 text-sm text-red-600">
                {actionError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setDeletingTaskId(
                    null
                  );

                  setActionError(
                    ""
                  );
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={
                  handleDeleteConfirm
                }
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving
                  ? "Deleting..."
                  : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}