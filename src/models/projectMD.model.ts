
import { model, Schema } from "mongoose";

// Documentation extraction types
export interface MarkdownDoc {
    _id?: Schema.Types.ObjectId;
    projectId?: Schema.Types.ObjectId;
    filePath: string;
    fileName: string;
    content: string;              // Original markdown content
    cleanedContent: string;       // Cleaned text for vector DB
    chunks: string[];             // Text chunks for embeddings
    relatedNodeIds: string[];
    matchType: "module" | "file" | "unmatched";
    scanVersion?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const MarkdownSchema = new Schema<MarkdownDoc>({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    filePath: { type: String, required: true },
    fileName: { type: String, required: true },
    content: { type: String, required: true },
    cleanedContent: { type: String, required: true },
    chunks: { type: [String], required: true },
    relatedNodeIds: { type: [String], required: true },
    matchType: { type: String, required: true },
    scanVersion: { type: Number, default: 0 },
}, {
    timestamps: true,
});

export const MarkdownModel = model<MarkdownDoc>("Markdown", MarkdownSchema);