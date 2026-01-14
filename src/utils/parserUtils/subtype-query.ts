import { KGNode } from "../../types/kg.types.js";

/**
 * Filters nodes by file subtype
 * @param nodes - Array of KG nodes
 * @param subtype - The subtype to filter by (e.g., "schema", "service", "xyz")
 * @returns Nodes matching the specified subtype
 */
export function filterNodesBySubtype(nodes: KGNode[], subtype: string): KGNode[] {
    return nodes.filter(node => node.kind === "File" && node.subtype === subtype);
}

/**
 * Groups file nodes by their subtype
 * @param nodes - Array of KG nodes
 * @returns Map of subtype to nodes
 */
export function groupNodesBySubtype(nodes: KGNode[]): Map<string, KGNode[]> {
    const grouped = new Map<string, KGNode[]>();

    nodes
        .filter(node => node.kind === "File" && node.subtype)
        .forEach(node => {
            const subtype = node.subtype!;
            if (!grouped.has(subtype)) {
                grouped.set(subtype, []);
            }
            grouped.get(subtype)!.push(node);
        });

    return grouped;
}

/**
 * Gets statistics about file subtypes in the knowledge graph
 * @param nodes - Array of KG nodes
 * @returns Object with subtype counts
 */
export function getSubtypeStats(nodes: KGNode[]): Record<string, number> {
    const stats: Record<string, number> = {};

    nodes
        .filter(node => node.kind === "File" && node.subtype)
        .forEach(node => {
            const subtype = node.subtype!;
            stats[subtype] = (stats[subtype] || 0) + 1;
        });

    return stats;
}

/**
 * Gets all unique subtypes found in the knowledge graph
 * @param nodes - Array of KG nodes
 * @returns Array of unique subtypes, sorted alphabetically
 */
export function getAllUniqueSubtypes(nodes: KGNode[]): string[] {
    const subtypes = new Set<string>();

    nodes
        .filter(node => node.kind === "File" && node.subtype)
        .forEach(node => {
            subtypes.add(node.subtype!);
        });

    return Array.from(subtypes).sort();
}
