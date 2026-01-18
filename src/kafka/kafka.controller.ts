import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { ParserOrchestrationService } from '../parser/parser-orchestration.service';

interface ParseRequestMessage {
    projectId: string;
    action: string;
}

@Controller()
export class KafkaController {
    private readonly logger = new Logger(KafkaController.name);

    constructor(
        private readonly parserOrchestrationService: ParserOrchestrationService,
    ) { }

    /**
     * Kafka message handler for parse requests
     * This is the entry point that replaces direct execution of main.ts
     */
    @MessagePattern('parse-requests')
    async handleParseRequest(
        @Payload() message: ParseRequestMessage,
        @Ctx() context: KafkaContext,
    ): Promise<void> {
        const topic = context.getTopic();
        const partition = context.getPartition();
        const offset = context.getMessage().offset;

        this.logger.log(
            `📨 Received parse request from Kafka | Topic: ${topic} | Partition: ${partition} | Offset: ${offset}`,
        );
        this.logger.log(`Message payload: ${JSON.stringify(message)}`);

        try {
            // Validate message
            if (!message.projectId) {
                throw new Error('Missing projectId in message payload');
            }

            if (message.action !== 'parse_repository') {
                this.logger.warn(`Unknown action: ${message.action}. Proceeding with parse anyway.`);
            }

            // Process the project
            await this.parserOrchestrationService.processProject(message.projectId);

            this.logger.log(`✅ Successfully processed project: ${message.projectId}`);

            // Message is automatically acknowledged by NestJS after successful processing
        } catch (error) {
            this.logger.error(`❌ Failed to process project: ${message.projectId}`, error.stack);

            // Re-throw to prevent message acknowledgment (will be retried or sent to DLQ)
            throw error;
        }
    }
}
