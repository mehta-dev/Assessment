import type {
  UpdateUserData,
  User,
} from "@/types/user";

import type {
  CreateProjectData,
  Project,
  UpdateProjectData,
} from "@/types/project";

import type {
  Activity,
} from "@/types/activity";

import type {
  Comment,
  CreateCommentData,
} from "@/types/comment";

import type {
  CreateSubtaskData,
  Subtask,
  UpdateSubtaskData,
} from "@/types/subtask";

import type { Task } from "@/types/task";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

const CURRENT_WORKSPACE_KEY =
  "pyramid-workspace-id";

function getSelectedWorkspaceId(): string | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  return localStorage.getItem(
    CURRENT_WORKSPACE_KEY
  );
}

function getWorkspaceHeaders(
  workspaceId?: string
): Record<string, string> {
  const selectedWorkspaceId =
    workspaceId ||
    getSelectedWorkspaceId();

  if (!selectedWorkspaceId) {
    return {};
  }

  return {
    "X-Workspace-Id":
      selectedWorkspaceId,
  };
}

/* =========================
   Authentication
========================= */

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
  title?: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
}

export async function loginUser(
  data: LoginData
): Promise<AuthResponse> {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Login failed:",
      errorText
    );

    let message =
      "Invalid email or password.";

    try {
      const errorData =
        JSON.parse(errorText);

      if (errorData?.message) {
        message =
          Array.isArray(
            errorData.message
          )
            ? errorData.message.join(
                ", "
              )
            : errorData.message;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}

export async function registerUser(
  data: RegisterData
): Promise<AuthResponse> {
  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Registration failed:",
      errorText
    );

    let message =
      "Failed to create account.";

    try {
      const errorData =
        JSON.parse(errorText);

      if (errorData?.message) {
        message =
          Array.isArray(
            errorData.message
          )
            ? errorData.message.join(
                ", "
              )
            : errorData.message;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get current user failed:",
      errorText
    );

    throw new Error(
      "Not authenticated"
    );
  }

  return response.json();
}

/* =========================
   Workspaces
========================= */

export type WorkspaceMemberRole =
  | "owner"
  | "admin"
  | "member";

export interface WorkspaceMember {
  user: User;
  role: WorkspaceMemberRole;
  joinedAt: string;
}

export interface Workspace {
  _id: string;
  name: string;
  owner: User;
  members: WorkspaceMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkspaceData {
  name: string;
}

export interface AddWorkspaceMemberData {
  userId: string;
  role?: "admin" | "member";
}

export async function createWorkspace(
  data: CreateWorkspaceData
): Promise<Workspace> {
  const response = await fetch(
    `${API_URL}/workspaces`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Create workspace failed:",
      errorText
    );

    throw new Error(
      "Failed to create workspace"
    );
  }

  return response.json();
}

export async function getMyWorkspaces(
  accessToken?: string
): Promise<Workspace[]> {
  const headers: Record<
    string,
    string
  > = {};

  /*
   * Browser calls use the existing
   * credentials automatically.
   *
   * Server Components can pass the
   * access token explicitly so the
   * HTTP-only cookie reaches the API.
   */
  if (accessToken) {
    headers.Cookie =
      `accessToken=${accessToken}`;
  }

  const response = await fetch(
    `${API_URL}/workspaces/mine`,
    {
      method: "GET",
      credentials: "include",
      headers,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get workspaces failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch workspaces"
    );
  }

  return response.json();
}

export async function getWorkspace(
  id: string
): Promise<Workspace> {
  const response = await fetch(
    `${API_URL}/workspaces/${id}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get workspace failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch workspace"
    );
  }

  return response.json();
}

export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/members`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get workspace members failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch workspace members"
    );
  }

  return response.json();
}

