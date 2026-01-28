import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CODE_PARSER_QUEUE, GIT_CLONE_QUEUE } from 'src/queues/queue.constant';
import { GitUtils } from 'src/utils/git.utils';
import { Project, ProjectDocument } from 'src/modules/project/schemas/project.schema';

@Processor(GIT_CLONE_QUEUE)
export class GitCloneQueue extends WorkerHost {
    constructor(
        @InjectQueue(CODE_PARSER_QUEUE) private codeParserQueue: Queue,
        @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
        private readonly gitUtils: GitUtils
    ) {
        super();
    }

    async process(job: Job<any, any, string>, token?: string): Promise<any> {
        console.log("Processing job:", job.id, "with data:", job.data, "and token:", token);
        try {
            const project = await this.projectModel.findById(job.data._id);
            if (project?.git_link && project?.git_username && project?.git_password) {
                const result = await this.gitUtils.cloneGitRepository({
                    gitUrl: project.git_link,
                    username: project.git_username,
                    password: project.git_password,
                    projectName: project.title,
                    branch: project?.git_branch,
                });

                if (result.success && result.clonedPath) {
                    await this.codeParserQueue.add('start.parsing', {
                        _id: project._id,
                        project_path: result.clonedPath,
                        project_name: project.title
                    });
                } else {
                    throw new Error(`Failed to clone repository: ${result.message}`);
                }
            }
        } catch (error) {
            console.error('Git clone queue error:', error);
            throw error;
        }
    }
}
