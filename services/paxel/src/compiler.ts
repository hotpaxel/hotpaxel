import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { execa } from 'execa';
import { CONFIG } from './config';
import { AssetManager, Asset } from './asset-manager';

export class CompileError extends Error {
    constructor(message: string, public log?: string) {
        super(message);
        this.name = 'CompileError';
    }
}

export class Job {
    id: string;
    sandboxPath: string;
    texContent: string;
    assets: Asset[];

    constructor(texContent: string, assets: Asset[] = []) {
        this.id = uuidv4();
        this.sandboxPath = path.join('/tmp/paxel', this.id);
        this.texContent = texContent;
        this.assets = assets;
    }

    async run(): Promise<string> {
        try {
            // 1. Setup Sandbox
            await fs.ensureDir(this.sandboxPath);

            // 2. Write TeX File
            const inputPath = path.join(this.sandboxPath, 'input.tex');
            await fs.writeFile(inputPath, this.texContent);

            // 3. Download Assets
            if (CONFIG.ENABLE_ASSETS && this.assets.length > 0) {
                await AssetManager.downloadAssets(this.assets, this.sandboxPath);
            }

            // 4. Run XeLaTeX securely
            // Flags safety check:
            // -no-shell-escape: Disable \write18 and system commands
            // -interaction=nonstopmode: Don't stop for user input
            // -halt-on-error: Exit non-zero on error
            // -file-line-error: Better error format like "file.tex:10: Error"
            // -output-directory: Keep output in sandbox
            try {
                await execa('xelatex', [
                    '-no-shell-escape',
                    '-interaction=nonstopmode',
                    '-halt-on-error',
                    '-file-line-error',
                    '-output-directory', this.sandboxPath,
                    'input.tex'
                ], {
                    timeout: CONFIG.JOB_TIMEOUT_MS,
                    cwd: this.sandboxPath,
                    // user: 'node', // Removed to avoid build error and runtime issues if user doesn't exist
                });
            } catch (err: any) {
                // Handle Timeout specifically
                if (err.timedOut) {
                    throw new Error('Compilation timed out');
                }

                // Read log for summary if possible
                let logSummary = 'Compilation failed';
                const logPath = path.join(this.sandboxPath, 'input.log');
                if (await fs.pathExists(logPath)) {
                    const logContent = await fs.readFile(logPath, 'utf8');
                    // Extract first error line
                    const errorLine = logContent.split('\n').find(l => l.includes('!') || l.includes('Error:'));
                    if (errorLine) logSummary = errorLine.trim();
                }

                throw new CompileError(logSummary);
            }

            // 5. Verify Output
            const pdfPath = path.join(this.sandboxPath, 'input.pdf');
            if (!await fs.pathExists(pdfPath)) {
                throw new CompileError('PDF file was not generated');
            }

            return pdfPath;

        } catch (err) {
            // Cleanup happens in finally usually, but if we need to return errors, we throw.
            throw err;
        }
        // Cleanup is managed by the caller (Server) to allow streaming the file before deleting it?
        // OR we clean up AFTER the stream is finished.
        // Actually, Job should probably expose a cleanup method.
    }

    async cleanup() {
        // Force delete sandbox
        try {
            await fs.remove(this.sandboxPath);
        } catch (e) {
            console.error(`Failed to cleanup job ${this.id}`, e);
        }
    }
}
