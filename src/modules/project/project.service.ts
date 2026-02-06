import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Project, ProjectDocument } from "./schemas/project.schema";
import { ProjectMarkdown, ProjectMarkdownDocument } from "./schemas/markdown.schema";
import { ProjectDescription, ProjectDescriptionDocument } from "./schemas/description.schema";
import { Model, Types } from "mongoose";
import { Documentation } from "src/types/kg.types";

@Injectable()
export class ProjectService {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
        @InjectModel(ProjectMarkdown.name) private readonly markdownModel: Model<ProjectMarkdownDocument>,
        @InjectModel(ProjectDescription.name) private readonly descriptionModel: Model<ProjectDescriptionDocument>,
    ) { }

    async dumpDocumentation(project_id: Types.ObjectId, documentation: Documentation) {
        try {
            const project = await this.projectModel.findById(project_id);
            if (!project) throw new Error('Project not found');

            if (documentation.markdown.length) {
                const markdowns = documentation.markdown.map((markdown) => {
                    return {
                        ...markdown,
                        projectId: project._id,
                        scanVersion: project.scan_version,
                    };
                });
                await this.markdownModel.deleteMany({ projectId: project._id });
                await this.markdownModel.insertMany(markdowns);
            }

            if (documentation.descriptions.length) {
                const descriptions = documentation.descriptions.map((description) => {
                    return {
                        ...description,
                        projectId: project._id,
                        scanVersion: project.scan_version,
                    };
                });
                await this.descriptionModel.deleteMany({ projectId: project._id });
                await this.descriptionModel.insertMany(descriptions);
            }
        } catch (error) {
            throw error;
        }
    }
}