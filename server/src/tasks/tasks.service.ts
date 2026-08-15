import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Task,
  TaskDocument,
} from './schemas/task.schema';

import {
  CreateTaskDto,
} from './dto/create-task.dto';

import {
  UpdateTaskDto,
} from './dto/update-task.dto';

import {
  ActivitiesService,
} from '../activities/activities.service';

import {
  ActivityType,
} from '../activities/schemas/activity.schema';

import {
  Workspace,
  WorkspaceDocument,
  WorkspaceMemberRole,
} from '../workspaces/schemas/workspace.schema';

import {
  Project,
  ProjectDocument,
} from '../projects/schemas/project.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,

    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    private readonly activitiesService: ActivitiesService,
  ) {}

  /*
   * Make sure the workspace exists and
   * the authenticated user belongs to it.
   */
  private async getAuthorizedWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceDocument> {
    if (
      !Types.ObjectId.isValid(
        workspaceId,
      )
    ) {
      throw new NotFoundException(
        'Workspace not found',
      );
    }

    const workspace =
      await this.workspaceModel
        .findById(workspaceId)
        .exec();

    if (!workspace) {
      throw new NotFoundException(
        'Workspace not found',
      );
    }

    const isOwner =
      workspace.owner.toString() ===
      userId;

    const isMember =
      workspace.members.some(
        (member) =>
          member.user.toString() ===
          userId,
      );

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You are not a member of this workspace',
      );
    }

    return workspace;
  }

  /*
   * Return the current user's role
   * inside the workspace.
   */
  private getUserRole(
    workspace: WorkspaceDocument,
    userId: string,
  ): WorkspaceMemberRole | null {
    if (
      workspace.owner.toString() ===
      userId
    ) {
      return WorkspaceMemberRole.OWNER;
    }

    const member =
      workspace.members.find(
        (item) =>
          item.user.toString() ===
          userId,
      );

    return member?.role || null;
  }

  /*
   * Check whether the user can manage
   * any task in the workspace.
   *
   * Owners and admins can manage all tasks.
   */
  private canManageAllTasks(
    workspace: WorkspaceDocument,
    userId: string,
  ): boolean {
    const role =
      this.getUserRole(
        workspace,
        userId,
      );

    return (
      role ===
        WorkspaceMemberRole.OWNER ||
      role ===
        WorkspaceMemberRole.ADMIN
    );
  }

  /*
   * Check whether a normal member is
   * allowed to modify this particular task.
   *
   * A member can modify a task when they
   * are the reporter or an assigned member.
   */
  private canManageOwnTask(
    task: TaskDocument,
    userId: string,
  ): boolean {
    const isReporter =
      task.reporter?.toString() ===
      userId;

    const isAssignedMember =
      task.members.some(
        (member) =>
          member.toString() ===
          userId,
      );

    return (
      isReporter ||
      isAssignedMember
    );
  }

  /*
   * Enforce task modification permissions.
   *
   * Owner/admin -> any task
   * Member      -> own/assigned task only
   */
  private ensureCanModifyTask(
    workspace: WorkspaceDocument,
    task: TaskDocument,
    userId: string,
  ): void {
    if (
      this.canManageAllTasks(
        workspace,
        userId,
      )
    ) {
      return;
    }

    if (
      !this.canManageOwnTask(
        task,
        userId,
      )
    ) {
      throw new ForbiddenException(
        'You do not have permission to modify this task',
      );
    }
  }

  /*
   * Check that supplied user IDs belong
   * to the current workspace.
   */
  private validateWorkspaceUsers(
    workspace: WorkspaceDocument,
    userIds?: string[],
  ): void {
    if (!userIds) {
      return;
    }

    const workspaceUserIds =
      new Set<string>();

    workspaceUserIds.add(
      workspace.owner.toString(),
    );

    for (const member of workspace.members) {
      workspaceUserIds.add(
        member.user.toString(),
      );
    }

    for (const userId of userIds) {
      if (
        !Types.ObjectId.isValid(
          userId,
        )
      ) {
        throw new ForbiddenException(
          'Invalid user ID',
        );
      }

      if (
        !workspaceUserIds.has(
          userId,
        )
      ) {
        throw new ForbiddenException(
          'All task users must belong to the workspace',
        );
      }
    }
  }

  /*
   * Check that a project exists and
   * belongs to the same workspace.
   */
  private async validateProject(
    projectId: string | undefined,
    workspaceId: string,
  ): Promise<void> {
    if (!projectId) {
      return;
    }

    if (
      !Types.ObjectId.isValid(
        projectId,
      )
    ) {
      throw new ForbiddenException(
        'Invalid project ID',
      );
    }

    const project =
      await this.projectModel
        .findOne({
          _id: projectId,
          workspace:
            new Types.ObjectId(
              workspaceId,
            ),
        })
        .exec();

    if (!project) {
      throw new ForbiddenException(
        'Project does not belong to this workspace',
      );
    }
  }

  async create(
    createTaskDto: CreateTaskDto,
    workspaceId: string,
    userId: string,
  ): Promise<TaskDocument> {
    const workspace =
      await this.getAuthorizedWorkspace(
        workspaceId,
        userId,
      );

    /*
     * Reporter must belong to the
     * current workspace.
     */
    this.validateWorkspaceUsers(
      workspace,
      [createTaskDto.reporter],
    );

    /*
     * Task members must belong to the
     * current workspace.
     */
    this.validateWorkspaceUsers(
      workspace,
      createTaskDto.members,
    );

    /*
     * Project, when supplied, must belong
     * to the same workspace.
     */
    await this.validateProject(
      createTaskDto.project,
      workspaceId,
    );

    /*
     * A normal member can only create a
     * task as themselves.
     *
     * Owner/admin may create a task on
     * behalf of another workspace user.
     */
    if (
      !this.canManageAllTasks(
        workspace,
        userId,
      ) &&
      createTaskDto.reporter !==
        userId
    ) {
      throw new ForbiddenException(
        'Members can only create tasks reported by themselves',
      );
    }

    const task =
      new this.taskModel({
        ...createTaskDto,

        workspace:
          new Types.ObjectId(
            workspaceId,
          ),

        project:
          createTaskDto.project
            ? new Types.ObjectId(
                createTaskDto.project,
              )
            : undefined,

        reporter:
          new Types.ObjectId(
            createTaskDto.reporter,
          ),

        members:
          createTaskDto.members?.map(
            (memberId) =>
              new Types.ObjectId(
                memberId,
              ),
          ) || [],
      });

    const savedTask =
      await task.save();

    if (savedTask.reporter) {
      await this.activitiesService.create({
        task:
          savedTask._id.toString(),

        actor:
          savedTask.reporter.toString(),

        type:
          ActivityType.TASK_CREATED,

        message:
          `created task "${savedTask.title}"`,
      });
    }

    return this.findOne(
      savedTask._id.toString(),
      workspaceId,
      userId,
    );
  }

  async findAll(
    workspaceId: string,
    userId: string,
  ): Promise<TaskDocument[]> {
    await this.getAuthorizedWorkspace(
      workspaceId,
      userId,
    );

    return this.taskModel
      .find({
        workspace:
          new Types.ObjectId(
            workspaceId,
          ),
      })
      .populate('workspace')
      .populate('project')
      .populate('reporter')
      .populate('members')
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findOne(
    id: string,
    workspaceId: string,
    userId: string,
  ): Promise<TaskDocument> {
    await this.getAuthorizedWorkspace(
      workspaceId,
      userId,
    );

    const task =
      await this.taskModel
        .findOne({
          _id: id,
          workspace:
            new Types.ObjectId(
              workspaceId,
            ),
        })
        .populate('workspace')
        .populate('project')
        .populate('reporter')
        .populate('members')
        .exec();

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    workspaceId: string,
    userId: string,
  ): Promise<TaskDocument> {
    const workspace =
      await this.getAuthorizedWorkspace(
        workspaceId,
        userId,
      );

    const existingTask =
      await this.taskModel
        .findOne({
          _id: id,
          workspace:
            new Types.ObjectId(
              workspaceId,
            ),
        })
        .exec();

    if (!existingTask) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    /*
     * RBAC check happens before any
     * modification is performed.
     */
    this.ensureCanModifyTask(
      workspace,
      existingTask,
      userId,
    );

    /*
     * Validate any changed reporter.
     */
    if (
      updateTaskDto.reporter
    ) {
      this.validateWorkspaceUsers(
        workspace,
        [updateTaskDto.reporter],
      );
    }

    /*
     * Normal members cannot transfer
     * responsibility to another reporter.
     */
    if (
      updateTaskDto.reporter &&
      !this.canManageAllTasks(
        workspace,
        userId,
      ) &&
      updateTaskDto.reporter !==
        userId
    ) {
      throw new ForbiddenException(
        'Members cannot assign another reporter',
      );
    }

    /*
     * Validate any changed members.
     */
    if (
      updateTaskDto.members
    ) {
      this.validateWorkspaceUsers(
        workspace,
        updateTaskDto.members,
      );
    }

    /*
     * Validate any changed project.
     */
    if (
      updateTaskDto.project
    ) {
      await this.validateProject(
        updateTaskDto.project,
        workspaceId,
      );
    }

    /*
     * Normal members cannot remove
     * themselves from a task's member list
     * when doing so would make them no
     * longer responsible for the task.
     *
     * Admins/owners can freely manage
     * assignments.
     */
    if (
      updateTaskDto.members &&
      !this.canManageAllTasks(
        workspace,
        userId,
      )
    ) {
      const stillAssigned =
        updateTaskDto.members.includes(
          userId,
        ) ||
        updateTaskDto.reporter ===
          userId ||
        (
          updateTaskDto.reporter ===
            undefined &&
          existingTask.reporter.toString() ===
            userId
        );

      if (!stillAssigned) {
        throw new ForbiddenException(
          'Members cannot remove themselves from responsibility for their task',
        );
      }
    }

    const updateData: Record<
      string,
      unknown
    > = {
      ...updateTaskDto,
    };

    if (
      updateTaskDto.project !==
      undefined
    ) {
      updateData.project =
        updateTaskDto.project
          ? new Types.ObjectId(
              updateTaskDto.project,
            )
          : undefined;
    }

    if (
      updateTaskDto.reporter
    ) {
      updateData.reporter =
        new Types.ObjectId(
          updateTaskDto.reporter,
        );
    }

    if (
      updateTaskDto.members
    ) {
      updateData.members =
        updateTaskDto.members.map(
          (memberId) =>
            new Types.ObjectId(
              memberId,
            ),
        );
    }

    /*
     * Workspace is intentionally never
     * included in updateData.
     */
    const updatedTask =
      await this.taskModel
        .findOneAndUpdate(
          {
            _id: id,
            workspace:
              new Types.ObjectId(
                workspaceId,
              ),
          },
          updateData,
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();

    if (!updatedTask) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    /*
     * Activities are attributed to the
     * authenticated user performing the
     * operation.
     */
    const actor = userId;

    if (
      updateTaskDto.status &&
      updateTaskDto.status !==
        existingTask.status
    ) {
      await this.activitiesService.create({
        task: id,
        actor,
        type:
          ActivityType.STATUS_CHANGED,
        message:
          `changed status from ${existingTask.status} to ${updateTaskDto.status}`,
        metadata: {
          from:
            existingTask.status,
          to:
            updateTaskDto.status,
        },
      });
    }

    if (
      updateTaskDto.priority &&
      updateTaskDto.priority !==
        existingTask.priority
    ) {
      await this.activitiesService.create({
        task: id,
        actor,
        type:
          ActivityType.PRIORITY_CHANGED,
        message:
          `changed priority from ${existingTask.priority} to ${updateTaskDto.priority}`,
        metadata: {
          from:
            existingTask.priority,
          to:
            updateTaskDto.priority,
        },
      });
    }

    if (
      updateTaskDto.dueDate !==
      undefined
    ) {
      const oldDate =
        existingTask.dueDate
          ? existingTask.dueDate.toISOString()
          : undefined;

      const newDate =
        updateTaskDto.dueDate
          ? new Date(
              updateTaskDto.dueDate,
            ).toISOString()
          : undefined;

      if (
        oldDate !== newDate
      ) {
        await this.activitiesService.create({
          task: id,
          actor,
          type:
            ActivityType.DUE_DATE_CHANGED,
          message:
            newDate
              ? 'changed the due date'
              : 'removed the due date',
          metadata: {
            from:
              oldDate ?? null,
            to:
              newDate ?? null,
          },
        });
      }
    }

    const onlyBasicFieldsChanged =
      updateTaskDto.title !==
        undefined ||
      updateTaskDto.description !==
        undefined ||
      updateTaskDto.project !==
        undefined ||
      updateTaskDto.reporter !==
        undefined ||
      updateTaskDto.members !==
        undefined ||
      updateTaskDto.labels !==
        undefined;

    if (
      onlyBasicFieldsChanged
    ) {
      await this.activitiesService.create({
        task: id,
        actor,
        type:
          ActivityType.TASK_UPDATED,
        message:
          'updated the task',
      });
    }

    return this.findOne(
      id,
      workspaceId,
      userId,
    );
  }

  async remove(
    id: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace =
      await this.getAuthorizedWorkspace(
        workspaceId,
        userId,
      );

    const task =
      await this.taskModel
        .findOne({
          _id: id,
          workspace:
            new Types.ObjectId(
              workspaceId,
            ),
        })
        .exec();

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    /*
     * Owner/admin can delete any task.
     * Member can delete only a task they
     * report or are assigned to.
     */
    this.ensureCanModifyTask(
      workspace,
      task,
      userId,
    );

    await this.activitiesService.create({
      task: id,

      actor: userId,

      type:
        ActivityType.TASK_DELETED,

      message:
        `deleted task "${task.title}"`,
    });

    await this.taskModel
      .findOneAndDelete({
        _id: id,
        workspace:
          new Types.ObjectId(
            workspaceId,
          ),
      })
      .exec();
  }

  async findByProject(
    projectId: string,
    workspaceId: string,
    userId: string,
  ): Promise<TaskDocument[]> {
    await this.getAuthorizedWorkspace(
      workspaceId,
      userId,
    );

    /*
     * Project must belong to the
     * current workspace.
     */
    const project =
      await this.projectModel
        .findOne({
          _id: projectId,
          workspace:
            new Types.ObjectId(
              workspaceId,
            ),
        })
        .exec();

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    return this.taskModel
      .find({
        project:
          new Types.ObjectId(
            projectId,
          ),

        workspace:
          new Types.ObjectId(
            workspaceId,
          ),
      })
      .populate('workspace')
      .populate('project')
      .populate('reporter')
      .populate('members')
      .sort({
        createdAt: -1,
      })
      .exec();
  }
}