import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

export enum ProjectStatusEnum {
    Active = 'Active',
    Inactive = 'Inactive',
    Archived = 'Archived',
}
export interface IProject {
    _id?: Types.ObjectId;

    created_by?: Types.ObjectId;
    members?: Types.ObjectId[];
    title?: string;
    description?: string;
    language?: string;

    git_link?: string;
    git_username?: string;
    git_password?: string;
    git_branch?: string;
    uuid?: string;
    scan_version?: string;

    is_deleted?: boolean;
    status?: ProjectStatusEnum;

    createdAt?: Date;
    updatedAt?: Date;
}

@Schema({ timestamps: true, versionKey: false })
export class Project {
    @Prop({
        type: Types.ObjectId,
        required: [true, 'Created by user is required'],
        ref: User.name,
    })
    created_by: Types.ObjectId;

    @Prop({ type: String, default: '' })
    title: string;

    @Prop({ type: String, default: '' })
    description: string;

    @Prop({ type: String, default: '' })
    language: string;

    @Prop({
        type: String,
        required: true,
        unique: [true, 'Project with this git link already exists'],
        index: true,
    })
    git_link: string;

    @Prop({ type: String, required: [true, 'Git username is required'] })
    git_username: string;

    @Prop({ type: String, required: [true, 'Git password is required'] })
    git_password: string;

    @Prop({ type: String, required: [true, 'Git branch is required'] })
    git_branch: string;

    @Prop({ type: String, lowercase: true, unique: true, index: true })
    uuid: string;

    @Prop({ type: String, required: [true, 'Scan version is required'] })
    scan_version: string;

    @Prop({ type: Boolean, default: false, index: true })
    is_deleted: boolean;
    @Prop({
        type: String,
        default: ProjectStatusEnum.Inactive,
        enum: ProjectStatusEnum,
    })
    status: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
export type ProjectDocument = HydratedDocument<Project>;

ProjectSchema.index({ title: 1, git_branch: 1 }, { unique: true, partialFilterExpression: { is_deleted: false } });
ProjectSchema.plugin(require('mongoose-aggregate-paginate-v2'));
ProjectSchema.pre('validate', async function () {
    if (!this.uuid) {
        const seed = Math.random().toString(36).substring(2, 10);
        this.uuid = `${this.title}-${this.git_branch}-${seed}`;
    }
});

ProjectSchema.set('toJSON', {
    transform: (doc, ret: Partial<ProjectDocument>) => {
        delete ret.is_deleted;
        return ret;
    },
});
