import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@Controller('subtasks')
export class SubtasksController {
  constructor(
    private readonly subtasksService: SubtasksService,
  ) {}

  @Post()
  create(
    @Body() createSubtaskDto: CreateSubtaskDto,
  ) {
    return this.subtasksService.create(
      createSubtaskDto,
    );
  }

  @Get()
  findAll() {
    return this.subtasksService.findAll();
  }

  @Get('task/:taskId')
  findByTask(
    @Param('taskId') taskId: string,
  ) {
    return this.subtasksService.findByTask(
      taskId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.subtasksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubtaskDto: UpdateSubtaskDto,
  ) {
    return this.subtasksService.update(
      id,
      updateSubtaskDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.subtasksService.remove(id);
  }
}