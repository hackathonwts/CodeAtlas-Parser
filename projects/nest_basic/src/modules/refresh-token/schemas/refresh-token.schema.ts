import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongoSchema, HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'refreshTokens' })
export class RefreshToken {
    @Prop({ type: String, required: true, unique: true, index: true })
    token: string;

    @Prop({ type: String, default: null, index: true })
    accessToken: string;

    @Prop({ type: Date, required: true, index: true })
    accessTokenExpiresAt: Date;

    @Prop({ type: String, required: false, index: true })
    tokenFamily: string;

    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    userId: string | Types.ObjectId;

    @Prop({ type: Date, required: true, index: true })
    expiresAt: Date;

    @Prop({ type: Boolean, default: false, index: true })
    isRevoked: boolean;

    @Prop({ type: String, required: false })
    deviceId: string;

    @Prop({ type: Date, default: Date.now })
    lastUsedAt: Date;

    @Prop({ type: Date, default: Date.now, index: true })
    createdAt: Date;

    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);