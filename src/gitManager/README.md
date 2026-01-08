# Git Manager Module

This module provides functionality to download Git repositories as zip files and extract them to local directories using **axios** for downloading and **adm-zip** for extraction.

## Features

- ✅ Download Git repositories from any zip URL
- ✅ Extract zip files to specified local directories
- ✅ GitHub-specific helper functions
- ✅ Custom project naming
- ✅ Automatic directory creation
- ✅ Comprehensive error handling
- ✅ TypeScript support with full type definitions

## Installation

The required dependencies are already installed:

```bash
npm install axios adm-zip
npm install --save-dev @types/adm-zip
```

## Usage

### Basic Usage - Direct Zip URL

```typescript
import { downloadGitRepository } from './gitManager';

const result = await downloadGitRepository({
  downloadUrl: 'https://github.com/user/repo/archive/refs/heads/main.zip',
  projectName: 'my-project' // Optional: custom folder name
});

if (result.success) {
  console.log('Extracted to:', result.extractedPath);
}
```

### GitHub Repository Download

```typescript
import { downloadGitHubRepository } from './gitManager';

const result = await downloadGitHubRepository(
  'https://github.com/nestjs/nest',
  { 
    branch: 'master',        // Optional: defaults to 'main'
    projectName: 'nestjs'    // Optional: custom folder name
  }
);
```

### Generate GitHub Zip URL

```typescript
import { getGitHubZipUrl } from './gitManager';

const url = getGitHubZipUrl('https://github.com/user/repo', 'main');
// Returns: https://github.com/user/repo/archive/refs/heads/main.zip
```

## API Reference

### `downloadGitRepository(config: GitDownloadConfig): Promise<GitDownloadResult>`

Downloads and extracts a Git repository from a zip URL.

**Parameters:**
- `config.downloadUrl` - The zip file download URL
- `config.projectName` - (Optional) Custom folder name

**Returns:** Promise with success status, message, and extracted path

### `downloadGitHubRepository(repoUrl, options?): Promise<GitDownloadResult>`

Downloads a GitHub repository with simplified configuration.

**Parameters:**
- `repoUrl` - GitHub repository URL or `user/repo` format
- `options.branch` - (Optional) Branch name, defaults to 'main'
- `options.projectName` - (Optional) Custom folder name

### `getGitHubZipUrl(repoUrl, branch?): string`

Generates a GitHub zip download URL.

**Parameters:**
- `repoUrl` - GitHub repository URL or `user/repo` format
- `branch` - (Optional) Branch name, defaults to 'main'

## Examples

See [examples.ts](./examples.ts) for complete usage examples.

## Error Handling

The module includes comprehensive error handling:

- Network timeout (60 seconds)
- Invalid URLs
- Empty zip files
- File system errors
- Extraction failures

All functions return a `GitDownloadResult` with `success` boolean and error details.
