export type ActivityType =
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "status_changed"
  | "priority_changed"
  | "due_date_changed"
  | "subtask_created"
  | "subtask_updated"
  | "subtask_deleted"
  | "comment_added"
  | "comment_deleted";

export interface ActivityActor {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  title?: string;
  avatar?: string;
}

export interface Activity {
  _id: string;

  task:
    | string
    | {
        _id: string;
      };

  actor: ActivityActor;

  type: ActivityType;

  message: string;

  metadata?: Record<string, unknown>;

  createdAt?: string;
  updatedAt?: string;
}