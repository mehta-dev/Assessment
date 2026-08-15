"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createComment,
  deleteComment,
} from "@/lib/api";

import type { Comment } from "@/types/comment";

interface CommentSectionProps {
  taskId: string;
  comments: Comment[];
}

/*
 * Temporary current user.
 *
 * This is the same temporary user ID currently
 * being used by AddTaskButton until authentication
 * is implemented.
 */
const CURRENT_USER_ID =
  "6a781d3a8d7d8cd1d70e7796";

export default function CommentSection({
  taskId,
  comments,
}: CommentSectionProps) {
  const router = useRouter();

  const [content, setContent] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmedContent =
      content.trim();

    if (!trimmedContent) {
      setError(
        "Comment cannot be empty."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createComment({
        content: trimmedContent,
        task: taskId,
        author: CURRENT_USER_ID,
      });

      setContent("");

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to create comment:",
        error
      );

      setError(
        "Failed to add comment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    comment: Comment
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this comment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(comment._id);
      setError("");

      await deleteComment(comment._id);

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to delete comment:",
        error
      );

      setError(
        "Failed to delete comment. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatCommentDate = (
    date?: string
  ) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Comments
          </h2>

          <span className="text-xs text-gray-400">
            {comments.length} comment
            {comments.length === 1
              ? ""
              : "s"}
          </span>
        </div>
      </div>

      {/* Comments */}
      <div>
        {comments.length > 0 ? (
          <div>
            {comments.map((comment) => {
              const author =
                comment.author;

              const authorName =
                author?.name ||
                author?.username ||
                author?.email ||
                "Unknown user";

              const isOwnComment =
                author?._id ===
                CURRENT_USER_ID;

              return (
                <div
                  key={comment._id}
                  className="border-b border-gray-100 px-6 py-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      {/* Avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {author?.avatar ? (
                          <img
                            src={author.avatar}
                            alt={authorName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          authorName
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {authorName}
                          </p>

                          {comment.createdAt && (
                            <span className="text-xs text-gray-400">
                              {formatCommentDate(
                                comment.createdAt
                              )}
                            </span>
                          )}
                        </div>

                        {author?.email && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {author.email}
                          </p>
                        )}

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                          {comment.content}
                        </p>
                      </div>
                    </div>

                    {/* Delete */}
                    {isOwnComment && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            comment
                          )
                        }
                        disabled={
                          deletingId ===
                          comment._id
                        }
                        className="shrink-0 text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId ===
                        comment._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">
              No comments yet.
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Start the conversation below.
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border-t border-red-100 bg-red-50 px-6 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Comment Composer */}
      <div className="border-t border-gray-200 p-6">
        <div className="rounded-lg border border-gray-300 bg-white">
          <textarea
            value={content}
            onChange={(event) =>
              setContent(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              /*
               * Ctrl + Enter / Cmd + Enter
               * submits the comment.
               */
              if (
                event.key === "Enter" &&
                (event.ctrlKey ||
                  event.metaKey)
              ) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Add a comment..."
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-t-lg px-3 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:bg-gray-50"
          />

          <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2">
            <p className="text-xs text-gray-400">
              Press Ctrl + Enter to send
            </p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                loading ||
                !content.trim()
              }
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Posting..."
                : "Post Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}