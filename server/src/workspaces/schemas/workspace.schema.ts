import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type WorkspaceDocument =
  HydratedDocument<Workspace>;

export enum WorkspaceMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Schema({
  timestamps: true,
})
export class Workspace {
  @Prop({
    required: true,
    trim: true,
  })
  name!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  owner!: Types.ObjectId;

  @Prop({
    type: [
      {
        user: {
          type: Types.ObjectId,
          ref: 'User',
          required: true,
        },

        role: {
          type: String,
          enum: Object.values(
            WorkspaceMemberRole,
          ),
          default:
            WorkspaceMemberRole.MEMBER,
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  })
  members!: {
    user: Types.ObjectId;
    role: WorkspaceMemberRole;
    joinedAt: Date;
  }[];
}

export const WorkspaceSchema =
  SchemaFactory.createForClass(
    Workspace,
  );