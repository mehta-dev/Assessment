export type TaskStatus =
  | "todo"
  | "doing"
  | "completed"
  | "on_hold";

export type TaskPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export interface TaskProject {
  _id: string;
  name: string;
}

export interface TaskReporter {
  _id: string;
  name?: string;
  username?: string;
  email: string;
  title?: string;
  avatar?: string;
}

export interface TaskMember {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  title?: string;
  avatar?: string;
}

export interface Task {
  _id: string;

  title: string;

  description: string;

  status: TaskStatus;

  priority: TaskPriority;

  dueDate?: string;

  project?: TaskProject;

  reporter: TaskReporter;

  members: TaskMember[];

  labels: string[];
}