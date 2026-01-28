import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CODE_PARSER_QUEUE } from './queue.constant';
import { Job } from 'bullmq';
import { KGNode, KGRelation } from 'src/types/kg.types';
import { Project } from 'ts-morph';
import { extractStructure } from 'src/utils/ast/extract-structure';
import { extractDI } from 'src/utils/ast/extract-di';
import { extractImports } from 'src/utils/ast/extract-imports';
import { extractInheritance } from 'src/utils/ast/extract-inheritance';
import { extractMethodCalls } from 'src/utils/ast/extract-method-calls';
import { extractRoutes } from 'src/utils/ast/extract-routes';
import { extractTypeUsage } from 'src/utils/ast/extract-type-usage';
import { inspect } from 'util';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Processor(CODE_PARSER_QUEUE)
export class CodeParserQueue extends WorkerHost {
    constructor(private readonly neo4jService: Neo4jService) {
        super();
    }

    async process(job: Job, token?: string): Promise<void> {
        console.log('Processing job:', job.id, 'with data:', job.data, 'and token:', token);

        const { _id, project_path, project_name } = job.data;
        try {
            const { nodes, relations } = this.parseProject(project_path);
            console.log(inspect({ nodes, relations }, false, null, true));
            await this.neo4jService.cleanAndImport(project_name, nodes, relations);
        } catch (error) {
            console.error(error);
        }
    }

    parseProject(projectPath: string): { nodes: KGNode[]; relations: KGRelation[] } {
        const project = new Project({
            tsConfigFilePath: projectPath + '/tsconfig.json',
            skipAddingFilesFromTsConfig: false,
        });

        const structure = extractStructure(project);
        const di = extractDI(project);
        const calls = extractMethodCalls(project);
        const routes = extractRoutes(project);
        const typeUsage = extractTypeUsage(project);
        const imports = extractImports(project);
        const inheritance = extractInheritance(project);

        const nodes: KGNode[] = [
            ...structure.nodes,
            ...routes.nodes,
        ];

        const allRelations: KGRelation[] = [
            ...structure.relations,
            ...di,
            ...calls,
            ...routes.relations,
            ...typeUsage,
            ...imports,
            ...inheritance,
        ];

        const relations = this.deduplicateRelations(allRelations);
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
