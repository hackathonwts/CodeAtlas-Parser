import { KGNode, KGRelation } from "../types/kg.types";
import neo4j, { Session } from "neo4j-driver";

export const driver = neo4j.driver("neo4j://localhost:7687", neo4j.auth.basic("neo4j", "password"));
export async function withSession<T>(work: (session: Session) => Promise<T>): Promise<T> {
    const session = driver.session();
    try {
        return await work(session);
    } finally {
        await session.close();
    }
}

export function nodeMergeCypher(label: string) {
    return `
    MERGE (n:${label} { id: $id })
    SET n += $props
  `;
}

export function relationMergeCypher(type: string) {
    return `
    MATCH (a { id: $from })
    MATCH (b { id: $to })
    MERGE (a)-[r:${type}]->(b)
  `;
}


export async function importNodes(nodes: KGNode[]) {
    await withSession(async session => {
        const tx = session.beginTransaction();

        try {
            for (const node of nodes) {
                const label = node.kind;

                await tx.run(nodeMergeCypher(label), {
                    id: node.id,
                    props: {
                        name: node.name,
                        filePath: node.filePath,
                        parentId: node.parentId,
                        ...node.meta,
                    },
                });
            }

            await tx.commit();
        } catch (e) {
            await tx.rollback();
            throw e;
        }
    });
}


export async function importRelations(relations: KGRelation[]) {
    await withSession(async session => {
        const tx = session.beginTransaction();

        try {
            for (const rel of relations) {
                await tx.run(relationMergeCypher(rel.type), {
                    from: rel.from,
                    to: rel.to,
                });
            }

            await tx.commit();
        } catch (e) {
            await tx.rollback();
            throw e;
        }
    });
}