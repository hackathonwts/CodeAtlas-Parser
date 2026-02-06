import type { IProjectDescription, ProjectDescriptionDocument } from "src/modules/project/schemas/description.schema";
import type { IProjectMarkdown, ProjectMarkdownDocument } from "src/modules/project/schemas/markdown.schema";

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
    eid: string;
    kind: NodeKind;
    name: string;
    filePath?: string;
    parentId?: string;
    subtype?: string;
    meta?: Record<string, any>;
}

export interface KGRelation {
    from: string;
    to: string;
    type: string;
}


export interface Documentation {
    markdown: IProjectMarkdown[];
    descriptions: IProjectDescription[];
    metadata: {
        extractedAt: string;
        totalMarkdownFiles: number;
        matchedMarkdownFiles: number;
        totalDescriptions: number;
        projectPath: string;
    };
}