import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Neo4jDatabase } from '../db/neo4j.db';
import { KGNode, KGRelation } from '../types/kg.types';

@Injectable()
export class Neo4jService implements OnModuleDestroy {
    private readonly logger = new Logger(Neo4jService.name);
    private neo4jDb: Neo4jDatabase | null = null;

    constructor(private configService: ConfigService) { }

    /**
     * Get or create Neo4jDatabase instance for a specific database
     */
    private getDatabase(databaseName: string): Neo4jDatabase {
        if (!this.neo4jDb || this.neo4jDb['databaseName'] !== databaseName) {
            this.neo4jDb = new Neo4jDatabase(databaseName);
        }
        return this.neo4jDb;
    }

    /**
     * Clean and import knowledge graph data to Neo4j
     */
    async cleanAndImport(
        nodes: KGNode[],
        relations: KGRelation[],
        databaseName: string = 'neo4j',
    ): Promise<void> {
        this.logger.log(`Importing ${nodes.length} nodes and ${relations.length} relations to database: ${databaseName}`);

        try {
            const db = this.getDatabase(databaseName);
            await db.cleanAndImport(nodes, relations);

            this.logger.log('✅ Knowledge Graph imported successfully');
        } catch (error) {
            this.logger.error('Failed to import knowledge graph:', error);
            throw error;
        }
    }

    /**
     * Import only nodes to Neo4j
     */
    async importNodes(nodes: KGNode[], databaseName: string = 'neo4j'): Promise<void> {
        this.logger.log(`Importing ${nodes.length} nodes to database: ${databaseName}`);

        try {
            const db = this.getDatabase(databaseName);
            await db.importNodes(nodes);

            this.logger.log('✅ Nodes imported successfully');
        } catch (error) {
            this.logger.error('Failed to import nodes:', error);
            throw error;
        }
    }

    /**
     * Import only relations to Neo4j
     */
    async importRelations(relations: KGRelation[], databaseName: string = 'neo4j'): Promise<void> {
        this.logger.log(`Importing ${relations.length} relations to database: ${databaseName}`);

        try {
            const db = this.getDatabase(databaseName);
            await db.importRelations(relations);

            this.logger.log('✅ Relations imported successfully');
        } catch (error) {
            this.logger.error('Failed to import relations:', error);
            throw error;
        }
    }

    /**
     * Clean up on module destroy
     */
    async onModuleDestroy() {
        this.logger.log('Closing Neo4j driver connection...');
        await Neo4jDatabase.closeDriver();
    }
}
