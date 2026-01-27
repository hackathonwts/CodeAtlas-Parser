import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongoSchema } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class ProjectDescription {
    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Project', required: true })
    projectId: {
        type: MongoSchema.Types.ObjectId;
        ref: 'Project';
        required: true;
    };

    @Prop({ type: String, required: true })
    nodeId: { type: string; required: true };

    @Prop({ type: String, required: true })
    nodeName: { type: string; required: true };

    @Prop({ type: String, required: true })
    nodeKind: { type: string; required: true };

    @Prop({ type: String, required: true })
    filePath: { type: string; required: true };

    @Prop({ type: String, required: true })
    description: { type: string; required: true };

    @Prop({ type: String, required: true })
    fullComment: { type: string; required: true };

    @Prop({ type: Number, default: 0 })
    scanVersion: { type: number; default: 0 };
}

export const ProjectDescriptionSchema = SchemaFactory.createForClass(ProjectDescription);
export type ProjectDescriptionDocument = HydratedDocument<ProjectDescription>;
ProjectDescriptionSchema.set('toJSON', {
    transform: (doc, ret: Partial<ProjectDescriptionDocument>) => {
        delete ret._id;
        delete ret.__v;
    },
});
