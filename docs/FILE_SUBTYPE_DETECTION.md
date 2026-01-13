# File Subtype Detection

This feature **dynamically discovers and extracts** file subtypes directly from filenames - no predefined patterns required!

## How It Works

The parser analyzes the filename structure to extract subtypes. Any segment between the filename and extension becomes the subtype:

**Pattern: `filename.subtype.extension`**

Examples:
- `user.schema.ts` → Subtype: **schema**
- `auth.service.ts` → Subtype: **service**
- `newFile.xyz.ts` → Subtype: **xyz** ✨ (automatically discovered!)
- `database.config.js` → Subtype: **config**
- `app.test.spec.ts` → Subtype: **test.spec** (multi-segment)
- `index.ts` → No subtype (single segment files)

## Supported Subtypes

**ALL subtypes are automatically discovered!** There are no predefined patterns. The system extracts whatever appears between the filename and extension.

### Common Examples

While any pattern works, here are common conventions you might encounter:

| Subtype | Example Filename | Usage |
|---------|-----------------|-------|
| `schema` | `user.schema.ts` | Database schemas, validation schemas |
| `service` | `auth.service.ts` | Business logic, service layer |
| `controller` | `api.controller.ts` | HTTP controllers, route handlers |
| `repository` | `data.repository.ts` | Data access layer |
| `middleware` | `auth.middleware.ts` | HTTP middleware |
| `config` | `db.config.ts` | Configuration files |
| `util` / `utils` | `string.utils.ts` | Utility functions |
| `helper` / `helpers` | `date.helper.ts` | Helper functions |
| `model` | `user.model.ts` | Data models |
| `entity` | `post.entity.ts` | Database entities |
| `dto` | `create-user.dto.ts` | Data Transfer Objects |
| `type` / `types` | `api.types.ts` | Type definitions |
| `component` | `button.component.tsx` | UI components |
| `module` | `app.module.ts` | Module definitions |
| `route` / `routes` | `api.routes.ts` | Route definitions |
| `test` | `auth.test.ts` | Test files |
| `spec` | `user.spec.ts` | Spec files |
| **custom** | `file.custom.ts` | Any custom subtype you create! |

### Multi-Segment Subtypes

Files with multiple dots will have all segments after the first as the subtype:
- `component.test.spec.ts` → Subtype: `test.spec`
- `user.api.controller.ts` → Subtype: `api.controller`

## Usage Examples

### Basic Usage

When you run the parser, file subtypes are automatically detected and stored:

```typescript
import parser from "./parser";

const { nodes, relations } = parser("/path/to/project");

// Files now have a 'subtype' property
const fileNodes = nodes.filter(n => n.kind === "File");
fileNodes.forEach(file => {
    console.log(`File: ${file.name}, Subtype: ${file.subtype}`);
});
```

### Filtering by Subtype

Use the provided utility functions to filter and query by subtype:

```typescript
import { filterNodesBySubtype, groupNodesBySubtype, getSubtypeStats, getAllUniqueSubtypes } from "./utils/subtype-query";

// Get all schema files
const schemaFiles = filterNodesBySubtype(nodes, "schema");
console.log("Schema files:", schemaFiles.map(f => f.name));

// Get all service files
const serviceFiles = filterNodesBySubtype(nodes, "service");
console.log("Service files:", serviceFiles.map(f => f.name));

// Get your custom xyz files!
const xyzFiles = filterNodesBySubtype(nodes, "xyz");
console.log("XYZ files:", xyzFiles.map(f => f.name));

// Group files by subtype
const grouped = groupNodesBySubtype(nodes);
console.log("Controllers:", grouped.get("controller"));
console.log("Repositories:", grouped.get("repository"));

// Get statistics
const stats = getSubtypeStats(nodes);
console.log("File type distribution:", stats);
// Output: { schema: 5, service: 12, controller: 8, config: 3, xyz: 2, ... }

// Get all discovered subtypes
const allSubtypes = getAllUniqueSubtypes(nodes);
console.log("All discovered subtypes:", allSubtypes);
// Output: ["config", "controller", "schema", "service", "xyz", ...]
```

### Neo4j Queries

When ingested into Neo4j, you can query by any subtype:

```cypher
// Find all schema files
MATCH (f:File {subtype: "schema"})
RETURN f.name, f.filePath

// Find your custom xyz files
MATCH (f:File {subtype: "xyz"})
RETURN f.name, f.filePath

// Find all services and what they depend on
MATCH (f:File {subtype: "service"})-[r:IMPORTS]->(dep)
RETURN f.name, collect(dep.name) as dependencies

// Count files by subtype (discover all subtypes in your codebase)
MATCH (f:File)
WHERE f.subtype IS NOT NULL
RETURN f.subtype, count(*) as count
ORDER BY count DESC

// Find all classes in service files
MATCH (f:File {subtype: "service"})-[:DECLARES]->(c:Class)
RETURN f.name, c.name
```

## Benefits

1. **Zero Configuration**: No need to predefine patterns - any naming convention works automatically
2. **Flexible**: Support for any custom subtype you create (`.xyz`, `.custom`, `.api`, etc.)
3. **Better Organization**: Quickly identify and categorize files based on their purpose
4. **Improved Queries**: Filter and analyze specific types of files
5. **Architecture Insights**: Understand the distribution of different file types in your codebase
6. **Multi-Segment Support**: Handle complex naming like `component.test.spec.ts`

## Console Output

When running the parser, you'll see a breakdown of all discovered file subtypes:

```
📊 Extracted 245 nodes and 789 relationships
   - Files: 42
   - Classes: 35
   - Methods: 156
   - Functions: 12
   - Interfaces: 18
   - Enums: 5
   - Routes: 24

📁 File Subtypes Detected:
   - service: 12
   - controller: 8
   - schema: 5
   - repository: 4
   - config: 3
   - utils: 2
   - types: 2
   - module: 2
   - xyz: 2  ← Your custom subtype!
   - test.spec: 2
```
