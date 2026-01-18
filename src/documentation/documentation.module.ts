import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentationService } from './documentation.service';
import { ProjectDescription, ProjectDescriptionSchema } from '../schemas/project-description.schema';
import { ProjectMarkdown, ProjectMarkdownSchema } from '../schemas/project-markdown.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ProjectDescription.name, schema: ProjectDescriptionSchema },
            { name: ProjectMarkdown.name, schema: ProjectMarkdownSchema },
        ]),
    ],
    providers: [DocumentationService],
    exports: [DocumentationService],
})
export class DocumentationModule { }
