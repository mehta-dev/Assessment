import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

import { TaskPriority } from '../../tasks/schemas/task.schema';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsMongoId()
  @IsOptional()
  lead?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  members?: string[];
}