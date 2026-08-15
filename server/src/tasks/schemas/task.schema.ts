import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type TaskDocument =
  HydratedDocument<Task>;

export enum TaskStatus {
  TODO = 'todo',
  DOING = 'doing',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export enum TaskPriority {
  NONE = 'none',
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Schema({
  timestamps: true,
})
export class Task {
  @Prop({
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    default: '',
    trim: true,
  })
  description!: string;

  @Prop({
    required: true,
    enum: Object.values(TaskStatus),
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Prop({
    required: true,
    enum: Object.values(TaskPriority),
    default: TaskPriority.NONE,
  })
  priority!: TaskPriority;

  @Prop()
  dueDate?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'Workspace',
    required: true,
  })
  workspace!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
  })
  project?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  reporter!: Types.ObjectId;

  @Prop({
    type: [Types.ObjectId],
    ref: 'User',
    default: [],
  })
  members!: Types.ObjectId[];

  @Prop({
    type: [String],
    default: [],
  })
  labels!: string[];
}

export const TaskSchema =
  SchemaFactory.createForClass(
    Task,
  );