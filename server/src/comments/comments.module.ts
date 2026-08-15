import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  CommentsController,
} from './comments.controller';

import {
  CommentsService,
} from './comments.service';

import {
  Comment,
  CommentSchema,
} from './schemas/comment.schema';

import {
  ActivitiesModule,
} from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
    ]),

    ActivitiesModule,
  ],

  controllers: [
    CommentsController,
  ],

  providers: [
    CommentsService,
  ],

  exports: [
    CommentsService,
  ],
})
export class CommentsModule {}