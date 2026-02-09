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
                const xelatexArgs = [
                    '-no-shell-escape',
                    '-interaction=nonstopmode',
                    '-halt-on-error',
                    '-file-line-error',
                    '-output-directory', this.sandboxPath,
                    'input.tex'
                ];

                const runOptions = {
                    timeout: CONFIG.JOB_TIMEOUT_MS,
                    cwd: this.sandboxPath,
                };

                // Run twice for correct cross-references and page counts
                await execa('xelatex', xelatexArgs, runOptions);
                await execa('xelatex', xelatexArgs, runOptions);
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
                    const lines = logContent.split('\n');
                    // Look for common error patterns
                    // 1. ! Error message
                    // 2. filename:line: Error message
                    // 3. ! Font ... not loadable: Metric (TFM) file not found
                    // 4. kpathsea: make_tex: Invalid fontname

                    const errorRegex = /^(!\s+|.*:\d+:\s+|kpathsea:\s+|Error\s+\d+\s+.*generating\s+output)/;
                    const errorLines = lines.filter(l => errorRegex.test(l));

                    if (errorLines.length > 0) {
                        // Return the first few errors to avoid overwhelming, but give enough context
                        // We also want to capture "Missed font" messages which might not start with !
                        // actually, XeLaTeX often prints specific font errors clearly.

                        // Let's try to find the *first* error and show its context.
                        const firstErrorIdx = lines.findIndex(l => errorRegex.test(l));
                        if (firstErrorIdx !== -1) {
                            // Capture up to 5 lines of context or until the next error
                            logSummary = lines.slice(firstErrorIdx, firstErrorIdx + 5).join('\n');
                        }
                    } else {
                        // Fallback: check for "Emergency stop" or "Fatal error"
                        const fatalIdx = lines.findIndex(l => l.includes('Emergency stop') || l.includes('Fatal error'));
                        if (fatalIdx !== -1) {
                            logSummary = lines.slice(Math.max(0, fatalIdx - 2), fatalIdx + 2).join('\n');
                        }
                    }

                    // Log the full error to the server console for debugging (Internal)
                    console.error('XeLaTeX Error Log Output:\n', logContent);
                } else {
                    console.error('XeLaTeX failed but no log file was found. Stderr:', err.stderr);
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
