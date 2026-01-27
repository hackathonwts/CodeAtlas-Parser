import { Injectable } from "@nestjs/common";
import { existsSync, rmSync } from "fs";
import simpleGit, { SimpleGit } from "simple-git";

@Injectable()
export class GitUtils {
    getAuthenticatedGitUrl(gitUrl: string, username: string, password: string): string {
        const url = new URL(gitUrl);
        url.username = encodeURIComponent(username);
        url.password = encodeURIComponent(password);
        return url.toString();
    }

    async cloneGitRepository({ git_link, git_username, git_password, git_branch, target_project_path }: { git_link: string; git_username: string; git_password: string; git_branch?: string; target_project_path: string; }): Promise<void> {
        const git: SimpleGit = simpleGit();
        const clone_options: string[] = [];
        if (git_branch) {
            clone_options.push('--branch', git_branch);
        }

        const authenticated_url = this.getAuthenticatedGitUrl(git_link, git_username, git_password);
        try {
            await git.clone(authenticated_url, target_project_path, clone_options);
            console.log(`✓ Repository cloned successfully to: ${target_project_path}`);
        } catch (cloneError) {
            if (existsSync(target_project_path)) {
                rmSync(target_project_path, { recursive: true, force: true });
            }
            throw cloneError;
        }
    }
}