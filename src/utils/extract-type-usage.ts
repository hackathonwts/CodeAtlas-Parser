import { Project, SyntaxKind, Node, Type } from "ts-morph";
import { KGRelation } from "../types/kg.types";
import { relative, sep } from "path";
import * as IdGen from "./id-generator.js";

/**
 * Extracts type usage relationships - tracks when methods/functions use 
 * models, entities, interfaces, enums, etc.
 * 
 * Example: findUser() uses UserModel, RolesEnum -> creates USES_MODEL, USES_ENUM relationships
 */
export function extractTypeUsage(project: Project): KGRelation[] {
    const relations: KGRelation[] = [];
    const srcDir = project.getDirectories().find(d => d.getPath().endsWith(`${sep}src`));
    const srcRoot = srcDir?.getPath() || "";

    project.getSourceFiles().forEach(file => {
        const relativePath = srcRoot
            ? `src/${relative(srcRoot, file.getFilePath()).split(sep).join("/")}`
            : file.getFilePath();

        // Process class methods
        file.getClasses().forEach(cls => {
            const className = cls.getName();
            if (!className) return;

            cls.getMethods().forEach(method => {
                const methodId = IdGen.generateMethodId(className, method.getName(), relativePath);
                extractTypesFromNode(method, methodId, relations, srcRoot);
            });
        });

        // Process standalone functions
        file.getFunctions().forEach(func => {
            const funcName = func.getName();
            if (!funcName) return;
            const funcId = IdGen.generateFunctionId(funcName, relativePath);
            extractTypesFromNode(func, funcId, relations, srcRoot);
        });
    });

    return relations;
}

function extractTypesFromNode(node: Node, fromId: string, relations: KGRelation[], srcRoot: string): void {
    // Get all type references within the node
    const typeRefs = node.getDescendantsOfKind(SyntaxKind.TypeReference);

    typeRefs.forEach(typeRef => {
        const typeName = typeRef.getTypeName();
        if (Node.isIdentifier(typeName)) {
            const symbol = typeName.getSymbol();
            if (symbol) {
                processTypeSymbol(symbol, fromId, relations, srcRoot);
            }
        }
    });

    // Get all identifiers and check if they reference types we care about
    const identifiers = node.getDescendantsOfKind(SyntaxKind.Identifier);

    identifiers.forEach(identifier => {
        const symbol = identifier.getSymbol();
        if (!symbol) return;

        const decl = symbol.getDeclarations()?.[0];
        if (!decl) return;

        const kind = decl.getKind();
        const identText = identifier.getText();

        // Get the file path of the declaration
        const declFile = decl.getSourceFile();
        const declFilePath = srcRoot
            ? `src/${relative(srcRoot, declFile.getFilePath()).split(sep).join("/")}`
            : declFile.getFilePath();

        // Check for model/entity access (commonly named patterns)
        if (isModelPattern(identText) || isEntityPattern(identText)) {
            addUniqueRelation(relations, {
                from: fromId,
                to: IdGen.generateClassId(identText, declFilePath),
                type: "USES_MODEL",
            });
            return;
        }

        // Check for enum access
        if (kind === SyntaxKind.EnumDeclaration) {
            addUniqueRelation(relations, {
                from: fromId,
                to: IdGen.generateEnumId(symbol.getName(), declFilePath),
                type: "USES_ENUM",
            });
        }
        // Check for interface access
        else if (kind === SyntaxKind.InterfaceDeclaration) {
            addUniqueRelation(relations, {
                from: fromId,
                to: IdGen.generateInterfaceId(symbol.getName(), declFilePath),
                type: "USES_INTERFACE",
            });
        }
        // Check for type alias access
        else if (kind === SyntaxKind.TypeAliasDeclaration) {
            addUniqueRelation(relations, {
                from: fromId,
                to: IdGen.generateTypeAliasId(symbol.getName(), declFilePath),
                type: "USES_TYPE",
            });
        }
    });

    // Process property accesses that might be using models/repositories
    const propAccesses = node.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);

    propAccesses.forEach(propAccess => {
        const expression = propAccess.getExpression();

        // Check if this is accessing a model/repository
        if (Node.isIdentifier(expression)) {
            const symbol = expression.getSymbol();
            if (symbol) {
                const type = symbol.getValueDeclaration()?.getType();
                if (type) {
                    checkTypeForModels(type, fromId, relations, srcRoot);
                }
            }
        }
        // Check for this.userModel, this.userRepository patterns
        else if (Node.isPropertyAccessExpression(expression)) {
            const propName = propAccess.getName();
            if (isModelPattern(propName) || isRepoPattern(propName)) {
                const propSymbol = propAccess.getNameNode().getSymbol();
                if (propSymbol) {
                    const propType = propSymbol.getValueDeclaration()?.getType();
                    if (propType) {
                        const typeSymbol = propType.getSymbol();
                        if (typeSymbol) {
                            const typeName = typeSymbol.getName();
                            const typeDecl = typeSymbol.getDeclarations()?.[0];
                            if (typeDecl) {
                                const typeFile = typeDecl.getSourceFile();
                                const typeFilePath = srcRoot
                                    ? `src/${relative(srcRoot, typeFile.getFilePath()).split(sep).join("/")}`
                                    : typeFile.getFilePath();
                                addUniqueRelation(relations, {
                                    from: fromId,
                                    to: IdGen.generateClassId(typeName, typeFilePath),
                                    type: "USES_MODEL",
                                });
                            }
                        }
                    }
                }
            }
        }
    });

    // Extract new expressions (e.g., new UserDto(), new UserEntity())
    const newExpressions = node.getDescendantsOfKind(SyntaxKind.NewExpression);

    newExpressions.forEach(newExpr => {
        const expression = newExpr.getExpression();
        if (Node.isIdentifier(expression)) {
            const className = expression.getText();
            const symbol = expression.getSymbol();

            if (symbol) {
                const decl = symbol.getDeclarations()?.[0];
                if (decl && decl.getKind() === SyntaxKind.ClassDeclaration) {
                    const declFile = decl.getSourceFile();
                    const declFilePath = srcRoot
                        ? `src/${relative(srcRoot, declFile.getFilePath()).split(sep).join("/")}`
                        : declFile.getFilePath();

                    const relationType = isEntityPattern(className) || isModelPattern(className)
                        ? "CREATES_MODEL"
                        : "CREATES_INSTANCE";

                    addUniqueRelation(relations, {
                        from: fromId,
                        to: IdGen.generateClassId(className, declFilePath),
                        type: relationType,
                    });
                }
            }
        }
    });
}

