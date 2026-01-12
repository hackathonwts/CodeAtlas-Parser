import { Project } from "ts-morph";
import { extractDI } from "./utils/extract-di";
import { extractMethodCalls } from "./utils/extract-method-calls";
import { extractRoutes } from "./utils/extract-routes";
import { extractStructure } from "./utils/extract-structure";
import { extractTypeUsage } from "./utils/extract-type-usage";
import { extractImports } from "./utils/extract-imports";
import { extractInheritance } from "./utils/extract-inheritance";
import { KGNode, KGRelation } from "./types/kg.types";

/**
 * Main parser function that extracts a comprehensive knowledge graph from a TypeScript project.
 * 
 * The knowledge graph includes:
 * 
 * **Nodes:**
 * - Files
 * - Classes
 * - Methods
 * - Functions
 * - Interfaces
 * - Enums and EnumMembers
 * - Type Aliases
 * - Properties
 * - Parameters
 * - Variables
 * - Routes
 * 
 * **Relationships:**
 * - DECLARES: File declares Class/Function/Interface/Enum/TypeAlias/Variable
 * - HAS_METHOD: Class has Method
 * - HAS_PROPERTY: Class has Property
 * - HAS_PARAMETER: Method has Parameter
 * - HAS_MEMBER: Enum has EnumMember
 * - INJECTS: Class injects dependency via constructor
 * - CALLS: Method/Function calls another Method/Function
 * - USES: Class uses another Class (e.g., accessing service methods)
 * - USES_TYPE: Element uses a Type/Interface/Enum
 * - USES_MODEL: Method/Function uses a Model/Entity class
 * - USES_ENUM: Method/Function uses an Enum
 * - USES_INTERFACE: Method/Function uses an Interface
 * - USES_CLASS: Method/Function uses a Class
 * - CREATES_INSTANCE: Method/Function creates an instance of a class
 * - CREATES_MODEL: Method/Function creates an instance of a Model/Entity
 * - IMPORTS: File imports from another File
 * - IMPORTS_CLASS/IMPORTS_INTERFACE/IMPORTS_ENUM/IMPORTS_FUNCTION/IMPORTS_TYPE: Specific import types
 * - DEPENDS_ON: Class depends on another Class (via constructor injection)
 * - HAS_DEPENDENCY: Class has dependency on another type (via properties)
 * - EXTENDS: Class/Interface extends another Class/Interface
 * - IMPLEMENTS: Class implements an Interface
 * - DECORATED_BY: Class/Method is decorated by a decorator
 * - HANDLES_ROUTE: Method handles a specific HTTP route
 * 
 * @param projectPath Path to the TypeScript project root (should contain tsconfig.json)
 * @returns Object containing nodes and relations arrays for the knowledge graph
 */
export default function parser(projectPath: string): { nodes: KGNode[]; relations: KGRelation[] } {
    const project = new Project({
        tsConfigFilePath: projectPath + "/tsconfig.json",
        skipAddingFilesFromTsConfig: false,
    });

    // Extract structure (files, classes, methods, functions, interfaces, enums, etc.)
    const structure = extractStructure(project);

    // Extract dependency injection relationships
    const di = extractDI(project);

    // Extract method call chains (which method calls which)
    const calls = extractMethodCalls(project);

    // Extract HTTP routes (for NestJS/Express controllers)
    const routes = extractRoutes(project);

    // Extract type usage relationships (methods using models, enums, interfaces)
    const typeUsage = extractTypeUsage(project);

    // Extract import relationships with usage tracking
    const imports = extractImports(project);

    // Extract inheritance relationships (extends, implements)
    const inheritance = extractInheritance(project);

    // Combine all nodes
    const nodes: KGNode[] = [
        ...structure.nodes,
        ...routes.nodes,
    ];

    // Combine all relations and deduplicate
    const allRelations: KGRelation[] = [
        ...structure.relations,
        ...di,
        ...calls,
        ...routes.relations,
        ...typeUsage,
        ...imports,
        ...inheritance,
    ];

    // Deduplicate relations
    const relations = deduplicateRelations(allRelations);

    console.log(`📊 Extracted ${nodes.length} nodes and ${relations.length} relationships`);
    console.log(`   - Files: ${nodes.filter(n => n.kind === "File").length}`);
    console.log(`   - Classes: ${nodes.filter(n => n.kind === "Class").length}`);
    console.log(`   - Methods: ${nodes.filter(n => n.kind === "Method").length}`);
    console.log(`   - Functions: ${nodes.filter(n => n.kind === "Function").length}`);
    console.log(`   - Interfaces: ${nodes.filter(n => n.kind === "Interface").length}`);
    console.log(`   - Enums: ${nodes.filter(n => n.kind === "Enum").length}`);
    console.log(`   - Routes: ${nodes.filter(n => n.kind === "Route").length}`);

    return { nodes, relations };
}

function deduplicateRelations(relations: KGRelation[]): KGRelation[] {
    const seen = new Set<string>();
    const unique: KGRelation[] = [];

    for (const rel of relations) {
        const key = `${rel.from}|${rel.to}|${rel.type}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(rel);
        }
    }

    return unique;
}