export async function addWorkspaceMember(
  workspaceId: string,
  data: AddWorkspaceMemberData
): Promise<Workspace> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/members`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Add workspace member failed:",
      errorText
    );

    throw new Error(
      "Failed to add workspace member"
    );
  }

  return response.json();
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<Workspace> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/members/${userId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Remove workspace member failed:",
      errorText
    );

    throw new Error(
      "Failed to remove workspace member"
    );
  }

  return response.json();
}

export async function leaveWorkspace(
  workspaceId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/leave`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Leave workspace failed:",
      errorText
    );

    throw new Error(
      "Failed to leave workspace"
    );
  }
}

/* =========================
   Tasks
========================= */

export async function getTasks(
  workspaceId?: string,
  accessToken?: string
): Promise<Task[]> {
  const headers: Record<
    string,
    string
  > = {
    ...getWorkspaceHeaders(
      workspaceId
    ),
  };

  /*
   * Server Components cannot automatically
   * forward the browser's HTTP-only cookie.
   */
  if (accessToken) {
    headers.Cookie =
      `accessToken=${accessToken}`;
  }

  const response = await fetch(
    `${API_URL}/tasks`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers,
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get tasks failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch tasks"
    );
  }

  return response.json();
}

export async function deleteTask(
  id: string,
  workspaceId?: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/tasks/${id}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        ...getWorkspaceHeaders(
          workspaceId
        ),
      },
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Delete task failed:",
      errorText
    );

    throw new Error(
      "Failed to delete task"
    );
  }
}

export async function updateTask(
  id: string,
  data: Partial<
    Omit<Task, "members">
  > & {
    members?: string[];
  },
  workspaceId?: string
): Promise<Task> {
  const response = await fetch(
    `${API_URL}/tasks/${id}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
        ...getWorkspaceHeaders(
          workspaceId
        ),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Update task failed:",
      errorText
    );

    throw new Error(
      "Failed to update task"
    );
  }

  return response.json();
}

interface CreateTaskData {
  title: string;
  description?: string;
  status?:
    | "todo"
    | "doing"
    | "completed";
  priority?:
    | "urgent"
    | "high"
    | "medium"
    | "low";
  dueDate?: string;
  project?: string;
  reporter?: string;
  members?: string[];
  labels?: string[];
}

export async function createTask(
  data: CreateTaskData,
  workspaceId?: string
): Promise<Task> {
  const response = await fetch(
    `${API_URL}/tasks`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
        ...getWorkspaceHeaders(
          workspaceId
        ),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Create task failed:",
      errorText
    );

    throw new Error(
      "Failed to create task"
    );
  }

  return response.json();
}

export async function getTask(
  id: string,
  workspaceId?: string,
  accessToken?: string
): Promise<Task> {
  const headers: Record<
    string,
    string
  > = {
    ...getWorkspaceHeaders(
      workspaceId
    ),
  };

  if (accessToken) {
    headers.Cookie =
      `accessToken=${accessToken}`;
  }

  const response = await fetch(
    `${API_URL}/tasks/${id}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers,
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get task failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch task"
    );
  }

  return response.json();
}

/* =========================
   Subtasks
========================= */

export async function getSubtasks(
  taskId: string
): Promise<Subtask[]> {
  const response = await fetch(
    `${API_URL}/subtasks/task/${taskId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch subtasks"
    );
  }

  return response.json();
}

export async function createSubtask(
  data: CreateSubtaskData
): Promise<Subtask> {
  const response = await fetch(
    `${API_URL}/subtasks`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Create subtask failed:",
      errorText
    );

    throw new Error(
      "Failed to create subtask"
    );
  }

  return response.json();
}

export async function updateSubtask(
  id: string,
  data: UpdateSubtaskData
): Promise<Subtask> {
  const response = await fetch(
    `${API_URL}/subtasks/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Update subtask failed:",
      errorText
    );

    throw new Error(
      "Failed to update subtask"
    );
  }

  return response.json();
}

export async function deleteSubtask(
  id: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/subtasks/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to delete subtask"
    );
  }
}

