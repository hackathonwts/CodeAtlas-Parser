import { downloadGitRepository } from './index';

/**
 * Example 1: Download a repository using direct zip URL
 */
async function example1() {
    console.log('Example 1: Direct zip URL download');

    const result = await downloadGitRepository({
        downloadUrl: 'https://gitlab.webskitters.com/node/wts_academy/-/archive/prod/wts_academy-prod.zip',
        projectName: 'wts_academy'
    });

    if (result.success) {
        console.log('✓ Success!');
        console.log('Extracted to:', result.extractedPath);
    } else {
        console.error('✗ Failed:', result.message);
    }
}

(async () => {
    await example1();
})();