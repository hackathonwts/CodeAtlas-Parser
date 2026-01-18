import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { ParserModule } from './parser/parser.module';
import { GitManagerModule } from './git-manager/git-manager.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { DocumentationModule } from './documentation/documentation.module';
import { KafkaModule } from './kafka/kafka.module';
import { HealthModule } from './health/health.module';
import { AppController } from './app.controller';

@Module({
    imports: [
        // Configuration module - loads .env
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            envFilePath: ['.env', '.env.local'],
        }),

        // MongoDB connection
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const host = configService.get<string>('mongodb.host');
                const port = configService.get<number>('mongodb.port');
                const database = configService.get<string>('mongodb.database');
                const username = configService.get<string>('mongodb.username');
                const password = configService.get<string>('mongodb.password');

                const uri = port ? `${host}:${port}` : host;

                return {
                    uri,
                    dbName: database,
                    auth: {
                        username,
                        password,
                    },
                    connectTimeoutMS: 10000,
                };
            },
            inject: [ConfigService],
        }),

        // Feature modules
        ParserModule,
        GitManagerModule,
        Neo4jModule,
        DocumentationModule,
        KafkaModule,
        HealthModule,
    ],
    controllers: [AppController],
})
export class AppModule { }
