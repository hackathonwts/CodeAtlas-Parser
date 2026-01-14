import { Documentation } from "../types/kg.types";

/**
 * Document storage manager for posting documentation to API
 * Sends documents to localhost:5000/addDocument
 */
export class ChromaDBManager {
    private apiUrl: string;

    constructor() {
        this.apiUrl = "http://localhost:5000/addDocument";
        console.log(`🔗 Initializing Document Storage API connection to ${this.apiUrl}...`);
    }

    /**
     * Stores documentation by posting to the API endpoint
     */
    async storeDocumentation(
        projectName: string,
        documentation: Documentation
    ): Promise<void> {
        // Sanitize collection name
        const collectionName = projectName.toLowerCase().replace(/[^a-z0-9-_]/g, "-");

        try {
            // Add documents via API
            await this.addDocuments(documentation, collectionName);

        } catch (error) {
            console.error(`\n❌ Error storing documents via API:`, error);
            throw error;
        }
    }

    /**
     * Posts documentation chunks to the API
     */
    private async addDocuments(
        documentation: Documentation,
        collectionName: string
    ): Promise<void> {
        const documents: any[] = [];

        // Prepare documents from markdown chunks
        for (const markdownDoc of documentation.markdown) {
            for (let i = 0; i < markdownDoc.chunks.length; i++) {
                const chunk = markdownDoc.chunks[i];

                documents.push({
                    id: `${markdownDoc.fileName}-chunk-${i}`,
                    text: chunk,
                    metadata: {
                        fileName: markdownDoc.fileName,
                        filePath: markdownDoc.filePath,
                        matchType: markdownDoc.matchType,
                        chunkIndex: i,
                        totalChunks: markdownDoc.chunks.length,
                        relatedNodeIds: markdownDoc.relatedNodeIds,
                    },
                });
            }
        }

        // Post documents to API
        if (documents.length > 0) {
            console.log(`📝 Posting ${documents.length} document chunks to API...`);

            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    collectionName,
                    documents,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log(`✓ Successfully posted ${documents.length} chunks to API`);
            console.log(`✓ Collection: ${collectionName}`);
            console.log(`✓ From ${documentation.markdown.length} markdown file(s)\n`);
            console.log(`✓ API Response:`, result);
        } else {
            console.log(`⚠️  No markdown chunks to store\n`);
        }
    }
}