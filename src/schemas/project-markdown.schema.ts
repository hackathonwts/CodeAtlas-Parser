import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProjectMarkdownDocument = ProjectMarkdown & Document;

@Schema({ timestamps: true })
export class ProjectMarkdown {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true })
    projectId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    scanVersion: number;

    @Prop({ required: true })
    filePath: string;

    @Prop({ required: true })
    content: string;

    @Prop()
    matchType?: string;

    @Prop()
    matchedNodeId?: string;

    @Prop()
    matchedNodeName?: string;

    @Prop()
    matchScore?: number;

    createdAt?: Date;
    updatedAt?: Date;
}

export const ProjectMarkdownSchema = SchemaFactory.createForClass(ProjectMarkdown);

// Indexes
ProjectMarkdownSchema.index({ projectId: 1, scanVersion: 1 });
ProjectMarkdownSchema.index({ filePath: 1 });
