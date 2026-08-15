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
  TasksService,
} from './tasks.service';

import {
  CreateTaskDto,
} from './dto/create-task.dto';

import {
  UpdateTaskDto,
} from './dto/update-task.dto';

interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
}

const ACCESS_TOKEN_COOKIE =
  'accessToken';

const WORKSPACE_HEADER =
  'x-workspace-id';

@Controller('tasks')
export class TasksController {
  constructor(
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
    createTaskDto: CreateTaskDto,

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

    return this.tasksService.create(
      createTaskDto,
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

    return this.tasksService.findAll(
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

    return this.tasksService.findOne(
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
    updateTaskDto: UpdateTaskDto,

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

    return this.tasksService.update(
      id,
      updateTaskDto,
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

    return this.tasksService.remove(
      id,
      workspaceId,
      userId,
    );
  }
}