# Git Manager Module

This module provides functionality to clone Git repositories using **simple-git** with HTTP authentication (username and password).

## Features

- ✅ Clone Git repositories via HTTP/HTTPS
- ✅ **Username and password authentication**
- ✅ Support for private repositories
- ✅ Custom target directory paths (no forced subdirectory structure)
- ✅ Optional branch selection
- ✅ Automatic directory creation and cleanup
- ✅ Comprehensive error handling
- ✅ TypeScript support with full type definitions
- ✅ Credential encoding for special characters

## Installation

Install the required dependency:

```bash
npm install simple-git
```

## Usage

### Basic Usage - Clone with Authentication

```typescript
import { cloneGitRepository } from './gitManager';

const result = await cloneGitRepository({
  gitUrl: 'https://github.com/user/repo.git',
  username: 'your-username',
  password: 'your-password-or-token',
  targetPath: '/absolute/path/to/clone/location'
});

if (result.success) {
  console.log('Cloned to:', result.clonedPath);
}
```

### Clone Specific Branch

```typescript
import { cloneGitRepository } from './gitManager';

const result = await cloneGitRepository({
  gitUrl: 'https://gitlab.com/user/repo.git',
  username: 'your-username',
  password: 'your-token',
  targetPath: './my-project',
  branch: 'develop' // Optional: clone specific branch
});

if (result.success) {
  console.log('Cloned to:', result.clonedPath);
}
```

### Using Personal Access Tokens

For **GitHub**, **GitLab**, or other Git providers, you can use Personal Access Tokens as the password:

```typescript
const result = await cloneGitRepository({
  gitUrl: 'https://github.com/user/private-repo.git',
  username: 'your-username',
  password: process.env.GITHUB_TOKEN, // Personal Access Token
  targetPath: './cloned-repo'
});
```

**Creating Personal Access Tokens:**
- **GitHub**: Settings → Developer settings → Personal access tokens → Generate token with `repo` scope
- **GitLab**: Settings → Access Tokens → Create token with `read_repository` scope
- **Bitbucket**: Personal settings → App passwords → Create app password with repository read permission

## API Reference

### `cloneGitRepository(config: GitCloneConfig): Promise<GitCloneResult>`

Clones a Git repository using HTTP authentication with username and password.

**Parameters:**
- `config.gitUrl` - The Git repository URL (HTTP/HTTPS), e.g., `https://github.com/user/repo.git`
- `config.username` - Username for authentication (stored as string)
- `config.password` - Password or Personal Access Token for authentication (stored as string)
- `config.targetPath` - Absolute or relative path where the repository will be cloned
- `config.branch` - (Optional) Branch to clone, defaults to repository's default branch

**Returns:** Promise<GitCloneResult>
- `success` - Boolean indicating if the clone was successful
- `message` - Descriptive message about the operation
- `clonedPath` - Absolute path where the repository was cloned (if successful)
- `error` - Error object (if failed)

### Interface: `GitCloneConfig`

```typescript
interface GitCloneConfig {
  gitUrl: string;
  username: string;
  password: string;
  targetPath: string;
  branch?: string;
}
```

### Interface: `GitCloneResult`

```typescript
interface GitCloneResult {
  success: boolean;
  message: string;
  clonedPath?: string;
  error?: Error;
}
```

## How It Works

1. **Credential Embedding**: The username and password are URL-encoded and embedded directly into the Git URL (e.g., `https://username:password@github.com/user/repo.git`)
2. **Simple-Git**: Uses the `simple-git` library to perform the actual Git clone operation
3. **Cleanup**: If the clone fails, any partial clone is automatically removed
4. **Directory Management**: Creates parent directories as needed and removes existing directories before cloning

## Error Handling

The module includes comprehensive error handling for:

- Invalid Git URLs
- Authentication failures
- Network connectivity issues
- File system errors
- Partial clone cleanup

All functions return a `GitCloneResult` with:
- `success` boolean
- Descriptive `message`
- `error` object (when applicable)

## Security Notes

⚠️ **Important**: Credentials are embedded in the Git URL. While they are URL-encoded, ensure you:
- Use Personal Access Tokens instead of passwords when possible
- Store credentials securely (e.g., environment variables, secret management systems)
- Never commit credentials to version control
- Revoke tokens after use if they're temporary

## Example

```typescript
import { cloneGitRepository } from './gitManager';

async function cloneMyRepo() {
  const result = await cloneGitRepository({
    gitUrl: 'https://github.com/myuser/myrepo.git',
    username: 'myuser',
    password: 'ghp_myPersonalAccessToken123',
    targetPath: '/home/user/projects/myrepo',
    branch: 'main'
  });

  if (result.success) {
    console.log(`✓ Repository cloned to: ${result.clonedPath}`);
  } else {
    console.error(`✗ Clone failed: ${result.message}`);
  }
}

cloneMyRepo();
```
