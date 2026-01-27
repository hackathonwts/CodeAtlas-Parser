import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { Project, ProjectSchema } from './schemas/project.schema';
import { Member, MemberSchema } from './schemas/member.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Project.name, schema: ProjectSchema },
            { name: Member.name, schema: MemberSchema },
        ]),
    ],
    controllers: [],
    providers: [],
})
export class ProjectModule {}
