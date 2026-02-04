import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CodeParserQueue } from './code-parser.queue';
import { BullModule } from '@nestjs/bullmq';
import { CODE_PARSER_QUEUE, VECTORIZER_WORKER_QUEUE } from './queue.constant';
import { Project, ProjectSchema } from 'src/modules/project/schemas/project.schema';
import { Role, RoleSchema } from 'src/modules/role/schemas/role.schema';
import { User, UserSchema } from 'src/modules/user/schemas/user.schema';
import { Policy, PolicySchema } from 'src/modules/policy/schemas/policy.schema';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { Notification, NotificationSchema } from 'src/modules/notification/schemas/notification.schema';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
            { name: Role.name, schema: RoleSchema },
            { name: User.name, schema: UserSchema },
            { name: Policy.name, schema: PolicySchema },
            { name: Notification.name, schema: NotificationSchema },
        ]),
        BullModule.registerQueue({ name: CODE_PARSER_QUEUE }),
        BullModule.registerQueue({ name: VECTORIZER_WORKER_QUEUE }),
    ],
    providers: [CodeParserQueue, Neo4jService],
    exports: [],
})
export class QueuesModule {}
