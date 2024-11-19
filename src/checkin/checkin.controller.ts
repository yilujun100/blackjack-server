import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/types/user.types';
import { ApiSecurity } from '@nestjs/swagger';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';

@ApiSecurity('tma')
@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  checkin(@CurrentUser() user: User) {
    return this.checkinService.checkin(user);
  }

  @Get()
  getCheckin(@CurrentUser() user: User) {
    return this.checkinService.getCheckin(user);
  }
  
  @Post()
  create(@Body() createCheckinDto: CreateCheckinDto) {
    return this.checkinService.create(createCheckinDto);
  }

  @Get()
  findAll() {
    return this.checkinService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkinService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCheckinDto: UpdateCheckinDto) {
    return this.checkinService.update(+id, updateCheckinDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checkinService.remove(+id);
  }
}
