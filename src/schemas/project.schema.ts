import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import slugify from 'slugify';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
    @Prop({ required: true })
    gitUrl: string;

    @Prop({ required: true })
    branch: string;

    @Prop({ required: true })
    projectName: string;

    @Prop({ required: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, unique: true })
    uuid: string;

    @Prop({ default: 0 })
    scanVersion: number;

    @Prop({ default: false })
    isDeleted: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Indexes
ProjectSchema.index({ projectName: 1, branch: 1 }, { unique: true });

// Pre-validate hook to generate UUID
ProjectSchema.pre('validate', async function () {
    if (!this.uuid) {
        // Generate a random 8-character alphanumeric seed
        const seed = Math.random().toString(36).substring(2, 10);
        this.uuid = slugify(`${this.projectName}-${this.branch}-${seed}`, {
            lower: true,
            trim: true,
            replacement: '-',
        });
    }
});
