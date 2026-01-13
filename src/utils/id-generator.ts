import { NodeKind } from "../types/kg.types.js";
import { createHash } from "crypto";

/**
 * Generates a unique ID with a type-based prefix for knowledge graph nodes.
 * 
 * ID Format:
 * - File: fil-{subtype}-{hash} or fil-{hash} if no subtype
 * - Class: cls-{hash}
 * - Method: met-{hash}
 * - Function: fun-{hash}
 * - Interface: int-{hash}
 * - Enum: enm-{hash}
 * - EnumMember: emb-{hash}
 * - TypeAlias: typ-{hash}
 * - Property: prp-{hash}
 * - Parameter: par-{hash}
 * - Variable: var-{hash}
 * - Route: rte-{hash}
 * - Model: mdl-{hash}
 * 
 * Examples:
 * - fil-schema-a3f2c1d (schema file)
 * - fil-service-b8e4d2a (service file)
 * - cls-e9f3a2b (class)
 * - met-d4c2b1a (method)
 */

/**
 * Get the prefix for a given node kind
 */
function getKindPrefix(kind: NodeKind): string {
    const prefixMap: Record<NodeKind, string> = {
        File: "fil",
        Class: "cls",
        Method: "met",
        Function: "fun",
        Interface: "int",
        Enum: "enm",
        EnumMember: "emb",
        TypeAlias: "typ",
        Property: "prp",
        Parameter: "par",
        Variable: "var",
        Route: "rte",
        Model: "mdl",
    };

    return prefixMap[kind];
}

/**
 * Normalize subtype for use in ID (remove dots, lowercase)
 */
function normalizeSubtype(subtype: string): string {
    return subtype.toLowerCase().replace(/\./g, '-');
}

/**
 * Generate a short hash from a string
 */
function generateHash(input: string, length: number = 8): string {
    const hash = createHash('sha256').update(input).digest('hex');
    return hash.substring(0, length);
}

/**
 * Generate a unique ID for a file node
 */
export function generateFileId(filePath: string, subtype?: string | null): string {
    const hash = generateHash(filePath);

    if (subtype) {
        const normalizedSubtype = normalizeSubtype(subtype);
        return `fil-${normalizedSubtype}-${hash}`;
    }

    return `fil-${hash}`;
}

/**
 * Generate a unique ID for a class node
 */
export function generateClassId(className: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${className}`);
    return `cls-${hash}`;
}

/**
 * Generate a unique ID for a method node
 */
export function generateMethodId(className: string, methodName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${className}.${methodName}`);
    return `met-${hash}`;
}

/**
 * Generate a unique ID for a function node
 */
export function generateFunctionId(functionName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${functionName}`);
    return `fun-${hash}`;
}

/**
 * Generate a unique ID for an interface node
 */
export function generateInterfaceId(interfaceName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${interfaceName}`);
    return `int-${hash}`;
}

/**
 * Generate a unique ID for an enum node
 */
export function generateEnumId(enumName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${enumName}`);
    return `enm-${hash}`;
}

/**
 * Generate a unique ID for an enum member node
 */
export function generateEnumMemberId(enumName: string, memberName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${enumName}.${memberName}`);
    return `emb-${hash}`;
}

/**
 * Generate a unique ID for a type alias node
 */
export function generateTypeAliasId(typeName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${typeName}`);
    return `typ-${hash}`;
}

/**
 * Generate a unique ID for a property node
 */
export function generatePropertyId(className: string, propertyName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${className}.${propertyName}`);
    return `prp-${hash}`;
}

/**
 * Generate a unique ID for a parameter node
 */
export function generateParameterId(parentId: string, paramName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${parentId}:${paramName}`);
    return `par-${hash}`;
}

/**
 * Generate a unique ID for a variable node
 */
export function generateVariableId(variableName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${variableName}`);
    return `var-${hash}`;
}

/**
 * Generate a unique ID for a route node
 */
export function generateRouteId(method: string, path: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${method}:${path}`);
    return `rte-${hash}`;
}

/**
 * Generate a unique ID for a model node
 */
export function generateModelId(modelName: string, filePath: string): string {
    const hash = generateHash(`${filePath}:${modelName}`);
    return `mdl-${hash}`;
}

/**
 * Generic ID generator that routes to the appropriate specific generator
 */
export function generateNodeId(
    kind: NodeKind,
    name: string,
    filePath: string,
    options?: {
        subtype?: string | null;
        parentName?: string;
        parentId?: string;
        method?: string;
        path?: string;
    }
): string {
    switch (kind) {
        case "File":
            return generateFileId(filePath, options?.subtype);
        case "Class":
            return generateClassId(name, filePath);
        case "Method":
            return generateMethodId(options?.parentName || "", name, filePath);
        case "Function":
            return generateFunctionId(name, filePath);
        case "Interface":
            return generateInterfaceId(name, filePath);
        case "Enum":
            return generateEnumId(name, filePath);
        case "EnumMember":
            return generateEnumMemberId(options?.parentName || "", name, filePath);
        case "TypeAlias":
            return generateTypeAliasId(name, filePath);
        case "Property":
            return generatePropertyId(options?.parentName || "", name, filePath);
        case "Parameter":
            return generateParameterId(options?.parentId || "", name, filePath);
        case "Variable":
            return generateVariableId(name, filePath);
        case "Route":
            return generateRouteId(options?.method || "GET", options?.path || "", filePath);
        case "Model":
            return generateModelId(name, filePath);
        default:
            // Fallback
            const hash = generateHash(`${filePath}:${name}`);
            return `unk-${hash}`;
    }
}
