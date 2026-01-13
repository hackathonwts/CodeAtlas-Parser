import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename, dirname, relative, sep } from "path";
import { KGNode } from "../types/kg.types";

export interface MarkdownDoc {
    filePath: string;
    fileName: string;
    content: string;
    relatedNodeIds: string[];
    matchType: "module" | "file" | "unmatched";
}

/**
 * Extracts markdown documentation files and matches them to code nodes
 */
export function extractMarkdownDocs(
    projectPath: string,
    nodes: KGNode[]
): MarkdownDoc[] {
    const docs: MarkdownDoc[] = [];
    const mdFiles = findMarkdownFiles(projectPath);

    mdFiles.forEach(mdFilePath => {
        const fileName = basename(mdFilePath);
        const dirPath = dirname(mdFilePath);
        const content = readFileSync(mdFilePath, "utf-8");

        const doc: MarkdownDoc = {
            filePath: mdFilePath,
            fileName,
            content,
            relatedNodeIds: [],
            matchType: "unmatched",
        };

        // Match markdown to nodes
        const relatedNodes = matchMarkdownToNodes(mdFilePath, fileName, dirPath, nodes, projectPath);

        if (relatedNodes.length > 0) {
            doc.relatedNodeIds = relatedNodes.map(n => n.id);

            // Determine match type based on the file name pattern
            if (fileName.toLowerCase().includes("readme.md")) {
                const folderName = basename(dirPath);
                const baseFileName = fileName.toLowerCase().replace(".readme.md", "");

                if (baseFileName === folderName.toLowerCase()) {
                    doc.matchType = "module";
                } else {
                    doc.matchType = "file";
                }
            } else {
                doc.matchType = "file";
            }
        }

        docs.push(doc);
    });

    return docs;
}

/**
 * Recursively finds all markdown files in project
 */
function findMarkdownFiles(dirPath: string): string[] {
    const mdFiles: string[] = [];

    function traverse(currentPath: string) {
        try {
            const items = readdirSync(currentPath);

            items.forEach(item => {
                const fullPath = join(currentPath, item);

                // Skip node_modules and hidden directories
                if (item === "node_modules" || item.startsWith(".")) {
                    return;
                }

                try {
                    const stat = statSync(fullPath);

                    if (stat.isDirectory()) {
                        traverse(fullPath);
                    } else if (stat.isFile() && item.toLowerCase().endsWith(".md")) {
                        mdFiles.push(fullPath);
                    }
                } catch (err) {
                    // Skip files we can't read
                }
            });
        } catch (err) {
            // Skip directories we can't read
        }
    }

    traverse(dirPath);
    return mdFiles;
}

/**
 * Matches markdown file to relevant nodes based on naming conventions
 */
function matchMarkdownToNodes(
    mdFilePath: string,
    mdFileName: string,
    mdDirPath: string,
    nodes: KGNode[],
    projectPath: string
): KGNode[] {
    const relatedNodes: KGNode[] = [];
    const mdFileNameLower = mdFileName.toLowerCase();

    // Get relative directory from project root
    const relativeDir = relative(projectPath, mdDirPath);

    // Extract base name patterns
    // Example: user.readme.md -> user
    // Example: user.service.readme.md -> user.service
    const readmeMatch = mdFileNameLower.match(/^(.+)\.readme\.md$/);
    const baseName = readmeMatch ? readmeMatch[1] : mdFileNameLower.replace(/\.md$/, "");

    nodes.forEach(node => {
        if (!node.filePath) return;

        const nodeDir = dirname(node.filePath);
        const nodeFileName = basename(node.filePath, ".ts");
        const nodeFileNameLower = nodeFileName.toLowerCase();

        // Check if markdown is in same directory as the node
        const nodeDirRelative = nodeDir.startsWith("src/") ? nodeDir : `src/${nodeDir}`;
        const sameDir = relativeDir.includes(nodeDir) || nodeDirRelative.includes(relativeDir);

        if (!sameDir) return;

        // Match type 1: module-level (user.readme.md matches all in user module)
        if (mdFileNameLower === `${basename(mdDirPath).toLowerCase()}.readme.md`) {
            // This is a module-level readme, matches all nodes in this directory
            if (node.filePath.includes(mdDirPath) || nodeDirRelative.includes(relativeDir)) {
                relatedNodes.push(node);
            }
        }
        // Match type 2: file-level (user.service.readme.md matches user.service.ts)
        else if (baseName === nodeFileNameLower) {
            // Exact file match
            relatedNodes.push(node);
        }
        // Match type 3: simple readme in directory (readme.md matches all in directory)
        else if (mdFileNameLower === "readme.md" && sameDir) {
            relatedNodes.push(node);
        }
    });

    return relatedNodes;
}
