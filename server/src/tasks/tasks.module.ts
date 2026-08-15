import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  TasksController,
} from './tasks.controller';

import {
  TasksService,
} from './tasks.service';

import {
  Task,
  TaskSchema,
} from './schemas/task.schema';

import {
  Workspace,
  WorkspaceSchema,
} from '../workspaces/schemas/workspace.schema';

import {
  Project,
  ProjectSchema,
} from '../projects/schemas/project.schema';

import {
  ActivitiesModule,
} from '../activities/activities.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Task.name,
        schema: TaskSchema,
      },
      {
        name: Workspace.name,
        schema: WorkspaceSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
    ]),

    ActivitiesModule,

    AuthModule,
  ],

  controllers: [
    TasksController,
  ],

  providers: [
    TasksService,
  ],

  exports: [
    TasksService,
  ],
})
export class TasksModule {}