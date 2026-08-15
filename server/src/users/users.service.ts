import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  User,
  UserDocument,
} from './schemas/user.schema';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<UserDocument> {
    const user =
      new this.userModel(createUserDto);

    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .sort({ name: 1 })
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<UserDocument> {
    const user =
      await this.userModel
        .findById(id)
        .exec();

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user =
      await this.userModel
        .findByIdAndUpdate(
          id,
          updateUserDto,
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }
}