import { Neo4jDatabase } from "./db/neo4j.db";

export async function ingest(nodes: any[], relations: any[], databaseName: string = "neo4j") {
    const db = new Neo4jDatabase(databaseName);

    try {
        // Clean the database first, then import new data
        await db.cleanAndImport(nodes, relations);

        console.log("✅ Knowledge Graph imported successfully");
    } finally {
        await Neo4jDatabase.closeDriver();
    }
}
