import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  SchemaTypes,
  Types,
} from 'mongoose';

export type ActivityDocument =
  HydratedDocument<Activity>;

export enum ActivityType {
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',

  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  DUE_DATE_CHANGED = 'due_date_changed',

  SUBTASK_CREATED = 'subtask_created',
  SUBTASK_UPDATED = 'subtask_updated',
  SUBTASK_DELETED = 'subtask_deleted',

  COMMENT_ADDED = 'comment_added',
  COMMENT_DELETED = 'comment_deleted',
}

@Schema({
  timestamps: true,
})
export class Activity {
  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    required: true,
  })
  task!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  actor!: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(ActivityType),
  })
  type!: ActivityType;

  @Prop({
    required: true,
    trim: true,
  })
  message!: string;

  @Prop({
    type: SchemaTypes.Mixed,
    default: {},
  })
  metadata!: Record<string, unknown>;
}

export const ActivitySchema =
  SchemaFactory.createForClass(Activity);