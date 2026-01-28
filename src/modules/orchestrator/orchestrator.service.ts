import { Injectable } from '@nestjs/common';
import { GitManagerService } from '../git-manager/git-manager.service';
import { AstParserService } from '../ast-parser/ast-parser.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { GitCloneConfig } from 'src/interfaces/git.interfaces';

@Injectable()
export class OrchestratorService {
    constructor(
        private readonly gitManagerService: GitManagerService,
        private readonly astParserService: AstParserService,
        private readonly ingestionService: IngestionService,
    ) {}

    async processProject(projectGitConfig: GitCloneConfig): Promise<void> {
        const result = await this.gitManagerService.cloneGitRepository(projectGitConfig);
        if (result.success && result.clonedPath) {
            const { nodes, relations } = this.astParserService.parseProject(result.clonedPath);
            await this.ingestionService.ingest(nodes, relations, projectGitConfig.projectName);
            console.log("✅ Knowledge Graph imported");
        } else {
            throw new Error(`Failed to clone repository: ${result.message}`);
        }
    }
}