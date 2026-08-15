import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ProjectsController,
} from './projects.controller';

import {
  ProjectsService,
} from './projects.service';

import {
  Project,
  ProjectSchema,
} from './schemas/project.schema';

import {
  Workspace,
  WorkspaceSchema,
} from '../workspaces/schemas/workspace.schema';

import { TasksModule } from '../tasks/tasks.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: Workspace.name,
        schema: WorkspaceSchema,
      },
    ]),

    TasksModule,

    AuthModule,
  ],

  controllers: [
    ProjectsController,
  ],

  providers: [
    ProjectsService,
  ],

  exports: [
    ProjectsService,
  ],
})
export class ProjectsModule {}