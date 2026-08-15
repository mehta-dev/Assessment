import { AuthModule } from './auth/auth.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { SubtasksModule } from './tasks/subtasks/subtasks.module';
import { CommentsModule } from './comments/comments.module';
import { ActivitiesModule } from './activities/activities.module';

import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(
      process.env.MONGODB_URI!,
    ),

    AuthModule,

    UsersModule,

    TasksModule,

    ProjectsModule,

    SubtasksModule,

    CommentsModule,

    ActivitiesModule,

    WorkspacesModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}