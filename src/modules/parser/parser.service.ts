import { Injectable } from '@nestjs/common';
import { CreateParserDto } from './dto/parser.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GIT_CLONE_QUEUE } from 'src/queues/queue.constant';
import { OrchestratorService } from '../orchestrator/orchestrator.service';

@Injectable()
export class ParserService {
    constructor(
        @InjectQueue(GIT_CLONE_QUEUE) private gitCloneQueue: Queue,
        private readonly orchestratorService: OrchestratorService,
    ) {}

    async handleCreateParser(message: CreateParserDto) {
        console.log('Received create_parser message:', message);
        
        // Use the orchestrator to process the project
        try {
            await this.orchestratorService.processProject({
                gitUrl: message.gitUrl,
                username: message.username,
                password: message.password,
                projectName: message.projectName,
                branch: message.branch,
            });
        } catch (error) {
            console.error('Error processing project:', error);
            throw error;
        }
        
        // Optionally still add to queue if needed for other processing
        this.gitCloneQueue.add('start.clone', message);
    }
}
