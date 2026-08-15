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
  Project,
  ProjectDocument,
} from './schemas/project.schema';

import {
  CreateProjectDto,
} from './dto/create-project.dto';

import {
  UpdateProjectDto,
} from './dto/update-project.dto';

import {
  Workspace,
  WorkspaceDocument,
  WorkspaceMemberRole,
} from '../workspaces/schemas/workspace.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
  ) {}

  /*
   * Make sure the workspace exists and
   * the current user belongs to it.
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
   * Only owners and admins can create,
   * update or delete projects.
   */
  private ensureCanManageProjects(
    workspace: WorkspaceDocument,
    userId: string,
  ): void {
    const role =
      this.getUserRole(
        workspace,
        userId,
      );

    if (
      role !==
        WorkspaceMemberRole.OWNER &&
      role !==
        WorkspaceMemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only workspace owners and admins can manage projects',
      );
    }
  }

  /*
   * Validate that every project member
   * belongs to the same workspace.
   */
  private validateProjectMembers(
    workspace: WorkspaceDocument,
    memberIds?: string[],
  ): void {
    if (!memberIds) {
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

    for (const memberId of memberIds) {
      if (
        !Types.ObjectId.isValid(
          memberId,
        )
      ) {
        throw new ForbiddenException(
          'Invalid project member ID',
        );
      }

      if (
        !workspaceUserIds.has(
          memberId,
        )
      ) {
        throw new ForbiddenException(
          'All project members must belong to the workspace',
        );
      }
    }
  }

  /*
   * Validate that a lead belongs to
   * the workspace.
   */
  private validateProjectLead(
    workspace: WorkspaceDocument,
    leadId: string,
  ): void {
    if (
      !Types.ObjectId.isValid(
        leadId,
      )
    ) {
      throw new ForbiddenException(
        'Invalid project lead ID',
      );
    }

    const isOwner =
      workspace.owner.toString() ===
      leadId;

    const isMember =
      workspace.members.some(
        (member) =>
          member.user.toString() ===
          leadId,
      );

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'Project lead must belong to the workspace',
      );
    }
  }

  async create(
    createProjectDto: CreateProjectDto,
    workspaceId: string,
    userId: string,
  ): Promise<ProjectDocument> {
    const workspace =
      await this.getAuthorizedWorkspace(
        workspaceId,
        userId,
      );

    this.ensureCanManageProjects(
      workspace,
      userId,
    );

    this.validateProjectMembers(
      workspace,
      createProjectDto.members,
    );

    this.validateProjectLead(
      workspace,
      createProjectDto.lead,
    );

    const project =
      new this.projectModel({
        ...createProjectDto,

        workspace:
          new Types.ObjectId(
            workspaceId,
          ),

        lead: new Types.ObjectId(
          createProjectDto.lead,
        ),

        members:
          createProjectDto.members?.map(
            (memberId) =>
              new Types.ObjectId(
                memberId,
              ),
          ) || [],
      });

    return project.save();
  }

  async findAll(
    workspaceId: string,
    userId: string,
  ): Promise<ProjectDocument[]> {
    await this.getAuthorizedWorkspace(
      workspaceId,
      userId,
    );

    return this.projectModel
      .find({
        workspace:
          new Types.ObjectId(
            workspaceId,
          ),
      })
      .populate('workspace')
      .populate('lead')
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
  ): Promise<ProjectDocument> {
    await this.getAuthorizedWorkspace(
      workspaceId,
      userId,
    );

    const project =
      await this.projectModel
        .findOne({
          _id: id,
          workspace:
            new Types.ObjectId(
              workspaceId,
            ),
        })
        .populate('workspace')
        .populate('lead')
        .populate('members')
        .exec();

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    workspaceId: string,
    userId: string,
  ): Promise<ProjectDocument> {
    const workspace =
      await this.getAuthorizedWorkspace(
        workspaceId,
        userId,
      );

    this.ensureCanManageProjects(
      workspace,
      userId,
    );

    this.validateProjectMembers(
      workspace,
      updateProjectDto.members,
    );

    if (
      updateProjectDto.lead
    ) {
      this.validateProjectLead(
        workspace,
        updateProjectDto.lead,
      );
    }

    const project =
      await this.projectModel
        .findOne({
          _id: id,
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

    const updateData: Record<
      string,
      unknown
    > = {
      ...updateProjectDto,
    };

    if (
      updateProjectDto.lead
    ) {
      updateData.lead =
        new Types.ObjectId(
          updateProjectDto.lead,
        );
    }

    if (
      updateProjectDto.members
    ) {
      updateData.members =
        updateProjectDto.members.map(
          (memberId) =>
            new Types.ObjectId(
              memberId,
            ),
        );
    }

    const updatedProject =
      await this.projectModel
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
        .populate('workspace')
        .populate('lead')
        .populate('members')
        .exec();

    if (!updatedProject) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    return updatedProject;
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

    this.ensureCanManageProjects(
      workspace,
      userId,
    );

    const result =
      await this.projectModel
        .findOneAndDelete({
          _id: id,
          workspace:
            new Types.ObjectId(
              workspaceId,
            ),
        })
        .exec();

    if (!result) {
      throw new NotFoundException(
        'Project not found',
      );
    }
  }
}