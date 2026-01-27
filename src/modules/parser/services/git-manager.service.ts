import { Injectable, Logger } from '@nestjs/common';
import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import { GitCloneConfig, GitCloneResult } from '../../../types/kg.types';

@Injectable()
export class GitManagerService {
    private readonly logger = new Logger(GitManagerService.name);
    private readonly projectsPath = path.join(process.cwd(), 'projects');

    constructor() {
        // Ensure projects directory exists
        if (!fs.existsSync(this.projectsPath)) {
            fs.mkdirSync(this.projectsPath, { recursive: true });
        }
    }

    /**
     * Clones a Git repository using HTTP authentication with username and password
     * 
     * @param config - Configuration object containing Git URL, credentials, and target path
     * @returns Promise with the result of the clone operation
     */
    async cloneRepository(config: GitCloneConfig): Promise<GitCloneResult> {
        const { gitUrl, username, password, projectName, branch } = config;

        try {
            // Validate inputs
            if (!gitUrl || !username || !password || !projectName) {
                throw new Error('gitUrl, username, password, and projectName are required');
            }

            this.logger.log(`Cloning repository from: ${gitUrl}`);
            this.logger.log(`Target path: ${this.projectsPath}/${projectName}`);

            const targetPath = path.join(this.projectsPath, projectName);
            
            // Check if target path already exists
            if (fs.existsSync(targetPath)) {
                this.logger.log(`Target path already exists. Removing: ${targetPath}`);
                fs.rmSync(targetPath, { recursive: true, force: true });
            }

            // Ensure parent directory exists
            const parentDir = path.dirname(targetPath);
            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
            }

            // Build authenticated URL
            const authenticatedUrl = this.buildAuthenticatedUrl(gitUrl, username, password);

            // Initialize simple-git
            const git = simpleGit();

            // Clone options
            const cloneOptions: string[] = [];
            if (branch) {
                cloneOptions.push('--branch', branch);
            }

            // Clone the repository
            this.logger.log('Starting clone operation...');
            await git.clone(authenticatedUrl, targetPath, cloneOptions);

            this.logger.log(`✓ Repository cloned successfully to: ${targetPath}`);

            return {
                success: true,
                message: 'Repository cloned successfully',
                clonedPath: targetPath,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error('Error cloning repository:', errorMessage);
            
            const targetPath = path.join(this.projectsPath, projectName);
            // Clean up partial clone if it exists
            if (fs.existsSync(targetPath)) {
                try {
                    fs.rmSync(targetPath, { recursive: true, force: true });
                } catch (cleanupError) {
                    this.logger.error('Failed to clean up partial clone:', cleanupError);
                }
            }

            return {
                success: false,
                message: `Failed to clone repository: ${errorMessage}`,
                error: error instanceof Error ? error : new Error(errorMessage),
            };
        }
    }

    private buildAuthenticatedUrl(gitUrl: string, username: string, password: string): string {
        try {
            const url = new URL(gitUrl);
            url.username = encodeURIComponent(username);
            url.password = encodeURIComponent(password);
            return url.toString();
        } catch (error) {
            throw new Error(`Invalid Git URL: ${gitUrl}`);
        }
    }

    /**
     * Remove a cloned project directory
     */
    async removeProject(projectName: string): Promise<void> {
        const targetPath = path.join(this.projectsPath, projectName);
        if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { recursive: true, force: true });
            this.logger.log(`Removed project directory: ${targetPath}`);
        }
    }

    /**
     * Check if a project directory exists
     */
    projectExists(projectName: string): boolean {
        const targetPath = path.join(this.projectsPath, projectName);
        return fs.existsSync(targetPath);
    }

    /**
     * Get the path to a cloned project
     */
    getProjectPath(projectName: string): string {
        return path.join(this.projectsPath, projectName);
    }
}