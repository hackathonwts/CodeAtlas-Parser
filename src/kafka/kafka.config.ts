import { KafkaOptions, Transport } from '@nestjs/microservices';

export const kafkaConfig: KafkaOptions = {
    transport: Transport.KAFKA,
    options: {
        client: {
            clientId: 'parser-service',
            brokers: ['localhost:9092'],
        },
        consumer: {
            groupId: 'parser-consumer-group',
        },
    },
};