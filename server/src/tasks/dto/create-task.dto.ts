import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  TaskPriority,
  TaskStatus,
} from '../schemas/task.schema';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsMongoId()
  @IsOptional()
  project?: string;

  @IsMongoId()
  @IsNotEmpty()
  reporter!: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  members?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];
}