import { Project, SyntaxKind, Node } from "ts-morph";
import { KGRelation } from "../../types/kg.types";
import { relative, sep } from "path";
import * as IdGen from "./id-generator.js";
import { detectFileSubtype } from "./detect-file-subtype.js";

/**
 * Extracts import relationships with actual usage tracking.
 * Not just file imports, but tracks what is imported and actually used.
 * 
 * Example: 
 * - auth.controller imports AuthService from auth.service
 * - AuthController uses AuthService.findUser -> creates IMPORT and USES relationships
 */
export function extractImports(project: Project): KGRelation[] {
    const relations: KGRelation[] = [];
    const srcDir = project.getDirectories().find(d => d.getPath().endsWith(`${sep}src`));
    const srcRoot = srcDir?.getPath() || "";

    project.getSourceFiles().forEach(file => {
        const absolutePath = file.getFilePath();
        const relativePath = srcRoot
            ? `src/${relative(srcRoot, absolutePath).split(sep).join("/")}`
            : absolutePath;
        const fileName = file.getBaseName();
        const fileSubtype = detectFileSubtype(fileName);
        const fileId = IdGen.generateFileId(relativePath, fileSubtype);

        // Get all imports in this file
        file.getImportDeclarations().forEach(importDecl => {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();

            // Resolve the imported file using ts-morph's module resolution
            // This handles both relative imports (./file) and path aliases (@common/file)
            const importedFile = importDecl.getModuleSpecifierSourceFile();

            // Skip if the import couldn't be resolved (likely external node_modules)
            if (!importedFile) return;

            // Skip if it's outside the src directory (external dependencies)
            if (srcRoot && !importedFile.getFilePath().includes(srcRoot)) {
                return;
            }

            const importedFilePath = srcRoot
                ? `src/${relative(srcRoot, importedFile.getFilePath()).split(sep).join("/")}`
                : importedFile.getFilePath();
            const importedFileName = importedFile.getBaseName();
            const importedFileSubtype = detectFileSubtype(importedFileName);
            const importedFileId = IdGen.generateFileId(importedFilePath, importedFileSubtype);

            // Create file imports file relationship
            addUniqueRelation(relations, {
                from: fileId,
                to: importedFileId,
                type: "IMPORTS",
            });

            // Track named imports and their usage
            importDecl.getNamedImports().forEach(namedImport => {
                const importedName = namedImport.getName();
                const alias = namedImport.getAliasNode()?.getText() || importedName;

                // Find references to this imported name in the current file
                const refs = file.getDescendantsOfKind(SyntaxKind.Identifier)
                    .filter(id => id.getText() === alias && id !== namedImport.getNameNode());

                if (refs.length > 0) {
                    // This import is actually used in the file
                    const symbol = namedImport.getNameNode().getSymbol();
                    if (symbol) {
                        const decl = symbol.getDeclarations()?.[0];
                        if (decl) {
                            const kind = decl.getKind();

                            // Determine the type of import and create appropriate relationship
                            if (kind === SyntaxKind.ClassDeclaration) {
                                const targetClassId = IdGen.generateClassId(importedName, importedFilePath);
                                addUniqueRelation(relations, {
                                    from: fileId,
                                    to: targetClassId,
                                    type: "IMPORTS_CLASS",
                                });
                            }
                            else if (kind === SyntaxKind.InterfaceDeclaration) {
                                const targetInterfaceId = IdGen.generateInterfaceId(importedName, importedFilePath);
                                addUniqueRelation(relations, {
                                    from: fileId,
                                    to: targetInterfaceId,
                                    type: "IMPORTS_INTERFACE",
                                });
                            }
                            else if (kind === SyntaxKind.EnumDeclaration) {
                                const targetEnumId = IdGen.generateEnumId(importedName, importedFilePath);
                                addUniqueRelation(relations, {
                                    from: fileId,
                                    to: targetEnumId,
                                    type: "IMPORTS_ENUM",
                                });
                            }
                            else if (kind === SyntaxKind.FunctionDeclaration) {
                                const targetFuncId = IdGen.generateFunctionId(importedName, importedFilePath);
                                addUniqueRelation(relations, {
                                    from: fileId,
                                    to: targetFuncId,
                                    type: "IMPORTS_FUNCTION",
                                });
                            }
                            else if (kind === SyntaxKind.TypeAliasDeclaration) {
                                const targetTypeId = IdGen.generateTypeAliasId(importedName, importedFilePath);
                                addUniqueRelation(relations, {
                                    from: fileId,
                                    to: targetTypeId,
                                    type: "IMPORTS_TYPE",
                                });
                            }
                            else if (kind === SyntaxKind.VariableDeclaration) {
                                const targetVarId = IdGen.generateVariableId(importedName, importedFilePath);
                                addUniqueRelation(relations, {
                                    from: fileId,
                                    to: targetVarId,
                                    type: "IMPORTS_VARIABLE",
                                });
                            }
                        }
                    }
                }
            });

            // Track default import usage
            const defaultImport = importDecl.getDefaultImport();
            if (defaultImport) {
                const defaultName = defaultImport.getText();
                const refs = file.getDescendantsOfKind(SyntaxKind.Identifier)
                    .filter(id => id.getText() === defaultName && id !== defaultImport);

                if (refs.length > 0) {
                    // The default import is actually used
                    addUniqueRelation(relations, {
                        from: fileId,
                        to: importedFileId,
                        type: "IMPORTS_DEFAULT",
                    });
                }
            }

            // Track namespace import usage (import * as X from ...)
            const namespaceImport = importDecl.getNamespaceImport();
            if (namespaceImport) {
                const nsName = namespaceImport.getText();
                const refs = file.getDescendantsOfKind(SyntaxKind.Identifier)
                    .filter(id => id.getText() === nsName && id !== namespaceImport);

                if (refs.length > 0) {
                    addUniqueRelation(relations, {
                        from: fileId,
                        to: importedFileId,
                        type: "IMPORTS_NAMESPACE",
                    });
                }
            }
        });

        // Track class-level import usage (which classes use which imported classes)
        file.getClasses().forEach(cls => {
            const className = cls.getName() || "AnonymousClass";
            const classId = IdGen.generateClassId(className, relativePath);

            // Check constructor parameters for injected dependencies
            const ctor = cls.getConstructors()[0];
            if (ctor) {
                ctor.getParameters().forEach(param => {
                    const typeSymbol = param.getType().getSymbol();
                    if (typeSymbol) {
                        const typeName = typeSymbol.getName();
                        const typeDecl = typeSymbol.getDeclarations()?.[0];
                        if (typeDecl) {
                            const typeFile = typeDecl.getSourceFile();
                            const typeFilePath = srcRoot
                                ? `src/${relative(srcRoot, typeFile.getFilePath()).split(sep).join("/")}`
                                : typeFile.getFilePath();

                            // If the type is from a different file, it's an imported dependency
                            if (typeFilePath !== relativePath) {
                                const targetClassId = IdGen.generateClassId(typeName, typeFilePath);
                                addUniqueRelation(relations, {
                                    from: classId,
                                    to: targetClassId,
                                    type: "DEPENDS_ON",
                                });
                            }
                        }
                    }
                });
            }

            // Check class properties for type dependencies
            cls.getProperties().forEach(prop => {
                const typeSymbol = prop.getType().getSymbol();
                if (typeSymbol) {
                    const typeName = typeSymbol.getName();
                    const typeDecl = typeSymbol.getDeclarations()?.[0];
                    if (typeDecl && typeDecl.getKind() === SyntaxKind.ClassDeclaration) {
                        const typeFile = typeDecl.getSourceFile();
                        const typeFilePath = srcRoot
                            ? `src/${relative(srcRoot, typeFile.getFilePath()).split(sep).join("/")}`
                            : typeFile.getFilePath();

                        if (typeFilePath !== relativePath) {
                            const targetClassId = IdGen.generateClassId(typeName, typeFilePath);
                            addUniqueRelation(relations, {
                                from: classId,
                                to: targetClassId,
                                type: "HAS_DEPENDENCY",
                            });
                        }
                    }
                }
            });
        });
    });

    return relations;
}

function addUniqueRelation(relations: KGRelation[], relation: KGRelation): void {
    const exists = relations.some(
        r => r.from === relation.from && r.to === relation.to && r.type === relation.type
    );
    if (!exists) {
        relations.push(relation);
    }
}
