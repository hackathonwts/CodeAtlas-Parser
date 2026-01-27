import { Injectable, Logger } from '@nestjs/common';
import { KGNode, KGRelation } from '../../../types/kg.types';
import { Neo4jDatabaseService } from './neo4j-database.service';

@Injectable()
export class IngestService {
    private readonly logger = new Logger(IngestService.name);

    constructor(private readonly neo4jDatabaseService: Neo4jDatabaseService) {}

    /**
     * Ingests parsed nodes and relations into Neo4j database
     * @param nodes Array of knowledge graph nodes
     * @param relations Array of knowledge graph relations
     * @param databaseName Name of the Neo4j database to use (defaults to "neo4j")
     */
    async ingest(nodes: KGNode[], relations: KGRelation[], databaseName: string = "neo4j"): Promise<void> {
        try {
            this.logger.log(`Starting ingest of ${nodes.length} nodes and ${relations.length} relations to database '${databaseName}'`);

            await this.neo4jDatabaseService.cleanAndImport(nodes, relations, databaseName);

            this.logger.log("✅ Knowledge Graph imported successfully");
        } catch (error) {
            this.logger.error(`Failed to ingest knowledge graph: ${error.message}`);
            throw error;
        }
    }
}