import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParserController } from './parser.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PARSER_QUEUE, PARSER_SERVICE } from './parser.constant';
import { BullModule } from '@nestjs/bullmq';
import { ParseQueue } from './parse.queue';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from 'src/project/schemas/project.schema';
import { Role, RoleSchema } from 'src/role/schemas/role.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Policy, PolicySchema } from 'src/policy/schemas/policy.schema';

@Module({
    imports: [
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
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
            { name: Role.name, schema: RoleSchema },
            { name: User.name, schema: UserSchema },
            { name: Policy.name, schema: PolicySchema },
        ]),
    ],
    controllers: [ParserController],
    providers: [ParserService, ParseQueue],
})
export class ParserModule { }
