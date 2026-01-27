import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { NEO4J_DRIVER } from './neo4j.module';
import { inspect } from 'util';

@Injectable()
export class Neo4jService implements OnModuleDestroy {
    constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

    getSession(database?: string): Session {
        return this.driver.session(database ? { database } : undefined);
    }

    async read<T>(cypher: string, params: Record<string, any> = {}, database?: string): Promise<T[]> {
        const session = this.getSession(database);
        try {
            const result = await session.executeRead((tx) => tx.run(cypher, params));
            return result.records.map((r) => r.toObject() as T);
        } finally {
            await session.close();
        }
    }

    async write<T>(cypher: string, params: Record<string, any> = {}, database?: string): Promise<T[]> {
        const session = this.getSession(database);
        try {
            const result = await session.executeWrite((tx) => tx.run(cypher, params));
            return result.records.map((r) => r.toObject() as T);
        } finally {
            await session.close();
        }
    }

    async onModuleDestroy() {
        await this.driver.close();
    }
}
