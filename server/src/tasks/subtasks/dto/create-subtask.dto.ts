import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class CreateSubtaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  task!: string;

  @IsMongoId()
  @IsOptional()
  assignee?: string;

  @IsEnum(['todo', 'doing', 'completed'])
  @IsOptional()
  status?: 'todo' | 'doing' | 'completed';

  @IsEnum(['none', 'urgent', 'high', 'medium', 'low'])
  @IsOptional()
  priority?: 'none' | 'urgent' | 'high' | 'medium' | 'low';

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}