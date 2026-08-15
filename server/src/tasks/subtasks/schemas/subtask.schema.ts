import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubtaskDocument = HydratedDocument<Subtask>;

@Schema({
  timestamps: true,
})
export class Subtask {
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
    type: Types.ObjectId,
    ref: 'Task',
    required: true,
  })
  task!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  assignee?: Types.ObjectId;

  @Prop({
    default: 'todo',
    enum: ['todo', 'doing', 'completed'],
  })
  status!: 'todo' | 'doing' | 'completed';

  @Prop({
    default: 'none',
    enum: ['none', 'urgent', 'high', 'medium', 'low'],
  })
  priority!: 'none' | 'urgent' | 'high' | 'medium' | 'low';

  @Prop()
  dueDate?: Date;
}

export const SubtaskSchema =
  SchemaFactory.createForClass(Subtask);