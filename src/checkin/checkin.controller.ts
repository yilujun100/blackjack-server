import { Controller, Get, Post } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/types/user.types';
import { ApiSecurity } from '@nestjs/swagger';
import { DistributedLockService } from 'src/common/distributed-lock/distributed-lock.service';

@ApiSecurity('tma')
@Controller('checkin')
export class CheckinController {
  constructor(
    private readonly checkinService: CheckinService,
    private readonly distributedLockService: DistributedLockService,
  ) {}

  @Post()
  checkin(@CurrentUser() user: User) {
    return this.distributedLockService.executeTask(
      [`checkin:${user.user.id}`],
      4000,
      () => this.checkinService.checkin(user),
    );
  }

  @Get()
  getCheckin(@CurrentUser() user: User) {
    return this.checkinService.getCheckin(user);
  }
}
