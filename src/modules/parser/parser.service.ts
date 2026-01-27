import { Injectable, Logger } from '@nestjs/common';
import { CreateParserDto } from './dto/parser.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GIT_CLONE_QUEUE } from 'src/queues/queue.constant';
import { GitManagerService } from './services/git-manager.service';
import { CoreParserService } from './services/core-parser.service';
import { IngestService } from './services/ingest.service';

@Injectable()
export class ParserService {
    private readonly logger = new Logger(ParserService.name);

    constructor(
        @InjectQueue(GIT_CLONE_QUEUE) private gitCloneQueue: Queue,
        private readonly gitManagerService: GitManagerService,
        private readonly coreParserService: CoreParserService,
        private readonly ingestService: IngestService,
    ) {}

    async handleCreateParser(message: CreateParserDto) {
        this.logger.log('Received create_parser message:', message);
        
        // Add job to queue for async processing
        await this.gitCloneQueue.add('start.clone', message);
    }

    /**
     * Complete parser workflow: clone repository, parse code, and ingest to Neo4j
     */
    async processProject(dto: CreateParserDto): Promise<void> {
        try {
            this.logger.log(`Starting to process project: ${dto.name}`);

            // Step 1: Clone the repository
            const cloneResult = await this.gitManagerService.cloneRepository({
                gitUrl: dto.gitUrl,
                username: dto.gitUsername,
                password: dto.gitPassword,
                projectName: dto.name,
                branch: dto.branch,
            });

            if (!cloneResult.success) {
                throw new Error(`Failed to clone repository: ${cloneResult.message}`);
            }

            this.logger.log(`Repository cloned successfully to: ${cloneResult.clonedPath}`);

            // Step 2: Parse the project
            const { nodes, relations } = await this.coreParserService.parseProject(cloneResult.clonedPath);

            // Step 3: Ingest to Neo4j
            await this.ingestService.ingest(nodes, relations, dto.name);

            this.logger.log(`✅ Project '${dto.name}' processed successfully`);

        } catch (error) {
            this.logger.error(`Failed to process project '${dto.name}':`, error.message);
            throw error;
        }
    }
}
