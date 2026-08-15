import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = "http://localhost:4000";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore =
    await cookies();

  const accessToken =
    cookieStore.get(
      "accessToken"
    )?.value;

  /*
   * No authentication cookie means
   * the user is not logged in.
   */
  if (!accessToken) {
    redirect("/login");
  }

  /*
   * Verify the cookie with the backend.
   */
  try {
    const response =
      await fetch(
        `${API_URL}/auth/me`,
        {
          method: "GET",
          headers: {
            Cookie: `accessToken=${accessToken}`,
          },
          cache: "no-store",
        }
      );

    if (!response.ok) {
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