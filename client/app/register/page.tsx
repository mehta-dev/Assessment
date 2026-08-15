"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (!username.trim()) {
      setError(
        "Please enter a username."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await registerUser({
          name: name.trim(),
          email: email.trim(),
          username:
            username.trim(),
          password,
        });

      /*
       * The access token is now stored
       * by the backend in an HTTP-only
       * cookie.
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
        "Registration failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
            P
          </div>

          <h1 className="text-xl font-semibold text-gray-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Get started with your workspace.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Full name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Your name"
              autoComplete="name"
              disabled={loading}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 disabled:bg-gray-50"
            />
          </div>

          {/* Email */}
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

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              placeholder="Choose a username"
              autoComplete="username"
              disabled={loading}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 disabled:bg-gray-50"
            />
          </div>

          {/* Password */}
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
              placeholder="At least 6 characters"
              autoComplete="new-password"
              disabled={loading}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 disabled:bg-gray-50"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirm password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Re-enter your password"
              autoComplete="new-password"
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
              ? "Creating account..."
              : "Create account"}
          </button>

          <Link
            href="/login"
            className="block text-center text-sm text-gray-500 hover:text-gray-900"
          >
            Already have an account?
            <span className="ml-1 font-medium text-gray-900">
              Sign in
            </span>
          </Link>
        </form>
      </div>
    </main>
  );
}