"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getCurrentUser as getAuthenticatedUser,
  getUser,
} from "@/lib/api";

import {
  isGuest,
  logout,
} from "@/lib/auth";

import type { User } from "@/types/user";

import {
  useTheme,
  type AccentColor,
  type ThemeMode,
} from "@/components/ThemeProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [
    isWorkspaceMenuOpen,
    setIsWorkspaceMenuOpen,
  ] = useState(false);

  const [
    openSubmenu,
    setOpenSubmenu,
  ] = useState<
    "theme" | "accent" | null
  >(null);

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  const {
    theme,
    accent,
    setTheme,
    setAccent,
  } = useTheme();

  const loadUser = async () => {
    try {
      /*
       * Get the authenticated user from
       * the backend using the HTTP-only
       * authentication cookie.
       */
      const authenticatedUser =
        await getAuthenticatedUser();

      setUser(
        authenticatedUser
      );

      return;
    } catch {
      /*
       * If there is no authenticated
       * session, check whether the user
       * is currently using Guest mode.
       */
    }

    /*
     * Temporary guest fallback until
     * the real guest session is built.
     */
    if (isGuest()) {
      try {
        const guestUser =
          await getUser(
            "6a781d3a8d7d8cd1d70e7796"
          );

        setUser(guestUser);
      } catch (error) {
        console.error(
          "Failed to load guest user:",
          error
        );

        setUser(null);
      }

      return;
    }

    setUser(null);
  };

  useEffect(() => {
    loadUser();

    const handleProfileUpdate = () => {
      loadUser();
    };

    window.addEventListener(
      "user-profile-updated",
      handleProfileUpdate
    );

    return () => {
      window.removeEventListener(
        "user-profile-updated",
        handleProfileUpdate
      );
    };
  }, []);

  useEffect(() => {
    if (!isWorkspaceMenuOpen) {
      return;
    }

    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setIsWorkspaceMenuOpen(false);
        setOpenSubmenu(null);
      }
    };

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setIsWorkspaceMenuOpen(false);
        setOpenSubmenu(null);
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
  }, [isWorkspaceMenuOpen]);

  const displayName =
    user?.name ||
    user?.username ||
    "User";

  const displayInitial =
    displayName
      .charAt(0)
      .toUpperCase();

  const isTasksActive =
    pathname === "/" ||
    pathname.startsWith("/tasks/");

  const isProjectsActive =
    pathname === "/projects" ||
    pathname.startsWith(
      "/projects/"
    );

  const selectTheme = (
    nextTheme: ThemeMode
  ) => {
    setTheme(nextTheme);
    setOpenSubmenu(null);
  };

  const selectAccent = (
    nextAccent: AccentColor
  ) => {
    setAccent(nextAccent);
    setOpenSubmenu(null);
  };

  const handleLogout = async () => {
    await logout();

    setUser(null);
    setIsWorkspaceMenuOpen(false);
    setOpenSubmenu(null);

    router.push("/login");
    router.refresh();
  };

  const accentOptions: {
    value: AccentColor;
    label: string;
  }[] = [
    {
      value: "amber",
      label: "Amber",
    },
    {
      value: "blue",
      label: "Blue",
    },
    {
      value: "pink",
      label: "Pink",
    },
    {
      value: "rose",
      label: "Rose",
    },
    {
      value: "emerald",
      label: "Emerald",
    },
    {
      value: "black",
      label: "Black",
    },
  ];

  return (
    <aside className="flex min-h-screen w-16 shrink-0 flex-col border-r border-gray-200 bg-white p-2 sm:w-20 sm:p-3 lg:w-64 lg:p-5">
      {/* Workspace header */}
      <div
        ref={menuRef}
        className="relative mb-6 flex items-center justify-between lg:mb-8"
      >
        <div className="flex min-w-0 items-center gap-2">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="h-8 w-8 shrink-0 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
              {displayInitial}
            </div>
          )}

          <h1 className="hidden truncate text-lg font-semibold text-gray-900 lg:block">
            {displayName}
          </h1>
        </div>

        {/* Workspace menu button */}
        <button
          type="button"
          onClick={() => {
            setIsWorkspaceMenuOpen(
              (open) => !open
            );

            setOpenSubmenu(null);
          }}
          className={`rounded-md px-1.5 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 ${
            isWorkspaceMenuOpen
              ? "bg-gray-100 text-gray-900"
              : ""
          }`}
          aria-label="Workspace menu"
          aria-expanded={
            isWorkspaceMenuOpen
          }
        >
          ⋮
        </button>

        {/* Workspace menu */}
        {isWorkspaceMenuOpen && (
          <div className="absolute left-full top-0 z-[100] ml-1 w-52 rounded-md border border-gray-200 bg-white py-1 shadow-lg lg:left-0 lg:top-11 lg:ml-0">
            {/* Change Theme */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenSubmenu(
                    openSubmenu === "theme"
                      ? null
                      : "theme"
                  )
                }
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <span className="text-gray-500">
                    ☼
                  </span>

                  Change Theme
                </span>

                <span className="text-gray-400">
                  ›
                </span>
              </button>

              {openSubmenu ===
                "theme" && (
                <div className="absolute left-full top-0 ml-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() =>
                      selectTheme(
                        "light"
                      )
                    }
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span>
                      Light
                    </span>

                    {theme ===
                      "light" && (
                      <span>
                        ✓
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selectTheme(
                        "dark"
                      )
                    }
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span>
                      Dark
                    </span>

                    {theme ===
                      "dark" && (
                      <span>
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Color Mode */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenSubmenu(
                    openSubmenu ===
                      "accent"
                      ? null
                      : "accent"
                  )
                }
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <span className="text-gray-500">
                    ■
                  </span>

                  Color Mode
                </span>

                <span className="text-gray-400">
                  ›
                </span>
              </button>

              {openSubmenu ===
                "accent" && (
                <div className="absolute left-full top-0 ml-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {accentOptions.map(
                    (option) => (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          selectAccent(
                            option.value
                          )
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-sm"
                            style={{
                              backgroundColor:
                                option.value ===
                                "amber"
                                  ? "#f59e0b"
                                  : option.value ===
                                    "blue"
                                  ? "#3b82f6"
                                  : option.value ===
                                    "pink"
                                  ? "#ec4899"
                                  : option.value ===
                                    "rose"
                                  ? "#f43f5e"
                                  : option.value ===
                                    "emerald"
                                  ? "#10b981"
                                  : "#000000",
                            }}
                          />

                          {option.label}
                        </span>

                        {accent ===
                          option.value && (
                          <span>
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => {
                setIsWorkspaceMenuOpen(
                  false
                );

                setOpenSubmenu(null);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="text-gray-500">
                ⚙
              </span>

              Settings
            </Link>

            {/* Logout */}
            <div className="my-1 border-t border-gray-100" />

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <span>
                ↪
              </span>

              Logout
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <p className="mb-3 hidden text-xs font-medium uppercase tracking-wide text-gray-400 lg:block">
          Workspace
        </p>

        <div className="space-y-1">
          {/* Tasks */}
          <Link
            href="/"
            title="Tasks"
            className={`block rounded-md px-2 py-2 text-center text-sm font-medium lg:px-3 lg:text-left ${
              isTasksActive
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span className="lg:hidden">
              T
            </span>

            <span className="hidden lg:inline">
              Tasks
            </span>
          </Link>

          {/* Projects */}
          <Link
            href="/projects"
            title="Projects"
            className={`block rounded-md px-2 py-2 text-center text-sm font-medium lg:px-3 lg:text-left ${
              isProjectsActive
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span className="lg:hidden">
              P
            </span>

            <span className="hidden lg:inline">
              Projects
            </span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}