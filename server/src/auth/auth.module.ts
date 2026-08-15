import { AuthController } from './auth.controller';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

import { AuthService } from './auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
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
    AuthController,
  ],

  providers: [
    AuthService,
  ],

  exports: [
    AuthService,
    JwtModule,
  ],
})
export class AuthModule {}