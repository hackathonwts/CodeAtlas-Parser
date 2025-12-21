import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true, versionKey: false })
export class Category {
    @Prop({ default: '' })
    name: string;

    @Prop({ default: '' })
    description: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', index: true })
    parentId: Types.ObjectId;

    @Prop({ default: 'Active', enum: ['Active', 'Inactive'], index: true })
    status: 'Active' | 'Inactive';

    @Prop({ default: false, index: true })
    isDeleted: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
