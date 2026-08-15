"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  addWorkspaceMember,
  createWorkspace,
  getCurrentUser,
  getUsers,
  getMyWorkspaces,
  removeWorkspaceMember,
  leaveWorkspace,
  type Workspace,
  type WorkspaceMemberRole,
} from "@/lib/api";

import type { User } from "@/types/user";

import BackButton from "@/components/BackButton";

import {
  useTheme,
  type AccentColor,
  type ThemeMode,
} from "@/components/ThemeProvider";

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

const setWorkspaceCookie = (
  workspaceId: string
) => {
  document.cookie =
    `${CURRENT_WORKSPACE_KEY}=${encodeURIComponent(
      workspaceId
    )}; path=/; max-age=2592000; samesite=lax`;
};

const clearWorkspaceCookie = () => {
  document.cookie =
    `${CURRENT_WORKSPACE_KEY}=; path=/; max-age=0; samesite=lax`;
};

const accentOptions: {
  value: AccentColor;
  label: string;
  color: string;
}[] = [
  {
    value: "amber",
    label: "Amber",
    color: "#f59e0b",
  },
  {
    value: "blue",
    label: "Blue",
    color: "#3b82f6",
  },
  {
    value: "pink",
    label: "Pink",
    color: "#ec4899",
  },
  {
    value: "rose",
    label: "Rose",
    color: "#f43f5e",
  },
  {
    value: "emerald",
    label: "Emerald",
    color: "#10b981",
  },
  {
    value: "black",
    label: "Black",
    color: "#000000",
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [workspaces, setWorkspaces] =
    useState<Workspace[]>([]);

  const [
    selectedWorkspaceId,
    setSelectedWorkspaceId,
  ] = useState("");

  const [
    loadingWorkspaces,
    setLoadingWorkspaces,
  ] = useState(true);

  const [
    workspaceName,
    setWorkspaceName,
  ] = useState("");

  const [
    creatingWorkspace,
    setCreatingWorkspace,
  ] = useState(false);

  const [
    workspaceUsers,
    setWorkspaceUsers,
  ] = useState<User[]>([]);

  const [
    loadingWorkspaceUsers,
    setLoadingWorkspaceUsers,
  ] = useState(false);

  const [
    selectedMemberId,
    setSelectedMemberId,
  ] = useState("");

  const [
    selectedMemberRole,
    setSelectedMemberRole,
  ] = useState<"member" | "admin">(
    "member"
  );

  const [
    addingMember,
    setAddingMember,
  ] = useState(false);

  const [
    removingMemberId,
    setRemovingMemberId,
  ] = useState<string | null>(
    null
  );

  const [
    leavingWorkspace,
    setLeavingWorkspace,
  ] = useState(false);

  const [
    workspaceError,
    setWorkspaceError,
  ] = useState("");

  const [
    workspaceMessage,
    setWorkspaceMessage,
  ] = useState("");

  const {
    theme,
    accent,
    setTheme,
    setAccent,
  } = useTheme();

  const selectedWorkspace =
    useMemo(
      () =>
        workspaces.find(
          (workspace) =>
            workspace._id ===
            selectedWorkspaceId
        ) || null,
      [
        workspaces,
        selectedWorkspaceId,
      ]
    );

  const currentUserRole:
    | WorkspaceMemberRole
    | null = useMemo(() => {
    if (
      !selectedWorkspace ||
      !user
    ) {
      return null;
    }

    if (
      selectedWorkspace.owner._id ===
      user._id
    ) {
      return "owner";
    }

    const membership =
      selectedWorkspace.members.find(
        (member) =>
          member.user._id ===
          user._id
      );

    return (
      membership?.role || null
    );
  }, [
    selectedWorkspace,
    user,
  ]);

  const canManageMembers =
    currentUserRole === "owner" ||
    currentUserRole === "admin";

  const memberUserIds =
    useMemo(() => {
      if (!selectedWorkspace) {
        return new Set<string>();
      }

      return new Set(
        selectedWorkspace.members.map(
          (member) =>
            member.user._id
        )
      );
    }, [selectedWorkspace]);

  const availableUsers =
    useMemo(
      () =>
        workspaceUsers.filter(
          (workspaceUser) =>
            !memberUserIds.has(
              workspaceUser._id
            )
        ),
      [
        workspaceUsers,
        memberUserIds,
      ]
    );

  useEffect(() => {
    const loadInitialData =
      async () => {
        try {
          setLoadingUser(true);

          const [
            currentUser,
            userWorkspaces,
          ] = await Promise.all([
            getCurrentUser(),
            getMyWorkspaces(),
          ]);

          setUser(currentUser);

          setWorkspaces(
            userWorkspaces
          );

          const savedWorkspaceId =
            localStorage.getItem(
              CURRENT_WORKSPACE_KEY
            );

          const savedWorkspaceExists =
            userWorkspaces.some(
              (workspace) =>
                workspace._id ===
                savedWorkspaceId
            );

          const workspaceToSelect =
            savedWorkspaceExists
              ? savedWorkspaceId || ""
              : userWorkspaces[0]
                  ?._id || "";

          setSelectedWorkspaceId(
            workspaceToSelect
          );

          if (workspaceToSelect) {
            localStorage.setItem(
              CURRENT_WORKSPACE_KEY,
              workspaceToSelect
            );

            setWorkspaceCookie(
              workspaceToSelect
            );
          } else {
            clearWorkspaceCookie();
          }
        } catch (error) {
          console.error(
            "Failed to load settings:",
            error
          );

          setWorkspaceError(
            "Failed to load your workspace information."
          );
        } finally {
          setLoadingUser(false);

          setLoadingWorkspaces(
            false
          );
        }
      };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      clearWorkspaceCookie();
      return;
    }

    localStorage.setItem(
      CURRENT_WORKSPACE_KEY,
      selectedWorkspaceId
    );

    setWorkspaceCookie(
      selectedWorkspaceId
    );
  }, [
    selectedWorkspaceId,
  ]);

  const loadWorkspaceUsers =
    async () => {
      try {
        setLoadingWorkspaceUsers(
          true
        );

        const users =
          await getUsers();

        setWorkspaceUsers(users);
      } catch (error) {
        console.error(
          "Failed to load users:",
          error
        );

        setWorkspaceError(
          "Failed to load users."
        );
      } finally {
        setLoadingWorkspaceUsers(
          false
        );
      }
    };

  const refreshWorkspaces =
    async (
      preferredWorkspaceId?: string
    ) => {
      const updated =
        await getMyWorkspaces();

      setWorkspaces(updated);

      const nextWorkspaceId =
        preferredWorkspaceId &&
        updated.some(
          (workspace) =>
            workspace._id ===
            preferredWorkspaceId
        )
          ? preferredWorkspaceId
          : updated.find(
              (workspace) =>
                workspace._id ===
                selectedWorkspaceId
            )?._id ||
            updated[0]?._id ||
            "";

      setSelectedWorkspaceId(
        nextWorkspaceId
      );

      if (nextWorkspaceId) {
        localStorage.setItem(
          CURRENT_WORKSPACE_KEY,
          nextWorkspaceId
        );

        setWorkspaceCookie(
          nextWorkspaceId
        );
      } else {
        localStorage.removeItem(
          CURRENT_WORKSPACE_KEY
        );

        clearWorkspaceCookie();
      }

      /*
       * Refresh the current Next.js route
       * after the workspace changes.
       */
      router.refresh();
    };

  const handleCreateWorkspace =
    async () => {
      if (!workspaceName.trim()) {
        setWorkspaceError(
          "Workspace name is required."
        );

        return;
      }

      try {
        setCreatingWorkspace(
          true
        );

        setWorkspaceError("");
        setWorkspaceMessage("");

        const workspace =
          await createWorkspace({
            name:
              workspaceName.trim(),
          });

        setWorkspaceName("");

        await refreshWorkspaces(
          workspace._id
        );

        setWorkspaceMessage(
          "Workspace created successfully."
        );
      } catch (error) {
        console.error(
          "Failed to create workspace:",
          error
        );

        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "Failed to create workspace."
        );
      } finally {
        setCreatingWorkspace(
          false
        );
      }
    };

  const handleWorkspaceChange =
    async (
      workspaceId: string
    ) => {
      /*
       * Update local React state first
       * so the Settings page immediately
       * displays the new workspace.
       */
      setSelectedWorkspaceId(
        workspaceId
      );

      setWorkspaceError("");
      setWorkspaceMessage("");

      /*
       * Persist the selection in both
       * localStorage and a browser cookie.
       */
      if (workspaceId) {
        localStorage.setItem(
          CURRENT_WORKSPACE_KEY,
          workspaceId
        );

        setWorkspaceCookie(
          workspaceId
        );
      } else {
        localStorage.removeItem(
          CURRENT_WORKSPACE_KEY
        );

        clearWorkspaceCookie();
      }

      /*
       * Reload workspace-specific members
       * immediately.
       */
      if (workspaceId) {
        await loadWorkspaceUsers();
      } else {
        setWorkspaceUsers([]);
      }

      /*
       * Tell Next.js Server Components to
       * re-render using the new workspace
       * cookie instead of requiring a
       * manual browser refresh.
       */
      router.refresh();
    };

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadWorkspaceUsers();
    }
  }, [
    selectedWorkspaceId,
  ]);

  const handleAddMember =
    async () => {
      if (
        !selectedWorkspace ||
        !selectedMemberId
      ) {
        return;
      }

      try {
        setAddingMember(true);

        setWorkspaceError("");
        setWorkspaceMessage("");

        await addWorkspaceMember(
          selectedWorkspace._id,
          {
            userId:
              selectedMemberId,
            role:
              selectedMemberRole,
          }
        );

        setSelectedMemberId("");

        setSelectedMemberRole(
          "member"
        );

        await refreshWorkspaces(
          selectedWorkspace._id
        );

        setWorkspaceMessage(
          "Member added successfully."
        );
      } catch (error) {
        console.error(
          "Failed to add member:",
          error
        );

        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "Failed to add member."
        );
      } finally {
        setAddingMember(false);
      }
    };

  const handleRemoveMember =
    async (
      memberId: string
    ) => {
      if (!selectedWorkspace) {
        return;
      }

      const member =
        selectedWorkspace.members.find(
          (item) =>
            item.user._id ===
            memberId
        );

      const memberName =
        member?.user.name ||
        member?.user.username ||
        member?.user.email ||
        "this member";

      const confirmed =
        window.confirm(
          `Remove ${memberName} from this workspace?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setRemovingMemberId(
          memberId
        );

        setWorkspaceError("");
        setWorkspaceMessage("");

        await removeWorkspaceMember(
          selectedWorkspace._id,
          memberId
        );

        await refreshWorkspaces(
          selectedWorkspace._id
        );

        setWorkspaceMessage(
          "Member removed successfully."
        );
      } catch (error) {
        console.error(
          "Failed to remove member:",
          error
        );

        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "Failed to remove member."
        );
      } finally {
        setRemovingMemberId(null);
      }
    };

  const handleLeaveWorkspace =
    async () => {
      if (!selectedWorkspace) {
        return;
      }

      const confirmed =
        window.confirm(
          `Leave "${selectedWorkspace.name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setLeavingWorkspace(
          true
        );

        setWorkspaceError("");
        setWorkspaceMessage("");

        await leaveWorkspace(
          selectedWorkspace._id
        );

        await refreshWorkspaces();

        setWorkspaceMessage(
          "You left the workspace."
        );
      } catch (error) {
        console.error(
          "Failed to leave workspace:",
          error
        );

        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "Failed to leave workspace."
        );
      } finally {
        setLeavingWorkspace(
          false
        );
      }
    };

  const displayName =
    user?.name ||
    user?.username ||
    "User";

  const handleThemeChange = (
    nextTheme: ThemeMode
  ) => {
    setTheme(nextTheme);
  };

  const handleAccentChange = (
    nextAccent: AccentColor
  ) => {
    setAccent(nextAccent);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <BackButton
          fallback="/"
          label="Back"
        />

        <div className="mt-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your account and workspace settings.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Account */}
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">
              Account
            </h2>
          </div>

          <div>
            <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  Profile
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Update your name, email, username, title and avatar.
                </p>
              </div>

              <Link
                href="/profile"
                className="w-full shrink-0 rounded-md px-4 py-2 text-center text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
                style={{
                  backgroundColor:
                    "var(--accent)",
                }}
              >
                Open Profile
              </Link>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">
              Appearance
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Customize how Pyramid looks and feels.
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Theme */}
            <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  Theme
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Choose between light and dark appearance.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleThemeChange(
                      "light"
                    )
                  }
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${
                    theme === "light"
                      ? "font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={
                    theme === "light"
                      ? {
                          borderColor:
                            "var(--accent)",
                          color:
                            "var(--accent)",
                          backgroundColor:
                            "var(--accent-soft)",
                        }
                      : undefined
                  }
                >
                  Light
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleThemeChange(
                      "dark"
                    )
                  }
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${
                    theme === "dark"
                      ? "font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={
                    theme === "dark"
                      ? {
                          borderColor:
                            "var(--accent)",
                          color:
                            "var(--accent)",
                          backgroundColor:
                            "var(--accent-soft)",
                        }
                      : undefined
                  }
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Color mode */}
            <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-6">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  Color mode
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Choose the interface accent color.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:max-w-md sm:justify-end">
                {accentOptions.map(
                  (option) => (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() =>
                        handleAccentChange(
                          option.value
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition hover:opacity-90"
                      style={
                        accent ===
                        option.value
                          ? {
                              borderColor:
                                option.color,
                              color:
                                option.color,
                              backgroundColor:
                                "var(--accent-soft)",
                            }
                          : {
                              borderColor:
                                "var(--border-strong)",
                              color:
                                "var(--foreground)",
                            }
                      }
                    >
                      <span
                        className="h-3 w-3 rounded-sm"
                        style={{
                          backgroundColor:
                            option.color,
                        }}
                      />

                      {option.label}

                      {accent ===
                        option.value && (
                        <span className="font-medium">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Workspace */}
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">
              Workspace
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Create a workspace and manage its members.
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Workspace selector */}
            <div className="px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Current workspace
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Choose the workspace you want to work in.
                  </p>
                </div>

                {loadingWorkspaces ? (
                  <p className="text-sm text-gray-400">
                    Loading workspaces...
                  </p>
                ) : workspaces.length ===
                  0 ? (
                  <p className="text-sm text-gray-400">
                    You don't have a workspace yet.
                  </p>
                ) : (
                  <select
                    value={
                      selectedWorkspaceId
                    }
                    onChange={(
                      event
                    ) =>
                      handleWorkspaceChange(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500"
                  >
                    {workspaces.map(
                      (workspace) => (
                        <option
                          key={
                            workspace._id
                          }
                          value={
                            workspace._id
                          }
                        >
                          {
                            workspace.name
                          }
                        </option>
                      )
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* Create workspace */}
            <div className="px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Create workspace
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Create a new workspace. You will automatically become its owner.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={
                      workspaceName
                    }
                    onChange={(
                      event
                    ) =>
                      setWorkspaceName(
                        event.target
                          .value
                      )
                    }
                    placeholder="Workspace name"
                    disabled={
                      creatingWorkspace
                    }
                    className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-50"
                  />

                  <button
                    type="button"
                    onClick={
                      handleCreateWorkspace
                    }
                    disabled={
                      creatingWorkspace
                    }
                    className="rounded-md px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor:
                        "var(--accent)",
                    }}
                  >
                    {creatingWorkspace
                      ? "Creating..."
                      : "Create"}
                  </button>
                </div>
              </div>
            </div>

            {/* Members */}
            {selectedWorkspace && (
              <div className="px-4 py-5 sm:px-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    Members
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {
                      selectedWorkspace
                        .members
                        .length
                    }{" "}
                    member
                    {selectedWorkspace
                      .members
                      .length !==
                    1
                      ? "s"
                      : ""}{" "}
                    in this workspace.
                  </p>
                </div>

                <div className="space-y-2">
                  {selectedWorkspace.members.map(
                    (member) => {
                      const memberName =
                        member.user
                          .name ||
                        member.user
                          .username ||
                        member.user
                          .email ||
                        "Unknown user";

                      const isOwner =
                        member.role ===
                        "owner";

                      const isSelf =
                        user?._id ===
                        member.user
                          ._id;

                      return (
                        <div
                          key={
                            member.user
                              ._id
                          }
                          className="flex flex-col gap-3 rounded-md border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {member.user
                              .avatar ? (
                              <img
                                src={
                                  member.user
                                    .avatar
                                }
                                alt={
                                  memberName
                                }
                                className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                                {memberName
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-800">
                                {
                                  memberName
                                }
                                {isSelf &&
                                  " (You)"}
                              </p>

                              <p className="truncate text-xs text-gray-400">
                                {
                                  member.user
                                    .email
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                                member.role ===
                                "owner"
                                  ? "bg-gray-900 text-white"
                                  : member.role ===
                                    "admin"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-gray-50 text-gray-500"
                              }`}
                            >
                              {
                                member.role
                              }
                            </span>

                            {canManageMembers &&
                              !isOwner &&
                              !isSelf && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveMember(
                                      member
                                        .user
                                        ._id
                                    )
                                  }
                                  disabled={
                                    removingMemberId ===
                                    member
                                      .user
                                      ._id
                                  }
                                  className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {removingMemberId ===
                                  member
                                    .user
                                    ._id
                                    ? "Removing..."
                                    : "Remove"}
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Add member */}
            {selectedWorkspace &&
              canManageMembers && (
                <div className="px-4 py-5 sm:px-6">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      Add member
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Add an existing user directly to this workspace.
                    </p>
                  </div>

                  {loadingWorkspaceUsers ? (
                    <p className="text-sm text-gray-400">
                      Loading users...
                    </p>
                  ) : availableUsers.length ===
                    0 ? (
                    <p className="text-sm text-gray-400">
                      No additional users are available to add.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={
                          selectedMemberId
                        }
                        onChange={(
                          event
                        ) =>
                          setSelectedMemberId(
                            event.target
                              .value
                          )
                        }
                        disabled={
                          addingMember
                        }
                        className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 disabled:bg-gray-50"
                      >
                        <option value="">
                          Select user
                        </option>

                        {availableUsers.map(
                          (
                            availableUser
                          ) => (
                            <option
                              key={
                                availableUser._id
                              }
                              value={
                                availableUser._id
                              }
                            >
                              {availableUser
                                .name ||
                                availableUser
                                  .username ||
                                availableUser
                                  .email}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={
                          selectedMemberRole
                        }
                        onChange={(
                          event
                        ) =>
                          setSelectedMemberRole(
                            event.target
                              .value as
                              | "member"
                              | "admin"
                          )
                        }
                        disabled={
                          addingMember
                        }
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 disabled:bg-gray-50"
                      >
                        <option value="member">
                          Member
                        </option>

                        <option value="admin">
                          Admin
                        </option>
                      </select>

                      <button
                        type="button"
                        onClick={
                          handleAddMember
                        }
                        disabled={
                          addingMember ||
                          !selectedMemberId
                        }
                        className="rounded-md px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                        style={{
                          backgroundColor:
                            "var(--accent)",
                        }}
                      >
                        {addingMember
                          ? "Adding..."
                          : "Add"}
                      </button>
                    </div>
                  )}
                </div>
              )}

            {/* Leave workspace */}
            {selectedWorkspace &&
              currentUserRole &&
              currentUserRole !==
                "owner" && (
                <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700">
                      Leave workspace
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Remove yourself from the current workspace.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleLeaveWorkspace
                    }
                    disabled={
                      leavingWorkspace
                    }
                    className="w-full rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:w-auto"
                  >
                    {leavingWorkspace
                      ? "Leaving..."
                      : "Leave Workspace"}
                  </button>
                </div>
              )}

            {/* Messages */}
            {(workspaceError ||
              workspaceMessage) && (
              <div className="px-4 py-4 sm:px-6">
                {workspaceError && (
                  <p className="text-sm text-red-600">
                    {
                      workspaceError
                    }
                  </p>
                )}

                {workspaceMessage && (
                  <p className="text-sm text-green-600">
                    {
                      workspaceMessage
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}