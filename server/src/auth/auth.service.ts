import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ) {
    const existingEmail =
      await this.userModel
        .findOne({
          email:
            registerDto.email
              .toLowerCase(),
        })
        .exec();

    if (existingEmail) {
      throw new ConflictException(
        'Email is already registered',
      );
    }

    const existingUsername =
      await this.userModel
        .findOne({
          username:
            registerDto.username,
        })
        .exec();

    if (existingUsername) {
      throw new ConflictException(
        'Username is already taken',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        registerDto.password,
        12,
      );

    const user =
      new this.userModel({
        name:
          registerDto.name.trim(),

        email:
          registerDto.email
            .trim()
            .toLowerCase(),

        username:
          registerDto.username.trim(),

        password:
          hashedPassword,

        title:
          registerDto.title?.trim() ||
          '',

        avatar:
          registerDto.avatar?.trim() ||
          '',
      });

    const savedUser =
      await user.save();

    return {
      user: this.sanitizeUser(
        savedUser,
      ),

      accessToken:
        this.createAccessToken(
          savedUser,
        ),
    };
  }

  async login(
    loginDto: LoginDto,
  ) {
    const user =
      await this.userModel
        .findOne({
          email:
            loginDto.email
              .trim()
              .toLowerCase(),
        })
        .select('+password')
        .exec();

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        loginDto.password,
        user.password,
      );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    return {
      user: this.sanitizeUser(
        user,
      ),

      accessToken:
        this.createAccessToken(user),
    };
  }

  async getCurrentUser(
    userId: string,
  ) {
    const user =
      await this.userModel
        .findById(userId)
        .exec();

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.sanitizeUser(
      user,
    );
  }

  private createAccessToken(
    user: UserDocument,
  ): string {
    return this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
    });
  }

  private sanitizeUser(
    user: UserDocument,
  ) {
    const {
      password,
      ...safeUser
    } = user.toObject();

    return safeUser;
  }
}