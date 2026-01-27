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
    meta?: Record<string, any>;
}

export interface KGRelation {
    from: string;
    to: string;
    type: string;
}

/**
 * Configuration for cloning Git repository with HTTP authentication
 */
export interface GitCloneConfig {
    /** The Git repository URL (HTTP/HTTPS) */
    gitUrl: string;
    /** Username for authentication */
    username: string;
    /** Password or Personal Access Token for authentication */
    password: string;
    /** Project name where the repository will be cloned */
    projectName: string;
    /** Optional: Branch to clone (defaults to default branch) */
    branch?: string;
}

/**
 * Result of the Git clone operation
 */
export interface GitCloneResult {
    success: boolean;
    message: string;
    clonedPath?: string;
    error?: Error;
}