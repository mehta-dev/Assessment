"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!email.trim()) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await loginUser({
          email: email.trim(),
          password,
        });

      /*
       * The access token is now stored by
       * the backend in an HTTP-only cookie.
       *
       * We only keep the user information
       * locally for UI purposes.
       */
      localStorage.setItem(
        "currentUser",
        JSON.stringify(
          result.user
        )
      );

      localStorage.removeItem(
        "guestMode"
      );

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    /*
     * Guest mode still uses the existing
     * temporary guest user.
     *
     * We'll replace this with the proper
     * guest session later.
     */
    localStorage.setItem(
      "guestMode",
      "true"
    );

    localStorage.removeItem(
      "currentUser"
    );

    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
            P
          </div>

          <h1 className="text-xl font-semibold text-gray-900">
            Let's get back on track
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to continue to
            your workspace.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 disabled:bg-gray-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Signing in..."
              : "Continue"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-xs text-gray-400">
              OR
            </span>

            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={
              handleGuestLogin
            }
            disabled={loading}
            className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Continue as Guest
          </button>

          <Link
            href="/register"
            className="block text-center text-sm text-gray-500 hover:text-gray-900"
          >
            Don't have an account?
            <span className="ml-1 font-medium text-gray-900">
              Sign up
            </span>
          </Link>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-gray-400">
          By continuing, you agree to
          our Terms of Service and
          Privacy Policy.
        </p>
      </div>
    </main>
  );
}