import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, KafkaConfig } from 'kafkajs';
import { KAFKA_CLIENT } from './kafka.constants';
import { KafkaClient } from './kafka.type';

export interface KafkaModuleOptions extends KafkaConfig {}

export interface KafkaModuleAsyncOptions {
    useFactory: (configService: ConfigService) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
    inject?: any[];
}

@Global()
@Module({})
export class KafkaModule {
    static registerAsync(options: KafkaModuleAsyncOptions): DynamicModule {
        return {
            module: KafkaModule,
            providers: [
                {
                    provide: KAFKA_CLIENT,
                    useFactory: async (configService: ConfigService) => {
                        const kafkaOptions = await options.useFactory(configService);
                        const kafka = new Kafka(kafkaOptions);
                        const producer = kafka.producer();
                        const admin = kafka.admin();

                        await producer.connect();
                        await admin.connect();

                        return {
                            client: kafka,
                            producer,
                            admin,
                        } as KafkaClient;
                    },
                    inject: [ConfigService, ...(options.inject || [])],
                } as Provider,
            ],
            exports: [KAFKA_CLIENT],
        };
    }
}
