import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationTemplateKey = 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'PROJECT_DELETED' | 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'USER_CREATED' | 'USER_UPDATED';

export interface INotificationTemplate {
    _id?: string;

    key: NotificationTemplateKey;
    version: number;
    title: string;
    body: string;
    is_active: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

@Schema({ timestamps: true, versionKey: false })
export class NotificationTemplate {
    @Prop({ type: String, required: [true, 'Key is required'], trim: true, unique: true, index: true })
    key: NotificationTemplateKey;

    @Prop({ type: Number, default: 1 })
    version: number;

    @Prop({
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxLength: [100, 'Title cannot exceed 100 characters'],
    })
    title: string;

    @Prop({
        type: String,
        required: [true, 'Body is required'],
        trim: true,
        maxLength: [500, 'Body cannot exceed 500 characters'],
    })
    body: string;

    @Prop({ type: Boolean, default: true })
    is_active: boolean;
}

export const NotificationTemplateSchema = SchemaFactory.createForClass(NotificationTemplate);
export type NotificationTemplateDocument = HydratedDocument<NotificationTemplate>;

NotificationTemplateSchema.set('toJSON', {
    transform: (doc, ret: Partial<NotificationTemplateDocument>) => {
        return ret;
    },
});
