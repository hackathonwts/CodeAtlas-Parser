import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ParserModule } from './parser/parser.module';
import { KafkaModule } from './kafka/kafka.module';
import { KafkaService } from './kafka/kafka.service';

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
        ParserModule,
    ],
    providers: [KafkaService],
})
export class AppModule { }
