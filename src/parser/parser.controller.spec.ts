import { Test, TestingModule } from '@nestjs/testing';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';

describe('ParserController', () => {
  let controller: ParserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParserController],
      providers: [ParserService],
    }).compile();

    controller = module.get<ParserController>(ParserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
