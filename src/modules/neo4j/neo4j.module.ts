import { Module } from '@nestjs/common';
import { KnowledgeGraphNeo4jService } from './neo4j.service';
import { Neo4jModule as BaseNeo4jModule } from '../../neo4j/neo4j.module';

@Module({
    imports: [BaseNeo4jModule],
    providers: [KnowledgeGraphNeo4jService],
    exports: [KnowledgeGraphNeo4jService],
})
export class KnowledgeGraphNeo4jModule {}