import { Injectable } from '@nestjs/common';
import { CreateParserDto } from './dto/create-parser.dto';
import { UpdateParserDto } from './dto/update-parser.dto';

@Injectable()
export class ParserService {
  create(createParserDto: CreateParserDto) {
    return 'This action adds a new parser';
  }

  findAll() {
    return `This action returns all parser`;
  }

  findOne(id: number) {
    return `This action returns a #${id} parser`;
  }

  update(id: number, updateParserDto: UpdateParserDto) {
    return `This action updates a #${id} parser`;
  }

  remove(id: number) {
    return `This action removes a #${id} parser`;
  }
}
