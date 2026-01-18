import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProjectDescription, ProjectDescriptionDocument } from '../schemas/project-description.schema';
import { ProjectMarkdown, ProjectMarkdownDocument } from '../schemas/project-markdown.schema';
import { ProjectDocument } from '../schemas/project.schema';
import { Documentation } from '../types/kg.types';

@Injectable()
export class DocumentationService {
    private readonly logger = new Logger(DocumentationService.name);

    constructor(
        @InjectModel(ProjectDescription.name)
        private descriptionModel: Model<ProjectDescriptionDocument>,
        @InjectModel(ProjectMarkdown.name)
        private markdownModel: Model<ProjectMarkdownDocument>,
    ) { }

    /**
     * Dump documentation (markdown and descriptions) to MongoDB
     * Replicates the logic from dumpDoc.ts
     */
    async dumpDocumentation(project: ProjectDocument, documentation: Documentation): Promise<void> {
        this.logger.log(`Dumping documentation for project: ${project.projectName}`);

        try {
            let isDocDumped = false;

            // Dump markdowns to database
            if (documentation.markdown && documentation.markdown.length > 0) {
                const markdowns = documentation.markdown.map((markdown) => ({
                    ...markdown,
                    projectId: project._id,
                    scanVersion: project.scanVersion,
                }));

                // Delete old markdowns for this project
                await this.markdownModel.deleteMany({ projectId: project._id });

                // Insert new markdowns
                await this.markdownModel.insertMany(markdowns);

                this.logger.log(`✅ Inserted ${markdowns.length} markdown documents`);
                isDocDumped = true;
            }

            // Dump descriptions to database
            if (documentation.descriptions && documentation.descriptions.length > 0) {
                const descriptions = documentation.descriptions.map((description) => ({
                    ...description,
                    projectId: project._id,
                    scanVersion: project.scanVersion,
                }));

                // Delete old descriptions for this project
                await this.descriptionModel.deleteMany({ projectId: project._id });

                // Insert new descriptions
                await this.descriptionModel.insertMany(descriptions);

                this.logger.log(`✅ Inserted ${descriptions.length} description documents`);
                isDocDumped = true;
            }

            if (!isDocDumped) {
                this.logger.warn('No documentation to dump');
            }
        } catch (error) {
            this.logger.error('Failed to dump documentation:', error);
            throw error;
        }
    }
}
