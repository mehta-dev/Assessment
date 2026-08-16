import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import ProfileForm from "@/components/ProfileForm";
import BackButton from "@/components/BackButton";

const API_URL =
  process.env.API_SERVER_URL ||
  "http://localhost:4000";

const ACCESS_TOKEN_COOKIE =
  "accessToken";

export default async function ProfilePage() {
  const cookieStore =
    await cookies();

  const accessToken =
    cookieStore.get(
      ACCESS_TOKEN_COOKIE
    )?.value;

  if (!accessToken) {
    redirect("/login");
  }

  let user;

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
        "Profile authentication check failed:",
        response.status,
        await response.text()
      );

      redirect("/login");
    }

    user =
      await response.json();
  } catch (error) {
    console.error(
      "Failed to load authenticated user:",
      error
    );

    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <BackButton
          fallback="/"
          label="Back to app"
        />

        <div className="mt-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your profile information.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <ProfileForm
          user={user}
        />
      </div>
    </div>
  );
}