function processTypeSymbol(symbol: any, fromId: string, relations: KGRelation[], srcRoot: string): void {
    const decl = symbol.getDeclarations()?.[0];
    if (!decl) return;

    const kind = decl.getKind();
    const typeName = symbol.getName();

    const declFile = decl.getSourceFile();
    const declFilePath = srcRoot
        ? `src/${relative(srcRoot, declFile.getFilePath()).split(sep).join("/")}`
        : declFile.getFilePath();

    if (kind === SyntaxKind.ClassDeclaration) {
        const relationType = isEntityPattern(typeName) || isModelPattern(typeName)
            ? "USES_MODEL"
            : "USES_CLASS";
        addUniqueRelation(relations, {
            from: fromId,
            to: IdGen.generateClassId(typeName, declFilePath),
            type: relationType,
        });
    }
    else if (kind === SyntaxKind.InterfaceDeclaration) {
        addUniqueRelation(relations, {
            from: fromId,
            to: IdGen.generateInterfaceId(typeName, declFilePath),
            type: "USES_INTERFACE",
        });
    }
    else if (kind === SyntaxKind.EnumDeclaration) {
        addUniqueRelation(relations, {
            from: fromId,
            to: IdGen.generateEnumId(typeName, declFilePath),
            type: "USES_ENUM",
        });
    }
    else if (kind === SyntaxKind.TypeAliasDeclaration) {
        addUniqueRelation(relations, {
            from: fromId,
            to: IdGen.generateTypeAliasId(typeName, declFilePath),
            type: "USES_TYPE",
        });
    }
}

function checkTypeForModels(type: Type, fromId: string, relations: KGRelation[], srcRoot: string): void {
    const typeSymbol = type.getSymbol();
    if (typeSymbol) {
        const typeName = typeSymbol.getName();
        const typeDecl = typeSymbol.getDeclarations()?.[0];
        if (typeDecl && (isModelPattern(typeName) || isEntityPattern(typeName))) {
            const declFile = typeDecl.getSourceFile();
            const declFilePath = srcRoot
                ? `src/${relative(srcRoot, declFile.getFilePath()).split(sep).join("/")}`
                : declFile.getFilePath();
            addUniqueRelation(relations, {
                from: fromId,
                to: IdGen.generateClassId(typeName, declFilePath),
                type: "USES_MODEL",
            });
        }
    }

    // Check generic type arguments (e.g., Repository<User>)
    const typeArgs = type.getTypeArguments();
    typeArgs.forEach(argType => {
        const argSymbol = argType.getSymbol();
        if (argSymbol) {
            const argTypeName = argSymbol.getName();
            const argDecl = argSymbol.getDeclarations()?.[0];
            if (argDecl && (isModelPattern(argTypeName) || isEntityPattern(argTypeName))) {
                const declFile = argDecl.getSourceFile();
                const declFilePath = srcRoot
                    ? `src/${relative(srcRoot, declFile.getFilePath()).split(sep).join("/")}`
                    : declFile.getFilePath();
                addUniqueRelation(relations, {
                    from: fromId,
                    to: IdGen.generateClassId(argTypeName, declFilePath),
                    type: "USES_MODEL",
                });
            }
        }
    });
}

function isModelPattern(name: string): boolean {
    const patterns = [
        /model$/i,
        /entity$/i,
        /dto$/i,
        /schema$/i,
        /document$/i,
    ];
    return patterns.some(p => p.test(name));
}

function isEntityPattern(name: string): boolean {
    const patterns = [
        /entity$/i,
        /model$/i,
    ];
    return patterns.some(p => p.test(name));
}

function isRepoPattern(name: string): boolean {
    const patterns = [
        /repository$/i,
        /repo$/i,
        /model$/i,
        /service$/i,
    ];
    return patterns.some(p => p.test(name));
}

function addUniqueRelation(relations: KGRelation[], relation: KGRelation): void {
    const exists = relations.some(
        r => r.from === relation.from && r.to === relation.to && r.type === relation.type
    );
    if (!exists) {
        relations.push(relation);
    }
}
