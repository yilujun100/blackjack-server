import { Test, TestingModule } from '@nestjs/testing';
import { CasinoController } from './casino.controller';
import { CasinoService } from './casino.service';

describe('CasinoController', () => {
  let controller: CasinoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasinoController],
      providers: [CasinoService],
    }).compile();

    controller = module.get<CasinoController>(CasinoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
