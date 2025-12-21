import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CmsDocument = HydratedDocument<Cms>;

@Schema({ timestamps: true, versionKey: false })
export class Cms {
    @Prop({ type: String, default: '', index: true })
    title: string;

    @Prop({ type: String, default: '', index: true })
    slug: string;

    @Prop({ type: String, default: '' })
    content: string;

    @Prop({ type: String, default: 'Active', enum: ['Active', 'Inactive'], index: true })
    status: string;

    @Prop({ type: Boolean, default: false, index: true })
    isDeleted: boolean;
}

export const CmsSchema = SchemaFactory.createForClass(Cms);
