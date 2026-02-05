import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { KafkaClient } from './kafka.type';
import { KAFKA_CLIENT } from './kafka.constants';
import { KAFKA_TOPICS } from './kafka.topics';
import { ITopicConfig } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
    constructor(@Inject(KAFKA_CLIENT) private readonly kafka: KafkaClient) { }

    async onModuleInit() {
        try {
            const existingTopics = await this.kafka.admin.listTopics();
            const missingTopics: ITopicConfig[] = [];

            for (const topicConfig of Object.values(KAFKA_TOPICS)) {
                const topicName = topicConfig.topic;
                if (!existingTopics.includes(topicName)) {
                    missingTopics.push(topicConfig);
                }
            }
            if (missingTopics.length > 0) {
                await this.kafka.admin.createTopics({
                    waitForLeaders: true,
                    topics: missingTopics,
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
}
