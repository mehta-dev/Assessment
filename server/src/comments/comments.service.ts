import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import {
  Comment,
  CommentDocument,
} from './schemas/comment.schema';

import {
  CreateCommentDto,
} from './dto/create-comment.dto';

import {
  ActivitiesService,
} from '../activities/activities.service';

import {
  ActivityType,
} from '../activities/schemas/activity.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,

    private readonly activitiesService: ActivitiesService,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
  ): Promise<CommentDocument> {
    const comment =
      new this.commentModel(
        createCommentDto,
      );

    const savedComment =
      await comment.save();

    await this.activitiesService.create({
      task:
        createCommentDto.task,
      actor:
        createCommentDto.author,
      type:
        ActivityType.COMMENT_ADDED,
      message: 'posted a comment',
      metadata: {
        commentId:
          savedComment._id.toString(),
      },
    });

    return savedComment;
  }

  async findByTask(
    taskId: string,
  ): Promise<CommentDocument[]> {
    return this.commentModel
      .find({
        task: taskId,
      })
      .populate('author')
      .sort({
        createdAt: 1,
      })
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<CommentDocument> {
    const comment =
      await this.commentModel
        .findById(id)
        .populate('author')
        .exec();

    if (!comment) {
      throw new NotFoundException(
        'Comment not found',
      );
    }

    return comment;
  }

  async remove(
    id: string,
  ): Promise<void> {
    const comment =
      await this.commentModel
        .findById(id)
        .exec();

    if (!comment) {
      throw new NotFoundException(
        'Comment not found',
      );
    }

    await this.activitiesService.create({
      task:
        comment.task.toString(),
      actor:
        comment.author.toString(),
      type:
        ActivityType.COMMENT_DELETED,
      message: 'deleted a comment',
    });

    await this.commentModel
      .findByIdAndDelete(id)
      .exec();
  }
}