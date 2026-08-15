"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import {
  createSubtask,
  deleteSubtask,
  updateSubtask,
} from "@/lib/api";

import type {
  Subtask,
  SubtaskPriority,
  SubtaskStatus,
} from "@/types/subtask";

interface SubtaskSectionProps {
  taskId: string;
  subtasks: Subtask[];
}

interface MenuPosition {
  top: number;
  left: number;
}

const priorityStyles: Record<
  SubtaskPriority,
  string
> = {
  none: "text-gray-400",
  urgent: "text-red-500",
  high: "text-red-400",
  medium: "text-orange-400",
  low: "text-gray-400",
};

const statusLabels: Record<
  SubtaskStatus,
  string
> = {
  todo: "To Do",
  doing: "Doing",
  completed: "Completed",
};

const MENU_WIDTH = 140;
const MENU_HEIGHT = 90;
const MENU_GAP = 6;

export default function SubtaskSection({
  taskId,
  subtasks,
}: SubtaskSectionProps) {
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] =
    useState(false);

  const [editingSubtask, setEditingSubtask] =
    useState<Subtask | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [menuPosition, setMenuPosition] =
    useState<MenuPosition | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState<SubtaskStatus>("todo");

  const [priority, setPriority] =
    useState<SubtaskPriority>("medium");

  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * Close action menu when clicking outside
   * or pressing Escape.
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
        target.closest(
          "[data-subtask-action-menu]"
        ) ||
        target.closest(
          "[data-subtask-action-button]"
        )
      ) {
        return;
      }

      setOpenMenuId(null);
      setMenuPosition(null);
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

  /*
   * Recalculate menu position while scrolling
   * or resizing.
   */
  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    const updateMenuPosition = () => {
      const button = document.querySelector(
        `[data-subtask-action-button="${openMenuId}"]`
      ) as HTMLElement | null;

      if (!button) {
        return;
      }

      const rect =
        button.getBoundingClientRect();

      let left =
        rect.right - MENU_WIDTH;

      if (left < 8) {
        left = 8;
      }

      if (
        left + MENU_WIDTH >
        window.innerWidth - 8
      ) {
        left =
          window.innerWidth -
          MENU_WIDTH -
          8;
      }

      let top =
        rect.bottom + MENU_GAP;

      /*
       * If there isn't enough room below,
       * put the menu above the button.
       */
      if (
        top + MENU_HEIGHT >
        window.innerHeight - 8
      ) {
        top =
          rect.top -
          MENU_HEIGHT -
          MENU_GAP;
      }

      if (top < 8) {
        top = 8;
      }

      setMenuPosition({
        top,
        left,
      });
    };

    updateMenuPosition();

    window.addEventListener(
      "scroll",
      updateMenuPosition,
      true
    );

    window.addEventListener(
      "resize",
      updateMenuPosition
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updateMenuPosition,
        true
      );

      window.removeEventListener(
        "resize",
        updateMenuPosition
      );
    };
  }, [openMenuId]);

  /*
   * Toggle the subtask action menu.
   */
  const handleActionMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    subtaskId: string
  ) => {
    event.stopPropagation();

    if (openMenuId === subtaskId) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    let left =
      rect.right - MENU_WIDTH;

    if (left < 8) {
      left = 8;
    }

    if (
      left + MENU_WIDTH >
      window.innerWidth - 8
    ) {
      left =
        window.innerWidth -
        MENU_WIDTH -
        8;
    }

    let top =
      rect.bottom + MENU_GAP;

    if (
      top + MENU_HEIGHT >
      window.innerHeight - 8
    ) {
      top =
        rect.top -
        MENU_HEIGHT -
        MENU_GAP;
    }

    if (top < 8) {
      top = 8;
    }

    setMenuPosition({
      top,
      left,
    });

    setOpenMenuId(subtaskId);
  };

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setError("");
  };

  const openAddModal = () => {
    resetForm();
    setEditingSubtask(null);
    setIsAddOpen(true);
  };

  const closeModal = () => {
    if (loading) {
      return;
    }

    setIsAddOpen(false);
    setEditingSubtask(null);
    resetForm();
  };

  const openEditModal = (
    subtask: Subtask
  ) => {
    setError("");

    setTitle(subtask.title);

    setDescription(
      subtask.description || ""
    );

    setStatus(subtask.status);
    setPriority(subtask.priority);

    setDueDate(
      subtask.dueDate
        ? new Date(subtask.dueDate)
            .toISOString()
            .split("T")[0]
        : ""
    );

    setEditingSubtask(subtask);
    closeMenu();
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError(
        "Subtask title is required."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createSubtask({
        title: title.trim(),
        description:
          description.trim(),
        task: taskId,
        status,
        priority,
        ...(dueDate
          ? {
              dueDate: new Date(
                dueDate
              ).toISOString(),
            }
          : {}),
      });

      setIsAddOpen(false);
      resetForm();

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to create subtask:",
        error
      );

      setError(
        "Failed to create subtask. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSubtask) {
      return;
    }

    if (!title.trim()) {
      setError(
        "Subtask title is required."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateSubtask(
        editingSubtask._id,
        {
          title: title.trim(),
          description:
            description.trim(),
          status,
          priority,
          ...(dueDate
            ? {
                dueDate: new Date(
                  dueDate
                ).toISOString(),
              }
            : {}),
        }
      );

      setEditingSubtask(null);
      resetForm();

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to update subtask:",
        error
      );

      setError(
        "Failed to update subtask. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    subtask: Subtask
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${subtask.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await deleteSubtask(subtask._id);

      closeMenu();

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to delete subtask:",
        error
      );

      setError(
        "Failed to delete subtask. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isModalOpen =
    isAddOpen ||
    editingSubtask !== null;

  const activeSubtask = openMenuId
    ? subtasks.find(
        (subtask) =>
          subtask._id === openMenuId
      )
    : null;

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Subtasks
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              {subtasks.length} subtask
              {subtasks.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Add Subtask
          </button>
        </div>

        {/* Error */}
        {error && !isModalOpen && (
          <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        {subtasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">
                    Task
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Priority
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Members
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Due Date
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {subtasks.map((subtask) => {
                  const assignee =
                    typeof subtask.assignee ===
                    "object"
                      ? subtask.assignee
                      : null;

                  return (
                    <tr
                      key={subtask._id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {subtask.title}
                          </p>

                          {subtask.description && (
                            <p className="mt-1 max-w-sm truncate text-xs text-gray-400">
                              {
                                subtask.description
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      <td
                        className={`px-4 py-3 font-medium capitalize ${
                          priorityStyles[
                            subtask.priority
                          ]
                        }`}
                      >
                        {subtask.priority ===
                        "none"
                          ? "—"
                          : subtask.priority}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {statusLabels[
                          subtask.status
                        ]}
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {assignee
                          ? assignee.username ||
                            assignee.name ||
                            assignee.email ||
                            "Member"
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {subtask.dueDate
                          ? new Date(
                              subtask.dueDate
                            ).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          data-subtask-action-button
                          aria-label={`Actions for ${subtask.title}`}
                          onClick={(event) =>
                            handleActionMenuClick(
                              event,
                              subtask._id
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-lg font-bold tracking-widest text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                          •••
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">
              No subtasks yet.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="mt-2 text-sm font-medium text-gray-700 hover:text-black"
            >
              + Add your first subtask
            </button>
          </div>
        )}
      </div>

      {/* Floating Subtask Action Menu */}
      {openMenuId &&
        activeSubtask &&
        menuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-subtask-action-menu
            className="fixed z-[9999] w-36 overflow-hidden rounded-md border border-gray-200 bg-white py-1 text-left shadow-xl"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <button
              type="button"
              onClick={() =>
                openEditModal(
                  activeSubtask
                )
              }
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                handleDelete(
                  activeSubtask
                )
              }
              disabled={loading}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>,
          document.body
        )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingSubtask
                    ? "Edit Subtask"
                    : "Add Subtask"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingSubtask
                    ? "Update the subtask."
                    : "Create a subtask for this task."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="text-xl text-gray-400 hover:text-gray-700 disabled:opacity-50"
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
                  placeholder="Enter subtask title"
                  disabled={loading}
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
                  placeholder="Enter description"
                  rows={3}
                  disabled={loading}
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
                        .value as SubtaskStatus
                    )
                  }
                  disabled={loading}
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
                        .value as SubtaskPriority
                    )
                  }
                  disabled={loading}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none disabled:bg-gray-50"
                >
                  <option value="none">
                    No Priority
                  </option>

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
                  disabled={loading}
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
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    editingSubtask
                      ? handleUpdate
                      : handleCreate
                  }
                  disabled={loading}
                  className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingSubtask
                    ? "Save Changes"
                    : "Create Subtask"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}