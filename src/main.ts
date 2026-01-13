import config from "./config";
import { cloneGitRepository, GitCloneConfig } from "./gitManager";
import parser from "./parser";
import { ingest } from "./ingest";
import { ChromaDBManager } from "./utils/store-chromadb.js";
const chromaManager = new ChromaDBManager();


async function main() {
    const projectGitConfig: GitCloneConfig = {
        gitUrl: process.env.GIT_URL,
        branch: "dev",
        projectName: "wts-nest-setup",
        username: process.env.GIT_USER_NAME,
        password: process.env.GIT_PASSWORD,
    };
    const result = await cloneGitRepository(projectGitConfig);
    if (result.success) {
        const { nodes, relations, documentation } = parser(result.clonedPath);

        // Pass the project name as the database name
        await ingest(nodes, relations, projectGitConfig.projectName);
        console.log("✅ Knowledge Graph imported to Neo4j");

        // Store documentation in ChromaDB
        try {
            await chromaManager.storeDocumentation(projectGitConfig.projectName, documentation);
            console.log("✅ Documentation stored in ChromaDB");
        } catch (error) {
            console.error("Failed to store documentation in ChromaDB:", error);
        }
    }

};
main();