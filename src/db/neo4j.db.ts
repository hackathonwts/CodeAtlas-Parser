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
            console.log(`Database '${this.databaseName}' cleaned successfully.`);
        });
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

                    await tx.run(this.nodeMergeCypher(label), {
                        id: node.id,
                        props: {
                            name: node.name,
                            filePath: node.filePath,
                            parentId: node.parentId,
                            ...node.meta,
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
     * Cleans the database and imports fresh data (nodes and relations)
     */
    async cleanAndImport(nodes: KGNode[], relations: KGRelation[]): Promise<void> {
        console.log(`Starting clean import to database '${this.databaseName}'...`);

        // Clean the database first
        await this.cleanDatabase();

        // Import nodes
        console.log(`Importing ${nodes.length} nodes...`);
        await this.importNodes(nodes);

        // Import relations
        console.log(`Importing ${relations.length} relations...`);
        await this.importRelations(relations);

        console.log(`Clean import completed successfully.`);
    }

    /**
     * Closes the driver connection (call when done with all database operations)
     */
    static async closeDriver(): Promise<void> {
        await driver.close();
    }
}