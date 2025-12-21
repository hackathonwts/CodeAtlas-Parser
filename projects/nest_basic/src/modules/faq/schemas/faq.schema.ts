import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FaqDocument = HydratedDocument<Faq>;

@Schema({ timestamps: true, versionKey: false })
export class Faq {
    @Prop({ type: String, default: '' })
    question: string;

    @Prop({ type: String, default: '' })
    answer: string;

    @Prop({ type: String, default: 'Active', enum: ['Active', 'Inactive'], index: true })
    status: string;

    @Prop({ type: Boolean, default: false, index: true })
    isDeleted: boolean;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);
