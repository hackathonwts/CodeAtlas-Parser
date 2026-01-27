export interface Neo4jModuleOptions {
    uri: string;
    username: string;
    password: string;
    database?: string;
}

export interface Neo4jModuleAsyncOptions {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<Neo4jModuleOptions> | Neo4jModuleOptions;
    inject?: any[];
}
