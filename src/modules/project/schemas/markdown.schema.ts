import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class ProjectMarkdown {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    })
    projectId: mongoose.Types.ObjectId;

    @Prop({ required: true })
    filePath: string;

    @Prop({ required: true })
    fileName: string;

    @Prop({ required: true })
    content: string;

    @Prop({ required: true })
    cleanedContent: string;

    @Prop({ type: [String], required: true })
    chunks: string[];

    @Prop({ type: [String], required: true })
    relatedNodeIds: string[];

    @Prop({ required: true })
    matchType: string;

    @Prop({ type: Number, default: 0 })
    scanVersion: number;
}

export const ProjectMarkdownSchema = SchemaFactory.createForClass(ProjectMarkdown);
export type ProjectMarkdownDocument = HydratedDocument<ProjectMarkdown>;
ProjectMarkdownSchema.set('toJSON', {
    transform: (doc, ret: Partial<ProjectMarkdownDocument>) => {
        delete ret._id;
        delete ret.__v;
    },
});
