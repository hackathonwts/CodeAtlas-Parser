import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParserController } from './parser.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from 'src/project/schemas/project.schema';
import { Role, RoleSchema } from 'src/role/schemas/role.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Policy, PolicySchema } from 'src/policy/schemas/policy.schema';
import { GIT_CLONE_QUEUE } from 'src/queues/queue.constant';

export const PARSER_SERVICE = 'PARSER_SERVICE';
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
        BullModule.registerQueue({ name: GIT_CLONE_QUEUE }),
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
            { name: Role.name, schema: RoleSchema },
            { name: User.name, schema: UserSchema },
            { name: Policy.name, schema: PolicySchema },
        ]),
    ],
    controllers: [ParserController],
    providers: [ParserService],
})
export class ParserModule { }
