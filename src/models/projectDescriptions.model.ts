import { model, Schema } from "mongoose";


export interface DescriptionDoc {
    _id?: Schema.Types.ObjectId;
    projectId?: Schema.Types.ObjectId;
    nodeId: string;
    nodeName: string;
    nodeKind: string;
    filePath: string;
    description: string;
    fullComment: string;
    scanVersion?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const DescriptionSchema = new Schema<DescriptionDoc>({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    nodeId: { type: String, required: true },
    nodeName: { type: String, required: true },
    nodeKind: { type: String, required: true },
    filePath: { type: String, required: true },
    description: { type: String, required: true },
    fullComment: { type: String, required: true },
    scanVersion: { type: Number, default: 0 },
}, {
    timestamps: true,
});

export const DescriptionModel = model<DescriptionDoc>("Description", DescriptionSchema);

