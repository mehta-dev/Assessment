import type { User } from "@/types/user";

const CURRENT_USER_KEY =
  "currentUser";

const GUEST_MODE_KEY =
  "guestMode";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser =
    localStorage.getItem(
      CURRENT_USER_KEY
    );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser
    ) as User;
  } catch {
    return null;
  }
}

export function isGuest(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    localStorage.getItem(
      GUEST_MODE_KEY
    ) === "true"
  );
}

export function isLoggedIn(): boolean {
  /*
   * The authentication token is stored
   * in an HTTP-only cookie, so JavaScript
   * cannot read it directly.
   *
   * For client-side UI purposes, the
   * presence of currentUser is enough
   * for now. Server-side authentication
   * will be added with route protection.
   */
  return (
    getCurrentUser() !== null
  );
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    await fetch(
      "http://localhost:4000/auth/logout",
      {
        method: "POST",
        credentials: "include",
      }
    );
  } catch (error) {
    console.error(
      "Logout request failed:",
      error
    );
  }

  localStorage.removeItem(
    CURRENT_USER_KEY
  );

  localStorage.removeItem(
    GUEST_MODE_KEY
  );
}