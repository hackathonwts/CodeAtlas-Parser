import { Global, Module } from '@nestjs/common';
import { GitCloneQueue } from './git-clone.queue';
import { MongooseModule } from '@nestjs/mongoose';
import { CodeParserQueue } from './code-parser.queue';
import { BullModule } from '@nestjs/bullmq';
import { CODE_PARSER_QUEUE } from './queue.constant';
import { Project, ProjectSchema } from 'src/modules/project/schemas/project.schema';
import { Role, RoleSchema } from 'src/modules/role/schemas/role.schema';
import { User, UserSchema } from 'src/modules/user/schemas/user.schema';
import { Policy, PolicySchema } from 'src/modules/policy/schemas/policy.schema';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
            { name: Role.name, schema: RoleSchema },
            { name: User.name, schema: UserSchema },
            { name: Policy.name, schema: PolicySchema },
        ]),
        BullModule.registerQueue({ name: CODE_PARSER_QUEUE }),
    ],
    providers: [
        GitCloneQueue,
        CodeParserQueue
    ],
    exports: []
})
export class QueuesModule { }