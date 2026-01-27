import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, HydratedDocument, Types } from 'mongoose';
import type { NotificationTemplateKey } from './notification-template.schema';
import { User } from 'src/modules/user/schemas/user.schema';

export interface INotification {
    _id?: string;

    user_id: string;
    title: string;
    body: string;
    read: boolean;
    timestamp: Date;
    template?: NotificationTemplateKey;

    createdAt?: Date;
    updatedAt?: Date;
}

@Schema({ timestamps: true, versionKey: false })
export class Notification {
    @Prop({
        type: MongoSchema.Types.ObjectId,
        ref: User.name,
        required: [true, 'User ID is required'],
        trim: true,
        index: true,
    })
    user_id: string;

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

    @Prop({ type: Date, default: Date.now, index: true })
    timestamp: Date;

    @Prop({ type: Boolean, default: false, index: true })
    read: boolean;

    @Prop({ type: String, required: false, trim: true })
    template?: NotificationTemplateKey;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
export type NotificationDocument = HydratedDocument<Notification>;

NotificationSchema.set('toJSON', {
    transform: (doc, ret: Partial<NotificationDocument>) => {
        return ret;
    },
});
