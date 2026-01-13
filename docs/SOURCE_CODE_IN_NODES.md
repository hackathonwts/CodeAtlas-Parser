# Source Code Storage in Leaf Nodes

## Overview

Leaf nodes (the smallest code components) now store their full source code in stringified format. Container nodes (files, classes, interfaces, enums) do NOT store source code.

## What is Stored

### ✅ Leaf Nodes WITH Source Code

| Node Type | What's Stored | Example |
|-----------|--------------|---------|
| **Method** | Full method implementation | `async findUser(id: string) { return this.repo.findById(id); }` |
| **Function** | Full function implementation | `export function formatDate(date: Date) { return date.toISOString(); }` |
| **Property** | Property declaration with initializer | `private readonly userRepo: UserRepository;` |
| **Variable** | Variable declaration with value | `const MAX_RETRIES = 3;` |
| **Parameter** | Parameter declaration | `id: string` |
| **Type Alias** | Full type definition | `type UserRole = 'admin' \| 'user' \| 'guest';` |
| **Enum Member** | Enum value declaration | `ADMIN = 'admin'` |

### ❌ Container Nodes WITHOUT Source Code

| Node Type | Reason |
|-----------|--------|
| **File** | Too large, contains many components |
| **Class** | Contains multiple members, use member source code instead |
| **Interface** | Definition is just the structure, individual properties have their signatures |
| **Enum** | Container for enum members, use member source code instead |

## Data Structure

### Example: Method Node
```json
{
  "id": "met-d4c2b1a5",
  "kind": "Method",
  "name": "findUser",
  "parentId": "cls-e9f3a2b4",
  "filePath": "src/modules/user/user.service.ts",
  "meta": {
    "isAsync": true,
    "isStatic": false,
    "visibility": "public",
    "returnType": "Promise<User>",
    "parameters": [
      { "name": "id", "type": "string" }
    ],
    "sourceCode": "async findUser(id: string): Promise<User> {\n    return await this.userRepository.findById(id);\n  }"
  }
}
```

### Example: Property Node
```json
{
  "id": "prp-75e1d9c2",
  "kind": "Property",
  "name": "userRepository",
  "parentId": "cls-e9f3a2b4",
  "meta": {
    "type": "UserRepository",
    "isStatic": false,
    "visibility": "private",
    "sourceCode": "private readonly userRepository: UserRepository"
  }
}
```

### Example: Variable Node
```json
{
  "id": "var-53c9b7a0",
  "kind": "Variable",
  "name": "MAX_RETRIES",
  "filePath": "src/config/constants.ts",
  "meta": {
    "isExported": true,
    "type": "number",
    "declarationType": "const",
    "sourceCode": "MAX_RETRIES = 3"
  }
}
```

### Example: Type Alias Node
```json
{
  "id": "typ-86f2e0d3",
  "kind": "TypeAlias",
  "name": "UserRole",
  "filePath": "src/types/user.types.ts",
  "meta": {
    "isExported": true,
    "definition": "'admin' | 'user' | 'guest'",
    "sourceCode": "type UserRole = 'admin' | 'user' | 'guest';"
  }
}
```

## Use Cases

### 1. Code Search
```cypher
// Find all methods that use 'await'
MATCH (m:Method)
WHERE m.meta.sourceCode CONTAINS 'await'
RETURN m.name, m.meta.sourceCode

// Find all variables initialized with specific value
MATCH (v:Variable)
WHERE v.meta.sourceCode CONTAINS '= 3'
RETURN v.name, v.meta.sourceCode
```

### 2. Implementation Analysis
```cypher
// Find methods using try-catch
MATCH (m:Method)
WHERE m.meta.sourceCode CONTAINS 'try {' 
  AND m.meta.sourceCode CONTAINS 'catch'
RETURN m.name, m.filePath

// Find async methods
MATCH (m:Method)
WHERE m.meta.sourceCode STARTS WITH 'async'
RETURN m.name, m.meta.sourceCode
```

### 3. Pattern Detection
```cypher
// Find all methods that throw errors
MATCH (m:Method)
WHERE m.meta.sourceCode CONTAINS 'throw new'
RETURN m.name, m.meta.sourceCode

// Find type guards (functions using 'is' return type)
MATCH (f:Function)
WHERE f.meta.sourceCode CONTAINS ' is '
RETURN f.name, f.meta.sourceCode
```

### 4. Code Documentation
```cypher
// Extract all exported utility functions with their implementation
MATCH (f:Function)
WHERE f.meta.isExported = true
  AND f.filePath CONTAINS 'utils/'
RETURN f.name, f.meta.returnType, f.meta.sourceCode
```

