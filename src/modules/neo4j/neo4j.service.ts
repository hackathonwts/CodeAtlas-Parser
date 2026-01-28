import { Injectable } from '@nestjs/common';
import { KGNode, KGRelation } from '../../types/kg.types';
import { Neo4jService as BaseNeo4jService } from '../../neo4j/neo4j.service';

@Injectable()
export class KnowledgeGraphNeo4jService {
    constructor(private readonly baseNeo4jService: BaseNeo4jService) {}

    /**
     * Generates Cypher query for merging nodes
     */
    private nodeMergeCypher(label: string): string {
        return `
        MERGE (n:${label} { id: $id })
        SET n += $props
        `;
    }

    /**
     * Generates Cypher query for merging relations
     */
    private relationMergeCypher(type: string): string {
        return `
        MATCH (a { id: $from })
        MATCH (b { id: $to })
        MERGE (a)-[r:${type}]->(b)
        `;
    }

    /**
     * Creates the database if it doesn't exist
     */
    async createDatabaseIfNotExists(databaseName: string): Promise<void> {
        const session = this.baseNeo4jService.getSession("system");
        try {
            // Create database if it doesn't exist (Neo4j Enterprise feature)
            await session.run(`CREATE DATABASE \`${databaseName}\` IF NOT EXISTS`);
            // Wait for database to become available
            await this.waitForDatabaseReady(databaseName);
        } catch (error: any) {
            // If the error is about the database already existing, ignore it
            if (error.code === "Neo.ClientError.Database.DatabaseAlreadyExists") {
                // console.log(`Database '${databaseName}' already exists.`);
            } else {
                throw error;
            }
        } finally {
            await session.close();
        }
    }

    /**
     * Waits for the database to be ready (online status)
     */
    private async waitForDatabaseReady(databaseName: string, maxRetries: number = 10, delayMs: number = 1000): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Try a simple query on the database to verify it's ready
                const session = this.baseNeo4jService.getSession(databaseName);
                try {
                    await session.run("RETURN 1");
                } finally {
                    await session.close();
                }
                // console.log(`Database '${databaseName}' is ready.`);
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
        await this.baseNeo4jService.write("MATCH (n) DETACH DELETE n", {}, databaseName);
        // console.log(`Database '${databaseName}' cleaned successfully.`);
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
    async importNodes(databaseName: string, nodes: KGNode[]): Promise<void> {
        const session = this.baseNeo4jService.getSession(databaseName);
        const tx = session.beginTransaction();

        try {
            for (const node of nodes) {
                const label = node.kind;
                const flattenedMeta = this.flattenMeta(node.meta);

                await tx.run(this.nodeMergeCypher(label), {
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
    async importRelations(databaseName: string, relations: KGRelation[]): Promise<void> {
        const session = this.baseNeo4jService.getSession(databaseName);
        const tx = session.beginTransaction();

        try {
            for (const rel of relations) {
                await tx.run(this.relationMergeCypher(rel.type), {
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
    async cleanAndImport(databaseName: string, nodes: KGNode[], relations: KGRelation[]): Promise<void> {
        try {
            // console.log(`Starting clean import to database '${databaseName}'...`);

            // Ensure database exists and clean it
            await this.ensureCleanDatabase(databaseName);

            // Import nodes
            // console.log(`Importing ${nodes.length} nodes...`);
            await this.importNodes(databaseName, nodes);

            // Import relations
            // console.log(`Importing ${relations.length} relations...`);
            await this.importRelations(databaseName, relations);

            // console.log(`Clean import completed successfully.`);
        } catch (error) {
            throw error;
        }
    }
}