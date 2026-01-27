import { Injectable } from '@nestjs/common';
import { CreateParserDto } from './dto/parser.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { PARSER_QUEUE } from './parser.constant';
import { Queue } from 'bullmq';

@Injectable()
export class ParserService {
    constructor(@InjectQueue(PARSER_QUEUE) private parserQueue: Queue) {}

    async handleCreateParser(message: CreateParserDto) {
        console.log('Received create_parser message:', message);
        this.parserQueue.add('create_parser_job', message);
    }
}
