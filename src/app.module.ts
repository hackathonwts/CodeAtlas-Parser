import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ParserModule } from './parser/parser.module';
import { KafkaModule } from './kafka/kafka.module';
import { KafkaService } from './kafka/kafka.service';
import { BullModule } from '@nestjs/bullmq';
import { Neo4jModule } from './neo4j/neo4j.module';
import { Neo4jService } from './neo4j/neo4j.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.development',
        }),
        KafkaModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                clientId: configService.getOrThrow<string>('KAFKA_APP_ID'),
                brokers: [configService.getOrThrow<string>('KAFKA_BROKER_URL')],
            }),
            inject: [ConfigService],
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    host: configService.getOrThrow<string>('REDIS_HOST'),
                    port: configService.getOrThrow<number>('REDIS_PORT'),
                },
            }),
            inject: [ConfigService],
        }),
        Neo4jModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.getOrThrow<string>('NEO4J_URI'),
                username: configService.getOrThrow<string>('NEO4J_USER'),
                password: configService.getOrThrow<string>('NEO4J_PASSWORD'),
            }),
            inject: [ConfigService],
        }),
        ParserModule,
    ],
    providers: [
        KafkaService,
        Neo4jService
    ],
})
export class AppModule {}
