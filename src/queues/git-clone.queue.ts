import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CODE_PARSER_QUEUE, GIT_CLONE_QUEUE } from 'src/queues/queue.constant';
import { Project, ProjectDocument } from 'src/project/schemas/project.schema';
import { GitUtils } from 'src/utils/git.utils';
import { HelperUtils } from 'src/utils/helper.utils';

@Processor(GIT_CLONE_QUEUE)
export class GitCloneQueue extends WorkerHost {
    constructor(
        @InjectQueue(CODE_PARSER_QUEUE) private codeParserQueue: Queue,
        @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
        private readonly helperUtils: HelperUtils,
        private readonly gitUtils: GitUtils
    ) {
        super();
    }

    async process(job: Job<any, any, string>, token?: string): Promise<any> {
        console.log("Processing job:", job.id, "with data:", job.data, "and token:", token);
        try {
            const project = await this.projectModel.findById(job.data._id);
            if (project?.git_link && project?.git_username && project?.git_password) {
                const target_project_path = this.helperUtils.getProjectPath(project.title);
                if (!target_project_path) throw new Error('Failed to create project path');

                await this.gitUtils.cloneGitRepository({
                    git_link: project.git_link,
                    git_username: project.git_username,
                    git_password: project.git_password,
                    git_branch: project?.git_branch,
                    target_project_path: target_project_path
                });

                await this.codeParserQueue.add('start.parsing', {
                    _id: project._id,
                    project_path: target_project_path
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
}
