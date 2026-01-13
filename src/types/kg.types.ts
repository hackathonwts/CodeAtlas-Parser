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

// Documentation extraction types
export interface MarkdownDoc {
    filePath: string;
    fileName: string;
    content: string;              // Original markdown content
    cleanedContent: string;       // Cleaned text for vector DB
    chunks: string[];             // Text chunks for embeddings
    relatedNodeIds: string[];
    matchType: "module" | "file" | "unmatched";
}

export interface DescriptionDoc {
    nodeId: string;
    nodeName: string;
    nodeKind: string;
    filePath: string;
    description: string;
    fullComment: string;
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