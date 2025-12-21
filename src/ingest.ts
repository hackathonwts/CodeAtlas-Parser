import { readFileSync } from "node:fs";
import { importNodes, importRelations } from "./db/neo4j.db";

const kg = JSON.parse(readFileSync("kg.json", "utf-8"));

async function executeIngestion() {
    console.log("Importing nodes...");
    await importNodes(kg.nodes);

    console.log("Importing relations...");
    await importRelations(kg.relations);

    console.log("✅ Knowledge Graph imported");
}

executeIngestion()
    .then(() => process.exit(0))
    .catch(console.error);