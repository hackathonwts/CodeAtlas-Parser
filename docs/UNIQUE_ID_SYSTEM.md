# Unique ID System for CodeAtlas Parser

## Overview

Every element parsed by CodeAtlas now has a unique, prefixed ID that makes it easy to identify its type at a glance.

## ID Format

All IDs follow this pattern: `{prefix}-{hash}`

Where:
- `{prefix}` = A 3-letter code indicating the element type
- `{hash}` = An 8-character SHA-256 hash ensuring uniqueness

### Special Case: Files with Subtypes

Files get a special extended format: `fil-{subtype}-{hash}`

Examples:
- `fil-schema-a3f2c1d8` (schema file)
- `fil-service-b8e4d2a9` (service file)
- `fil-controller-c9f3e1b0` (controller file)
- `fil-xyz-d4a2f3c1` (custom subtype "xyz")
- `fil-7e3b2a1d` (no subtype)

## Node Type Prefixes

| Node Kind | Prefix | Example ID | Description |
|-----------|--------|------------|-------------|
| **File** | `fil` | `fil-schema-a3f2c1d8` | File nodes (with optional subtype) |
| **Class** | `cls` | `cls-e9f3a2b4` | Class declarations |
| **Method** | `met` | `met-d4c2b1a5` | Class methods |
| **Function** | `fun` | `fun-c8e4d2a6` | Standalone functions |
| **Interface** | `int` | `int-b7f3e1c9` | Interface declarations |
| **Enum** | `enm` | `enm-a6d2c3b8` | Enum declarations |
| **EnumMember** | `emb` | `emb-97e3d1f4` | Enum member values |
| **TypeAlias** | `typ` | `typ-86f2e0d3` | Type alias declarations |
| **Property** | `prp` | `prp-75e1d9c2` | Class properties |
| **Parameter** | `par` | `par-64d0c8b1` | Method/function parameters |
| **Variable** | `var` | `var-53c9b7a0` | Variable declarations |
| **Route** | `rte` | `rte-42b8a6f9` | HTTP route definitions |
| **Model** | `mdl` | `mdl-31a7f5e8` | Data model/entity |

## Benefits

### 1. **Type Identification at a Glance**
```
met-d4c2b1a5  ← Immediately know it's a method
cls-e9f3a2b4  ← Know it's a class
fil-schema-a3f2c1d8  ←  Know it's a schema file
```

### 2. **Consistent & Predictable**
IDs are generated deterministically from the element's context (file path + name), so:
- Same element always gets the same ID
- Rebuilding the graph produces identical IDs
- Perfect for version control and diffing

### 3. **Globally Unique**
The SHA-256 hash ensures no collisions, even across:
- Different files with similar names
- Classes/functions with the same name in different files
- Method overloads

### 4. **Database-Friendly**
- Short enough to be efficient (11-15 characters)
- No special characters that need escaping
- Perfect for Neo4j node identifiers

### 5. **Subtype-Aware for Files**
Schema files, services, controllers, etc. are clearly distinguishable:
```cypher
// Find all schema files
MATCH (f) WHERE f.id STARTS WITH 'fil-schema-'
RETURN f

// Find all service files
MATCH (f) WHERE f.id STARTS WITH 'fil-service-'
RETURN f

// Find all files with custom "xyz" subtype
MATCH (f) WHERE f.id STARTS WITH 'fil-xyz-'
RETURN f
```

## Neo4j Query Examples

### Find Elements by Type

```cypher
// Find all methods
MATCH (n) WHERE n.id STARTS WITH 'met-'
RETURN n.name, n.id

// Find all classes
MATCH (n) WHERE n.id STARTS WITH 'cls-'
RETURN n.name, n.id

// Find all schema files
MATCH (n) WHERE n.id STARTS WITH 'fil-schema-'
RETURN n.name, n.id
```

### Type-Specific Queries

```cypher
// Find all methods in a specific class
MATCH (c:Class)-[:HAS_METHOD]->(m:Method)
WHERE c.id STARTS WITH 'cls-'
  AND m.id STARTS WITH 'met-'
RETURN c.name, collect(m.name) as methods

// Find all classes declared in schema files
MATCH (f:File)-[:DECLARES]->(c:Class)
WHERE f.id STARTS WITH 'fil-schema-'
RETURN f.name, c.name
```

### Relationship Tracking

```cypher
// Track which services use which schemas
MATCH (service:File)-[:IMPORTS]->(schema:File)
WHERE service.id STARTS WITH 'fil-service-'
  AND schema.id STARTS WITH 'fil-schema-'
RETURN service.name, collect(schema.name) as schemas_used
```

## Implementation Details

### Hash Generation

IDs are generated using SHA-256 hashing of:
- **File**: `relativePath`
- **Class**: `relativePath:className`
- **Method**: `relativePath:className.methodName`
- **Function**: `relativePath:functionName`
- **Property**: `relativePath:className.propertyName`
- **Parameter**: `relativePath:parentId:paramName`
- **Variable**: `relativePath:variableName`
- etc.

This ensures:
- Deterministic ID generation
- Context-aware uniqueness
- Rebuild stability

### Code Example

```typescript
import * as IdGen from "./utils/id-generator";

// Generate file ID with subtype
const fileId = IdGen.generateFileId("src/user.schema.ts", "schema");
// Result: "fil-schema-a3f2c1d8"

// Generate class ID
const classId = IdGen.generateClassId("UserService", "src/user.service.ts");
// Result: "cls-e9f3a2b4"

// Generate method ID
const methodId = IdGen.generateMethodId("UserService", "create", "src/user.service.ts");
// Result: "met-d4c2b1a5"
```

## Migration Notes

If you have existing data with old ID formats (`file:path`, `class:Name`, etc.), you'll need to:

1. Re-run the parser to generate the new IDs
2. Update any hardcoded ID references in queries
3. Update any external systems that reference these IDs

The new system is backward-incompatible by design for improved consistency and usability.
