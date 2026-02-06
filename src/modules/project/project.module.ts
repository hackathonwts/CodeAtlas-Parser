import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { Project, ProjectSchema } from './schemas/project.schema';
import { Member, MemberSchema } from './schemas/member.schema';
import { ProjectService } from './project.service';
import { ProjectMarkdown, ProjectMarkdownSchema } from './schemas/markdown.schema';
import { ProjectDescription, ProjectDescriptionSchema } from './schemas/description.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
            { name: ProjectMarkdown.name, schema: ProjectMarkdownSchema },
            { name: ProjectDescription.name, schema: ProjectDescriptionSchema },
            { name: Member.name, schema: MemberSchema },
        ]),
    ],
    controllers: [],
    providers: [ProjectService],
    exports: [ProjectService],
})
export class ProjectModule {}
