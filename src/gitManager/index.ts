import axios from 'axios';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';

const PROJECTS_DIR = path.resolve(process.cwd(), 'projects');

/**
 * Configuration for downloading Git repository
 */
export interface GitDownloadConfig {
    /** The download URL for the Git repository (zip format) */
    downloadUrl: string;
    /** Optional: The name of the project folder (defaults to extracted folder name) */
    projectName?: string;
}

/**
 * Result of the Git download operation
 */
export interface GitDownloadResult {
    success: boolean;
    message: string;
    extractedPath?: string;
    error?: Error;
}

/**
 * Downloads a Git repository as a zip file and extracts it to a local directory
 * 
 * @param config - Configuration object containing download URL and target directory
 * @returns Promise with the result of the download and extraction operation
 * 
 * @example
 * ```typescript
 * const result = await downloadGitRepository({
 *   downloadUrl: 'https://github.com/user/repo/archive/refs/heads/main.zip',
 *   targetDirectory: './projects',
 *   projectName: 'my-project'
 * });
 * 
 * if (result.success) {
 *   console.log('Extracted to:', result.extractedPath);
 * }
 * ```
 */
export async function downloadGitRepository(
    config: GitDownloadConfig
): Promise<GitDownloadResult> {
    const { downloadUrl, projectName } = config;

    try {
        // Ensure projects directory exists
        if (!fs.existsSync(PROJECTS_DIR)) {
            fs.mkdirSync(PROJECTS_DIR, { recursive: true });
        }

        console.log(`Downloading repository from: ${downloadUrl}`);

        // Download the zip file using axios
        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 60000, // 60 seconds timeout
            headers: {
                'User-Agent': 'CodeAtlas-Parser',
            },
        });

        // Create a temporary path for the zip file
        const tempZipPath = path.join(PROJECTS_DIR, 'temp_download.zip');

        // Write the downloaded content to a temporary zip file
        fs.writeFileSync(tempZipPath, response.data);

        console.log('Download complete. Extracting...');

        // Extract the zip file using adm-zip
        const zip = new AdmZip(tempZipPath);
        const zipEntries = zip.getEntries();

        if (zipEntries.length === 0) {
            throw new Error('The downloaded zip file is empty');
        }

        // Determine the extraction path
        let extractPath: string;

        if (projectName) {
            // If project name is specified, extract directly to that folder
            extractPath = path.join(PROJECTS_DIR, projectName);

            // Remove existing directory if it exists
            if (fs.existsSync(extractPath)) {
                fs.rmSync(extractPath, { recursive: true, force: true });
            }

            // Extract all files
            zip.extractAllTo(PROJECTS_DIR, true);

            // Get the name of the extracted folder (usually repo-name-branch)
            const extractedFolderName = zipEntries[0].entryName.split('/')[0];
            const tempExtractPath = path.join(PROJECTS_DIR, extractedFolderName);

            // Rename to the desired project name
            if (tempExtractPath !== extractPath) {
                fs.renameSync(tempExtractPath, extractPath);
            }
        } else {
            // Extract with the default folder name from the zip
            zip.extractAllTo(PROJECTS_DIR, true);
            const extractedFolderName = zipEntries[0].entryName.split('/')[0];
            extractPath = path.join(PROJECTS_DIR, extractedFolderName);
        }

        // Clean up the temporary zip file
        fs.unlinkSync(tempZipPath);

        console.log(`✓ Repository extracted successfully to: ${extractPath}`);

        return {
            success: true,
            message: 'Repository downloaded and extracted successfully',
            extractedPath: extractPath,
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error downloading/extracting repository:', errorMessage);

        return {
            success: false,
            message: `Failed to download/extract repository: ${errorMessage}`,
            error: error instanceof Error ? error : new Error(errorMessage),
        };
    }
}
