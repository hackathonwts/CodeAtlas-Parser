import { Processor, WorkerHost } from "@nestjs/bullmq";
import { CODE_PARSER_QUEUE } from "./queue.constant";
import { Job } from "bullmq";

@Processor(CODE_PARSER_QUEUE)
export class CodeParserQueue extends WorkerHost {
    async process(job: Job, token?: string): Promise<void> {
        console.log("Processing job:", job.id, "with data:", job.data);
    }
}