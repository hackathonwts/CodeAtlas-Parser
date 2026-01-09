import { Neo4jDatabase } from "./db/neo4j.db";

export async function ingest(nodes: any[], relations: any[], databaseName: string = "neo4j") {
    const db = new Neo4jDatabase(databaseName);

    try {
        console.log("Importing nodes...");
        await db.importNodes(nodes);

        console.log("Importing relations...");
        await db.importRelations(relations);

        console.log("✅ Knowledge Graph imported");
    } finally {
        await db.close();
    }
}
