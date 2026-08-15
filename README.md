# Assessment — Collaborative Project & Task Management Platform

A full-stack project management application built for collaborative workspaces. Users can create and manage workspaces, projects, and tasks, collaborate with workspace members, and control access through role-based permissions.

## Overview

The application is designed around a workspace-based project management workflow:

- Users authenticate with JWT-based authentication.
- Users can create or join multiple workspaces.
- Each workspace has its own projects, tasks, and members.
- Projects can contain multiple tasks.
- Tasks support status, priority, due dates, labels, members, comments, subtasks, and activity history.
- Role-based access control (RBAC) distinguishes owners, admins, and members.
- Workspace selection is persisted and automatically reflected throughout the application.

## Key Features

### Authentication

- User registration and login
- JWT access-token authentication
- Authenticated server-side requests
- Protected workspace/project/task operations

### Workspaces

- Create workspaces
- Switch between workspaces
- Workspace-specific data isolation
- View workspace members
- Add and remove members
- Leave a workspace
- Owner, admin, and member roles

### Projects

- Create, view, edit, and delete projects
- Project priority and due date
- Project lead
- Project members
- Project-specific task lists
- Create tasks directly from a project

### Tasks

- Create, view, edit, and delete tasks
- Task status: To Do, Doing, Completed, On Hold
- Task priority
- Due dates
- Labels
- Task members
- Project assignment
- Subtasks
- Comments
- Activity history
- Task detail pages
- List/board-oriented task management UI

### RBAC & Security

The application enforces permissions on the backend as well as reflecting them in the frontend.

| Role | Workspace | Projects | Tasks |
|---|---|---|---|
| Owner | Full control | Create / update / delete | Full task management |
| Admin | Member management | Create / update / delete | Full task management |
| Member | Normal workspace access | View only | Create tasks and modify tasks they report or are assigned to |

Backend authorization also verifies that workspace, project, member, reporter, and task relationships belong to the correct workspace.

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- NestJS
- TypeScript
- Mongoose
- MongoDB
- JWT authentication

### Database / Infrastructure

- MongoDB Atlas
- REST API architecture

## Project Structure

```text
Assessment/
├── client/                 # Next.js frontend
│   ├── app/                # App Router pages
│   ├── components/        # Reusable UI components
│   ├── lib/               # API helpers and client utilities
│   └── types/             # Frontend TypeScript types
│
├── server/                 # NestJS backend
│   └── src/
│       ├── auth/           # Authentication
│       ├── users/          # User management
│       ├── workspaces/     # Workspace and member management
│       ├── projects/       # Project management
│       ├── tasks/          # Task management
│       ├── comments/       # Comments
│       ├── subtasks/       # Subtasks
│       └── activities/     # Activity history
│
└── README.md
```

## Local Development

### Prerequisites

Make sure you have installed:

- Node.js 18+
- npm
- MongoDB / MongoDB Atlas account

### 1. Clone the repository

```bash
git clone https://github.com/mehta-dev/Assessment.git
cd Assessment
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file in `server/` with the values required by the backend. Do not commit this file to GitHub.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_token_secret
PORT=4000
```

> Use the environment variable names required by the current backend configuration. Never commit real credentials, database passwords, or JWT secrets.

### 3. Start the backend

```bash
npm run start:dev
```

The backend runs locally on:

```text
http://localhost:4000
```

### 4. Configure and start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs locally on:

```text
http://localhost:3000
```

## Workspace Data Isolation

Workspace selection is persisted in the browser and is also stored in a cookie so that server-rendered pages can read the selected workspace.

Requests to workspace-scoped backend endpoints include:

```text
Authentication token
+
X-Workspace-Id
```

The backend then verifies that the authenticated user belongs to the selected workspace before returning or modifying data.

This prevents data from one workspace from being exposed through another workspace.

## RBAC

Authorization is enforced server-side and is not dependent on frontend visibility alone.

Examples:

- Members cannot create or modify projects.
- Admins and owners can manage projects.
- Members cannot modify unrelated tasks.
- Members can modify tasks they report or are assigned to.
- Admins cannot remove other admins.
- Workspace ownership cannot be assigned through the member-management endpoint.

## API Overview

The backend exposes REST endpoints for:

```text
/auth
/users
/workspaces
/projects
/tasks
/comments
/subtasks
/activities
```

Workspace-scoped requests use the `X-Workspace-Id` header where required.

## UI Highlights

The application includes:

- Responsive dashboard layout
- Settings and workspace selector
- Workspace-aware task and project pages
- Project detail and task detail views
- Search/filter-oriented task management
- List/board-oriented task display
- Contextual action menus
- Workspace-aware member management
- Loading, empty, and error states

## Screenshots

Add screenshots of the final application here before submission.

Recommended screenshots:

1. Dashboard / Tasks
2. Project list
3. Project details with project tasks
4. Task details
5. Settings / Workspace selector
6. Workspace members / RBAC behavior

Example:

```md
![Dashboard](docs/screenshots/dashboard.png)
![Projects](docs/screenshots/projects.png)
![Task Details](docs/screenshots/task-details.png)
![Settings](docs/screenshots/settings.png)
```

## Testing Checklist

Before deployment/submission, verify:

- [ ] User can register and log in
- [ ] Workspace can be created
- [ ] Workspace can be switched without a manual page refresh
- [ ] Projects are isolated by workspace
- [ ] Tasks are isolated by workspace
- [ ] Project tasks appear correctly in project details
- [ ] Owner permissions work
- [ ] Admin permissions work
- [ ] Member restrictions work
- [ ] A user cannot access another workspace's data by changing IDs/headers
- [ ] Task/project create, update, and delete flows work
- [ ] Comments and subtasks work
- [ ] No secrets are committed to GitHub

## Deployment

The application is intended to be deployed as two services:

```text
Frontend  → Next.js deployment
Backend   → NestJS/Node.js deployment
Database  → MongoDB Atlas
```

When deploying, update the frontend API URL and backend environment variables to point to the production services.

## Security Notes

- Keep `.env` files out of version control.
- Use strong production JWT secrets.
- Restrict MongoDB Atlas network access appropriately.
- Enforce authorization on the backend for all workspace-scoped resources.
- Do not rely on hidden frontend buttons as the security boundary.

## Future Improvements

Possible future enhancements include:

- Automated unit/integration tests
- Real-time task updates
- Notifications
- More advanced board interactions
- File attachments
- Richer reporting and analytics
- Production monitoring and logging

## Repository

GitHub: https://github.com/mehta-dev/Assessment

## License

This project was created as an assessment/project submission.
