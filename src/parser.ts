import { inspect } from "node:util";
import { writeFileSync } from "node:fs";
import { Project } from "ts-morph";
import { extractDI } from "./utils/extract-di";
import { extractMethodCalls } from "./utils/extract-method-calls";
import { extractRoutes } from "./utils/extract-routes";
import { extractStructure } from "./utils/extract-structure";


export default function parser(projectPath: string) {
    const project = new Project({
        tsConfigFilePath: projectPath + "tsconfig.json",
        skipAddingFilesFromTsConfig: false,
    });

    const structure = extractStructure(project);
    const di = extractDI(project);
    const calls = extractMethodCalls(project);
    const routes = extractRoutes(project);

    const nodes = [
        ...structure.nodes,
        ...routes.nodes,
    ];

    const relations = [
        ...structure.relations,
        ...di,
        ...calls,
        ...routes.relations,
    ];

    return { nodes, relations };
}
