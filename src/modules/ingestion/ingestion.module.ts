import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { KnowledgeGraphNeo4jModule } from '../neo4j/neo4j.module';

@Module({
    imports: [KnowledgeGraphNeo4jModule],
    providers: [IngestionService],
    exports: [IngestionService],
})
export class IngestionModule {}