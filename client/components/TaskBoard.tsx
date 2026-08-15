"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/types/task";
import { updateTask } from "@/lib/api";

interface TaskBoardProps {
  tasks: Task[];
}

const priorityStyles = {
  urgent: "border-red-400 text-red-500",
  high: "border-red-300 text-red-400",
  medium: "border-orange-300 text-orange-400",
  low: "border-gray-300 text-gray-400",
};

const columns = [
  {
    title: "To Do",
    status: "todo" as const,
  },
  {
    title: "Doing",
    status: "doing" as const,
  },
  {
    title: "Completed",
    status: "completed" as const,
  },
];

export default function TaskBoard({
  tasks,
}: TaskBoardProps) {
  const router = useRouter();

  const [draggedTaskId, setDraggedTaskId] =
    useState<string | null>(null);

  const [loadingTaskId, setLoadingTaskId] =
    useState<string | null>(null);

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    taskId: string
  ) => {
    setDraggedTaskId(taskId);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    newStatus: "todo" | "doing" | "completed"
  ) => {
    event.preventDefault();

    const taskId =
      event.dataTransfer.getData("text/plain") ||
      draggedTaskId;

    if (!taskId) {
      return;
    }

    const task = tasks.find(
      (item) => item._id === taskId
    );

    if (!task) {
      return;
    }

    // Task is already in this column.
    if (task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    try {
      setLoadingTaskId(taskId);

      await updateTask(taskId, {
        status: newStatus,
      });

      // Refresh server data without doing a full
      // browser reload. This keeps the current
      // List / Board view.
      router.refresh();
    } catch (error) {
      console.error(
        "Failed to update task status:",
        error
      );

      alert(
        "Failed to update task status. Please try again."
      );
    } finally {
      setLoadingTaskId(null);
      setDraggedTaskId(null);
    }
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[820px] grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter(
            (task) =>
              task.status === column.status
          );

          return (
            <div
              key={column.status}
              onDragOver={handleDragOver}
              onDrop={(event) =>
                handleDrop(
                  event,
                  column.status
                )
              }
              className={`min-h-[400px] rounded-lg border border-gray-200 bg-gray-50 p-4 transition ${
                draggedTaskId
                  ? "border-dashed border-gray-300"
                  : ""
              }`}
            >
              {/* Column Header */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {column.title}
                </h2>

                <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-500">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {columnTasks.length > 0 ? (
                  columnTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(event) =>
                        handleDragStart(
                          event,
                          task._id
                        )
                      }
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md active:cursor-grabbing ${
                        draggedTaskId ===
                        task._id
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      {/* Task Title */}
                      <h3 className="break-words font-medium text-gray-900">
                        {task.title}
                      </h3>

                      {/* Description */}
                      {task.description && (
                        <p className="mt-2 line-clamp-2 break-words text-sm text-gray-500">
                          {task.description}
                        </p>
                      )}

                      {/* Task Information */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`rounded border px-2 py-1 text-xs font-medium capitalize ${
                            priorityStyles[
                              task.priority
                            ]
                          }`}
                        >
                          {task.priority}
                        </span>

                        {task.dueDate && (
                          <span className="text-xs text-gray-400">
                            {new Date(
                              task.dueDate
                            ).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        )}
                      </div>

                      {/* Updating Indicator */}
                      {loadingTaskId ===
                        task._id && (
                        <p className="mt-3 text-xs text-gray-400">
                          Updating...
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-400">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}