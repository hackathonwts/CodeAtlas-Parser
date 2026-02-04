export interface GitCloneConfig {
    gitUrl: string;
    username: string;
    password: string;
    projectUuid: string;
    branch?: string;
}

export interface GitCloneResult {
    success: boolean;
    message: string;
    clonedPath?: string;
    error?: Error;
}
