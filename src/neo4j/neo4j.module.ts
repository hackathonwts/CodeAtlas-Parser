import { DynamicModule, Global, Module } from '@nestjs/common';
import neo4j, { Driver } from 'neo4j-driver';
import { Neo4jModuleOptions, Neo4jModuleAsyncOptions } from './neo4j-config.interface';

export const NEO4J_OPTIONS = 'NEO4J_OPTIONS';
export const NEO4J_DRIVER = 'NEO4J_DRIVER';

@Global()
@Module({})
export class Neo4jModule {
    static forRootAsync(options: Neo4jModuleAsyncOptions): DynamicModule {
        return {
            module: Neo4jModule,
            imports: options.imports || [],
            providers: [
                {
                    provide: NEO4J_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                {
                    provide: NEO4J_DRIVER,
                    useFactory: async (neo4jOptions: Neo4jModuleOptions): Promise<Driver> => {
                        const driver = neo4j.driver(neo4jOptions.uri, neo4j.auth.basic(neo4jOptions.username, neo4jOptions.password));

                        await driver.verifyConnectivity();
                        return driver;
                    },
                    inject: [NEO4J_OPTIONS],
                }
            ],
            exports: [NEO4J_DRIVER, NEO4J_OPTIONS],
        };
    }
}
