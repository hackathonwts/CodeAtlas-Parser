import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { IPolicy, IPolicyConditions } from '../policy.interface';

@Schema({ timestamps: true, versionKey: false })
export class Policy implements IPolicy {
    @Prop({ type: String, required: true })
    resource: string;

    @Prop({ type: String, required: true })
    action: string;

    @Prop({ type: Object, default: {} })
    conditions?: IPolicyConditions;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);
export type PolicyDocument = HydratedDocument<Policy>;

PolicySchema.index(
    { resource: 1, action: 1 },
    {
        unique: true,
        partialFilterExpression: {
            resource: { $exists: true, $ne: '' },
            action: { $exists: true, $ne: '' },
        },
    },
);
PolicySchema.plugin(require('mongoose-aggregate-paginate-v2'));
PolicySchema.set('toJSON', {
    transform: (doc, ret: Partial<PolicyDocument>) => {
        delete ret.__v;
        return ret;
    },
});
