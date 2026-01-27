import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PARSER_QUEUE } from './parser.constant';

@Processor(PARSER_QUEUE)
export class ParseQueue extends WorkerHost {
    async process(job: Job<any, any, string>): Promise<any> {
        console.log('Processing job:', job.id, 'with data:', job.data);
    }
}
