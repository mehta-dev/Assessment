"use client";

import { useMemo, useState } from "react";

import type { Task } from "@/types/task";

import TaskTable from "@/components/TaskTable";
import TaskToolbar from "@/components/TaskToolbar";
import TaskBoard from "@/components/TaskBoard";

interface TaskManagerProps {
  tasks: Task[];
}

type StatusFilter =
  | "all"
  | "todo"
  | "doing"
  | "completed";

type PriorityFilter =
  | "all"
  | "urgent"
  | "high"
  | "medium"
  | "low";

interface VisibleFields {
  task: boolean;
  priority: boolean;
  members: boolean;
  dueDate: boolean;
  actions: boolean;
}

type OpenPanel =
  | "filter"
  | "fields"
  | null;

export default function TaskManager({
  tasks,
}: TaskManagerProps) {
  const [view, setView] = useState<
    "list" | "board"
  >("list");

  const [search, setSearch] =
    useState("");

  /*
   * Only one panel can be open at a time.
   */
  const [openPanel, setOpenPanel] =
    useState<OpenPanel>(null);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState<PriorityFilter>("all");

  const [
    visibleFields,
    setVisibleFields,
  ] = useState<VisibleFields>({
    task: true,
    priority: true,
    members: true,
    dueDate: true,
    actions: true,
  });

  /*
   * Search + Status + Priority
   */
  const filteredTasks = useMemo(() => {
    let result = tasks;

    const query =
      search.toLowerCase().trim();

    // Search
    if (query) {
      result = result.filter(
        (task) => {
          return (
            task.title
              .toLowerCase()
              .includes(query) ||
            task.description
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }

    // Status
    if (statusFilter !== "all") {
      result = result.filter(
        (task) =>
          task.status ===
          statusFilter
      );
    }

    // Priority
    if (priorityFilter !== "all") {
      result = result.filter(
        (task) =>
          task.priority ===
          priorityFilter
      );
    }

    return result;
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
  ]);

  /*
   * Open / close panels.
   */
  const togglePanel = (
    panel: "filter" | "fields"
  ) => {
    setOpenPanel((current) =>
      current === panel
        ? null
        : panel
    );
  };

  /*
   * Toggle visible table field.
   */
  const toggleField = (
    field: keyof VisibleFields
  ) => {
    setVisibleFields((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  /*
   * Reset all visible fields.
   */
  const resetFields = () => {
    setVisibleFields({
      task: true,
      priority: true,
      members: true,
      dueDate: true,
      actions: true,
    });
  };

  /*
   * Clear filters.
   */
  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  /*
   * Change view.
   *
   * Unlike before, the Fields panel
   * stays open so the user can see
   * which view is currently selected.
   */
  const changeView = (
    newView: "list" | "board"
  ) => {
    setView(newView);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="relative z-50 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="w-full min-w-0 sm:flex-1">
          <TaskToolbar
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        {/* Controls */}
        <div className="relative flex w-full items-center justify-start gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {/* Fields */}
          <button
            type="button"
            onClick={() =>
              togglePanel("fields")
            }
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
              openPanel === "fields"
                ? "border-gray-300 bg-gray-100 text-gray-900"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="text-gray-500">
              ▦
            </span>

            Fields
          </button>

          {/* Filter */}
          <button
            type="button"
            onClick={() =>
              togglePanel("filter")
            }
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
              openPanel === "filter" ||
              statusFilter !== "all" ||
              priorityFilter !== "all"
                ? "border-gray-300 bg-gray-100 text-gray-900"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="text-gray-500">
              ▾
            </span>

            Filter
          </button>

          {/* Filter Panel */}
          {openPanel === "filter" && (
            <div className="absolute right-0 top-11 z-[100] w-[calc(100vw-2rem)] max-w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Filters
                </h3>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Clear all
                </button>
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                >
                  <option value="all">
                    All statuses
                  </option>

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
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Priority
                </label>

                <select
                  value={
                    priorityFilter
                  }
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target
                        .value as PriorityFilter
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                >
                  <option value="all">
                    All priorities
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
            </div>
          )}

          {/* Fields Panel */}
          {openPanel === "fields" && (
            <div className="absolute right-0 top-11 z-[100] w-[calc(100vw-2rem)] max-w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
              {/* View switcher */}
              <div className="mb-3 rounded-md border border-gray-200 p-1">
                <div className="grid grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      changeView(
                        "list"
                      )
                    }
                    className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                      view === "list"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    List
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      changeView(
                        "board"
                      )
                    }
                    className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                      view === "board"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Board
                  </button>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Fields
                </h3>

                <button
                  type="button"
                  onClick={
                    resetFields
                  }
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-1">
                {/* Task */}
                <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50">
                  <span className="text-sm text-gray-700">
                    Task
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      visibleFields.task
                    }
                    onChange={() =>
                      toggleField(
                        "task"
                      )
                    }
                    className="h-4 w-4"
                  />
                </label>

                {/* Priority */}
                <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50">
                  <span className="text-sm text-gray-700">
                    Priority
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      visibleFields.priority
                    }
                    onChange={() =>
                      toggleField(
                        "priority"
                      )
                    }
                    className="h-4 w-4"
                  />
                </label>

                {/* Members */}
                <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50">
                  <span className="text-sm text-gray-700">
                    Members
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      visibleFields.members
                    }
                    onChange={() =>
                      toggleField(
                        "members"
                      )
                    }
                    className="h-4 w-4"
                  />
                </label>

                {/* Due Date */}
                <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50">
                  <span className="text-sm text-gray-700">
                    Due Date
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      visibleFields.dueDate
                    }
                    onChange={() =>
                      toggleField(
                        "dueDate"
                      )
                    }
                    className="h-4 w-4"
                  />
                </label>

                {/* Actions */}
                <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-gray-50">
                  <span className="text-sm text-gray-700">
                    Actions
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      visibleFields.actions
                    }
                    onChange={() =>
                      toggleField(
                        "actions"
                      )
                    }
                    className="h-4 w-4"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task View */}
      {view === "list" ? (
        <TaskTable
          tasks={filteredTasks}
          visibleFields={
            visibleFields
          }
        />
      ) : (
        <TaskBoard
          tasks={filteredTasks}
        />
      )}
    </>
  );
}