import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService
    implements OnModuleInit, OnModuleDestroy {
    private producer: Producer;

    async onModuleInit() {
        const kafka = new Kafka({
            clientId: 'parser-producer',
            brokers: ['localhost:9092'],
        });

        this.producer = kafka.producer();
        await this.producer.connect();
    }

    async emit(topic: string, message: unknown) {
        await this.producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
    }

    async onModuleDestroy() {
        await this.producer.disconnect();
    }
}
