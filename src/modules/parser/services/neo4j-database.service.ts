import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../../../neo4j/neo4j.service';
import { KGNode, KGRelation } from '../../../types/kg.types';

@Injectable()
export class Neo4jDatabaseService {
    private readonly logger = new Logger(Neo4jDatabaseService.name);

    constructor(private readonly neo4jService: Neo4jService) {}

    /**
     * Creates a database if it doesn't exist
     */
    async createDatabaseIfNotExists(databaseName: string): Promise<void> {
        try {
            // Create database if it doesn't exist (Neo4j Enterprise feature)
            await this.neo4jService.write(
                `CREATE DATABASE \`${databaseName}\` IF NOT EXISTS`,
                {},
                'system'
            );
            // Wait for database to become available
            await this.waitForDatabaseReady(databaseName);
        } catch (error: any) {
            // If the error is about the database already existing, ignore it
            if (error.code === "Neo.ClientError.Database.DatabaseAlreadyExists") {
                this.logger.log(`Database '${databaseName}' already exists.`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Waits for the database to be ready (online status)
     */
    private async waitForDatabaseReady(databaseName: string, maxRetries: number = 10, delayMs: number = 1000): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Try a simple query on the database to verify it's ready
                await this.neo4jService.read("RETURN 1", {}, databaseName);
                this.logger.log(`Database '${databaseName}' is ready.`);
                return;
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw new Error(`Database '${databaseName}' did not become ready in time.`);
                }
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    /**
     * Cleans the entire database by deleting all nodes and relationships
     */
    async cleanDatabase(databaseName: string): Promise<void> {
        // Delete all relationships first, then all nodes
        await this.neo4jService.write("MATCH (n) DETACH DELETE n", {}, databaseName);
        this.logger.log(`Database '${databaseName}' cleaned successfully.`);
    }

    /**
     * Ensures database exists (creates if not) and cleans it
     */
    async ensureCleanDatabase(databaseName: string): Promise<void> {
        try {
            await this.createDatabaseIfNotExists(databaseName);
            await this.cleanDatabase(databaseName);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Flattens nested properties to JSON strings for Neo4j compatibility
     * Neo4j only accepts primitive types (string, number, boolean) or arrays of primitives
     */
    private flattenMeta(meta: Record<string, any> | undefined): Record<string, any> {
        if (!meta) return {};

        const flattened: Record<string, any> = {};

        for (const [key, value] of Object.entries(meta)) {
            if (value === null || value === undefined) {
                continue;
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                // Serialize objects to JSON string
                flattened[key] = JSON.stringify(value);
            } else if (Array.isArray(value)) {
                // Check if array contains objects
                if (value.length > 0 && typeof value[0] === 'object') {
                    // Serialize array of objects to JSON string
                    flattened[key] = JSON.stringify(value);
                } else {
                    // Keep primitive arrays as-is
                    flattened[key] = value;
                }
            } else {
                // Keep primitives as-is
                flattened[key] = value;
            }
        }

        return flattened;
    }

    /**
     * Imports nodes into the database
     */
    async importNodes(nodes: KGNode[], databaseName: string): Promise<void> {
        const session = this.neo4jService.getSession(databaseName);
        const tx = session.beginTransaction();

        try {
            for (const node of nodes) {
                const label = node.kind;
                const flattenedMeta = this.flattenMeta(node.meta);

                const cypher = `
                MERGE (n:${label} { id: $id })
                SET n += $props
                `;

                await tx.run(cypher, {
                    id: node.id,
                    props: {
                        name: node.name,
                        filePath: node.filePath || null,
                        parentId: node.parentId || null,
                        ...flattenedMeta,
                    },
                });
            }

            await tx.commit();
        } catch (e) {
            await tx.rollback();
            throw e;
        } finally {
            await session.close();
        }
    }

    /**
     * Imports relations into the database
     */
    async importRelations(relations: KGRelation[], databaseName: string): Promise<void> {
        const session = this.neo4jService.getSession(databaseName);
        const tx = session.beginTransaction();

        try {
            for (const rel of relations) {
                const cypher = `
                MATCH (a { id: $from })
                MATCH (b { id: $to })
                MERGE (a)-[r:${rel.type}]->(b)
                `;

                await tx.run(cypher, {
                    from: rel.from,
                    to: rel.to,
                });
            }

            await tx.commit();
        } catch (e) {
            await tx.rollback();
            throw e;
        } finally {
            await session.close();
        }
    }

    /**
     * Creates/ensures database exists, cleans it, and imports fresh data (nodes and relations)
     */
    async cleanAndImport(nodes: KGNode[], relations: KGRelation[], databaseName: string = "neo4j"): Promise<void> {
        try {
            this.logger.log(`Starting clean import to database '${databaseName}'...`);

            // Ensure database exists and clean it
            await this.ensureCleanDatabase(databaseName);

            // Import nodes
            this.logger.log(`Importing ${nodes.length} nodes...`);
            await this.importNodes(nodes, databaseName);

            // Import relations
            this.logger.log(`Importing ${relations.length} relations...`);
            await this.importRelations(relations, databaseName);

            this.logger.log(`Clean import completed successfully.`);
        } catch (error) {
            this.logger.error(`Failed to clean and import: ${error.message}`);
            throw error;
        }
    }
}