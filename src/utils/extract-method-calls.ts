import { Project, SyntaxKind, PropertyAccessExpression, Node, SourceFile, ClassDeclaration } from "ts-morph";
import { KGRelation } from "../types/kg.types";
import { relative, sep } from "path";
import * as IdGen from "./id-generator.js";

/**
 * Extracts method call relationships - tracks which methods call which other methods
 * This captures the actual usage patterns in code, e.g., 
 * login() calls findUser() -> creates CALLS relationship
 */
export function extractMethodCalls(project: Project): KGRelation[] {
    const relations: KGRelation[] = [];
    const srcDir = project.getDirectories().find(d => d.getPath().endsWith(`${sep}src`));
    const srcRoot = srcDir?.getPath() || "";

    project.getSourceFiles().forEach(file => {
        const relativePath = srcRoot ? `src/${relative(srcRoot, file.getFilePath()).split(sep).join("/")}` : file.getFilePath();

        // Process class methods
        file.getClasses().forEach(cls => {
            const className = cls.getName();
            if (!className) return;

            cls.getMethods().forEach(method => {
                const fromMethodId = IdGen.generateMethodId(className, method.getName(), relativePath);

                // Find all call expressions within this method
                method.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
                    const expression = call.getExpression();

                    // Handle method calls like this.service.findUser() or authService.findUser()
                    if (Node.isPropertyAccessExpression(expression)) {
                        processPropertyAccessCall(expression, fromMethodId, relations, cls);
                    }
                    // Handle direct function calls like findUser()
                    else if (Node.isIdentifier(expression)) {
                        const symbol = expression.getSymbol();
                        if (!symbol) return;

                        const decl = symbol.getDeclarations()?.[0];
                        if (!decl) return;

                        // Check if it's a method declaration
                        if (Node.isMethodDeclaration(decl)) {
                            const targetClass = decl.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
                            if (targetClass) {
                                const toMethodId = `method:${targetClass.getName()}.${decl.getName()}`;
                                addUniqueRelation(relations, {
                                    from: fromMethodId,
                                    to: toMethodId,
                                    type: "CALLS",
                                });
                            }
                        }
                        // Check if it's a standalone function
                        else if (Node.isFunctionDeclaration(decl)) {
                            const funcFile = decl.getSourceFile();
                            const funcRelPath = srcRoot
                                ? `src/${relative(srcRoot, funcFile.getFilePath()).split(sep).join("/")}`
                                : funcFile.getFilePath();
                            const toFuncId = `function:${funcRelPath}:${decl.getName()}`;
                            addUniqueRelation(relations, {
                                from: fromMethodId,
                                to: toFuncId,
                                type: "CALLS",
                            });
                        }
                    }
                });
            });
        });

        // Process standalone functions
        file.getFunctions().forEach(func => {
            const funcName = func.getName();
            if (!funcName) return;

            const fromFuncId = `function:${relativePath}:${funcName}`;

            func.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
                const expression = call.getExpression();

                if (Node.isPropertyAccessExpression(expression)) {
                    processPropertyAccessCallFromFunction(expression, fromFuncId, relations, srcRoot);
                }
                else if (Node.isIdentifier(expression)) {
                    const symbol = expression.getSymbol();
                    if (!symbol) return;

                    const decl = symbol.getDeclarations()?.[0];
                    if (!decl) return;

                    if (Node.isMethodDeclaration(decl)) {
                        const targetClass = decl.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
                        if (targetClass) {
                            const toMethodId = `method:${targetClass.getName()}.${decl.getName()}`;
                            addUniqueRelation(relations, {
                                from: fromFuncId,
                                to: toMethodId,
                                type: "CALLS",
                            });
                        }
                    }
                    else if (Node.isFunctionDeclaration(decl)) {
                        const funcFile = decl.getSourceFile();
                        const funcRelPath = srcRoot
                            ? `src/${relative(srcRoot, funcFile.getFilePath()).split(sep).join("/")}`
                            : funcFile.getFilePath();
                        const toFuncId = `function:${funcRelPath}:${decl.getName()}`;
                        addUniqueRelation(relations, {
                            from: fromFuncId,
                            to: toFuncId,
                            type: "CALLS",
                        });
                    }
                }
            });
        });
    });

    return relations;
}

/**
 * Process property access calls like this.authService.findUser()
 */
function processPropertyAccessCall(
    expression: PropertyAccessExpression,
    fromMethodId: string,
    relations: KGRelation[],
    currentClass: ClassDeclaration
): void {
    const methodName = expression.getName();
    const symbol = expression.getNameNode().getSymbol();

    if (!symbol) return;

    const decl = symbol.getDeclarations()?.[0];
    if (!decl) return;

    // If it resolves to a method declaration
    if (Node.isMethodDeclaration(decl)) {
        const targetClass = decl.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
        if (targetClass) {
            const targetClassName = targetClass.getName();
            const toMethodId = `method:${targetClassName}.${methodName}`;

            addUniqueRelation(relations, {
                from: fromMethodId,
                to: toMethodId,
                type: "CALLS",
            });

            // Also check the object being called on - this helps track which service/class is being used
            const objExpression = expression.getExpression();
            if (Node.isPropertyAccessExpression(objExpression)) {
                // e.g., this.authService.findUser() -> objExpression is this.authService
                const propSymbol = objExpression.getNameNode().getSymbol();
                if (propSymbol) {
                    const propDecl = propSymbol.getDeclarations()?.[0];
                    if (propDecl && (Node.isPropertyDeclaration(propDecl) || Node.isParameterDeclaration(propDecl))) {
                        const propType = propDecl.getType();
                        const typeSymbol = propType.getSymbol();
                        if (typeSymbol) {
                            const typeName = typeSymbol.getName();
                            // Add USES relationship from current class to the injected class
                            addUniqueRelation(relations, {
                                from: `class:${currentClass.getName()}`,
                                to: `class:${typeName}`,
                                type: "USES",
                            });
                        }
                    }
                }
            }
        }
    }
}

function processPropertyAccessCallFromFunction(
    expression: PropertyAccessExpression,
    fromFuncId: string,
    relations: KGRelation[],
    srcRoot: string
): void {
    const methodName = expression.getName();
    const symbol = expression.getNameNode().getSymbol();

    if (!symbol) return;

    const decl = symbol.getDeclarations()?.[0];
    if (!decl) return;

    if (Node.isMethodDeclaration(decl)) {
        const targetClass = decl.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
        if (targetClass) {
            const toMethodId = `method:${targetClass.getName()}.${methodName}`;
            addUniqueRelation(relations, {
                from: fromFuncId,
                to: toMethodId,
                type: "CALLS",
            });
        }
    }
    else if (Node.isFunctionDeclaration(decl)) {
        const funcFile = decl.getSourceFile();
        const funcRelPath = srcRoot
            ? `src/${relative(srcRoot, funcFile.getFilePath()).split(sep).join("/")}`
            : funcFile.getFilePath();
        const toFuncId = `function:${funcRelPath}:${decl.getName()}`;
        addUniqueRelation(relations, {
            from: fromFuncId,
            to: toFuncId,
            type: "CALLS",
        });
    }
}

function addUniqueRelation(relations: KGRelation[], relation: KGRelation): void {
    const exists = relations.some(
        r => r.from === relation.from && r.to === relation.to && r.type === relation.type
    );
    if (!exists) {
        relations.push(relation);
    }
}
