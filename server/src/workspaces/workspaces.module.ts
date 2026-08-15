import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import {
  Workspace,
  WorkspaceSchema,
} from './schemas/workspace.schema';

import {
  WorkspacesController,
} from './workspaces.controller';

import {
  WorkspacesService,
} from './workspaces.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Workspace.name,
        schema: WorkspaceSchema,
      },
    ]),

    JwtModule.register({
      secret:
        process.env.JWT_ACCESS_SECRET ||
        'development-secret',

      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],

  controllers: [
    WorkspacesController,
  ],

  providers: [
    WorkspacesService,
  ],
})
export class WorkspacesModule {}