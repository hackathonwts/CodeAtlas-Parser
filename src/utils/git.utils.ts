import { Injectable } from '@nestjs/common';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { GitCloneConfig, GitCloneResult } from '../interfaces/git.interfaces';

@Injectable()
export class GitUtils {
    private readonly projectsPath = join(process.cwd(), 'projects');

    getAuthenticatedGitUrl(gitUrl: string, username: string, password: string): string | null {
        try {
            const url = new URL(gitUrl);
            url.username = encodeURIComponent(username);
            url.password = encodeURIComponent(password);
            return url.toString();
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    getProjectPath(projectTitle: string): string {
        const project_title_sanitized = projectTitle.replace(/\s+/g, '_').toLowerCase();
        const p_path = join(this.projectsPath, project_title_sanitized);

        if (existsSync(p_path)) rmSync(p_path, { recursive: true, force: true });

        const parentDir = dirname(p_path);
        if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
        mkdirSync(p_path, { recursive: true });

        return p_path;
    }

    async cloneGitRepository(config: GitCloneConfig): Promise<GitCloneResult> {
        const { gitUrl, username, password, projectName, branch } = config;
        try {
            const targetPath = this.getProjectPath(projectName);
            const authenticatedUrl = this.getAuthenticatedGitUrl(gitUrl, username, password);
            if (!authenticatedUrl) throw new Error('Invalid git url');

            const git: SimpleGit = simpleGit();
            const cloneOptions: string[] = [];
            if (branch) cloneOptions.push('--branch', branch);

            console.log('Starting clone operation...');
            await git.clone(authenticatedUrl, targetPath, cloneOptions);
            console.log(`✓ Repository cloned successfully to: ${targetPath}`);

            return {
                success: true,
                message: 'Repository cloned successfully',
                clonedPath: targetPath,
            };
        } catch (error) {
            const targetPath = join(this.projectsPath, projectName.replace(/\s+/g, '_').toLowerCase());
            if (existsSync(targetPath)) {
                try {
                    rmSync(targetPath, { recursive: true, force: true });
                } catch (clnp_error) {
                    console.error('Failed to clean up partial clone:', clnp_error);
                }
            }

            return {
                success: false,
                message: `Failed to clone repository: ${error?.message}`,
                error: error instanceof Error ? error : new Error(error),
            };
        }
    }
}
