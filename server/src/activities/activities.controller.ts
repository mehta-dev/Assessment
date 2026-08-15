import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import {
  ActivitiesService,
} from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
  ) {}

  @Get('task/:taskId')
  findByTask(
    @Param('taskId') taskId: string,
  ) {
    return this.activitiesService.findByTask(
      taskId,
    );
  }
}