# ChromaDB Integration

## Overview

Documentation chunks are now automatically stored in ChromaDB for semantic search and RAG applications. The integration creates a collection named after your project and stores cleaned markdown chunks with full metadata.

## Configuration

- **ChromaDB URL**: `http://localhost:8000` (default)
- **Collection Name**: Derived from `projectName` (e.g., `wts-nest-setup`)
- **Auto-cleanup**: Existing collections are deleted before re-storing

## What's Stored

Each markdown chunk is stored as a separate document with:

### Document Text
The cleaned, plain text chunk (ready for embeddings).

### Metadata
- `fileName` - Original markdown filename
- `filePath` - Full path to markdown file
- `matchType` - `"module"`, `"file"`, or `"unmatched"`
- `chunkIndex` - Position of this chunk (0, 1, 2...)
- `totalChunks` - Total chunks from this file
- **`relatedNodeIds`** - JSON array of related code node IDs

### Document ID
Format: `{fileName}-chunk-{index}`  
Example: `user.readme.md-chunk-0`

## Example Data in ChromaDB

```javascript
// Document ID: "user.service.readme.md-chunk-0"
{
  "document": "User Service The UserService class handles user management including creation updates and deletion. It provides methods for finding users by ID email and other criteria.",
  "metadata": {
    "fileName": "user.service.readme.md",
    "filePath": "src/modules/user/user.service.readme.md",
    "matchType": "file",
    "chunkIndex": 0,
    "totalChunks": 3,
    "relatedNodeIds": "[\"cls-abc123\",\"met-def456\",\"met-ghi789\"]"
  }
}
```

## Workflow

### 1. Clone Project
```typescript
const result = await cloneGitRepository(projectGitConfig);
```

### 2. Parse & Extract Documentation
```typescript
const { nodes, relations, documentation } = parser(result.clonedPath);
```

### 3. Store in Neo4j
```typescript
await ingest(nodes, relations, projectGitConfig.projectName);
```

### 4. Store in ChromaDB
```typescript
await storeInChromaDB(projectGitConfig.projectName, documentation);
```

## Collection Management

### Auto-Cleanup
Before storing new data, the existing collection is deleted:
```
🗑️  Checking for existing collection: wts-nest-setup...
✓ Deleted existing collection
📦 Creating collection: wts-nest-setup...
✓ Successfully created collection
```

This ensures:
- ✅ No duplicate data
- ✅ Always fresh documentation
- ✅ Clean state for each parse

## Console Output

When running the parser, you'll see:

```
📚 Extracting documentation...

🔗 Connecting to ChromaDB at http://localhost:8000...
🗑️  Checking for existing collection: wts-nest-setup...
✓ Deleted existing collection
📦 Creating collection: wts-nest-setup...
📝 Adding 45 document chunks...
✓ Successfully stored 45 chunks in ChromaDB
✓ Collection: wts-nest-setup
✓ From 12 markdown file(s)

✅ Knowledge Graph imported to Neo4j
✅ Documentation stored in ChromaDB
```

## Querying ChromaDB

### Using the Utility Function

```typescript
import { queryChromaDB } from "./utils/store-chromadb";

const results = await queryChromaDB(
    "wts-nest-setup",
    "How to create a new user?",
    5  // Number of results
);

console.log(results);
```

### Direct ChromaDB API

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient({ path: "http://localhost:8000" });
const collection = await client.getCollection({ name: "wts-nest-setup" });

const results = await collection.query({
    queryTexts: ["authentication"],
    nResults: 10,
});

// Access results
results.ids[0]        // ["user.service.readme.md-chunk-2"]
results.documents[0]  // ["The authentication system uses..."]
results.metadatas[0]  // [{ fileName: "...", relatedNodeIds: "[...]" }]
```

## Use Cases

### 1. **Semantic Documentation Search**
```typescript
// Find relevant docs for a coding question
const results = await queryChromaDB(
    "wts-nest-setup",
    "How do I implement authentication?"
);
```

### 2. **RAG (Retrieval Augmented Generation)**
```typescript
// Get context for LLM
const docs = await queryChromaDB("wts-nest-setup", userQuestion, 5);
const context = docs.documents[0].join("\n\n");

// Send to LLM with context
const answer = await llm.complete({
    prompt: `Context: ${context}\n\nQuestion: ${userQuestion}`,
});
```

### 3. **Code-Aware Search**
```typescript
// Find docs related to specific code
const results = await queryChromaDB("wts-nest-setup", "UserService methods");

// Get related code nodes
const nodeIds = JSON.parse(results.metadatas[0][0].relatedNodeIds);
// Query Neo4j for these nodes to show code + docs together
```

### 4. **Documentation Coverage**
```typescript
const collection = await client.getCollection({ name: "wts-nest-setup" });
const count = await collection.count();
console.log(`Total documentation chunks: ${count}`);
```

## Connecting Code & Docs

The `relatedNodeIds` field links documentation to code:

```typescript
// 1. Find relevant documentation
const docResults = await queryChromaDB("wts-nest-setup", query);

// 2. Extract related node IDs
const nodeIds = JSON.parse(docResults.metadatas[0][0].relatedNodeIds);

// 3. Query Neo4j for the actual code
const codeQuery = `
  MATCH (n)
  WHERE n.id IN $nodeIds
  RETURN n.name, n.kind, n.meta.sourceCode
`;

// 4. Now you have both docs AND code!
```

## Files Created/Modified

1. **`src/utils/store-chromadb.ts`** - ChromaDB storage and query utilities
2. **`src/main.ts`** - Integrated ChromaDB storage after parsing
3. **`package.json`** - Added `chromadb` dependency

## Configuration Options

### Custom ChromaDB URL

Set via environment variable or parameter:

```typescript
await storeInChromaDB(
    projectName,
    documentation,
    "http://remote-chroma:8000"  // Custom URL
);
```

### Collection Naming

Collection names are auto-sanitized:
- `wts-nest-setup` → `wts-nest-setup`
- `My Project!` → `my-project`
- `Test_v2.0` → `test-v2-0`

## Error Handling

Graceful error handling prevents parser failure:

```typescript
try {
    await storeInChromaDB(projectName, documentation);
    console.log("✅ Documentation stored in ChromaDB");
} catch (error) {
    console.error("Failed to store documentation:", error);
    // Parser continues, Neo4j data still stored
}
```

## Requirements

- ✅ ChromaDB server running on localhost:8000
- ✅ `chromadb` npm package installed
- ✅ Network access to ChromaDB server

## Testing ChromaDB

Verify ChromaDB is running:

```bash
curl http://localhost:8000/api/v1/heartbeat
# Should return: {"nanosecond heartbeat": ...}
```

View collections:
```bash
curl http://localhost:8000/api/v1/collections
```

## Benefits

✅ **Semantic Search**: Find docs by meaning, not keywords  
✅ **RAG Ready**: Perfect for LLM context retrieval  
✅ **Code-Linked**: Connect docs to actual code via node IDs  
✅ **Auto-Managed**: Collections auto-cleaned and recreated  
✅ **Chunked**: Optimal sizes for embeddings  
✅ **Clean Text**: No markdown noise in vectors  
✅ **Fast Queries**: Pre-embedded documents ready to search

## Summary

Documentation is now stored in ChromaDB with:
- ✅ Clean, plain text chunks
- ✅ Rich metadata including relatedNodeIds
- ✅ Auto-managed collections
- ✅ Ready for semantic search and RAG
- ✅ Integrated seamlessly into parser workflow
