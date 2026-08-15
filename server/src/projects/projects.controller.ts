import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtService } from '@nestjs/jwt';

import {
  ProjectsService,
} from './projects.service';

import {
  CreateProjectDto,
} from './dto/create-project.dto';

import {
  UpdateProjectDto,
} from './dto/update-project.dto';

import {
  TasksService,
} from '../tasks/tasks.service';

interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
}

const ACCESS_TOKEN_COOKIE =
  'accessToken';

const WORKSPACE_HEADER =
  'x-workspace-id';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,

    private readonly tasksService: TasksService,

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

  private getWorkspaceId(
    request: Request,
  ): string {
    const workspaceId =
      request.headers[
        WORKSPACE_HEADER
      ];

    if (
      typeof workspaceId !==
        'string' ||
      !workspaceId.trim()
    ) {
      throw new UnauthorizedException(
        'Workspace selection is required',
      );
    }

    return workspaceId.trim();
  }

  @Post()
  create(
    @Body()
    createProjectDto: CreateProjectDto,

    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    const workspaceId =
      this.getWorkspaceId(
        request,
      );

    return this.projectsService.create(
      createProjectDto,
      workspaceId,
      userId,
    );
  }

  @Get()
  findAll(
    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    const workspaceId =
      this.getWorkspaceId(
        request,
      );

    return this.projectsService.findAll(
      workspaceId,
      userId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,

    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    const workspaceId =
      this.getWorkspaceId(
        request,
      );

    return this.projectsService.findOne(
      id,
      workspaceId,
      userId,
    );
  }

  @Get(':id/tasks')
  findTasks(
    @Param('id')
    id: string,

    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    const workspaceId =
      this.getWorkspaceId(
        request,
      );

    return this.tasksService.findByProject(
      id,
      workspaceId,
      userId,
    );
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    updateProjectDto: UpdateProjectDto,

    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    const workspaceId =
      this.getWorkspaceId(
        request,
      );

    return this.projectsService.update(
      id,
      updateProjectDto,
      workspaceId,
      userId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,

    @Req()
    request: Request,
  ) {
    const userId =
      this.getCurrentUserId(
        request,
      );

    const workspaceId =
      this.getWorkspaceId(
        request,
      );

    return this.projectsService.remove(
      id,
      workspaceId,
      userId,
    );
  }
}