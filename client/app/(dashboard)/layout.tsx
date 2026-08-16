import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL =
  process.env.API_SERVER_URL ||
  "http://localhost:4000";

const ACCESS_TOKEN_COOKIE =
  "accessToken";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore =
    await cookies();

  const accessToken =
    cookieStore.get(
      ACCESS_TOKEN_COOKIE
    )?.value;

  /*
   * No authentication cookie means
   * the user is not logged in.
   */
  if (!accessToken) {
    redirect("/login");
  }

  /*
   * Verify the authentication cookie
   * directly with the backend.
   *
   * In production API_SERVER_URL points
   * to the Render backend.
   *
   * In local development it falls back
   * to localhost:4000.
   */
  try {
    const response =
      await fetch(
        `${API_URL}/auth/me`,
        {
          method: "GET",

          headers: {
            Cookie:
              `${ACCESS_TOKEN_COOKIE}=${accessToken}`,
          },

          cache: "no-store",
        }
      );

    if (!response.ok) {
      console.error(
        "Dashboard authentication check failed:",
        response.status,
        await response.text()
      );

      redirect("/login");
    }
  } catch (error) {
    console.error(
      "Dashboard authentication check failed:",
      error
    );

    redirect("/login");
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}