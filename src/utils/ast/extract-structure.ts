import { Project, SyntaxKind } from "ts-morph";
import { KGNode, KGRelation } from "../../types/kg.types";
import { relative, sep } from "path";

export function extractStructure(project: Project): { nodes: KGNode[]; relations: KGRelation[] } {
    const nodes: KGNode[] = [];
    const relations: KGRelation[] = [];

    const srcDir = project.getDirectories().find(d => d.getPath().endsWith(`${sep}src`));
    if (!srcDir) throw new Error("src directory not found");

    const srcRoot = srcDir.getPath();

    project.getSourceFiles().forEach(file => {
        const absolutePath = file.getFilePath();
        const relativePath = `src/${relative(srcRoot, absolutePath).split(sep).join("/")}`;
        const fileId = `file:${relativePath}`;

        // Add File node
        nodes.push({
            id: fileId,
            kind: "File",
            name: file.getBaseName(),
            filePath: relativePath,
        });

        // Extract Classes and their members
        file.getClasses().forEach(cls => {
            const className = cls.getName() || "AnonymousClass";
            const classId = `class:${className}`;

            nodes.push({
                id: classId,
                kind: "Class",
                name: className,
                filePath: relativePath,
            });

            relations.push({
                from: fileId,
                to: classId,
                type: "DECLARES",
            });

            // Extract Methods
            cls.getMethods().forEach(method => {
                const methodName = method.getName();
                const methodId = `method:${className}.${methodName}`;

                nodes.push({
                    id: methodId,
                    kind: "Method",
                    name: methodName,
                    parentId: classId,
                    filePath: relativePath,
                    meta: {
                        isAsync: method.isAsync(),
                        isStatic: method.isStatic(),
                        visibility: method.getScope(),
                        returnType: method.getReturnType()?.getText() || "void",
                        parameters: method.getParameters().map(p => ({
                            name: p.getName(),
                            type: p.getType().getText(),
                        })),
                    },
                });

                relations.push({
                    from: classId,
                    to: methodId,
                    type: "HAS_METHOD",
                });

                // Extract method parameters as nodes
                method.getParameters().forEach(param => {
                    const paramName = param.getName();
                    const paramType = param.getType().getText();
                    const paramId = `param:${className}.${methodName}.${paramName}`;

                    nodes.push({
                        id: paramId,
                        kind: "Parameter",
                        name: paramName,
                        parentId: methodId,
                        meta: {
                            type: paramType,
                        },
                    });

                    relations.push({
                        from: methodId,
                        to: paramId,
                        type: "HAS_PARAMETER",
                    });

                    // Check if parameter type references a known type (class, interface, enum)
                    const typeSymbol = param.getType().getSymbol();
                    if (typeSymbol) {
                        const typeName = typeSymbol.getName();
                        const typeDecl = typeSymbol.getDeclarations()?.[0];
                        if (typeDecl) {
                            const typeKind = typeDecl.getKind();
                            if (typeKind === SyntaxKind.ClassDeclaration) {
                                relations.push({
                                    from: paramId,
                                    to: `class:${typeName}`,
                                    type: "USES_TYPE",
                                });
                            } else if (typeKind === SyntaxKind.InterfaceDeclaration) {
                                relations.push({
                                    from: paramId,
                                    to: `interface:${typeName}`,
                                    type: "USES_TYPE",
                                });
                            } else if (typeKind === SyntaxKind.EnumDeclaration) {
                                relations.push({
                                    from: paramId,
                                    to: `enum:${typeName}`,
                                    type: "USES_TYPE",
                                });
                            } else if (typeKind === SyntaxKind.TypeAliasDeclaration) {
                                relations.push({
                                    from: paramId,
                                    to: `type:${typeName}`,
                                    type: "USES_TYPE",
                                });
                            }
                        }
                    }
                });
            });

            // Extract Properties
            cls.getProperties().forEach(prop => {
                const propName = prop.getName();
                const propId = `property:${className}.${propName}`;

                nodes.push({
                    id: propId,
                    kind: "Property",
                    name: propName,
                    parentId: classId,
                    filePath: relativePath,
                    meta: {
                        type: prop.getType()?.getText() || "any",
                        isStatic: prop.isStatic(),
                        visibility: prop.getScope(),
                    },
                });

                relations.push({
                    from: classId,
                    to: propId,
                    type: "HAS_PROPERTY",
                });

                // Check if property type references a known type
                const typeSymbol = prop.getType().getSymbol();
                if (typeSymbol) {
                    const typeName = typeSymbol.getName();
                    const typeDecl = typeSymbol.getDeclarations()?.[0];
                    if (typeDecl) {
                        const typeKind = typeDecl.getKind();
                        if (typeKind === SyntaxKind.ClassDeclaration) {
                            relations.push({
                                from: propId,
                                to: `class:${typeName}`,
                                type: "USES_TYPE",
                            });
                        } else if (typeKind === SyntaxKind.InterfaceDeclaration) {
                            relations.push({
                                from: propId,
                                to: `interface:${typeName}`,
                                type: "USES_TYPE",
                            });
                        } else if (typeKind === SyntaxKind.EnumDeclaration) {
                            relations.push({
                                from: propId,
                                to: `enum:${typeName}`,
                                type: "USES_TYPE",
                            });
                        }
                    }
                }
            });
        });

        // Extract standalone Functions
        file.getFunctions().forEach(func => {
            const funcName = func.getName() || "anonymous";
            const funcId = `function:${relativePath}:${funcName}`;

            nodes.push({
                id: funcId,
                kind: "Function",
                name: funcName,
                filePath: relativePath,
                meta: {
                    isAsync: func.isAsync(),
                    isExported: func.isExported(),
                    returnType: func.getReturnType()?.getText() || "void",
                    parameters: func.getParameters().map(p => ({
                        name: p.getName(),
                        type: p.getType().getText(),
                    })),
                },
            });

            relations.push({
                from: fileId,
                to: funcId,
                type: "DECLARES",
            });
        });

        // Extract Interfaces
        file.getInterfaces().forEach(iface => {
            const ifaceName = iface.getName();
            const ifaceId = `interface:${ifaceName}`;

            nodes.push({
                id: ifaceId,
                kind: "Interface",
                name: ifaceName,
                filePath: relativePath,
                meta: {
                    isExported: iface.isExported(),
                    properties: iface.getProperties().map(p => ({
                        name: p.getName(),
                        type: p.getType().getText(),
                    })),
                },
            });

            relations.push({
                from: fileId,
                to: ifaceId,
                type: "DECLARES",
            });

            // Interface extends relationships
            iface.getExtends().forEach(ext => {
                const extName = ext.getExpression().getText();
                relations.push({
                    from: ifaceId,
                    to: `interface:${extName}`,
                    type: "EXTENDS",
                });
            });
        });

        // Extract Enums
        file.getEnums().forEach(enumDecl => {
            const enumName = enumDecl.getName();
            const enumId = `enum:${enumName}`;

            nodes.push({
                id: enumId,
                kind: "Enum",
                name: enumName,
                filePath: relativePath,
                meta: {
                    isExported: enumDecl.isExported(),
                },
            });

            relations.push({
                from: fileId,
                to: enumId,
                type: "DECLARES",
            });

            // Extract Enum Members
            enumDecl.getMembers().forEach(member => {
                const memberName = member.getName();
                const memberId = `enumMember:${enumName}.${memberName}`;

                nodes.push({
                    id: memberId,
                    kind: "EnumMember",
                    name: memberName,
                    parentId: enumId,
                    meta: {
                        value: member.getValue(),
                    },
                });

                relations.push({
                    from: enumId,
                    to: memberId,
                    type: "HAS_MEMBER",
                });
            });
        });

        // Extract Type Aliases
        file.getTypeAliases().forEach(typeAlias => {
            const typeName = typeAlias.getName();
            const typeId = `type:${typeName}`;

            nodes.push({
                id: typeId,
                kind: "TypeAlias",
                name: typeName,
                filePath: relativePath,
                meta: {
                    isExported: typeAlias.isExported(),
                    definition: typeAlias.getType().getText(),
                },
            });

            relations.push({
                from: fileId,
                to: typeId,
                type: "DECLARES",
            });
        });

        // Extract Variable Declarations (const, let, var)
        file.getVariableStatements().forEach(varStmt => {
            varStmt.getDeclarations().forEach(varDecl => {
                const varName = varDecl.getName();
                const varId = `variable:${relativePath}:${varName}`;

                nodes.push({
                    id: varId,
                    kind: "Variable",
                    name: varName,
                    filePath: relativePath,
                    meta: {
                        isExported: varStmt.isExported(),
                        type: varDecl.getType()?.getText() || "any",
                        declarationType: varStmt.getDeclarationKind(),
                    },
                });

                relations.push({
                    from: fileId,
                    to: varId,
                    type: "DECLARES",
                });
            });
        });
    });

    return { nodes, relations };
}