
import { cloneGitRepository,GitCloneConfig } from "./gitManager";
import * as dotenv from "dotenv";
import parser from "./parser";
dotenv.config();
console.log(process.env.GIT_USER_NAME);
console.log(process.env.GIT_PASSWORD);


async function main(){
    const projectGitConfig :GitCloneConfig= {
        gitUrl: "",
        branch: "dev",
        projectName: "wts-nest-setup",
        username: process.env.GIT_USER_NAME,
        password: process.env.GIT_PASSWORD,
    };
    const result = await cloneGitRepository(projectGitConfig);
    if(result.success){
        const { nodes, relations } = parser(result.clonedPath);
        console.log(nodes, relations);
    }
};
main();