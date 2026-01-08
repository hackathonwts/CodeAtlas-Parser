import { downloadGitRepository } from './index';

/**
 * Simple test to verify the Git manager functionality
 */
async function testGitManager() {
    console.log('🧪 Testing Git Manager Module\n');

    // URL generation test removed as function was deleted by user

    // Test 2: Download and extract (small repository for quick test)
    console.log('Test 2: Download and Extract');
    console.log('Downloading a small test repository...');

    const result = await downloadGitRepository({
        downloadUrl: 'https://github.com/octocat/Hello-World/archive/refs/heads/master.zip',
        projectName: 'test_repo'
    });

    if (result.success) {
        console.log('✓ Download and extraction successful!');
        console.log('  Extracted to:', result.extractedPath);
    } else {
        console.error('✗ Download failed:', result.message);
        if (result.error) {
            console.error('  Error details:', result.error);
        }
    }
}

// Run the test
testGitManager().catch(console.error);
