import { inspect } from "node:util";
import { writeFileSync } from "node:fs";
import { Project } from "ts-morph";
import { extractDI } from "./utils/extract-di";
import { extractMethodCalls } from "./utils/extract-method-calls";
import { extractRoutes } from "./utils/extract-routes";
import { extractStructure } from "./utils/extract-structure";

const PROJECT_PATH = './projects/nest_basic/';
const project = new Project({
    tsConfigFilePath: PROJECT_PATH + "tsconfig.json",
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

console.log(inspect({ nodes, relations }, { depth: null, colors: true }));

writeFileSync(
    "kg.json",
    JSON.stringify({ nodes, relations }, null, 2),
    "utf-8"
);