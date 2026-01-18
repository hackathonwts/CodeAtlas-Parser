import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProjectDescriptionDocument = ProjectDescription & Document;

@Schema({ timestamps: true })
export class ProjectDescription {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true })
    projectId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    scanVersion: number;

    @Prop({ required: true })
    nodeId: string;

    @Prop({ required: true })
    nodeName: string;

    @Prop({ required: true })
    nodeKind: string;

    @Prop()
    description?: string;

    @Prop()
    jsDocComment?: string;

    @Prop()
    filePath?: string;

    createdAt?: Date;
    updatedAt?: Date;
}

export const ProjectDescriptionSchema = SchemaFactory.createForClass(ProjectDescription);

// Indexes
ProjectDescriptionSchema.index({ projectId: 1, scanVersion: 1 });
ProjectDescriptionSchema.index({ nodeId: 1 });
