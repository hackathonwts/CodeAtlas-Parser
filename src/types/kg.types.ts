export type NodeKind =
    | "File"
    | "Class"
    | "Method"
    | "Route";

export interface KGNode {
    id: string;
    kind: NodeKind;
    name: string;
    filePath?: string;
    parentId?: string;
    meta?: Record<string, any>;
}

export interface KGRelation {
    from: string;
    to: string;
    type: string;
}