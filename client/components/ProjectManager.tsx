"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createProject,
  getCurrentUser,
  getMyWorkspaces,
  getWorkspaceMembers,
  updateProject,
} from "@/lib/api";

import type {
  Project,
  ProjectPriority,
} from "@/types/project";

import type {
  WorkspaceMember,
} from "@/lib/api";

import ProjectTable from "@/components/ProjectTable";

interface ProjectManagerProps {
  projects: Project[];
}

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

export default function ProjectManager({
  projects,
}: ProjectManagerProps) {
  const router = useRouter();

  const [
    editingProject,
    setEditingProject,
  ] = useState<Project | null>(null);

  const [
    isAddOpen,
    setIsAddOpen,
  ] = useState(false);

  const [name, setName] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] = useState<ProjectPriority>(
    "none"
  );

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

  const [
    permissionLoading,
    setPermissionLoading,
  ] = useState(true);

  const [
    canManageProjects,
    setCanManageProjects,
  ] = useState(false);

  const [
    permissionError,
    setPermissionError,
  ] = useState("");

  /*
   * Determine whether the current user is
   * an owner or admin in the selected workspace.
   */
  useEffect(() => {
    const loadPermission =
      async () => {
        try {
          setPermissionLoading(
            true
          );
          setPermissionError("");

          const [
            currentUser,
            workspaces,
          ] = await Promise.all([
            getCurrentUser(),
            getMyWorkspaces(),
          ]);

          let workspaceId =
            localStorage.getItem(
              CURRENT_WORKSPACE_KEY
            );

          const selectedWorkspace =
            workspaces.find(
              (workspace) =>
                workspace._id ===
                workspaceId
            );

          /*
           * Fall back to the first workspace
           * when no valid selection exists.
           */
          if (!selectedWorkspace) {
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
            setCanManageProjects(
              false
            );
            return;
          }

          const workspace =
            workspaces.find(
              (item) =>
                item._id ===
                workspaceId
            );

          if (!workspace) {
            setCanManageProjects(
              false
            );
            return;
          }

          /*
           * Owner is stored separately on the
           * workspace. Admin/member roles are
           * stored inside workspace.members.
           */
          if (
            workspace.owner._id ===
            currentUser._id
          ) {
            setCanManageProjects(
              true
            );
            return;
          }

          const membership =
            workspace.members.find(
              (member) =>
                member.user._id ===
                currentUser._id
            );

          setCanManageProjects(
            membership?.role ===
              "admin"
          );
        } catch (error) {
          console.error(
            "Failed to determine project permissions:",
            error
          );

          setCanManageProjects(
            false
          );

          setPermissionError(
            "Unable to determine your project permissions."
          );
        } finally {
          setPermissionLoading(
            false
          );
        }
      };

    loadPermission();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPriority("none");
    setDueDate("");
    setSelectedMembers([]);
    setError("");
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
          "Failed to load workspace members. Please try again."
        );
      } finally {
        setLoadingMembers(false);
      }
    };

  const openAdd = async () => {
    if (permissionLoading) {
      return;
    }

    if (!canManageProjects) {
      setPermissionError(
        "Only workspace owners and admins can create projects."
      );

      return;
    }

    resetForm();
    setEditingProject(null);
    setIsAddOpen(true);

    await loadWorkspaceMembers();
  };

  const openEdit = async (
    project: Project
  ) => {
    if (permissionLoading) {
      return;
    }

    if (!canManageProjects) {
      setPermissionError(
        "Only workspace owners and admins can edit projects."
      );

      return;
    }

    setName(project.name);

    setDescription(
      project.description || ""
    );

    setPriority(
      project.priority
    );

    setDueDate(
      project.dueDate
        ? new Date(
            project.dueDate
          )
            .toISOString()
            .split("T")[0]
        : ""
    );

    setSelectedMembers(
      (project.members || []).map(
        (member) =>
          typeof member ===
          "string"
            ? member
            : member._id
      )
    );

    setEditingProject(project);
    setIsAddOpen(true);
    setError("");

    await loadWorkspaceMembers();
  };

  const closeModal = () => {
    if (loading) {
      return;
    }

    setIsAddOpen(false);
    setEditingProject(null);
    resetForm();
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

  const handleSave =
    async () => {
      if (!canManageProjects) {
        setError(
          "Only workspace owners and admins can manage projects."
        );

        return;
      }

      if (!name.trim()) {
        setError(
          "Project name is required."
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

        if (editingProject) {
          await updateProject(
            editingProject._id,
            {
              name: name.trim(),
              description:
                description.trim(),
              priority,
              members:
                selectedMembers,
              dueDate: dueDate
                ? new Date(
                    dueDate
                  ).toISOString()
                : undefined,
            },
            workspaceId
          );
        } else {
          setLoadingCurrentUser(
            true
          );

          const currentUser =
            await getCurrentUser();

          await createProject(
            {
              name: name.trim(),
              description:
                description.trim(),
              priority,
              lead:
                currentUser._id,
              members:
                selectedMembers,
              dueDate: dueDate
                ? new Date(
                    dueDate
                  ).toISOString()
                : undefined,
            },
            workspaceId
          );

          setLoadingCurrentUser(
            false
          );
        }

        closeModal();

        router.refresh();
      } catch (error) {
        console.error(
          "Failed to save project:",
          error
        );

        /*
         * Show a useful RBAC message when
         * the backend returns a permission
         * error.
         */
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
              "owners and admins"
            ) ||
          message
            .toLowerCase()
            .includes(
              "forbidden"
            )
        ) {
          setError(
            "Only workspace owners and admins can manage projects."
          );
        } else {
          setError(
            editingProject
              ? "Failed to update project. Please try again."
              : "Failed to create project. Please try again."
          );
        }
      } finally {
        setLoading(false);

        setLoadingCurrentUser(
          false
        );
      }
    };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">
            Projects
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your projects.
          </p>
        </div>

        {!permissionLoading &&
          canManageProjects && (
            <button
              type="button"
              onClick={openAdd}
              className="w-full shrink-0 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 sm:w-auto"
            >
              + Add Project
            </button>
          )}
      </div>

      {permissionError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            {permissionError}
          </p>
        </div>
      )}

      <ProjectTable
        projects={projects}
        onEdit={openEdit}
      />

      {isAddOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-4 w-full max-w-md rounded-lg bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProject
                    ? "Edit Project"
                    : "Add Project"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingProject
                    ? "Update your project."
                    : "Create a new project."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="shrink-0 text-xl text-gray-400 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Project Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(
                    event
                  ) =>
                    setName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Enter project name"
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
                  value={
                    description
                  }
                  onChange={(
                    event
                  ) =>
                    setDescription(
                      event.target
                        .value
                    )
                  }
                  placeholder="Enter project description"
                  rows={3}
                  disabled={
                    loading ||
                    loadingCurrentUser
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-50"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(
                    event
                  ) =>
                    setPriority(
                      event.target
                        .value as ProjectPriority
                    )
                  }
                  disabled={
                    loading ||
                    loadingCurrentUser
                  }
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
                                  loading
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
                  onChange={(
                    event
                  ) =>
                    setDueDate(
                      event.target
                        .value
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
                  onClick={
                    closeModal
                  }
                  disabled={loading}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    loading ||
                    loadingMembers ||
                    loadingCurrentUser
                  }
                  className="w-full rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 sm:w-auto"
                >
                  {loading
                    ? "Saving..."
                    : editingProject
                    ? "Save Changes"
                    : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}