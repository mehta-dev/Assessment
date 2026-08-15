import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class UpdateSubtaskDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

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