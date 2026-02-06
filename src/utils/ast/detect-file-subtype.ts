

/**
 * Dynamically extracts the file subtype from the filename.
 * 
 * Extracts the segment between the filename and extension.
 * Examples:
 * - "user.schema.ts" → "schema"
 * - "auth.service.ts" → "service"
 * - "newFile.xyz.ts" → "xyz"
 * - "database.config.js" → "config"
 * - "helper.utils.tsx" → "utils"
 * - "app.test.spec.ts" → "test.spec" (multiple segments)
 * - "index.ts" → null (no subtype)
 * 
 * @param filename - The name of the file (e.g., "user.schema.ts")
 * @returns The extracted subtype or null if no subtype pattern found
 */
export function detectFileSubtype(filename: string): string | null {
    // Remove the file extension(s)
    // Handle cases like .ts, .tsx, .js, .jsx, .d.ts, etc.
    const extensionPattern = /\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/;
    let nameWithoutExt = filename.replace(extensionPattern, '');

    // Also handle .d.ts files
    if (nameWithoutExt.endsWith('.d')) {
        nameWithoutExt = nameWithoutExt.slice(0, -2);
    }

    // Split by dots to get segments
    const segments = nameWithoutExt.split('.');

    // If only one segment (e.g., "index.ts"), no subtype
    if (segments.length === 1) {
        return null;
    }

    // Everything after the first segment is the subtype
    // Examples:
    // ["user", "schema"] → "schema"
    // ["auth", "service", "test"] → "service.test"
    // ["app", "config"] → "config"
    const subtype = segments.slice(1).join('.');

    return subtype || null;
}

/**
 * Get all unique subtypes from a collection of filenames
 * @param filenames - Array of filenames
 * @returns Array of unique subtypes found
 */
export function getAllSubtypes(filenames: string[]): string[] {
    const subtypes = new Set<string>();

    filenames.forEach(filename => {
        const subtype = detectFileSubtype(filename);
        if (subtype) {
            subtypes.add(subtype);
        }
    });

    return Array.from(subtypes).sort();
}
