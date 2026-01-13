# Markdown Cleaning for Vector Database

## Overview

Markdown files are now automatically cleaned and prepared for vector database storage. The cleaning process removes markdown syntax, extracts plain text, and chunks content into optimal sizes for embeddings.

## What's Cleaned

### Removed Elements
- ✅ Code blocks (` ``` ` ... ` ``` `)
- ✅ Inline code (`` `code` ``)
- ✅ Images (`![alt](url)`)
- ✅ Links (`[text](url)` → `text`)
- ✅ HTML tags (`<div>`, etc.)
- ✅ Headers (`#`, `##`, `###`)
- ✅ Bold/italic formatting (`**bold**`, `*italic*`)
- ✅ Blockquotes (`>`)
- ✅ Horizontal rules (`---`)
- ✅ List markers (`-`, `*`, `1.`)
- ✅ Table formatting (`|`)
- ✅ Excessive whitespace

### Result
Clean, plain text optimized for semantic search and embeddings.

## Example

### Original Markdown
```markdown
# User Module

The **User Module** handles user management.

## Features
- Create users
- Update profiles
- Delete accounts

```typescript
class UserService {
    findUser(id: string) { }
}
```

See [documentation](./docs) for more.
```

### Cleaned Output
```
User Module
The User Module handles user management.
Features
Create users
Update profiles
Delete accounts
class UserService {
    findUser(id: string) { }
}
See documentation for more.
```

## Data Structure

Each `MarkdownDoc` now includes:

```typescript
{
  "filePath": "src/modules/user/user.readme.md",
  "fileName": "user.readme.md",
  "content": "# Original markdown...",           // Original
  "cleanedContent": "User Module...",          // Cleaned text
  "chunks": [                                   // Split for embeddings
    "User Module The User Module handles...",
    "Features Create users Update profiles..."
  ],
  "relatedNodeIds": ["cls-abc123", "met-def456"],
  "matchType": "module"
}
```

## Chunking Strategy

Text is split into chunks for better vector embeddings:

- **Default chunk size**: 512 characters
- **Overlap**: 50 characters between chunks
- **Strategy**: Split by paragraphs, then sentences if needed
- **Purpose**: Maintains context while keeping chunks manageable

### Example Chunks

From a long README:
```json
{
  "chunks": [
    "User Module The User Module manages user authentication and profiles. It provides comprehensive user management features including registration login and profile management.",
    
    "registration login and profile management. Features Create new user accounts Update user profiles Delete user accounts Manage authentication tokens Security The module implements industry standard security practices.",
    
    "Security The module implements industry standard security practices. All passwords are hashed using bcrypt. Sessions use JWT tokens with refresh capabilities."
  ]
}
```

Note the overlap maintains context between chunks.

## Vector DB Usage

### For Embeddings

Use `cleanedContent` or `chunks`:

```typescript
// Embed entire document
const embedding = await generateEmbedding(doc.cleanedContent);

// OR embed chunks separately (better for large docs)
for (const chunk of doc.chunks) {
    const embedding = await generateEmbedding(chunk);
    // Store chunk with embedding
}
```

### For Semantic Search

```typescript
// Query vector DB
const results = await vectorDB.search(queryEmbedding);

// Results are clean text snippets
results.forEach(result => {
    console.log(result.text); // Clean, readable text
});
```

## Functions Available

### `cleanMarkdownForVectorDB(markdown: string): string`

Cleans markdown and returns plain text.

```typescript
import { cleanMarkdownForVectorDB } from "./utils/clean-markdown";

const cleaned = cleanMarkdownForVectorDB("# Title\n\n**Bold** text");
// Returns: "Title\nBold text"
```

### `chunkMarkdownText(text: string, maxChunkSize?: number, overlapSize?: number): string[]`

Splits text into chunks for embeddings.

```typescript
import { chunkMarkdownText } from "./utils/clean-markdown";

const chunks = chunkMarkdownText(cleanedText, 512, 50);
// Returns: ["chunk 1...", "chunk 2...", ...]
```

### `extractMarkdownMetadata(markdown: string): object`

Extracts title and first paragraph.

```typescript
import { extractMarkdownMetadata } from "./utils/clean-markdown";

const metadata = extractMarkdownMetadata(markdown);
// Returns: { title: "User Module", firstParagraph: "..." }
```

## Benefits

### 1. **Better Embeddings**
Clean text produces higher quality vector embeddings compared to markdown-formatted text.

### 2. **Improved Search**
Semantic search works better without markdown noise.

### 3. **Optimal Chunking**
Auto-chunking ensures embeddings capture meaningful context.

### 4. **Ready to Use**
No additional processing needed - output is directly usable.

### 5. **Maintains Context**
Overlap between chunks preserves semantic relationships.

## Files Created/Modified

1. **`src/utils/clean-markdown.ts`** - Cleaning and chunking utilities
2. **`src/types/kg.types.ts`** - Added `cleanedContent` and `chunks` to `MarkdownDoc`
3. **`src/utils/extract-markdown-docs.ts`** - Integrated cleaning into extraction

## Console Output

Cleaned content is included in the documentation JSON:

```json
{
  "markdown": [
    {
      "fileName": "user.readme.md",
      "content": "# Original...",
      "cleanedContent": "Clean text...",
      "chunks": ["chunk1", "chunk2"],
      ...
    }
  ]
}
```

## Use With Vector DBs

Works with any vector database:

- **Pinecone**: Use chunks as documents
- **Weaviate**: Store cleaned content
- **Qdrant**: Index chunks with metadata
- **Milvus**: Batch insert chunks
- **ChromaDB**: Add documents with embeddings

Example (Pinecone):
```typescript
for (const doc of markdownDocs) {
    for (let i = 0; i < doc.chunks.length; i++) {
        await pinecone.upsert({
            id: `${doc.fileName}-chunk-${i}`,
            values: await embed(doc.chunks[i]),
            metadata: {
                fileName: doc.fileName,
                filePath: doc.filePath,
                chunkIndex: i,
                nodeIds: doc.relatedNodeIds
            }
        });
    }
}
```

## Summary

✅ Markdown automatically cleaned
✅ Plain text extracted
✅ Content chunked for embeddings
✅ Ready for vector database storage
✅ No manual processing needed
