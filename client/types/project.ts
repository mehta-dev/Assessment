export type ProjectPriority =
  | "none"
  | "urgent"
  | "high"
  | "medium"
  | "low";

export interface ProjectUser {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  title?: string;
  avatar?: string;
}

export interface Project {
  _id: string;

  name: string;

  description: string;

  priority: ProjectPriority;

  lead:
    | string
    | ProjectUser;

  dueDate?: string;

  members: string[] | ProjectUser[];

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  priority?: ProjectPriority;
  lead: string;
  dueDate?: string;
  members?: string[];
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  priority?: ProjectPriority;
  lead?: string;
  dueDate?: string;
  members?: string[];
}