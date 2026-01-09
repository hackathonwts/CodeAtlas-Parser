import config from "./config";
import { cloneGitRepository, GitCloneConfig } from "./gitManager";
import parser from "./parser";
import { ingest } from "./ingest";


async function main() {
    const projectGitConfig: GitCloneConfig = {
        gitUrl: "https://gitlab.webskitters.com/node/wts-nest-setup.git",
        branch: "dev",
        projectName: "wts-nest-setup",
        username: process.env.GIT_USER_NAME,
        password: process.env.GIT_PASSWORD,
    };
    const result = await cloneGitRepository(projectGitConfig);
    if (result.success) {
        const { nodes, relations } = parser(result.clonedPath);
        // Pass the project name as the database name
        await ingest(nodes, relations, projectGitConfig.projectName);
        console.log("✅ Knowledge Graph imported");
    }

};
main();