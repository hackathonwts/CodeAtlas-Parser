# TypeScript Path Alias Resolution Fix

## Problem

Previously, the import extraction was skipping TypeScript path aliases like:
```typescript
import { BaseRepository } from '@common/bases/base.repository';
import { UserService } from '@modules/user/user.service';
```

This caused imported classes/interfaces to appear isolated in the knowledge graph with no import relationships.

## Root Cause

The old code was filtering out imports that didn't start with `.` or `/`:

```typescript
// OLD CODE - WRONG!
if (!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("/")) {
    return; // This skipped ALL path alias imports!
}
```

Path aliases (defined in `tsconfig.json` like `@common`, `@modules`, `@app`, etc.) don't start with `.` or `/`, so they were incorrectly being treated as external node_modules dependencies.

## Solution

The fix leverages `ts-morph`'s built-in module resolution which already understands the TypeScript configuration and can resolve path aliases:

```typescript
// NEW CODE - CORRECT!
// Resolve the imported file using ts-morph's module resolution
// This handles both relative imports (./file) and path aliases (@common/file)
const importedFile = importDecl.getModuleSpecifierSourceFile();

// Skip if the import couldn't be resolved (likely external node_modules)
if (!importedFile) return;

// Skip if it's outside the src directory (external dependencies)
if (srcRoot && !importedFile.getFilePath().includes(srcRoot)) {
    return;
}
```

## How It Works

1. **Module Resolution**: `getModuleSpecifierSourceFile()` uses TypeScript's module resolution algorithm to find the actual file, whether it's:
   - Relative: `'./user.service'`
   - Absolute: `'/app/user.service'`
   - Path Alias: `'@modules/user/user.service'`
   - Barrel Export: `'@common/bases'` (resolves to index.ts)

2. **Smart Filtering**: Instead of checking the import string, we check if:
   - The file was successfully resolved (not null)
   - The resolved file is within our project's `src` directory

3. **External Detection**: True external dependencies (from `node_modules`) either:
   - Won't resolve to a SourceFile (returns null)
   - Will resolve to a path outside `srcRoot`

## Examples

### Before Fix
```
# Knowledge Graph (BROKEN)
BaseRepository (isolated, no connections)
UserRepository ❌ No IMPORTS relation to BaseRepository
OrderRepository ❌ No IMPORTS relation to BaseRepository
```

### After Fix
```
# Knowledge Graph (FIXED)
BaseRepository
  ← UserRepository (IMPORTS_CLASS)
  ← OrderRepository (IMPORTS_CLASS)
  ← ProductRepository (IMPORTS_CLASS)
```

## Captured Relations

Now properly captures:
- ✅ Aliased imports: `@common/bases/base.repository`
- ✅ Barrel imports: `@common/bases` → resolves to `index.ts`
- ✅ Nested aliases: `@modules/user/services/user.service`
- ✅ Cross-module imports: Between different alias roots

## TypeScript Path Aliases Commonly Supported

The fix works with all common alias patterns:
- `@common/*` → `src/common/*`
- `@modules/*` → `src/modules/*`
- `@app/*` → `src/app/*`
- `@shared/*` → `src/shared/*`
- `@config/*` → `src/config/*`
- `@utils/*` → `src/utils/*`
- Any custom aliases defined in `tsconfig.json` paths

## Configuration Requirements

The parser must be initialized with a valid `tsconfig.json` that includes path mappings:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@common/*": ["src/common/*"],
      "@modules/*": ["src/modules/*"],
      "@app/*": ["src/app/*"]
    }
  }
}
```

The `ts-morph` Project is initialized with this config in `parser.ts`:

```typescript
const project = new Project({
    tsConfigFilePath: projectPath + "/tsconfig.json",
    skipAddingFilesFromTsConfig: false,
});
```

## Testing

To verify the fix works:

1. **Check Import Relations**:
   ```cypher
   // Neo4j: Find all files that import BaseRepository
   MATCH (f:File)-[:IMPORTS_CLASS]->(c {name: "BaseRepository"})
   RETURN f.name, c.name
   ```

2. **Check Class Dependencies**:
   ```cypher
   // Find all classes that depend on BaseRepository
   MATCH (source:Class)-[:DEPENDS_ON]->(target:Class {name: "BaseRepository"})
   RETURN source.name, target.name
   ```

3. **Verify Alias Resolution**:
   ```cypher
   // Count imports from each alias prefix
   MATCH (f:File)-[r:IMPORTS]->()
   WHERE f.filePath CONTAINS 'common'
   RETURN count(r) as commonImports
   ```

## Impact

This fix ensures that:
- ✅ All project internal imports are tracked (not just relative ones)
- ✅ Shared base classes show proper fan-in relationships
- ✅ Services using DTOs are properly connected
- ✅ Dependency graphs are complete and accurate
- ✅ Architecture patterns (repository, service, etc.) are visible

## Related Files

- **Fixed**: `src/utils/extract-imports.ts`
- **Uses**: TypeScript's module resolution via `ts-morph`
- **Requires**: Valid `tsconfig.json` with path mappings
