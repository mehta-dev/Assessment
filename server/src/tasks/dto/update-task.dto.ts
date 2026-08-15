import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  TaskPriority,
  TaskStatus,
} from '../schemas/task.schema';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

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
  @IsOptional()
  reporter?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  members?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];
}