import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { GitManagerService } from '../git-manager/git-manager.service';
import { ParserService } from './parser.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import { DocumentationService } from '../documentation/documentation.service';
import { GitCloneConfig } from '../gitManager';

@Injectable()
export class ParserOrchestrationService {
    private readonly logger = new Logger(ParserOrchestrationService.name);

    constructor(
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        private gitManagerService: GitManagerService,
        private parserService: ParserService,
        private neo4jService: Neo4jService,
        private documentationService: DocumentationService,
    ) { }

    /**
     * Main orchestration method that handles the entire parsing workflow
     * This replaces the logic from main.ts
     */
    async processProject(projectIdentifier: string): Promise<void> {
        this.logger.log(`🚀 Starting processing for project: ${projectIdentifier}`);

        // 1. Fetch project from MongoDB
        const project = await this.fetchProject(projectIdentifier);

        // 2. Clone Git repository
        const clonedPath = await this.cloneRepository(project);

        // 3. Parse the project
        const { nodes, relations, documentation } = this.parserService.parse(clonedPath);

        // 4. Ingest to Neo4j
        await this.ingestToNeo4j(nodes, relations, project.projectName);

        // 5. Dump documentation to MongoDB
        await this.saveDocumentation(project, documentation);

        // 6. Update project scan version
        await this.updateProjectVersion(project);

        this.logger.log(`✅ Project processing completed successfully: ${projectIdentifier}`);
    }

    /**
     * Fetch project from MongoDB by UUID or ObjectId
     */
    private async fetchProject(identifier: string): Promise<ProjectDocument> {
        this.logger.log(`Fetching project: ${identifier}`);

        // Try to find by UUID first, then by ObjectId
        let project = await this.projectModel.findOne({ uuid: identifier }).exec();

        if (!project) {
            // Try by ObjectId if identifier looks like one
            if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
                project = await this.projectModel.findById(identifier).exec();
            }
        }

        if (!project) {
            throw new NotFoundException(`Project not found: ${identifier}`);
        }

        this.logger.log(`✅ Project found: ${project.projectName} (${project.branch})`);
        return project;
    }

    /**
     * Clone the Git repository
     */
    private async cloneRepository(project: ProjectDocument): Promise<string> {
        const gitConfig: GitCloneConfig = {
            gitUrl: project.gitUrl,
            branch: project.branch,
            projectName: project.projectName,
            username: project.username,
            password: project.password,
        };

        const result = await this.gitManagerService.cloneRepository(gitConfig);

        if (!result.success || !result.clonedPath) {
            throw new Error(`Failed to clone repository: ${result.message}`);
        }

        return result.clonedPath;
    }

    /**
     * Ingest parsed data into Neo4j
     */
    private async ingestToNeo4j(nodes: any[], relations: any[], databaseName: string): Promise<void> {
        this.logger.log('Ingesting knowledge graph to Neo4j...');
        await this.neo4jService.cleanAndImport(nodes, relations, databaseName);
        this.logger.log('✅ Knowledge Graph imported to Neo4j');
    }

    /**
     * Save documentation to MongoDB
     */
    private async saveDocumentation(project: ProjectDocument, documentation: any): Promise<void> {
        try {
            await this.documentationService.dumpDocumentation(project, documentation);
            this.logger.log('✅ Documentation dumped successfully');
        } catch (error) {
            this.logger.error('Failed to dump documentation:', error);
            throw error;
        }
    }

    /**
     * Update project scan version
     */
    private async updateProjectVersion(project: ProjectDocument): Promise<void> {
        project.scanVersion = project.scanVersion + 1;
        await project.save();
        this.logger.log(`✅ Project scan version updated to: ${project.scanVersion}`);
    }
}
