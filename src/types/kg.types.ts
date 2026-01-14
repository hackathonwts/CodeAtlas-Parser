import { MarkdownDoc } from "../models/projectMD.model";
import { DescriptionDoc } from "../models/projectDescriptions.model";


export type NodeKind =
    | "File"
    | "Class"
    | "Method"
    | "Route"
    | "Function"
    | "Interface"
    | "Enum"
    | "EnumMember"
    | "TypeAlias"
    | "Property"
    | "Parameter"
    | "Variable"
    | "Model";


export interface KGNode {
    id: string;
    kind: NodeKind;
    name: string;
    filePath?: string;
    parentId?: string;
    subtype?: string; // For files, indicates the discovered subtype
    meta?: Record<string, any>;
}

export interface KGRelation {
    from: string;
    to: string;
    type: string;
}


export interface Documentation {
    markdown: MarkdownDoc[];
    descriptions: DescriptionDoc[];
    metadata: {
        extractedAt: string;
        totalMarkdownFiles: number;
        matchedMarkdownFiles: number;
        totalDescriptions: number;
        projectPath: string;
    };
}