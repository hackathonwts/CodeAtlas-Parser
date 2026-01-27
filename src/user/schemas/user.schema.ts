import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { compareSync, hashSync, genSaltSync, genSalt, hash } from 'bcrypt';
import { HydratedDocument, Schema as MongoSchema, Types } from 'mongoose';
import { Policy, PolicySchema } from 'src/policy/schemas/policy.schema';

export enum UserStatus {
    Active = 'Active',
    Inactive = 'Inactive',
}

export interface IUser {
    _id?: string;

    full_name: string;
    profile_image: string;
    email: string;
    password: string;
    email_verification_otp: number | null;
    status: string;
    roles?: Types.ObjectId[];
    active_role?: Types.ObjectId;
    is_deleted: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

@Schema({ timestamps: true, versionKey: false })
export class User implements IUser {
    @Prop({ type: String, trim: true, default: '' })
    full_name: string;
    @Prop({ type: String, trim: true, default: '' })
    profile_image: string;
    @Prop({ type: String, trim: true, lowercase: true, required: true })
    email: string;

    @Prop({ type: String, trim: true, default: '' })
    password: string;
    @Prop({ type: Number, default: null })
    email_verification_otp: number | null;

    @Prop({ type: [MongoSchema.Types.ObjectId], ref: 'Role', default: [] })
    roles: Types.ObjectId[];
    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Role', default: null })
    active_role: Types.ObjectId;
    @Prop({ type: [PolicySchema], default: [] })
    policy: Policy[];

    @Prop({ type: Boolean, default: false, index: true })
    is_deleted: boolean;
    @Prop({ type: String, default: UserStatus.Active, enum: UserStatus, index: true })
    status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = HydratedDocument<User> & {
    validPassword: (password: string) => boolean;
    generateHash: (password: string) => string;
};

UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { is_deleted: false } });
UserSchema.methods.validPassword = function (password: string) {
    return compareSync(password, this.password);
};
UserSchema.methods.generateHash = function (password: string) {
    return hashSync(password, genSaltSync(+process.env.SALT_ROUNDS!));
};
UserSchema.plugin(require('mongoose-aggregate-paginate-v2'));
UserSchema.set('toJSON', {
    transform: (doc, ret: Partial<UserDocument>) => {
        delete ret.password;
        delete ret.is_deleted;
        delete ret.email_verification_otp;
        delete ret.__v;
        return ret;
    },
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);
});

UserSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate() as any;
    if (!update) return;
    if (update.password) {
        const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
        const salt = await genSalt(saltRounds);
        update.password = await hash(update.password, salt);
        this.setUpdate(update);
    }
});
