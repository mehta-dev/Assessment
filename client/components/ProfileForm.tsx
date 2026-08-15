"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateUser } from "@/lib/api";
import type { User } from "@/types/user";

interface ProfileFormProps {
  user: User;
}

type EditingField =
  | "email"
  | "name"
  | "title"
  | "username"
  | "avatar"
  | null;

export default function ProfileForm({
  user,
}: ProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(
    user.name || ""
  );

  const [email, setEmail] = useState(
    user.email || ""
  );

  const [title, setTitle] = useState(
    user.title || ""
  );

  const [username, setUsername] =
    useState(user.username || "");

  const [avatar, setAvatar] =
    useState(user.avatar || "");

  const [editingField, setEditingField] =
    useState<EditingField>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const getDisplayName = () =>
    name.trim() ||
    username.trim() ||
    "User";

  const getInitials = () => {
    const displayName =
      getDisplayName();

    const words =
      displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length >= 2) {
      return (
        words[0].charAt(0) +
        words[1].charAt(0)
      ).toUpperCase();
    }

    return displayName
      .charAt(0)
      .toUpperCase();
  };

  const saveField = async (
    field:
      | "email"
      | "name"
      | "title"
      | "username"
      | "avatar"
  ) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      let value = "";

      switch (field) {
        case "email":
          value = email.trim();
          break;

        case "name":
          value = name.trim();
          break;

        case "title":
          value = title.trim();
          break;

        case "username":
          value = username.trim();
          break;

        case "avatar":
          value = avatar;
          break;
      }

      await updateUser(user._id, {
        [field]: value,
      });

      setEditingField(null);
      setSuccess(
        "Profile updated successfully."
      );

      window.dispatchEvent(
        new Event("user-profile-updated")
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to update profile:",
        error
      );

      setError(
        "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    if (
      file.size >
      1 * 1024 * 1024
    ) {
      setError(
        "Image must be smaller than 1 MB."
      );
      return;
    }

    setError("");
    setSuccess("");

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result ===
        "string"
      ) {
        setAvatar(reader.result);
        setEditingField("avatar");
      }
    };

    reader.onerror = () => {
      setError(
        "Failed to read the selected image."
      );
    };

    reader.readAsDataURL(file);
  };

  const renderAvatar = (
    sizeClass = "h-12 w-12"
  ) => {
    if (avatar) {
      return (
        <img
          src={avatar}
          alt={getDisplayName()}
          className={`${sizeClass} shrink-0 rounded-full border border-gray-200 object-cover`}
        />
      );
    }

    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-medium text-gray-700`}
      >
        {getInitials()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <h2 className="font-semibold text-gray-900">
            Profile
          </h2>
        </div>

        <div>
          {/* Profile picture */}
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  Profile picture
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Choose an image from your device
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {renderAvatar()}

                <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Choose image

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={
                      loading
                    }
                    onChange={
                      handleAvatarChange
                    }
                  />
                </label>

                {editingField ===
                  "avatar" && (
                  <button
                    type="button"
                    onClick={() =>
                      saveField(
                        "avatar"
                      )
                    }
                    disabled={
                      loading
                    }
                    className="rounded-md px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading
                      ? "Saving..."
                      : "Save"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  Email
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Your account email address
                </p>
              </div>

              {editingField ===
              "email" ? (
                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      loading
                    }
                    className="w-full min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-50 sm:max-w-md"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      saveField(
                        "email"
                      )
                    }
                    disabled={
                      loading
                    }
                    className="w-full rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="break-all text-sm text-gray-600">
                    {email}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingField(
                        "email"
                      )
                    }
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Full name */}
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  Full name
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Your display name
                </p>
              </div>

              {editingField ===
              "name" ? (
                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      loading
                    }
                    className="w-full min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-50 sm:max-w-md"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      saveField(
                        "name"
                      )
                    }
                    disabled={
                      loading
                    }
                    className="w-full rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="break-words rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-600">
                    {name ||
                      "Add a name"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingField(
                        "name"
                      )
                    }
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  Title
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Your job title or role
                </p>
              </div>

              {editingField ===
              "title" ? (
                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      loading
                    }
                    className="w-full min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-50 sm:max-w-md"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      saveField(
                        "title"
                      )
                    }
                    disabled={
                      loading
                    }
                    className="w-full rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="break-words rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-600">
                    {title ||
                      "Add a title"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingField(
                        "title"
                      )
                    }
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  Username
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  One word, like a nickname or first name
                </p>
              </div>

              {editingField ===
              "username" ? (
                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
                  <input
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      loading
                    }
                    className="w-full min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 disabled:bg-gray-50 sm:max-w-md"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      saveField(
                        "username"
                      )
                    }
                    disabled={
                      loading
                    }
                    className="w-full rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="break-words rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-600">
                    {username}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingField(
                        "username"
                      )
                    }
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Workspace access */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <h2 className="font-semibold text-gray-900">
            Workspace access
          </h2>
        </div>

        <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">
              Remove yourself from the workspace
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              window.alert(
                "Leave Workspace will be connected when workspace membership is implemented."
              )
            }
            className="w-full shrink-0 rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-100 sm:w-auto"
          >
            Leave Workspace
          </button>
        </div>
      </div>
    </div>
  );
}