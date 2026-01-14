/**
 * Cleans markdown content for vector database storage
 * Removes markdown syntax and formatting, extracts plain text
 */

/**
 * Cleans markdown content by removing formatting and extracting plain text
 */
export function cleanMarkdownForVectorDB(markdown: string): string {
    let cleaned = markdown;

    // Remove code blocks (```...```)
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

    // Remove inline code (`...`)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

    // Remove images ![alt](url)
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

    // Remove links but keep text [text](url) -> text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Remove headers (###, ##, #)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

    // Remove bold/italic (**text** or *text* or __text__ or _text_)
    cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
    cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');

    // Remove blockquotes (>)
    cleaned = cleaned.replace(/^>\s+/gm, '');

    // Remove horizontal rules (---, ***, ___)
    cleaned = cleaned.replace(/^[-*_]{3,}$/gm, '');

    // Remove list markers (-, *, +, 1., 2., etc.)
    cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '');
    cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '');

    // Remove table formatting (|)
    cleaned = cleaned.replace(/\|/g, ' ');

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');  // Multiple spaces to single

    // Trim each line
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();

    return cleaned;
}

/**
 * Chunks cleaned markdown into smaller segments for better vector embeddings
 * @param text Cleaned markdown text
 * @param maxChunkSize Maximum characters per chunk (default: 512)
 * @param overlapSize Characters to overlap between chunks (default: 50)
 */
export function chunkMarkdownText(
    text: string,
    maxChunkSize: number = 512,
    overlapSize: number = 50
): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);

    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed max size
        if (currentChunk.length + paragraph.length > maxChunkSize) {
            // Save current chunk if not empty
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim());

                // Start new chunk with overlap from previous
                const words = currentChunk.split(' ');
                const overlapWords = words.slice(-Math.ceil(overlapSize / 5)); // Approx 5 chars per word
                currentChunk = overlapWords.join(' ') + '\n\n';
            }
        }

        // If single paragraph is too large, split it by sentences
        if (paragraph.length > maxChunkSize) {
            const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];

            for (const sentence of sentences) {
                if (currentChunk.length + sentence.length > maxChunkSize) {
                    if (currentChunk.trim().length > 0) {
                        chunks.push(currentChunk.trim());
                        currentChunk = '';
                    }
                }
                currentChunk += sentence + ' ';
            }
        } else {
            currentChunk += paragraph + '\n\n';
        }
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Extracts metadata from markdown content (title, description, etc.)
 */
export function extractMarkdownMetadata(markdown: string): {
    title?: string;
    firstParagraph?: string;
} {
    const metadata: { title?: string; firstParagraph?: string } = {};

    // Extract title (first h1 header)
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        metadata.title = titleMatch[1].trim();
    }

    // Extract first meaningful paragraph
    const lines = markdown.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        // Skip empty lines, headers, and code blocks
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
            metadata.firstParagraph = trimmed;
            break;
        }
    }

    return metadata;
}
