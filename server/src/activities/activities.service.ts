import {
  Injectable,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import {
  Activity,
  ActivityDocument,
  ActivityType,
} from './schemas/activity.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
  ) {}

  async create(data: {
    task: string;
    actor: string;
    type: ActivityType;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<ActivityDocument> {
    const activity =
      new this.activityModel({
        task: data.task,
        actor: data.actor,
        type: data.type,
        message: data.message,
        metadata: data.metadata ?? {},
      });

    return activity.save();
  }

  async findByTask(
    taskId: string,
  ): Promise<ActivityDocument[]> {
    return this.activityModel
      .find({
        task: taskId,
      })
      .populate('actor')
      .sort({
        createdAt: -1,
      })
      .exec();
  }
}