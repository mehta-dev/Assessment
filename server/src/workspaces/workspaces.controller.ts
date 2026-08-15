import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtService } from '@nestjs/jwt';

import {
  WorkspacesService,
} from './workspaces.service';

import {
  CreateWorkspaceDto,
} from './dto/create-workspace.dto';

import {
  WorkspaceMemberRole,
} from './schemas/workspace.schema';

interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
}

const ACCESS_TOKEN_COOKIE =
  'accessToken';

@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,

    private readonly jwtService: JwtService,
  ) {}

  private getCurrentUserId(
    request: Request,
  ): string {
    const accessToken =
      request.cookies?.[
        ACCESS_TOKEN_COOKIE
      ];

    if (!accessToken) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    try {
      const payload =
        this.jwtService.verify<AccessTokenPayload>(
          accessToken,
        );

      if (!payload.sub) {
        throw new UnauthorizedException(
          'Invalid authentication token',
        );
      }

      return payload.sub;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }

  @Post()
  create(
    @Body()
    createWorkspaceDto: CreateWorkspaceDto,

    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    return this.workspacesService.create(
      createWorkspaceDto.name,
      userId,
    );
  }

  @Get('mine')
  findMine(
    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    return this.workspacesService.findForUser(
      userId,
    );
  }

  @Get(':id/members')
  getMembers(
    @Param('id')
    workspaceId: string,

    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    return this.workspacesService.getMembers(
      workspaceId,
      userId,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id')
    id: string,

    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    /*
     * Verify that the current user is
     * actually a member of this workspace
     * before returning its details.
     */
    const workspaces =
      await this.workspacesService.findForUser(
        userId,
      );

    const isAuthorized =
      workspaces.some(
        (workspace) =>
          workspace._id.toString() ===
          id,
      );

    if (!isAuthorized) {
      throw new UnauthorizedException(
        'You do not have access to this workspace',
      );
    }

    return this.workspacesService.findOne(
      id,
    );
  }

  @Post(':id/members')
  addMember(
    @Param('id')
    workspaceId: string,

    @Body('userId')
    userId: string,

    @Body('role')
    role:
      | WorkspaceMemberRole
      | undefined,

    @Req()
    request: Request,
  ) {
    const actorId =
      this.getCurrentUserId(
        request,
      );

    return this.workspacesService.addMember(
      workspaceId,
      actorId,
      userId,
      role,
    );
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id')
    workspaceId: string,

    @Param('userId')
    userId: string,

    @Req()
    request: Request,
  ) {
    const actorId =
      this.getCurrentUserId(
        request,
      );

    return this.workspacesService.removeMember(
      workspaceId,
      actorId,
      userId,
    );
  }

  @Post(':id/leave')
  leaveWorkspace(
    @Param('id')
    workspaceId: string,

    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    return this.workspacesService.leaveWorkspace(
      workspaceId,
      userId,
    );
  }
}