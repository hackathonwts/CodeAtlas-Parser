import { Injectable } from '@nestjs/common';
import { CreateParserDto } from './dto/parser.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GIT_CLONE_QUEUE } from 'src/queues/queue.constant';

@Injectable()
export class ParserService {
    constructor(
        @InjectQueue(GIT_CLONE_QUEUE) private gitCloneQueue: Queue,
    ) {}

    async handleCreateParser(message: CreateParserDto) {
        console.log('Received create_parser message:', message);
        this.gitCloneQueue.add('start.clone', message);
    }
}
