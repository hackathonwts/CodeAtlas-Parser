import { Project } from "ts-morph";
import { KGNode, KGRelation } from "../types/kg.types";
import { relative, sep } from "path";

export function extractStructure(project: Project): { nodes: KGNode[]; relations: KGRelation[] } {
    const nodes: KGNode[] = [];
    const relations: KGRelation[] = [];

    const srcDir = project.getDirectories().find(d => d.getPath().endsWith(`${sep}src`));
    if (!srcDir) throw new Error("src directory not found");

    const srcRoot = srcDir.getPath();
    project.getSourceFiles().forEach(file => {
        // const fileId = `file:${file.getFilePath()}`;
        const absolutePath = file.getFilePath();
        const relativePath = `src/${relative(srcRoot, absolutePath).split(sep).join("/")}`;

        nodes.push({
            id: `file:${relativePath}`,
            kind: "File",
            name: file.getBaseName(),
            filePath: relativePath,
        });

        file.getClasses().forEach(cls => {
            const classId = `class:${cls.getName()}`;

            nodes.push({
                id: classId,
                kind: "Class",
                name: cls.getName(),
                filePath: relativePath,
            });

            relations.push({
                from: relativePath,
                to: classId,
                type: "DECLARES",
            });

            cls.getMethods().forEach(method => {
                const methodId = `method:${cls.getName()}.${method.getName()}`;

                nodes.push({
                    id: methodId,
                    kind: "Method",
                    name: method.getName(),
                    parentId: classId,
                });

                relations.push({
                    from: classId,
                    to: methodId,
                    type: "HAS_METHOD",
                });
            });
        });
    });

    return { nodes, relations };
}
