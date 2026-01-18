import config from "./config";
import { cloneGitRepository, GitCloneConfig } from "./gitManager";
import parser from "./parser";
import { ingest } from "./ingest";
import mongoDb from './db/mongo.db';
import { Project } from "./models/project.model";
import dumpDoc from "./dumpDoc";


async function main() {
    await mongoDb();
    // const project =new Project({
    //     gitUrl: process.env.GIT_URL,
    //     branch: "dev",
    //     projectName: "wts-nest-setup",
    //     username: process.env.GIT_USER_NAME,
    //     password: process.env.GIT_PASSWORD,
    // });
    // console.log(project);
    // await project.save();
    const project = await Project.findOne({ uuid: "wts-nest-setup-dev-aa4bcqpu" }).exec();
    if (!project) {
        console.log("Project not found");
        return;
    }
    const projectGitConfig: GitCloneConfig = {
        gitUrl: project.gitUrl,
        branch: project.branch,
        projectName: project.projectName,
        username: project.username,
        password: project.password,
    };
    const result = await cloneGitRepository(projectGitConfig);
    if (result.success) {
        const { nodes, relations, documentation } = parser(result.clonedPath);

        // Pass the project name as the database name
        await ingest(nodes, relations, projectGitConfig.projectName);
        console.log("✅ Knowledge Graph imported to Neo4j");
        
        project.scanVersion = project.scanVersion + 1;
        await project.save();

        try {
            await dumpDoc(project,documentation);
            console.log("✅ Documentation are dumped successfully");
        } catch (error) {
            console.error("Failed to dump documentation:", error);
        }
    }

};
main();