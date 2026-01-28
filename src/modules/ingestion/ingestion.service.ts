import { Injectable } from '@nestjs/common';
import { KnowledgeGraphNeo4jService } from '../neo4j/neo4j.service';
import { KGNode, KGRelation } from '../../types/kg.types';

@Injectable()
export class IngestionService {
    constructor(private readonly knowledgeGraphNeo4jService: KnowledgeGraphNeo4jService) { }

    async ingest(nodes: KGNode[], relations: KGRelation[], databaseName: string = "neo4j"): Promise<void> {
        try {
            await this.knowledgeGraphNeo4jService.cleanAndImport(databaseName, nodes, relations);
            console.log("✅ Knowledge Graph imported successfully");
        } catch (error) {
            console.error("❌ Failed to import Knowledge Graph:", error);
            throw error;
        }
    }
}