import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PARSER_QUEUE } from './parser.constant';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from 'src/project/schemas/project.schema';
import { InjectModel } from '@nestjs/mongoose';
import simpleGit, { SimpleGit } from 'simple-git';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { GitUtils } from 'src/utils/git.utils';

@Processor(PARSER_QUEUE)
export class ParseQueue extends WorkerHost {
    project_path: string;

    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
        private readonly gitUtils: GitUtils
    ) {
        super();
        this.project_path = join(process.cwd(), 'projects');
    }

    getProjectPath(projectTitle: string): string {
        const projectTitleSanitized = projectTitle.replace(/\s+/g, '_').toLowerCase();
        const p_path = join(this.project_path, projectTitleSanitized);
        if (!existsSync(p_path)) {
            mkdirSync(p_path, { recursive: true });
        } else {
            rmSync(p_path, { recursive: true, force: true });
            mkdirSync(p_path, { recursive: true });
        }
        return p_path;
    }

    async process(job: Job<any, any, string>): Promise<any> {
        console.log('Processing job:', job.id, 'with data:', job.data);
        try {
            const project = await this.projectModel.findById(job.data._id);
            if (project?.git_link && project?.git_username && project?.git_password) {
                const target_project_path = this.getProjectPath(project.title);
                if (!target_project_path) throw new Error('Failed to create project path');

                await this.gitUtils.cloneGitRepository({
                    git_link: project.git_link,
                    git_username: project.git_username,
                    git_password: project.git_password,
                    git_branch: project?.git_branch,
                    target_project_path: target_project_path
                });

                // Queue For Parsing
            }
        } catch (error) {
            console.error(error);
        }
    }
}
