import { Injectable } from '@nestjs/common';
import { CreateParserDto } from './dto/parser.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CODE_PARSER_QUEUE } from 'src/queues/queue.constant';

@Injectable()
export class ParserService {
    constructor(
        @InjectQueue(CODE_PARSER_QUEUE) private codeParserQueue: Queue,
    ) {}
    async handleCreateParser(message: CreateParserDto) {
        this.codeParserQueue.add('start.parse', message);
    }
}
