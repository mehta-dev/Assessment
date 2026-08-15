import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

import { TaskPriority } from '../../tasks/schemas/task.schema';

export type ProjectDocument =
  HydratedDocument<Project>;

@Schema({
  timestamps: true,
})
export class Project {
  @Prop({
    required: true,
    trim: true,
  })
  name!: string;

  @Prop({
    default: '',
    trim: true,
  })
  description!: string;

  @Prop({
    required: true,
    enum: Object.values(TaskPriority),
    default: TaskPriority.NONE,
  })
  priority!: TaskPriority;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  lead!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Workspace',
    required: true,
  })
  workspace!: Types.ObjectId;

  @Prop()
  dueDate?: Date;

  @Prop({
    type: [Types.ObjectId],
    ref: 'User',
    default: [],
  })
  members!: Types.ObjectId[];
}

export const ProjectSchema =
  SchemaFactory.createForClass(
    Project,
  );