### 5. Refactoring Analysis
```cypher
// Find all places a specific API is called
MATCH (n)
WHERE n.meta.sourceCode IS NOT NULL
  AND n.meta.sourceCode CONTAINS 'oldApi.method'
RETURN labels(n)[0] as type, n.name, n.filePath, n.meta.sourceCode

// Find duplicate implementations
MATCH (m1:Method), (m2:Method)
WHERE m1.meta.sourceCode = m2.meta.sourceCode
  AND m1.id < m2.id
RETURN m1.name, m1.filePath, m2.name, m2.filePath
```

## Benefits

### 1. **Complete Context**
- See actual implementation, not just signatures
- Understand business logic from the graph
- No need to open source files for quick checks

### 2. **Advanced Queries**
- Search by implementation patterns
- Find similar code blocks
- Detect anti-patterns

### 3. **Documentation**
- Auto-generate code examples
- Extract actual usage patterns
- Show real implementations

### 4. **Code Quality Analysis**
- Find long methods (by sourceCode length)
- Detect complex logic patterns
- Identify code smells

### 5. **Differential Analysis**
- Compare implementations over time
- Track method evolution
- Find breaking changes

## Neo4j Storage Considerations

### Storage Impact
Storing source code increases database size. Estimates:

- **Small project** (100 files): +5-10 MB
- **Medium project** (500 files): +20-50 MB
- **Large project** (2000+ files): +100-200 MB

### Optimization Tips

1. **Index for Search**:
   ```cypher
   CREATE FULLTEXT INDEX methodSourceCode FOR (m:Method) ON EACH [m.meta.sourceCode]
   ```

2. **Query Efficiently**:
   ```cypher
   // Good - specific query
   MATCH (m:Method {name: 'findUser'})
   RETURN m.meta.sourceCode
   
   // Avoid - scanning all source code
   MATCH (m:Method)
   WHERE m.meta.sourceCode CONTAINS 'x'  // Slow on large datasets
   ```

3. **Use LIMIT**:
   ```cypher
   MATCH (m:Method)
   WHERE m.meta.sourceCode CONTAINS 'pattern'
   RETURN m.name, m.meta.sourceCode
   LIMIT 50  // Always limit large result sets
   ```

## Implementation Details

### Source Code Extraction
Using `ts-morph`'s `.getText()` method:

```typescript
// Method
method.getText()  
// Returns: "async findUser(id: string) { ... }"

// Property
prop.getText()
// Returns: "private readonly userRepo: UserRepository;"

// Variable
varDecl.getText()
// Returns: "MAX_RETRIES = 3"
```

### Formatting
- **Preserved**: Original indentation and whitespace
- **Includes**: Comments within the node
- **Excludes**: Surrounding context (other class members)

## Future Enhancements

### Possible Additions
1. **AST representation**: Store parsed AST for deeper analysis
2. **Minified version**: Remove whitespace to save space
3. **Hash**: Add content hash for change detection
4. **Line numbers**: Store start/end line numbers
5. **Dependencies**: Extract imported symbols from source code

## Example Queries by Use Case

### Security Analysis
```cypher
// Find SQL queries (potential injection points)
MATCH (n)
WHERE n.meta.sourceCode CONTAINS 'SELECT'
  OR n.meta.sourceCode CONTAINS 'INSERT'
RETURN labels(n)[0], n.name, n.filePath
```

### Performance Analysis
```cypher
// Find synchronous database calls (blocking)
MATCH (m:Method)
WHERE m.meta.sourceCode CONTAINS '.find('
  AND NOT m.meta.sourceCode CONTAINS 'await'
RETURN m.name, m.filePath, m.meta.sourceCode
```

### API Changes
```cypher
// Find all calls to deprecated API
MATCH (n)
WHERE n.meta.sourceCode CONTAINS '@deprecated'
  OR n.meta.sourceCode CONTAINS 'legacyMethod'
RETURN n.name, n.filePath
```

### Testing Coverage
```cypher
// Find functions without error handling
MATCH (f:Function)
WHERE NOT f.meta.sourceCode CONTAINS 'try'
  AND NOT f.meta.sourceCode CONTAINS 'catch'
  AND f.meta.sourceCode CONTAINS 'await'
RETURN f.name, f.filePath
```

## Summary

✅ **Leaf nodes** (methods, functions, properties, variables, etc.) now contain full source code
❌ **Container nodes** (files, classes, interfaces, enums) remain lightweight
🔍 **Enables** advanced code search, pattern detection, and analysis queries
💾 **Storage** impact is moderate and manageable
🚀 **Benefits** far outweigh the storage cost for most use cases
