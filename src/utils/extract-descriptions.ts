import { Project, Node, SyntaxKind } from "ts-morph";
import { relative, sep } from "path";
import * as IdGen from "./id-generator.js";
import { DescriptionDoc } from "../types/kg.types";

/**
 * Extracts @description comments from code nodes
 */
export function extractDescriptions(project: Project): DescriptionDoc[] {
    const descriptions: DescriptionDoc[] = [];
    const srcDir = project.getDirectories().find(d => d.getPath().endsWith(`${sep}src`));
    const srcRoot = srcDir?.getPath() || "";

    project.getSourceFiles().forEach(file => {
        const relativePath = srcRoot
            ? `src/${relative(srcRoot, file.getFilePath()).split(sep).join("/")}`
            : file.getFilePath();

        // Extract from classes
        file.getClasses().forEach(cls => {
            const className = cls.getName();
            if (!className) return;

            // Class-level description
            const classDesc = extractDescriptionFromNode(cls);
            if (classDesc) {
                descriptions.push({
                    nodeId: IdGen.generateClassId(className, relativePath),
                    nodeName: className,
                    nodeKind: "Class",
                    filePath: relativePath,
                    description: classDesc.description,
                    fullComment: classDesc.fullComment,
                });
            }

            // Method descriptions
            cls.getMethods().forEach(method => {
                const methodName = method.getName();
                const methodDesc = extractDescriptionFromNode(method);

                if (methodDesc) {
                    descriptions.push({
                        nodeId: IdGen.generateMethodId(className, methodName, relativePath),
                        nodeName: methodName,
                        nodeKind: "Method",
                        filePath: relativePath,
                        description: methodDesc.description,
                        fullComment: methodDesc.fullComment,
                    });
                }
            });

            // Property descriptions
            cls.getProperties().forEach(prop => {
                const propName = prop.getName();
                const propDesc = extractDescriptionFromNode(prop);

                if (propDesc) {
                    descriptions.push({
                        nodeId: IdGen.generatePropertyId(className, propName, relativePath),
                        nodeName: propName,
                        nodeKind: "Property",
                        filePath: relativePath,
                        description: propDesc.description,
                        fullComment: propDesc.fullComment,
                    });
                }
            });
        });

        // Extract from standalone functions
        file.getFunctions().forEach(func => {
            const funcName = func.getName();
            if (!funcName) return;

            const funcDesc = extractDescriptionFromNode(func);
            if (funcDesc) {
                descriptions.push({
                    nodeId: IdGen.generateFunctionId(funcName, relativePath),
                    nodeName: funcName,
                    nodeKind: "Function",
                    filePath: relativePath,
                    description: funcDesc.description,
                    fullComment: funcDesc.fullComment,
                });
            }
        });

        // Extract from interfaces
        file.getInterfaces().forEach(iface => {
            const ifaceName = iface.getName();
            const ifaceDesc = extractDescriptionFromNode(iface);

            if (ifaceDesc) {
                descriptions.push({
                    nodeId: IdGen.generateInterfaceId(ifaceName, relativePath),
                    nodeName: ifaceName,
                    nodeKind: "Interface",
                    filePath: relativePath,
                    description: ifaceDesc.description,
                    fullComment: ifaceDesc.fullComment,
                });
            }
        });

        // Extract from enums
        file.getEnums().forEach(enumDecl => {
            const enumName = enumDecl.getName();
            const enumDesc = extractDescriptionFromNode(enumDecl);

            if (enumDesc) {
                descriptions.push({
                    nodeId: IdGen.generateEnumId(enumName, relativePath),
                    nodeName: enumName,
                    nodeKind: "Enum",
                    filePath: relativePath,
                    description: enumDesc.description,
                    fullComment: enumDesc.fullComment,
                });
            }
        });

        // Extract from type aliases
        file.getTypeAliases().forEach(typeAlias => {
            const typeName = typeAlias.getName();
            const typeDesc = extractDescriptionFromNode(typeAlias);

            if (typeDesc) {
                descriptions.push({
                    nodeId: IdGen.generateTypeAliasId(typeName, relativePath),
                    nodeName: typeName,
                    nodeKind: "TypeAlias",
                    filePath: relativePath,
                    description: typeDesc.description,
                    fullComment: typeDesc.fullComment,
                });
            }
        });

        // Extract from variables
        file.getVariableStatements().forEach(varStmt => {
            varStmt.getDeclarations().forEach(varDecl => {
                const varName = varDecl.getName();
                const varDesc = extractDescriptionFromNode(varStmt);

                if (varDesc) {
                    descriptions.push({
                        nodeId: IdGen.generateVariableId(varName, relativePath),
                        nodeName: varName,
                        nodeKind: "Variable",
                        filePath: relativePath,
                        description: varDesc.description,
                        fullComment: varDesc.fullComment,
                    });
                }
            });
        });
    });

    return descriptions;
}

/**
 * Extracts @description from JSDoc comment of a node
 */
function extractDescriptionFromNode(node: Node): { description: string; fullComment: string } | null {
    // Get JSDoc comments
    const jsDocs = (node as any).getJsDocs?.();
    if (!jsDocs || jsDocs.length === 0) return null;

    for (const jsDoc of jsDocs) {
        const fullComment = jsDoc.getText();
        const tags = jsDoc.getTags();

        // Look for @description tag
        const descTag = tags.find((tag: any) =>
            tag.getTagName() === "description"
        );

        if (descTag) {
            const description = descTag.getComment() || "";
            return {
                description: typeof description === "string" ? description : description.getText?.() || "",
                fullComment,
            };
        }

        // Also check if description is in the main comment (before any tags)
        const comment = jsDoc.getComment();
        if (comment) {
            const commentText = typeof comment === "string" ? comment : comment.getText?.() || "";

            // Check if comment contains @description
            if (fullComment.includes("@description")) {
                const match = fullComment.match(/@description\s+(.+?)(?:\n\s*\*\s*@|\n\s*\*\/|$)/s);
                if (match) {
                    return {
                        description: match[1].trim().replace(/\n\s*\*\s*/g, " "),
                        fullComment,
                    };
                }
            }
        }
    }

    return null;
}
