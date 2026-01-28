import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { NEO4J_DRIVER } from './neo4j.module';
import { KGNode, KGRelation } from '../types/kg.types';

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

    /**
     * Generates Cypher query for merging nodes
     */
    private nodeMergeCypher(label: string): string {
        return `
        MERGE (n:${label} { id: $id })
        SET n += $props
        `;
    }

    /**
     * Generates Cypher query for merging relations
     */
    private relationMergeCypher(type: string): string {
        return `
        MATCH (a { id: $from })
        MATCH (b { id: $to })
        MERGE (a)-[r:${type}]->(b)
        `;
    }

    /**
     * Creates the database if it doesn't exist
     */
    async createDatabaseIfNotExists(databaseName: string): Promise<void> {
        const session = this.getSession('system');
        try {
            await session.run(`CREATE DATABASE \`${databaseName}\` IF NOT EXISTS`);
            await this.waitForDatabaseReady(databaseName);
        } catch (error: any) {
            if (error.code !== 'Neo.ClientError.Database.DatabaseAlreadyExists') {
                throw error;
            }
        } finally {
            await session.close();
        }
    }

    /**
     * Waits for the database to be ready (online status)
     */
    private async waitForDatabaseReady(databaseName: string, maxRetries: number = 10, delayMs: number = 1000): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const session = this.getSession(databaseName);
                try {
                    await session.run('RETURN 1');
                    return;
                } finally {
                    await session.close();
                }
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw new Error(`Database '${databaseName}' did not become ready in time.`);
                }
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    /**
     * Cleans the entire database by deleting all nodes and relationships
     */
    async cleanDatabase(databaseName: string): Promise<void> {
        await this.write('MATCH (n) DETACH DELETE n', {}, databaseName);
    }

    /**
     * Ensures database exists (creates if not) and cleans it
     */
    async ensureCleanDatabase(databaseName: string): Promise<void> {
        await this.createDatabaseIfNotExists(databaseName);
        await this.cleanDatabase(databaseName);
    }

    /**
     * Flattens nested properties to JSON strings for Neo4j compatibility
     */
    private flattenMeta(meta: Record<string, any> | undefined): Record<string, any> {
        if (!meta) return {};

        const flattened: Record<string, any> = {};
        for (const [key, value] of Object.entries(meta)) {
            if (value === null || value === undefined) {
                continue;
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                flattened[key] = JSON.stringify(value);
            } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                flattened[key] = JSON.stringify(value);
            } else {
                flattened[key] = value;
            }
        }
        return flattened;
    }

    /**
     * Imports nodes into the database
     */
    async importNodes(databaseName: string, nodes: KGNode[]): Promise<void> {
        const session = this.getSession(databaseName);
        const tx = session.beginTransaction();

        try {
            for (const node of nodes) {
                const flattenedMeta = this.flattenMeta(node.meta);
                await tx.run(this.nodeMergeCypher(node.kind), {
                    id: node.id,
                    props: {
                        name: node.name,
                        filePath: node.filePath || null,
                        parentId: node.parentId || null,
                        ...flattenedMeta,
                    },
                });
            }
            await tx.commit();
        } catch (error) {
            await tx.rollback();
            throw error;
        } finally {
            await session.close();
        }
    }

    /**
     * Imports relations into the database
     */
    async importRelations(databaseName: string, relations: KGRelation[]): Promise<void> {
        const session = this.getSession(databaseName);
        const tx = session.beginTransaction();

        try {
            for (const relation of relations) {
                await tx.run(this.relationMergeCypher(relation.type), {
                    from: relation.from,
                    to: relation.to,
                });
            }
            await tx.commit();
        } catch (error) {
            await tx.rollback();
            throw error;
        } finally {
            await session.close();
        }
    }

    /**
     * Creates/ensures database exists, cleans it, and imports fresh data
     */
    async cleanAndImport(databaseName: string, nodes: KGNode[], relations: KGRelation[]): Promise<void> {
        await this.ensureCleanDatabase(databaseName);
        await this.importNodes(databaseName, nodes);
        await this.importRelations(databaseName, relations);
    }
}
