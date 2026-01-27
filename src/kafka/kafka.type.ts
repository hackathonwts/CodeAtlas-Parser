import { Admin, Kafka, Producer } from 'kafkajs';

export type KafkaClient = {
    client: Kafka;
    producer: Producer;
    admin: Admin;
};
