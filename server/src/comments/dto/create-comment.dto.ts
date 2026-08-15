import {
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsMongoId()
  @IsNotEmpty()
  task!: string;

  @IsMongoId()
  @IsNotEmpty()
  author!: string;
}