import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParserController } from './parser.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { GIT_CLONE_QUEUE } from 'src/queues/queue.constant';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Policy, PolicySchema } from '../policy/schemas/policy.schema';
import { Neo4jModule } from '../../neo4j/neo4j.module';

// Import all the new services
import { GitManagerService } from './services/git-manager.service';
import { CoreParserService } from './services/core-parser.service';
import { IngestService } from './services/ingest.service';
import { Neo4jDatabaseService } from './services/neo4j-database.service';
import { ExtractStructureService } from './services/extract-structure.service';
import { ExtractDIService } from './services/extract-di.service';
import { ExtractMethodCallsService } from './services/extract-method-calls.service';
import { ExtractRoutesService } from './services/extract-routes.service';
import { ExtractTypeUsageService } from './services/extract-type-usage.service';
import { ExtractImportsService } from './services/extract-imports.service';
import { ExtractInheritanceService } from './services/extract-inheritance.service';

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
        Neo4jModule, // Add Neo4j module for database operations
    ],
    controllers: [ParserController],
    providers: [
        ParserService,
        GitManagerService,
        CoreParserService,
        IngestService,
        Neo4jDatabaseService,
        ExtractStructureService,
        ExtractDIService,
        ExtractMethodCallsService,
        ExtractRoutesService,
        ExtractTypeUsageService,
        ExtractImportsService,
        ExtractInheritanceService,
    ],
    exports: [
        ParserService,
        GitManagerService,
        CoreParserService,
        IngestService,
    ],
})
export class ParserModule { }
