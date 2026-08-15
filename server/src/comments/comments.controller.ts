import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  create(
    @Body()
    createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      createCommentDto,
    );
  }

  @Get('task/:taskId')
  findByTask(
    @Param('taskId') taskId: string,
  ) {
    return this.commentsService.findByTask(
      taskId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.commentsService.findOne(id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.commentsService.remove(id);
  }
}