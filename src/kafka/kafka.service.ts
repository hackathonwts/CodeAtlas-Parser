import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { KafkaClient } from "./kafka.type";
import { KAFKA_CLIENT } from "./kafka.constants";
import { KAFKA_TOPICS } from "./kafka.topics";


@Injectable()
export class KafkaService implements OnModuleInit {
    constructor(
        @Inject(KAFKA_CLIENT) private readonly kafka: KafkaClient
    ) { }

    async onModuleInit() {
        await this.kafka.admin.createTopics({
            waitForLeaders: true,
            topics: Object.values(KAFKA_TOPICS),
        });
    }
}