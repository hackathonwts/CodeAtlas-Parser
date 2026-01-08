import { cloneGitRepository } from './index';

/**
 * Example: Clone a public repository with username and password
 */
async function exampleClonePublicRepo() {
    const result = await cloneGitRepository({
        gitUrl: 'https://github.com/torvalds/linux.git',
        username: 'user-name',
        password: 'password',
        projectName: 'linux-kernel'
    });

    if (result.success) {
        console.log(`✓ Success: ${result.message}`);
        console.log(`  Cloned to: ${result.clonedPath}`);
    } else {
        console.error(`✗ Failed: ${result.message}`);
        if (result.error) {
            console.error(`  Error: ${result.error.message}`);
        }
    }
}

/**
 * Example: Clone a specific branch with authentication
 */
async function exampleCloneSpecificBranch() {
    const result = await cloneGitRepository({
        gitUrl: 'https://github.com/torvalds/linux.git',
        username: 'user-name',
        password: 'password',
        projectName: 'linux-kernel',
        branch: 'development' // Clone the develop branch
    });

    if (result.success) {
        console.log(`✓ Cloned branch 'develop' to: ${result.clonedPath}`);
    } else {
        console.error(`✗ Clone failed: ${result.message}`);
    }
}

/**
 * Example: Clone with credentials stored as strings
 */
async function exampleWithStoredCredentials() {
    // Store credentials as strings
    const gitLink = 'https://github.com/torvalds/linux.git';
    const username = 'myuser';
    const password = 'password';

    const result = await cloneGitRepository({
        gitUrl: gitLink,
        username: username,
        password: password,
        projectName: 'linux-kernel'
    });

    if (result.success) {
        console.log('Repository cloned successfully!');
    }
}


// Uncomment to run examples:
// exampleClonePublicRepo();
exampleCloneSpecificBranch();
// exampleWithStoredCredentials();
