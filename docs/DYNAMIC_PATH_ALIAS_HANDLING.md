# Dynamic TypeScript Path Alias Handling

## How It Works

The CodeAtlas Parser **automatically handles ALL path aliases** defined in the target project's `tsconfig.json` - no configuration needed!

## Technical Implementation

### 1. Project Initialization

When the parser runs, it initializes a `ts-morph` Project with the target project's `tsconfig.json`:

```typescript
// src/parser.ts
const project = new Project({
    tsConfigFilePath: projectPath + "/tsconfig.json",  // ← Reads target project's config
    skipAddingFilesFromTsConfig: false,
});
```

This tells `ts-morph` to:
- ✅ Read the `tsconfig.json` from the **project being analyzed**
- ✅ Load all compiler options including `paths` mappings
- ✅ Use TypeScript's full module resolution algorithm

### 2. Module Resolution

When extracting imports, the code uses:

```typescript
// src/utils/extract-imports.ts
const importedFile = importDecl.getModuleSpecifierSourceFile();
```

This leverages TypeScript's module resolution which automatically:
- ✅ Resolves path aliases using the `paths` config
- ✅ Handles `baseUrl` setting
- ✅ Resolves barrel exports (index.ts files)
- ✅ Follows complex mapping rules

## Supported Path Aliases

**Any** path alias defined in `tsconfig.json` is automatically supported!

