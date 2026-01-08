import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';

const projectsPath = path.join(process.cwd(), 'projects');
/**
 * Configuration for cloning Git repository with HTTP authentication
 */
export interface GitCloneConfig {
    /** The Git repository URL (HTTP/HTTPS) */
    gitUrl: string;
    /** Username for authentication */
    username: string;
    /** Password or Personal Access Token for authentication */
    password: string;
    /** Project name where the repository will be cloned */
    projectName: string;
    /** Optional: Branch to clone (defaults to default branch) */
    branch?: string;
}

/**
 * Result of the Git clone operation
 */
export interface GitCloneResult {
    success: boolean;
    message: string;
    clonedPath?: string;
    error?: Error;
}

/**
 * Clones a Git repository using HTTP authentication with username and password
 * 
 * @param config - Configuration object containing Git URL, credentials, and target path
 * @returns Promise with the result of the clone operation
 * 
 * @example
 * ```typescript
 * const result = await cloneGitRepository({
 *   gitUrl: 'https://github.com/user/repo.git',
 *   username: 'myuser',
 *   password: 'mytoken',
 *   targetPath: '/path/to/clone',
 *   branch: 'main' // optional
 * });
 * 
 * if (result.success) {
 *   console.log('Cloned to:', result.clonedPath);
 * }
 * ```
 */
export async function cloneGitRepository(
    config: GitCloneConfig
): Promise<GitCloneResult> {
    const { gitUrl, username, password, projectName, branch } = config;

    try {
        // Validate inputs
        if (!gitUrl || !username || !password || !projectName) {
            throw new Error('gitUrl, username, password, and projectName are required');
        }

        console.log(`Cloning repository from: ${gitUrl}`);
        console.log(`Target path: ${projectsPath}/${projectName}`);

        const targetPath = path.join(projectsPath, projectName);
        // Check if target path already exists
        if (fs.existsSync(targetPath)) {
            console.log(`Target path already exists. Removing: ${targetPath}`);
            fs.rmSync(targetPath, { recursive: true, force: true });
        }

        // Ensure parent directory exists
        const parentDir = path.dirname(targetPath);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }

        // Build authenticated URL
        const authenticatedUrl = ((gitUrl: string, username: string, password: string): string => {
            try {
                const url = new URL(gitUrl);
                url.username = encodeURIComponent(username);
                url.password = encodeURIComponent(password);
                return url.toString();
            } catch (error) {
                throw new Error(`Invalid Git URL: ${gitUrl}`);
            }
        })(gitUrl, username, password);

        // Initialize simple-git
        const git = simpleGit();

        // Clone options
        const cloneOptions: string[] = [];
        if (branch) {
            cloneOptions.push('--branch', branch);
        }

        // Clone the repository
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
        const targetPath = path.join(projectsPath, projectName);
        // Clean up partial clone if it exists
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
