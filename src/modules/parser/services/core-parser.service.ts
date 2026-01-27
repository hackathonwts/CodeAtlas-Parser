import { Injectable, Logger } from '@nestjs/common';
import { Project } from "ts-morph";
import { KGNode, KGRelation } from "../../../types/kg.types";
import { ExtractStructureService } from './extract-structure.service';
import { ExtractDIService } from './extract-di.service';
import { ExtractMethodCallsService } from './extract-method-calls.service';
import { ExtractRoutesService } from './extract-routes.service';
import { ExtractTypeUsageService } from './extract-type-usage.service';
import { ExtractImportsService } from './extract-imports.service';
import { ExtractInheritanceService } from './extract-inheritance.service';

@Injectable()
export class CoreParserService {
    private readonly logger = new Logger(CoreParserService.name);

    constructor(
        private readonly extractStructureService: ExtractStructureService,
        private readonly extractDIService: ExtractDIService,
        private readonly extractMethodCallsService: ExtractMethodCallsService,
        private readonly extractRoutesService: ExtractRoutesService,
        private readonly extractTypeUsageService: ExtractTypeUsageService,
        private readonly extractImportsService: ExtractImportsService,
        private readonly extractInheritanceService: ExtractInheritanceService,
    ) {}

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
    async parseProject(projectPath: string): Promise<{ nodes: KGNode[]; relations: KGRelation[] }> {
        this.logger.log(`Starting to parse project: ${projectPath}`);

        const project = new Project({
            tsConfigFilePath: projectPath + "/tsconfig.json",
            skipAddingFilesFromTsConfig: false,
        });

        // Extract structure (files, classes, methods, functions, interfaces, enums, etc.)
        this.logger.log('Extracting project structure...');
        const structure = this.extractStructureService.extractStructure(project);

        // Extract dependency injection relationships
        this.logger.log('Extracting dependency injection relationships...');
        const di = this.extractDIService.extractDI(project);

        // Extract method call chains (which method calls which)
        this.logger.log('Extracting method call relationships...');
        const calls = this.extractMethodCallsService.extractMethodCalls(project);

        // Extract HTTP routes (for NestJS/Express controllers)
        this.logger.log('Extracting HTTP routes...');
        const routes = this.extractRoutesService.extractRoutes(project);

        // Extract type usage relationships (methods using models, enums, interfaces)
        this.logger.log('Extracting type usage relationships...');
        const typeUsage = this.extractTypeUsageService.extractTypeUsage(project);

        // Extract import relationships with usage tracking
        this.logger.log('Extracting import relationships...');
        const imports = this.extractImportsService.extractImports(project);

        // Extract inheritance relationships (extends, implements)
        this.logger.log('Extracting inheritance relationships...');
        const inheritance = this.extractInheritanceService.extractInheritance(project);

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
        const relations = this.deduplicateRelations(allRelations);

        this.logger.log(`📊 Extracted ${nodes.length} nodes and ${relations.length} relationships`);
        this.logger.log(`   - Files: ${nodes.filter(n => n.kind === "File").length}`);
        this.logger.log(`   - Classes: ${nodes.filter(n => n.kind === "Class").length}`);
        this.logger.log(`   - Methods: ${nodes.filter(n => n.kind === "Method").length}`);
        this.logger.log(`   - Functions: ${nodes.filter(n => n.kind === "Function").length}`);
        this.logger.log(`   - Interfaces: ${nodes.filter(n => n.kind === "Interface").length}`);
        this.logger.log(`   - Enums: ${nodes.filter(n => n.kind === "Enum").length}`);
        this.logger.log(`   - Routes: ${nodes.filter(n => n.kind === "Route").length}`);

        return { nodes, relations };
    }

    private deduplicateRelations(relations: KGRelation[]): KGRelation[] {
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
}