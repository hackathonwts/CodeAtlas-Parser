import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { CODE_PARSER_QUEUE, VECTORIZER_WORKER_QUEUE } from './queue.constant';
import { Job, Queue } from 'bullmq';
import { KGNode, KGRelation } from 'src/types/kg.types';
import { Project } from 'ts-morph';
import { extractStructure } from 'src/utils/ast/extract-structure';
import { extractDI } from 'src/utils/ast/extract-di';
import { extractImports } from 'src/utils/ast/extract-imports';
import { extractInheritance } from 'src/utils/ast/extract-inheritance';
import { extractMethodCalls } from 'src/utils/ast/extract-method-calls';
import { extractRoutes } from 'src/utils/ast/extract-routes';
import { extractTypeUsage } from 'src/utils/ast/extract-type-usage';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { ProjectDocument } from 'src/modules/project/schemas/project.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GitUtils } from 'src/utils/git.utils';
import { Notification, NotificationDocument } from 'src/modules/notification/schemas/notification.schema';

@Processor(CODE_PARSER_QUEUE)
export class CodeParserQueue extends WorkerHost {
    constructor(
        @InjectQueue(VECTORIZER_WORKER_QUEUE) private vectorQueue: Queue,
        @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
        @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
        private readonly gitUtils: GitUtils,
        private readonly neo4jService: Neo4jService,
    ) {
        super();

        // this.vectorQueue.add(VECTORIZER_WORKER_QUEUE, {
        //     projectId: '698335b74794732cc6bb1d9b',
        // });
    }

    async process(job: Job, token?: string): Promise<void> {
        console.log('Processing job:', job.id, 'with data:', job.data, 'and token:', token);

        const project = await this.projectModel.findById(job.data._id);
        if (project?.git_link && project?.git_username && project?.git_password) {
            await this.notificationModel.create({
                user_id: project.created_by,
                title: 'Cloning Started',
                body: `Started cloning project ${project.title}. This may take a few minutes...`,
            });

            const result = await this.gitUtils.cloneGitRepository({
                gitUrl: project.git_link,
                username: project.git_username,
                password: project.git_password,
                projectUuid: project.uuid,
                branch: project?.git_branch,
            });

            if (result.success && result.clonedPath) {
                await this.notificationModel.create({
                    user_id: project.created_by,
                    title: 'Cloning Completed',
                    body: `Completed cloning project ${project.title}.`,
                });

                try {
                    const { nodes, relations } = this.parseProject(result.clonedPath);
                    await this.neo4jService.cleanAndImport(project.uuid, nodes, relations);
                    await this.notificationModel.create({
                        user_id: project.created_by,
                        title: 'Parsing Completed',
                        body: `Completed parsing project ${project.title}.`,
                    });
                } catch (error) {
                    await this.notificationModel.create({
                        user_id: project.created_by,
                        title: 'Parsing Failed',
                        body: `Failed to parse project ${project.title}. Error: ${error.message}`,
                    });
                }
            } else {
                await this.notificationModel.create({
                    user_id: project.created_by,
                    title: 'Cloning Failed',
                    body: `Failed to clone repository for project ${project.title}. Error: ${result.error?.message || result.error || 'Unknown error'}`,
                });
            }
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
