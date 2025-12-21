import typescriptEslintEslintPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["eslint.config.mjs", "**/schemas/**", "**/dto/**", "**/*.e2e-spec.ts"],
}, ...compat.extends("plugin:@typescript-eslint/recommended"), {
    plugins: {
        "@typescript-eslint": typescriptEslintEslintPlugin,
    },

    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.jest,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            project: "tsconfig.json",
            tsconfigRootDir: __dirname,
        },
    },

    rules: {
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "no-trailing-spaces": "error",
        "quotes": ["error", "single"], // For single quotes
        // "quotes": ["error", "double", { allowTemplateLiterals: true, avoidEscape: true }], // For double quotes
        
        // Bracket placement rules
        "brace-style": ["error", "1tbs", { "allowSingleLine": true }], // Opening brace on same line
        "object-curly-spacing": ["error", "always"], // Spacing inside object braces
        "array-bracket-spacing": ["error", "never"], // No spacing inside array brackets
        
        // Line length and wrapping rules
        "max-len": ["error", { 
            "code": 500, 
            "ignoreUrls": true, 
            "ignoreStrings": true, 
            "ignoreTemplateLiterals": true,
            "ignoreComments": true
        }],
        "object-curly-newline": ["error", { 
            "ObjectExpression": { "multiline": true, "consistent": true },
            "ObjectPattern": { "multiline": true, "consistent": true },
            "ImportDeclaration": { "multiline": true, "consistent": true },
            "ExportDeclaration": { "multiline": true, "consistent": true }
        }],
        
        // Function and control structure formatting
        "function-paren-newline": ["error", "consistent"],
        "keyword-spacing": ["error", { "before": true, "after": true }],
        "space-before-blocks": ["error", "always"],
        "space-before-function-paren": ["error", { 
            "anonymous": "always", 
            "named": "never", 
            "asyncArrow": "always" 
        }],
        
        // Semicolon and comma rules
        "semi": ["error", "always"],
        "comma-dangle": ["error", "never"],
        "comma-spacing": ["error", { "before": false, "after": true }]
    },
}];