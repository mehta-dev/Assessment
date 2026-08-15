import {
  ConflictException,
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
  Workspace,
  WorkspaceDocument,
  WorkspaceMemberRole,
} from './schemas/workspace.schema';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
  ) {}

  async create(
    name: string,
    ownerId: string,
  ): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new ConflictException(
        'Invalid owner ID',
      );
    }

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      throw new ConflictException(
        'Workspace name is required',
      );
    }

    const workspace =
      new this.workspaceModel({
        name: trimmedName,

        owner: new Types.ObjectId(
          ownerId,
        ),

        members: [
          {
            user: new Types.ObjectId(
              ownerId,
            ),

            role:
              WorkspaceMemberRole.OWNER,

            joinedAt: new Date(),
          },
        ],
      });

    return workspace.save();
  }

  async findOne(
    id: string,
  ): Promise<WorkspaceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Workspace not found',
      );
    }

    const workspace =
      await this.workspaceModel
        .findById(id)
        .populate('owner')
        .populate('members.user')
        .exec();

    if (!workspace) {
      throw new NotFoundException(
        'Workspace not found',
      );
    }

    return workspace;
  }

  async findForUser(
    userId: string,
  ): Promise<WorkspaceDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }

    return this.workspaceModel
      .find({
        $or: [
          {
            owner:
              new Types.ObjectId(
                userId,
              ),
          },
          {
            'members.user':
              new Types.ObjectId(
                userId,
              ),
          },
        ],
      })
      .populate('owner')
      .populate('members.user')
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async getMembers(
    workspaceId: string,
    userId: string,
  ): Promise<unknown[]> {
    const workspace =
      await this.getWorkspace(
        workspaceId,
      );

    /*
     * Any workspace member can view the
     * membership list.
     */
    const userRole =
      this.getMemberRole(
        workspace,
        userId,
      );

    if (!userRole) {
      throw new ForbiddenException(
        'You are not a member of this workspace',
      );
    }

    const populatedWorkspace =
      await this.workspaceModel
        .findById(workspaceId)
        .populate('members.user')
        .exec();

    if (!populatedWorkspace) {
      throw new NotFoundException(
        'Workspace not found',
      );
    }

    return populatedWorkspace.members.map(
      (member) => ({
        user: member.user,
        role: member.role,
        joinedAt: member.joinedAt,
      }),
    );
  }

  private async getWorkspace(
    workspaceId: string,
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

    return workspace;
  }

  private getMemberRole(
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

  private ensureCanManageMembers(
    workspace: WorkspaceDocument,
    userId: string,
  ): void {
    const role =
      this.getMemberRole(
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
        'Only workspace owners and admins can manage members',
      );
    }
  }

  private ensureOwner(
    workspace: WorkspaceDocument,
    userId: string,
  ): void {
    const role =
      this.getMemberRole(
        workspace,
        userId,
      );

    if (
      role !== WorkspaceMemberRole.OWNER
    ) {
      throw new ForbiddenException(
        'Only the workspace owner can perform this action',
      );
    }
  }

  async addMember(
    workspaceId: string,
    actorId: string,
    userId: string,
    role:
      | WorkspaceMemberRole
      | undefined,
  ): Promise<WorkspaceDocument> {
    const workspace =
      await this.getWorkspace(
        workspaceId,
      );

    this.ensureCanManageMembers(
      workspace,
      actorId,
    );

    if (
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      throw new ConflictException(
        'Invalid user ID',
      );
    }

    if (
      workspace.owner.toString() ===
      userId
    ) {
      throw new ConflictException(
        'User is already the workspace owner',
      );
    }

    const alreadyMember =
      workspace.members.some(
        (member) =>
          member.user.toString() ===
          userId,
      );

    if (alreadyMember) {
      throw new ConflictException(
        'User is already a workspace member',
      );
    }

    /*
     * Ownership can never be granted
     * through member creation.
     */
    if (
      role ===
      WorkspaceMemberRole.OWNER
    ) {
      throw new ForbiddenException(
        'Ownership cannot be assigned through this endpoint',
      );
    }

    /*
     * Admins may add members or admins.
     * Ownership remains owner-only.
     */
    const memberRole =
      role ===
      WorkspaceMemberRole.ADMIN
        ? WorkspaceMemberRole.ADMIN
        : WorkspaceMemberRole.MEMBER;

    workspace.members.push({
      user: new Types.ObjectId(
        userId,
      ),

      role: memberRole,

      joinedAt: new Date(),
    });

    await workspace.save();

    return this.findOne(
      workspaceId,
    );
  }

  async removeMember(
    workspaceId: string,
    actorId: string,
    userId: string,
  ): Promise<WorkspaceDocument> {
    const workspace =
      await this.getWorkspace(
        workspaceId,
      );

    this.ensureCanManageMembers(
      workspace,
      actorId,
    );

    if (
      workspace.owner.toString() ===
      userId
    ) {
      throw new ConflictException(
        'Workspace owner cannot be removed',
      );
    }

    if (
      actorId === userId
    ) {
      throw new ConflictException(
        'Use the leave workspace action to remove yourself',
      );
    }

    const targetMember =
      workspace.members.find(
        (member) =>
          member.user.toString() ===
          userId,
      );

    if (!targetMember) {
      throw new NotFoundException(
        'Workspace member not found',
      );
    }

    const actorRole =
      this.getMemberRole(
        workspace,
        actorId,
      );

    /*
     * Admins can remove normal members,
     * but only the owner can remove admins.
     */
    if (
      actorRole ===
        WorkspaceMemberRole.ADMIN &&
      targetMember.role ===
        WorkspaceMemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Admins cannot remove other admins',
      );
    }

    workspace.members =
      workspace.members.filter(
        (member) =>
          member.user.toString() !==
          userId,
      );

    await workspace.save();

    return this.findOne(
      workspaceId,
    );
  }

  async leaveWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace =
      await this.getWorkspace(
        workspaceId,
      );

    const role =
      this.getMemberRole(
        workspace,
        userId,
      );

    if (!role) {
      throw new NotFoundException(
        'You are not a member of this workspace',
      );
    }

    /*
     * The owner cannot leave because the
     * workspace would be left without an owner.
     */
    if (
      role ===
      WorkspaceMemberRole.OWNER
    ) {
      throw new ConflictException(
        'Workspace owner cannot leave the workspace',
      );
    }

    workspace.members =
      workspace.members.filter(
        (member) =>
          member.user.toString() !==
          userId,
      );

    await workspace.save();
  }
}