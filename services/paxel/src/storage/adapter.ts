import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';

export interface StorageAdapter {
    /**
     * Puts a file into storage and returns a public URL.
     * @param localFilePath The path to the file on the local disk.
     * @param filename The desired filename in storage (optional).
     */
    put(localFilePath: string, filename?: string): Promise<{ url: string }>;
}

export class LocalStorageAdapter implements StorageAdapter {
    private publicDir: string;
    private baseUrl: string;

    constructor() {
        // In a real app, this should be mapped to a static file server or nginx
        // For Local/Dev phase, we assume a 'public' folder relative to CWD is served.
        this.publicDir = path.resolve(process.cwd(), 'storage', 'public');
        this.baseUrl = 'http://localhost:' + CONFIG.PORT + '/storage';
        fs.ensureDirSync(this.publicDir);
    }

    async put(localFilePath: string, filename?: string): Promise<{ url: string }> {
        if (!CONFIG.ENABLE_LOCAL_STORAGE) {
            throw new Error('Local storage is disabled configuration.');
        }

        const name = filename || path.basename(localFilePath);
        const key = `${uuidv4()}-${name}`;
        const destPath = path.join(this.publicDir, key);

        await fs.move(localFilePath, destPath);

        return { url: `${this.baseUrl}/${key}` };
    }
}

// Factory to get configured adapter
export function getStorageAdapter(): StorageAdapter | null {
    if (CONFIG.ENABLE_LOCAL_STORAGE) {
        return new LocalStorageAdapter();
    }
    return null;
}
