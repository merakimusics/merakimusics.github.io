import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

/**
 * Automatically commits and pushes dist/ to GitHub Pages
 */
export async function autoDeployToGitHub() {
  try {
    // Check if git is initialized
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: ROOT_DIR });
    
    // Check if remote exists
    const { stdout: remotes } = await execAsync('git remote', { cwd: ROOT_DIR });
    if (!remotes.trim()) {
      return {
        deployed: false,
        reason: 'No git remote configured. To enable auto-deploy, run: git remote add origin https://github.com/<user>/merakimusics.github.io.git'
      };
    }

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await execAsync('git add dist', { cwd: ROOT_DIR });
    await execAsync(`git commit -m "Auto-update SEO Static Hub & Schema.org [${timestamp}]"`, { cwd: ROOT_DIR });
    await execAsync('git push', { cwd: ROOT_DIR });

    return {
      deployed: true,
      timestamp,
      message: 'Successfully deployed updated SEO hub to GitHub Pages!'
    };
  } catch (err) {
    return {
      deployed: false,
      reason: err.message
    };
  }
}
