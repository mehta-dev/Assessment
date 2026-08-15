"use client";

import type { Activity } from "@/types/activity";

interface ActivitySectionProps {
  activities: Activity[];
}

const activityColors: Record<
  Activity["type"],
  string
> = {
  task_created:
    "bg-gray-400",
  task_updated:
    "bg-gray-400",

  task_deleted:
    "bg-red-500",

  status_changed:
    "bg-blue-500",

  priority_changed:
    "bg-orange-500",

  due_date_changed:
    "bg-purple-500",

  subtask_created:
    "bg-green-500",

  subtask_updated:
    "bg-green-500",

  subtask_deleted:
    "bg-red-500",

  comment_added:
    "bg-blue-500",

  comment_deleted:
    "bg-red-500",
};

function formatActivityDate(
  date?: string
) {
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
}

function getActorName(
  activity: Activity
) {
  return (
    activity.actor?.name ||
    activity.actor?.username ||
    activity.actor?.email ||
    "Unknown user"
  );
}

export default function ActivitySection({
  activities,
}: ActivitySectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Updates
          </h2>

          <span className="text-xs text-gray-400">
            {activities.length} update
            {activities.length === 1
              ? ""
              : "s"}
          </span>
        </div>
      </div>

      {/* Timeline */}
      {activities.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {activities.map((activity) => {
            const actorName =
              getActorName(activity);

            const initial =
              actorName
                .charAt(0)
                .toUpperCase();

            return (
              <div
                key={activity._id}
                className="flex gap-3 px-6 py-4"
              >
                {/* Timeline marker */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    {activity.actor?.avatar ? (
                      <img
                        src={
                          activity.actor
                            .avatar
                        }
                        alt={actorName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  <div className="mt-2 flex-1">
                    <span
                      className={`block h-2 w-2 rounded-full ${
                        activityColors[
                          activity.type
                        ] ||
                        "bg-gray-400"
                      }`}
                    />
                  </div>
                </div>

                {/* Activity content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {actorName}
                    </p>

                    {activity.createdAt && (
                      <span className="text-xs text-gray-400">
                        {formatActivityDate(
                          activity.createdAt
                        )}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {activity.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-gray-400">
            No updates yet.
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Task activity will appear here.
          </p>
        </div>
      )}
    </div>
  );
}