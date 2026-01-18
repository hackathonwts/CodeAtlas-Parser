import { Injectable, Logger } from '@nestjs/common';
import { cloneGitRepository, GitCloneConfig, GitCloneResult } from '../gitManager';

@Injectable()
export class GitManagerService {
    private readonly logger = new Logger(GitManagerService.name);

    /**
     * Clone a Git repository with authentication
     */
    async cloneRepository(config: GitCloneConfig): Promise<GitCloneResult> {
        this.logger.log(`Cloning repository: ${config.gitUrl} (branch: ${config.branch || 'default'})`);

        try {
            const result = await cloneGitRepository(config);

            if (result.success) {
                this.logger.log(`✅ Repository cloned successfully to: ${result.clonedPath}`);
            } else {
                this.logger.error(`❌ Failed to clone repository: ${result.message}`);
            }

            return result;
        } catch (error) {
            this.logger.error('Unexpected error during repository cloning:', error);
            throw error;
        }
    }
}
