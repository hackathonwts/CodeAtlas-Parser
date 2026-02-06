import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongoSchema, Types } from 'mongoose';

export interface IProjectDescription {
    projectId?: Types.ObjectId | string;
    nodeId: string;
    nodeName: string;
    nodeKind: string;
    filePath: string;
    description: string;
    fullComment: string;
    scanVersion?: number;

    _id?: Types.ObjectId | string;
    createdAt?: Date;
    updatedAt?: Date;
}

@Schema({ timestamps: true, versionKey: false })
export class ProjectDescription {
    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Project', required: true })
    projectId: Types.ObjectId | string;

    @Prop({ type: String, required: true })
    nodeId: string;

    @Prop({ type: String, required: true })
    nodeName: string;

    @Prop({ type: String, required: true })
    nodeKind: string;

    @Prop({ type: String, required: true })
    filePath: string;

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ type: String, required: true })
    fullComment: string;

    @Prop({ type: Number, default: 0 })
    scanVersion: number;
}

export const ProjectDescriptionSchema = SchemaFactory.createForClass(ProjectDescription);
export type ProjectDescriptionDocument = HydratedDocument<ProjectDescription>;
ProjectDescriptionSchema.set('toJSON', {
    transform: (doc, ret: Partial<ProjectDescriptionDocument>) => {
        delete ret._id;
        delete ret.__v;
    },
});