/* =========================
   Comments
========================= */

export async function getComments(
  taskId: string
): Promise<Comment[]> {
  const response = await fetch(
    `${API_URL}/comments/task/${taskId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch comments"
    );
  }

  return response.json();
}

export async function createComment(
  data: CreateCommentData
): Promise<Comment> {
  const response = await fetch(
    `${API_URL}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Create comment failed:",
      errorText
    );

    throw new Error(
      "Failed to create comment"
    );
  }

  return response.json();
}

export async function deleteComment(
  id: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/comments/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to delete comment"
    );
  }
}

/* =========================
   Activities
========================= */

export async function getActivities(
  taskId: string
): Promise<Activity[]> {
  const response = await fetch(
    `${API_URL}/activities/task/${taskId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch activities"
    );
  }

  return response.json();
}

/* =========================
   Projects
========================= */

export async function getProjects(
  workspaceId?: string
): Promise<Project[]> {
  const response = await fetch(
    `${API_URL}/projects`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        ...getWorkspaceHeaders(
          workspaceId
        ),
      },
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get projects failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch projects"
    );
  }

  return response.json();
}

export async function getProject(
  id: string,
  workspaceId?: string,
  accessToken?: string
): Promise<Project> {
  const headers: Record<
    string,
    string
  > = {
    ...getWorkspaceHeaders(
      workspaceId
    ),
  };

  if (accessToken) {
    headers.Cookie =
      `accessToken=${accessToken}`;
  }

  const response = await fetch(
    `${API_URL}/projects/${id}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers,
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get project failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch project"
    );
  }

  return response.json();
}

export async function createProject(
  data: CreateProjectData,
  workspaceId?: string
): Promise<Project> {
  const response = await fetch(
    `${API_URL}/projects`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
        ...getWorkspaceHeaders(
          workspaceId
        ),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Create project failed:",
      errorText
    );

    throw new Error(
      "Failed to create project"
    );
  }

  return response.json();
}

export async function updateProject(
  id: string,
  data: UpdateProjectData,
  workspaceId?: string
): Promise<Project> {
  const response = await fetch(
    `${API_URL}/projects/${id}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
        ...getWorkspaceHeaders(
          workspaceId
        ),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Update project failed:",
      errorText
    );

    throw new Error(
      "Failed to update project"
    );
  }

  return response.json();
}

export async function deleteProject(
  id: string,
  workspaceId?: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/projects/${id}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        ...getWorkspaceHeaders(
          workspaceId
        ),
      },
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Delete project failed:",
      errorText
    );

    throw new Error(
      "Failed to delete project"
    );
  }
}

export async function getProjectTasks(
  projectId: string,
  workspaceId?: string,
  accessToken?: string
): Promise<Task[]> {
  const headers: Record<
    string,
    string
  > = {
    ...getWorkspaceHeaders(
      workspaceId
    ),
  };

  if (accessToken) {
    headers.Cookie =
      `accessToken=${accessToken}`;
  }

  const response = await fetch(
    `${API_URL}/projects/${projectId}/tasks`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers,
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get project tasks failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch project tasks"
    );
  }

  return response.json();
}

/* =========================
   Users
========================= */

export async function getUsers(): Promise<
  User[]
> {
  const response = await fetch(
    `${API_URL}/users`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get users failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch users"
    );
  }

  return response.json();
}

export async function getUser(
  id: string
): Promise<User> {
  const response = await fetch(
    `${API_URL}/users/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Get user failed:",
      errorText
    );

    throw new Error(
      "Failed to fetch user"
    );
  }

  return response.json();
}

export async function updateUser(
  id: string,
  data: UpdateUserData
): Promise<User> {
  const response = await fetch(
    `${API_URL}/users/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Update user failed:",
      errorText
    );

    throw new Error(
      "Failed to update user"
    );
  }

  return response.json();
}