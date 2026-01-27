import { Injectable } from '@nestjs/common';
import { Project, SyntaxKind, Node } from "ts-morph";
import { KGRelation } from "../../../types/kg.types";
import { relative, sep } from "path";

@Injectable()
export class ExtractImportsService {
    
    extractImports(project: Project): KGRelation[] {
        const relations: KGRelation[] = [];
        const srcDir = project.getDirectories().find(d => d.getPath().endsWith(`${sep}src`));
        const srcRoot = srcDir?.getPath() || "";

        project.getSourceFiles().forEach(file => {
            const absolutePath = file.getFilePath();
            const relativePath = srcRoot
                ? `src/${relative(srcRoot, absolutePath).split(sep).join("/")}`
                : absolutePath;
            const fileId = `file:${relativePath}`;

            // Get all imports in this file
            file.getImportDeclarations().forEach(importDecl => {
                const moduleSpecifier = importDecl.getModuleSpecifierValue();

                // Skip node_modules imports
                if (!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("/")) {
                    return;
                }

                // Resolve the imported file
                const importedFile = importDecl.getModuleSpecifierSourceFile();
                if (!importedFile) return;

                const importedFilePath = srcRoot
                    ? `src/${relative(srcRoot, importedFile.getFilePath()).split(sep).join("/")}`
                    : importedFile.getFilePath();
                const importedFileId = `file:${importedFilePath}`;

                // Create file imports file relationship
                this.addUniqueRelation(relations, {
                    from: fileId,
                    to: importedFileId,
                    type: "IMPORTS",
                });

                // Track named imports and their usage
                const namedImports = importDecl.getNamedImports();
                namedImports.forEach(namedImport => {
                    const importName = namedImport.getName();
                    
                    // Find what this import refers to in the imported file
                    const importedSymbol = importedFile.getExportedDeclarations().get(importName)?.[0];
                    if (importedSymbol) {
                        const kind = importedSymbol.getKind();
                        let targetId = "";
                        let relationType = "";

                        if (kind === SyntaxKind.ClassDeclaration) {
                            targetId = `class:${importName}`;
                            relationType = "IMPORTS_CLASS";
                        } else if (kind === SyntaxKind.InterfaceDeclaration) {
                            targetId = `interface:${importName}`;
                            relationType = "IMPORTS_INTERFACE";
                        } else if (kind === SyntaxKind.EnumDeclaration) {
                            targetId = `enum:${importName}`;
                            relationType = "IMPORTS_ENUM";
                        } else if (kind === SyntaxKind.FunctionDeclaration) {
                            targetId = `function:${importedFilePath}:${importName}`;
                            relationType = "IMPORTS_FUNCTION";
                        } else if (kind === SyntaxKind.TypeAliasDeclaration) {
                            targetId = `type:${importName}`;
                            relationType = "IMPORTS_TYPE";
                        }

                        if (targetId && relationType) {
                            this.addUniqueRelation(relations, {
                                from: fileId,
                                to: targetId,
                                type: relationType,
                            });
                        }
                    }
                });

                // Track default imports
                const defaultImport = importDecl.getDefaultImport();
                if (defaultImport) {
                    const defaultName = defaultImport.getText();
                    // Assume it's a class for now (most common case)
                    this.addUniqueRelation(relations, {
                        from: fileId,
                        to: `class:${defaultName}`,
                        type: "IMPORTS_CLASS",
                    });
                }
            });
        });

        return relations;
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