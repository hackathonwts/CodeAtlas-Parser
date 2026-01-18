import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParserOrchestrationService } from './parser-orchestration.service';
import { GitManagerModule } from '../git-manager/git-manager.module';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { DocumentationModule } from '../documentation/documentation.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../schemas/project.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
        ]),
        GitManagerModule,
        Neo4jModule,
        DocumentationModule,
    ],
    providers: [ParserService, ParserOrchestrationService],
    exports: [ParserService, ParserOrchestrationService],
})
export class ParserModule { }
