import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ParserService } from './parser.service';
import { CreateParserDto } from './dto/parser.dto';
import { KAFKA_TOPICS } from 'src/kafka/kafka.topics';

@Controller()
export class ParserController {
    constructor(
        private readonly parserService: ParserService,
    ) { }

    @EventPattern(KAFKA_TOPICS.PARSER_CREATE.topic)
    async handleCreateParser(@Payload() message: CreateParserDto) {
        await this.parserService.handleCreateParser(message);
    }

}
