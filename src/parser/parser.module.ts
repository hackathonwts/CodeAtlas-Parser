import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParserController } from './parser.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PARSER_SERVICE } from './parser.constant';

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
                            groupId: 'parser-consumer'
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    controllers: [ParserController],
    providers: [ParserService],
})
export class ParserModule { }
