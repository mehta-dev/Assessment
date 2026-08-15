export type SubtaskStatus =
  | "todo"
  | "doing"
  | "completed";

export type SubtaskPriority =
  | "none"
  | "urgent"
  | "high"
  | "medium"
  | "low";

export interface SubtaskAssignee {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
}

export interface Subtask {
  _id: string;
  title: string;
  description: string;

  task: string | {
    _id: string;
  };

  assignee?: string | SubtaskAssignee;

  status: SubtaskStatus;
  priority: SubtaskPriority;

  dueDate?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubtaskData {
  title: string;
  description?: string;
  task: string;
  assignee?: string;
  status?: SubtaskStatus;
  priority?: SubtaskPriority;
  dueDate?: string;
}

export interface UpdateSubtaskData {
  title?: string;
  description?: string;
  assignee?: string;
  status?: SubtaskStatus;
  priority?: SubtaskPriority;
  dueDate?: string;
}