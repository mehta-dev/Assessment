"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteProject,
} from "@/lib/api";

import type {
  Project,
  ProjectPriority,
} from "@/types/project";

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
}

interface MenuPosition {
  top: number;
  left: number;
}

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

const priorityStyles: Record<
  ProjectPriority,
  string
> = {
  none: "text-gray-400",
  urgent: "text-red-500",
  high: "text-red-400",
  medium: "text-orange-400",
  low: "text-gray-400",
};

function getUserName(
  user: Project["lead"]
): string {
  if (
    typeof user === "string"
  ) {
    return user;
  }

  return (
    user?.name ||
    user?.username ||
    user?.email ||
    "Unknown"
  );
}

function formatDate(
  date?: string
): string {
  if (!date) {
    return "—";
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

export default function ProjectTable({
  projects,
  onEdit,
}: ProjectTableProps) {
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
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

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
          "[data-project-action-menu]"
        ) &&
        !target.closest(
          "[data-project-action-button]"
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

    const handleViewportChange =
      () => {
        if (!openMenuId) {
          return;
        }

        const button =
          document.querySelector(
            `[data-project-action-button="${openMenuId}"]`
          ) as HTMLElement | null;

        if (!button) {
          return;
        }

        const rect =
          button.getBoundingClientRect();

        const menuWidth = 150;
        const menuHeight = 120;

        let left =
          rect.right - menuWidth;

        let top =
          rect.bottom + 6;

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
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    window.addEventListener(
      "resize",
      handleViewportChange
    );

    window.addEventListener(
      "scroll",
      handleViewportChange,
      true
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

      window.removeEventListener(
        "resize",
        handleViewportChange
      );

      window.removeEventListener(
        "scroll",
        handleViewportChange,
        true
      );
    };
  }, [openMenuId]);

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const handleActionMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    projectId: string
  ) => {
    event.stopPropagation();

    if (openMenuId === projectId) {
      closeMenu();
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 150;
    const menuHeight = 120;

    let left =
      rect.right - menuWidth;

    let top =
      rect.bottom + 6;

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

    setOpenMenuId(projectId);
  };

  const handleDelete = async (
    project: Project
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${project.name}"?`
      );

    if (!confirmed) {
      return;
    }

    const workspaceId =
      localStorage.getItem(
        CURRENT_WORKSPACE_KEY
      );

    if (!workspaceId) {
      alert(
        "No workspace is selected. Please select a workspace first."
      );
      return;
    }

    try {
      setDeletingId(project._id);

      await deleteProject(
        project._id,
        workspaceId
      );

      closeMenu();

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to delete project:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete project. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">
                Project
              </th>

              <th className="px-4 py-3 font-medium">
                Priority
              </th>

              <th className="px-4 py-3 font-medium">
                Lead
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
            {projects.length > 0 ? (
              projects.map(
                (project) => (
                  <tr
                    key={project._id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="max-w-[280px] px-4 py-3">
                      <Link
                        href={`/projects/${project._id}`}
                        className="block truncate font-medium text-gray-900 hover:underline"
                      >
                        {project.name}
                      </Link>

                      {project.description && (
                        <p className="mt-1 max-w-md truncate text-xs text-gray-400">
                          {
                            project.description
                          }
                        </p>
                      )}
                    </td>

                    <td
                      className={`px-4 py-3 font-medium capitalize ${
                        priorityStyles[
                          project.priority
                        ]
                      }`}
                    >
                      {project.priority ===
                      "none"
                        ? "—"
                        : project.priority}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {getUserName(
                        project.lead
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(
                        project.dueDate
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        data-project-action-button={
                          project._id
                        }
                        onClick={(event) =>
                          handleActionMenu(
                            event,
                            project._id
                          )
                        }
                        aria-label={`Actions for ${project.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-lg font-bold tracking-widest text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        •••
                      </button>
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  No projects
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Project Action Menu */}
      {openMenuId &&
        menuPosition &&
        (() => {
          const activeProject =
            projects.find(
              (project) =>
                project._id ===
                openMenuId
            );

          if (!activeProject) {
            return null;
          }

          return (
            <div
              data-project-action-menu
              className="fixed z-[9999] w-40 overflow-hidden rounded-md border border-gray-200 bg-white py-1 text-left shadow-xl"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
              }}
            >
              <Link
                href={`/projects/${activeProject._id}`}
                onClick={
                  closeMenu
                }
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                View details
              </Link>

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onEdit(
                    activeProject
                  );
                }}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDelete(
                    activeProject
                  )
                }
                disabled={
                  deletingId ===
                  activeProject._id
                }
                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId ===
                activeProject._id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          );
        })()}
    </>
  );
}