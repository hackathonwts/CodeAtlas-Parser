import { Injectable } from '@nestjs/common';
import { Project, SyntaxKind, Node } from "ts-morph";
import { KGRelation } from "../../../types/kg.types";
import { relative, sep } from "path";

@Injectable()
export class ExtractTypeUsageService {
    
    extractTypeUsage(project: Project): KGRelation[] {
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
                    const methodId = `method:${className}.${method.getName()}`;
                    this.extractTypesFromNode(method, methodId, relations);
                });
            });

            // Process standalone functions
            file.getFunctions().forEach(func => {
                const funcName = func.getName();
                if (!funcName) return;
                const funcId = `function:${relativePath}:${funcName}`;
                this.extractTypesFromNode(func, funcId, relations);
            });
        });

        return relations;
    }

    private extractTypesFromNode(node: Node, fromId: string, relations: KGRelation[]): void {
        // Get all type references within the node
        const typeRefs = node.getDescendantsOfKind(SyntaxKind.TypeReference);

        typeRefs.forEach(typeRef => {
            const typeName = typeRef.getTypeName();
            if (Node.isIdentifier(typeName)) {
                const symbol = typeName.getSymbol();
                if (symbol) {
                    this.processTypeSymbol(symbol, fromId, relations);
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

            // Check for model/entity access (commonly named patterns)
            const identText = identifier.getText();
            if (this.isModelPattern(identText) || this.isEntityPattern(identText)) {
                this.addUniqueRelation(relations, {
                    from: fromId,
                    to: `class:${identText}`,
                    type: "USES_MODEL",
                });
                return;
            }

            // Check for enum access
            if (kind === SyntaxKind.EnumDeclaration) {
                this.addUniqueRelation(relations, {
                    from: fromId,
                    to: `enum:${symbol.getName()}`,
                    type: "USES_ENUM",
                });
            }
            // Check for interface access
            else if (kind === SyntaxKind.InterfaceDeclaration) {
                this.addUniqueRelation(relations, {
                    from: fromId,
                    to: `interface:${symbol.getName()}`,
                    type: "USES_INTERFACE",
                });
            }
            // Check for class access
            else if (kind === SyntaxKind.ClassDeclaration) {
                this.addUniqueRelation(relations, {
                    from: fromId,
                    to: `class:${symbol.getName()}`,
                    type: "USES_CLASS",
                });
            }
        });
    }

    private processTypeSymbol(symbol: any, fromId: string, relations: KGRelation[]): void {
        const decl = symbol.getDeclarations()?.[0];
        if (!decl) return;

        const kind = decl.getKind();
        const symbolName = symbol.getName();

        if (kind === SyntaxKind.ClassDeclaration) {
            this.addUniqueRelation(relations, {
                from: fromId,
                to: `class:${symbolName}`,
                type: "USES_CLASS",
            });
        } else if (kind === SyntaxKind.InterfaceDeclaration) {
            this.addUniqueRelation(relations, {
                from: fromId,
                to: `interface:${symbolName}`,
                type: "USES_INTERFACE",
            });
        } else if (kind === SyntaxKind.EnumDeclaration) {
            this.addUniqueRelation(relations, {
                from: fromId,
                to: `enum:${symbolName}`,
                type: "USES_ENUM",
            });
        }
    }

    private isModelPattern(name: string): boolean {
        return /Model$|Entity$/.test(name);
    }

    private isEntityPattern(name: string): boolean {
        return /Entity$|^[A-Z][a-z]+Entity/.test(name);
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