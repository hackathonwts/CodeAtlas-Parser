# Remaining ID System Updates

## Status

✅ **Completed:**
- `src/utils/extract-structure.ts` - Fully updated to use new ID system
- `src/utils/extract-imports.ts` - Fully updated to use new ID system

⚠️ **Needs Update:**
The following files still use old ID format and need to be updated to use `IdGen` functions:

## 1. extract-method-calls.ts

**Import added:** ✅ `import * as IdGen from "./id-generator.js";`

**Lines to update:**
- Line 24: `const fromMethodId = \`method:${className}.${method.getName()}\`;`
  - **Replace with:** `const fromMethodId = IdGen.generateMethodId(className, method.getName(), relativePath);`
  
- Line 46: `const toMethodId = \`method:${targetClass.getName()}.${decl.getName()}\`;`
  - Need to get target file path first, then: `IdGen.generateMethodId(targetClass.getName(), decl.getName(), targetFilePath)`
  
- Line 60: `const toFuncId = \`function:${funcRelPath}:${decl.getName()}\`;`
  - **Replace with:** `const toFuncId = IdGen.generateFunctionId(decl.getName(), funcRelPath);`

- Line 77: `const fromFuncId = \`function:${relativePath}:${funcName}\`;`
  - **Replace with:** `const fromFuncId = IdGen.generateFunctionId(funcName, relativePath);`

- Line 95, 145, 196: Similar method ID updates
- Line 108, 209: Similar function ID updates
- Line 167-168: Class USES relationships need updating

## 2. extract-type-usage.ts

**Needs:**
1. Add import: `import * as IdGen from "./id-generator.js";`
2. Update all old ID formats:
   - `method:*` → `IdGen.generateMethodId(...)`
   - `class:*` → `IdGen.generateClassId(...)`
   - `enum:*` → `IdGen.generateEnumId(...)`
   - `interface:*` → `IdGen.generateInterfaceId(...)`
   - `function:*` → `IdGen.generateFunctionId(...)`

## 3. extract-routes.ts

**Needs:**
1. Add import: `import * as IdGen from "./id-generator.js";`
2. Update route node creation to use:  `IdGen.generateRouteId(method, path, filePath)`
3. Update method references to use: `IdGen.generateMethodId(...)`

## 4. extract-di.ts

**Needs:**
1. Add import: `import * as IdGen from "./id-generator.js";`
2. Update class ID references: `class:*` → `IdGen.generateClassId(...)`

## 5. extract-inheritance.ts

**Needs:**
1. Add import: `import * as IdGen from "./id-generator.js";`
2. Update class and interface ID references

## Common Pattern for Updates

### Before:
```typescript
const classId = `class:${className}`;
const methodId = `method:${className}.${methodName}`;
const funcId = `function:${filePath}:${funcName}`;
```

### After:
```typescript
const classId = IdGen.generateClassId(className, filePath);
const methodId = IdGen.generateMethodId(className, methodName, filePath);
const funcId = IdGen.generateFunctionId(funcName, filePath);
```

### Challenge: Cross-File References

When creating relations to nodes in OTHER files, you need the target file path:

```typescript
// Get the target file path
const targetFile = decl.getSourceFile();
const targetFilePath = srcRoot
    ? `src/${relative(srcRoot, targetFile.getFilePath()).split(sep).join("/")}`
    : targetFile.getFilePath();

// Then generate the ID
const targetId = IdGen.generateMethodId(methodName, targetFilePath);
```

## Quick Find/Replace Patterns

Use these regex patterns to find old IDs (for manual review/update):

1. **Method IDs:** `\`method:\$\{[^}]+\}\``
2. **Class IDs:** `\`class:\$\{[^}]+\}\``
3. **Function IDs:** `\`function:\$\{[^}]+\}\``
4. **Interface IDs:** `\`interface:\$\{[^}]+\}\``
5. **Enum IDs:** `\`enum:\$\{[^}]+\}\``
6. **Type IDs:** `\`type:\$\{[^}]+\}\``
7. **Variable IDs:** `\`variable:\$\{[^}]+\}\``

## Testing After Updates

1. Run `npm run build` to ensure no TypeScript errors
2. Run the parser on a test project
3. Check that:
   - All node IDs follow the new format (prefix-hash)
   - Relations reference correct IDs
   - No broken references (from/to point to existing nodes)

## Priority Order

1. **extract-method-calls.ts** - High impact (CALLS relations)
2. **extract-type-usage.ts** - High impact (DTO/Model usage)  
3. **extract-routes.ts** - Medium impact (HTTP routes)
4. **extract-di.ts** - Medium impact (DI relations)
5. **extract-inheritance.ts** - Low impact (class hierarchies)
