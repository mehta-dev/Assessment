import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { TaskPriority } from '../../tasks/schemas/task.schema';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsMongoId()
  @IsNotEmpty()
  lead!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  members?: string[];
}