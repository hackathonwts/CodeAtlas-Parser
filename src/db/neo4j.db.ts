import { KGNode, KGRelation } from "../types/kg.types";
import neo4j, { Driver, Session } from "neo4j-driver";
import config from "../config";

// Driver created outside the class - singleton connection to Neo4j server
export const driver: Driver = neo4j.driver(
    `${config.neo4j.host}:${config.neo4j.port}`,
    neo4j.auth.basic(config.neo4j.username, config.neo4j.password)
);

export class Neo4jDatabase {
    private databaseName: string;

    constructor(databaseName: string) {
        this.databaseName = databaseName;
    }

    /**
     * Creates a session with the system database for administrative operations
     */
    private async withSystemSession<T>(work: (session: Session) => Promise<T>): Promise<T> {
        const session = driver.session({ database: "system" });
        try {
            return await work(session);
        } finally {
            await session.close();
        }
    }

    /**
     * Creates a session with the specified database name and executes work within it
     */
    private async withSession<T>(work: (session: Session) => Promise<T>): Promise<T> {
        const session = driver.session({ database: this.databaseName });
        try {
            return await work(session);
        } finally {
            await session.close();
        }
    }

    /**
     * Creates the database if it doesn't exist
     */
    async createDatabaseIfNotExists(): Promise<void> {
        await this.withSystemSession(async (session) => {
            try {
                // Create database if it doesn't exist (Neo4j Enterprise feature)
                await session.run(`CREATE DATABASE \`${this.databaseName}\` IF NOT EXISTS`);
                // Wait for database to become available
                await this.waitForDatabaseReady();
            } catch (error: any) {
                // If the error is about the database already existing, ignore it
                if (error.code === "Neo.ClientError.Database.DatabaseAlreadyExists") {
                    // console.log(`Database '${this.databaseName}' already exists.`);
                } else {
                    throw error;
                }
            }
        });
    }

    /**
     * Waits for the database to be ready (online status)
     */
    private async waitForDatabaseReady(maxRetries: number = 10, delayMs: number = 1000): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // await this.withSystemSession(async (session) => {
                //     const result = await session.run(
                //         `SHOW DATABASE \`${this.databaseName}\` YIELD currentStatus WHERE currentStatus = 'online' RETURN currentStatus`
                //     );
                //     if (result.records.length > 0) {
                //         return;
                //     }
                // });

                // Try a simple query on the database to verify it's ready
                await this.withSession(async (session) => {
                    await session.run("RETURN 1");
                });
                // console.log(`Database '${this.databaseName}' is ready.`);
                return;
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw new Error(`Database '${this.databaseName}' did not become ready in time.`);
                }
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

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
     * Cleans the entire database by deleting all nodes and relationships
     */
    async cleanDatabase(): Promise<void> {
        await this.withSession(async (session) => {
            // Delete all relationships first, then all nodes
            await session.run("MATCH (n) DETACH DELETE n");
            // console.log(`Database '${this.databaseName}' cleaned successfully.`);
        });
    }

    /**
     * Ensures database exists (creates if not) and cleans it
     */
    async ensureCleanDatabase(): Promise<void> {
        try {
            await this.createDatabaseIfNotExists();
            await this.cleanDatabase();
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
    async importNodes(nodes: KGNode[]): Promise<void> {
        await this.withSession(async (session) => {
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
            }
        });
    }

    /**
     * Imports relations into the database
     */
    async importRelations(relations: KGRelation[]): Promise<void> {
        await this.withSession(async (session) => {
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
            }
        });
    }

    /**
     * Creates/ensures database exists, cleans it, and imports fresh data (nodes and relations)
     */
    async cleanAndImport(nodes: KGNode[], relations: KGRelation[]): Promise<void> {
        try {
            // console.log(`Starting clean import to database '${this.databaseName}'...`);

            // Ensure database exists and clean it
            await this.ensureCleanDatabase();

            // Import nodes
            // console.log(`Importing ${nodes.length} nodes...`);
            await this.importNodes(nodes);

            // Import relations
            // console.log(`Importing ${relations.length} relations...`);
            await this.importRelations(relations);

            // console.log(`Clean import completed successfully.`);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Closes the driver connection (call when done with all database operations)
     */
    static async closeDriver(): Promise<void> {
        await driver.close();
    }
}