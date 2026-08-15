import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  SubtasksController,
} from './subtasks.controller';

import {
  SubtasksService,
} from './subtasks.service';

import {
  Subtask,
  SubtaskSchema,
} from './schemas/subtask.schema';

import {
  Task,
  TaskSchema,
} from '../schemas/task.schema';

import {
  ActivitiesModule,
} from '../../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Subtask.name,
        schema: SubtaskSchema,
      },
      {
        name: Task.name,
        schema: TaskSchema,
      },
    ]),

    ActivitiesModule,
  ],

  controllers: [
    SubtasksController,
  ],

  providers: [
    SubtasksService,
  ],

  exports: [
    SubtasksService,
  ],
})
export class SubtasksModule {}