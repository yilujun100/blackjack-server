import { Controller, Get, Param } from '@nestjs/common';
import { CasinoService } from './casino.service';
import { ApiSecurity } from '@nestjs/swagger';

@ApiSecurity('tma')
@Controller('casino')
export class CasinoController {
  constructor(private readonly casinoService: CasinoService) {}

  @Get()
  findAll() {
    return this.casinoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casinoService.findOne(id);
  }
}
