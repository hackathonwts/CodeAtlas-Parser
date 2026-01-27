import { Injectable } from '@nestjs/common';
import { Project, SyntaxKind, PropertyAccessExpression, Node } from "ts-morph";
import { KGRelation } from "../../../types/kg.types";
import { relative, sep } from "path";

@Injectable()
export class ExtractMethodCallsService {
    
    extractMethodCalls(project: Project): KGRelation[] {
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
                    const fromMethodId = `method:${className}.${method.getName()}`;

                    // Find all call expressions within this method
                    method.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
                        const expression = call.getExpression();

                        // Handle method calls like this.service.findUser() or authService.findUser()
                        if (Node.isPropertyAccessExpression(expression)) {
                            this.processPropertyAccessCall(expression, fromMethodId, relations, cls);
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
                                    this.addUniqueRelation(relations, {
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
                                this.addUniqueRelation(relations, {
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

                    if (Node.isIdentifier(expression)) {
                        const symbol = expression.getSymbol();
                        if (!symbol) return;

                        const decl = symbol.getDeclarations()?.[0];
                        if (!decl) return;

                        if (Node.isMethodDeclaration(decl)) {
                            const targetClass = decl.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
                            if (targetClass) {
                                const toMethodId = `method:${targetClass.getName()}.${decl.getName()}`;
                                this.addUniqueRelation(relations, {
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
                            this.addUniqueRelation(relations, {
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

    private processPropertyAccessCall(expression: PropertyAccessExpression, fromMethodId: string, relations: KGRelation[], cls: any): void {
        const propertyName = expression.getName();
        const objectExpression = expression.getExpression();

        if (Node.isThisExpression(objectExpression)) {
            // this.methodName() - calling another method in the same class
            const toMethodId = `method:${cls.getName()}.${propertyName}`;
            this.addUniqueRelation(relations, {
                from: fromMethodId,
                to: toMethodId,
                type: "CALLS",
            });
        } else if (Node.isIdentifier(objectExpression)) {
            // service.methodName() - calling method on injected service
            const symbol = objectExpression.getSymbol();
            if (symbol) {
                const decl = symbol.getDeclarations()?.[0];
                if (decl && Node.isParameter(decl)) {
                    const paramType = decl.getType().getSymbol()?.getName();
                    if (paramType) {
                        const toMethodId = `method:${paramType}.${propertyName}`;
                        this.addUniqueRelation(relations, {
                            from: fromMethodId,
                            to: toMethodId,
                            type: "CALLS",
                        });
                    }
                }
            }
        }
    }

    private addUniqueRelation(relations: KGRelation[], relation: KGRelation): void {
        const exists = relations.some(
            r => r.from === relation.from && r.to === relation.to && r.type === relation.type
        );
        if (!exists) {
            relations.push(relation);
        }
    }
}