### Example Configuration

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@helpers/*": ["src/helpers/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@auth/*": ["src/auth/*"],
      "@config/*": ["src/config/*"],
      "@root/*": ["src/*"],
      "@custom/*": ["src/my/custom/path/*"],    // ← Works automatically!
      "@new-alias/*": ["src/another/path/*"]    // ← Works automatically!
    }
  }
}
```

### Real Import Examples

All of these are resolved automatically:

```typescript
// Standard aliases
import { BaseRepository } from '@common/bases/base.repository';
import { UserService } from '@modules/user/user.service';
import { AuthGuard } from '@auth/guards/auth.guard';
import { ConfigService } from '@config/config.service';
import { Logger } from '@root/logger';

// Custom/new aliases - work immediately after adding to tsconfig.json!
import { CustomHelper } from '@custom/helpers/custom.helper';
import { NewFeature } from '@new-alias/features/new-feature';

// Barrel exports
import { UserDto, CreateUserDto } from '@modules/user/dto';  // ← Resolves to dto/index.ts

// Nested paths
import { AdvancedService } from '@modules/user/services/advanced/advanced.service';
```

## Adding New Path Aliases

### Steps to Add

1. **Update tsconfig.json** in your project:
   ```json
   {
     "paths": {
       "@new/*": ["src/new-folder/*"]
     }
   }
   ```

2. **No parser changes needed!** Just re-run:
   ```bash
   npm run build  # In parser project
   node dist/main.js  # Parser automatically picks up new alias
   ```

3. The parser will **automatically resolve** imports using `@new/*`

### It Just Works™

The parser code never hardcodes path aliases. Everything is dynamically read from the target project's `tsconfig.json`.

## Verification

### Check if Path Alias Resolution Works

Run this test in your Neo4j database after parsing:

```cypher
// 1. Find all imports using specific alias prefix
MATCH (f:File)-[:IMPORTS]->(imported:File)
WHERE imported.filePath CONTAINS 'common/bases'
RETURN f.name as importer, 
       imported.name as imported_file,
       imported.filePath as path
ORDER BY f.name

// 2. Check if BaseRepository shows dependents
MATCH (target:Class {name: 'BaseRepository'})<-[:DEPENDS_ON]-(source:Class)
RETURN source.name as dependent_class, count(*) as count

// 3. Verify all alias types are working
MATCH (f:File)-[:IMPORTS]->(imported:File)
WHERE imported.filePath =~ '^src/(helpers|modules|common|auth|config)/.*'
WITH substring(imported.filePath, 4, 
     case when imported.filePath contains '/' 
     then indexOf(substring(imported.filePath,4), '/')
     else length(imported.filePath) end) as folder
RETURN folder, count(*) as import_count
ORDER BY import_count DESC
```

## Under the Hood

### TypeScript's Module Resolution Algorithm

`ts-morph` uses TypeScript's own module resolution which:

1. **Checks path mappings**: Looks for matching patterns in `paths`
2. **Applies baseUrl**: Resolves relative to `baseUrl`
3. **Falls back**: If no mapping, tries standard resolution
4. **Extension resolution**: Tries `.ts`, `.tsx`, `.d.ts`, etc.
5. **Index resolution**: Tries `index.ts` for directories

### Example Resolution Flow

For `import { X } from '@common/bases/base.repository'`:

1. **Read tsconfig.json** → Find `"@common/*": ["src/common/*"]`
2. **Pattern match** → `@common/bases/base.repository` matches `@common/*`
3. **Replace** → `src/common/` + `bases/base.repository`
4. **Resolve** → `src/common/bases/base.repository.ts`
5. **Return** → SourceFile object pointing to resolved file

## Edge Cases Handled

### 1. Multiple Mappings
```json
{
  "paths": {
    "@shared/*": ["src/shared/*", "lib/shared/*"]  // Tries in order
  }
}
```
✅ Tries `src/shared/*` first, then `lib/shared/*`

### 2. Barrel Exports
```typescript
import { UserDto } from '@modules/user/dto';
```
✅ Resolves to `src/modules/user/dto/index.ts`

### 3. Wildcards
```json
{
  "paths": {
    "*": ["src/*", "lib/*"]  // Catch-all
  }
}
```
✅ Resolves any import through these paths

### 4. Exact Matches
```json
{
  "paths": {
    "jquery": ["node_modules/jquery/dist/jquery"]  // Exact module
  }
}
```
✅ Handles specific module redirects

## Troubleshooting

### If Imports Not Resolving

1. **Check tsconfig.json exists**:
   ```bash
   ls -la /path/to/project/tsconfig.json
   ```

2. **Verify paths configuration**:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",  // Must be set for paths to work
       "paths": { ... }
       }
   }
   ```

3. **Check parser is using correct tsconfig**:
   ```typescript
   // In parser.ts - should point to target project
   tsConfigFilePath: projectPath + "/tsconfig.json"
   ```

4. **Enable debug logging** (add to parser.ts):
   ```typescript
   const project = new Project({
       tsConfigFilePath: projectPath + "/tsconfig.json",
       skipAddingFilesFromTsConfig: false,
   });
   
   console.log("✓ Loaded tsconfig from:", project.getCompilerOptions().configFilePath);
   console.log("✓ Base URL:", project.getCompilerOptions().baseUrl);
   console.log("✓ Paths:", project.getCompilerOptions().paths);
   ```

### Common Issues

**Issue**: Imports not resolving
**Fix**: Ensure `baseUrl` is set in tsconfig.json

**Issue**: Some aliases work, others don't  
**Fix**: Check for typos in path mappings, ensure trailing `/*`

**Issue**: External packages being included
**Fix**: This is correct behavior if they're mapped in `paths`. The parser filters them out by checking if resolved file is in `src/`

## Benefits

### 1. Zero Configuration
- ✅ No hardcoded alias list in parser
- ✅ Works with ANY project structure
- ✅ Automatically adapts to changes

### 2. Future-Proof
- ✅ New aliases? Just add to tsconfig.json
- ✅ Renamed aliases? Update tsconfig.json
- ✅ No parser code changes needed

### 3. Standard Compliance
- ✅ Uses TypeScript's official resolution
- ✅ Same behavior as `tsc` compiler
- ✅ Matches IDE behavior (VSCode, etc.)

## Summary

**The parser already handles all path aliases dynamically!**

When you add a new path alias:
1. Add it to your project's `tsconfig.json`
2. Re-run the parser
3. New alias is automatically resolved

No parser configuration, no code changes, no maintenance needed! 🎉
