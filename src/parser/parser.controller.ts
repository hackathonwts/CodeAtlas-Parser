import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ParserService } from './parser.service';
import { CreateParserDto } from './dto/create-parser.dto';
import { UpdateParserDto } from './dto/update-parser.dto';

@Controller()
export class ParserController {
  constructor(private readonly parserService: ParserService) {}

  @MessagePattern('createParser')
  create(@Payload() createParserDto: CreateParserDto) {
    return this.parserService.create(createParserDto);
  }

  @MessagePattern('findAllParser')
  findAll() {
    return this.parserService.findAll();
  }

  @MessagePattern('findOneParser')
  findOne(@Payload() id: number) {
    return this.parserService.findOne(id);
  }

  @MessagePattern('updateParser')
  update(@Payload() updateParserDto: UpdateParserDto) {
    return this.parserService.update(updateParserDto.id, updateParserDto);
  }

  @MessagePattern('removeParser')
  remove(@Payload() id: number) {
    return this.parserService.remove(id);
  }
}
