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
  Subtask,
  SubtaskDocument,
} from './schemas/subtask.schema';

import {
  CreateSubtaskDto,
} from './dto/create-subtask.dto';

import {
  UpdateSubtaskDto,
} from './dto/update-subtask.dto';

import {
  Task,
  TaskDocument,
} from '../schemas/task.schema';

import {
  ActivitiesService,
} from '../../activities/activities.service';

import {
  ActivityType,
} from '../../activities/schemas/activity.schema';

@Injectable()
export class SubtasksService {
  constructor(
    @InjectModel(Subtask.name)
    private readonly subtaskModel: Model<SubtaskDocument>,

    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,

    private readonly activitiesService: ActivitiesService,
  ) {}

  async create(
    createSubtaskDto: CreateSubtaskDto,
  ): Promise<SubtaskDocument> {
    const task =
      await this.taskModel
        .findById(
          createSubtaskDto.task,
        )
        .exec();

    if (!task) {
      throw new NotFoundException(
        'Parent task not found',
      );
    }

    const subtask =
      new this.subtaskModel(
        createSubtaskDto,
      );

    const savedSubtask =
      await subtask.save();

    await this.activitiesService.create({
      task:
        createSubtaskDto.task,
      actor:
        task.reporter.toString(),
      type:
        ActivityType.SUBTASK_CREATED,
      message: `created subtask "${savedSubtask.title}"`,
    });

    return savedSubtask;
  }

  async findAll(): Promise<
    SubtaskDocument[]
  > {
    return this.subtaskModel
      .find()
      .populate('task')
      .populate('assignee')
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findByTask(
    taskId: string,
  ): Promise<SubtaskDocument[]> {
    return this.subtaskModel
      .find({
        task: taskId,
      })
      .populate('assignee')
      .sort({
        createdAt: 1,
      })
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<SubtaskDocument> {
    const subtask =
      await this.subtaskModel
        .findById(id)
        .populate('task')
        .populate('assignee')
        .exec();

    if (!subtask) {
      throw new NotFoundException(
        'Subtask not found',
      );
    }

    return subtask;
  }

  async update(
    id: string,
    updateSubtaskDto: UpdateSubtaskDto,
  ): Promise<SubtaskDocument> {
    const existingSubtask =
      await this.subtaskModel
        .findById(id)
        .exec();

    if (!existingSubtask) {
      throw new NotFoundException(
        'Subtask not found',
      );
    }

    const task =
      await this.taskModel
        .findById(
          existingSubtask.task,
        )
        .exec();

    if (!task) {
      throw new NotFoundException(
        'Parent task not found',
      );
    }

    const updatedSubtask =
      await this.subtaskModel
        .findByIdAndUpdate(
          id,
          updateSubtaskDto,
          {
            new: true,
            runValidators: true,
          },
        )
        .populate('assignee')
        .exec();

    if (!updatedSubtask) {
      throw new NotFoundException(
        'Subtask not found',
      );
    }

    await this.activitiesService.create({
      task:
        existingSubtask.task.toString(),
      actor:
        task.reporter.toString(),
      type:
        ActivityType.SUBTASK_UPDATED,
      message: `updated subtask "${existingSubtask.title}"`,
    });

    return updatedSubtask;
  }

  async remove(
    id: string,
  ): Promise<void> {
    const subtask =
      await this.subtaskModel
        .findById(id)
        .exec();

    if (!subtask) {
      throw new NotFoundException(
        'Subtask not found',
      );
    }

    const task =
      await this.taskModel
        .findById(subtask.task)
        .exec();

    if (!task) {
      throw new NotFoundException(
        'Parent task not found',
      );
    }

    await this.activitiesService.create({
      task:
        subtask.task.toString(),
      actor:
        task.reporter.toString(),
      type:
        ActivityType.SUBTASK_DELETED,
      message: `deleted subtask "${subtask.title}"`,
    });

    await this.subtaskModel
      .findByIdAndDelete(id)
      .exec();
  }
}