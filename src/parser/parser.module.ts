import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParserController } from './parser.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PARSER_QUEUE, PARSER_SERVICE } from './parser.constant';
import { BullModule } from '@nestjs/bullmq';
import { ParseQueue } from './parse.queue';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.development',
        }),
        ClientsModule.registerAsync([
            {
                name: PARSER_SERVICE,
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: 'parser',
                            brokers: [configService.getOrThrow<string>('KAFKA_BROKER_URL')],
                        },
                        consumer: {
                            groupId: 'parser-consumer',
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
        BullModule.registerQueue({ name: PARSER_QUEUE }),
    ],
    controllers: [ParserController],
    providers: [ParserService, ParseQueue],
})
export class ParserModule {}
