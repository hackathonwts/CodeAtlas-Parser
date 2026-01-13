# Documentation Extraction Feature

## Overview

The parser now extracts and outputs documentation in JSON format from two sources:
1. **Markdown files** (`.md`) with smart node matching
2. **JSDoc `@description` comments** from code

**Important:** Documentation is NOT stored in Neo4j - it's output as separate JSON to the console.

## Markdown File Extraction

### Matching Rules

| Pattern | Example | Matches | Match Type |
|---------|---------|---------|------------|
| Module-level | `user.readme.md` in `modules/user/` | ALL nodes in user module | `"module"` |
| File-level | `user.service.readme.md` | Only `user.service.ts` nodes | `"file"` |
| Directory readme | `readme.md` | All nodes in same directory | `"file"` |
| No match | `ARCHITECTURE.md` | No nodes (still included) | `"unmatched"` |

### Example Output

```json
{
  "markdown": [
    {
      "filePath": "src/modules/user/user.readme.md",
      "fileName": "user.readme.md",
      "content": "# User Module\n\nHandles user management...",
      "relatedNodeIds": ["cls-abc123", "met-def456"],
      "matchType": "module"
    }
  ]
}
```

## @description Comment Extraction

### Supported Nodes
- Classes, Methods, Properties
- Functions, Variables
- Interfaces, Enums, Type Aliases

### Example Code

```typescript
/**
 * @description Count student records matching the filter
 * @param {*} filterQuery MongoDB filter object
 * @param {*} secondaryQuery Additional query parameters
 * @returns {Promise<Number>} Total count
 */
async countStudents(filterQuery, secondaryQuery) {
    // implementation
}
```

### Example Output

```json
{
  "descriptions": [
    {
      "nodeId": "met-xyz789",
      "nodeName": "countStudents",
      "nodeKind": "Method",
      "filePath": "src/modules/student/student.service.ts",
      "description": "Count student records matching the filter",
      "fullComment": "/**\n * @description Count student records...\n */"
    }
  ]
}
```

## Complete JSON Structure

```json
{
  "markdown": [...],
  "descriptions": [...],
  "metadata": {
    "extractedAt": "2026-01-13T18:57:00.000Z",
    "totalMarkdownFiles": 12,
    "matchedMarkdownFiles": 8,
    "totalDescriptions": 45,
    "projectPath": "/path/to/project"
  }
}
```

## Console Output

When running the parser, you'll see:

```
📚 Extracting documentation...

📚 Documentation Extracted (JSON):
================================================================================
{
  "markdown": [...],
  "descriptions": [...],
  "metadata": {...}
}
================================================================================

✓ Found 12 markdown file(s)
✓ Matched 8 to code nodes
✓ Extracted 45 @description comment(s)
```

## Files Created

1. **`src/utils/extract-markdown-docs.ts`** - Markdown file finder and matcher
2. **`src/utils/extract-descriptions.ts`** - JSDoc @description extractor
3. **`src/parser.ts`** - Integrated extraction and JSON output

## Usage

Just run the parser as normal:

```bash
npm run build
node dist/main.js
```

The documentation JSON will be logged to console. You can redirect it to a file if needed:

```bash
node dist/main.js > output.log 2>&1
# Then extract JSON from output.log
```

## Use Cases

- **API Documentation**: Extract markdown guides for modules
- **Code Comments**: Get all @description annotations for documentation generation
- **Architecture Docs**: Collect unmatched markdown files (ARCH ITECTURE.md, CONTRIBUTING.md)
- **LLM Context**: Provide documentation as context for AI code assistants

## Benefits

✅ Automatic doc discovery - no manual configuration
✅ Smart matching - relates docs to relevant code
✅ Flexible output - JSON can be processed by any tool
✅ Non-intrusive - doesn't pollute the graph database
✅ Complete context - gets both markdown files and inline comments
