import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongoSchema } from 'mongoose';

export enum ProjectRoleEnum {
    Admin = 'admin',
    Member = 'member',
}

export interface IMember {
    _id?: Types.ObjectId;

    user_id?: Types.ObjectId;
    project_id?: Types.ObjectId;
    project_role?: ProjectRoleEnum;

    createdAt?: Date;
    updatedAt?: Date;
}

@Schema({ timestamps: true, versionKey: false })
export class Member {
    @Prop({ type: MongoSchema.Types.ObjectId, required: true, index: true })
    user_id: Types.ObjectId;

    @Prop({ type: MongoSchema.Types.ObjectId, required: true, index: true })
    project_id: Types.ObjectId;

    @Prop({
        type: String,
        enum: ProjectRoleEnum,
        default: ProjectRoleEnum.Member,
    })
    project_role: ProjectRoleEnum;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
export type MemberDocument = HydratedDocument<Member>;
MemberSchema.plugin(require('mongoose-aggregate-paginate-v2'));
MemberSchema.set('toJSON', {
    transform: (doc, ret: Partial<MemberDocument>) => {
        return ret;
    },
});
