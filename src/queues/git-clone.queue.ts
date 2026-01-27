import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CODE_PARSER_QUEUE, GIT_CLONE_QUEUE } from 'src/queues/queue.constant';
import { Project, ProjectDocument } from 'src/modules/project/schemas/project.schema';
import { ParserService } from '../modules/parser/parser.service';

@Processor(GIT_CLONE_QUEUE)
export class GitCloneQueue extends WorkerHost {
    constructor(
        @InjectQueue(CODE_PARSER_QUEUE) private codeParserQueue: Queue,
        @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
        private readonly parserService: ParserService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>, token?: string): Promise<any> {
        console.log("Processing job:", job.id, "with data:", job.data, "and token:", token);
        try {
            // Check if job data contains the parser DTO directly
            if (job.data.gitUrl && job.data.gitUsername && job.data.gitPassword) {
                // Direct processing from parser service
                await this.parserService.processProject(job.data);
                return;
            }

            // Legacy processing for existing projects
            const project = await this.projectModel.findById(job.data._id);
            if (project?.git_link && project?.git_username && project?.git_password) {
                // Convert to new format and process
                const parserDto = {
                    _id: project._id.toString(),
                    name: project.title,
                    description: project.description || '',
                    gitUrl: project.git_link,
                    gitUsername: project.git_username,
                    gitPassword: project.git_password,
                    branch: project.git_branch,
                };

                await this.parserService.processProject(parserDto);
            }
        } catch (error) {
            console.error('GitCloneQueue processing failed:', error);
            throw error;
        }
    }
}
