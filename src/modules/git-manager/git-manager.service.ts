import { Injectable } from '@nestjs/common';
import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import { GitCloneConfig, GitCloneResult } from 'src/interfaces/git.interfaces';

@Injectable()
export class GitManagerService {
    private readonly projectsPath = path.join(process.cwd(), 'projects');

    async cloneGitRepository(config: GitCloneConfig): Promise<GitCloneResult> {
        const { gitUrl, username, password, projectName, branch } = config;

        try {
            if (!gitUrl || !username || !password || !projectName) {
                throw new Error('gitUrl, username, password, and projectName are required');
            }

            console.log(`Cloning repository from: ${gitUrl}`);
            console.log(`Target path: ${this.projectsPath}/${projectName}`);

            const targetPath = path.join(this.projectsPath, projectName);
            if (fs.existsSync(targetPath)) {
                console.log(`Target path already exists. Removing: ${targetPath}`);
                fs.rmSync(targetPath, { recursive: true, force: true });
            }

            const parentDir = path.dirname(targetPath);
            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
            }

            const authenticatedUrl = this.buildAuthenticatedUrl(gitUrl, username, password);
            const git = simpleGit();
            const cloneOptions: string[] = [];
            if (branch) {
                cloneOptions.push('--branch', branch);
            }

            console.log('Starting clone operation...');
            await git.clone(authenticatedUrl, targetPath, cloneOptions);

            console.log(`✓ Repository cloned successfully to: ${targetPath}`);

            return {
                success: true,
                message: 'Repository cloned successfully',
                clonedPath: targetPath,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error cloning repository:', errorMessage);
            const targetPath = path.join(this.projectsPath, projectName);

            if (fs.existsSync(targetPath)) {
                try {
                    fs.rmSync(targetPath, { recursive: true, force: true });
                } catch (cleanupError) {
                    console.error('Failed to clean up partial clone:', cleanupError);
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
}