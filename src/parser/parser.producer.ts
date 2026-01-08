import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ParserService } from './parser.service';
import { CreateParserDto } from './dto/create-parser.dto';

@Controller()
export class ParserProducer {
    constructor(private readonly parserService: ParserService) { }

    @MessagePattern('parser.create')
    create(@Payload() createParserDto: CreateParserDto) {
        return this.parserService.create(createParserDto);
    }
}
