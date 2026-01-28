export interface GitCloneConfig {
    gitUrl: string;
    username: string;
    password: string;
    projectName: string;
    branch?: string;
}

export interface GitCloneResult {
    success: boolean;
    message: string;
    clonedPath?: string;
    error?: Error;
}