import path from 'path';
import fs from 'fs-extra';
import { Address6, Address4 } from 'ip-address';
import { URL } from 'url';
import { CONFIG } from './config';

export interface Asset {
    name: string;
    url: string;
}

export class AssetSecurityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AssetSecurityError';
    }
}

export class AssetManager {
    /**
     * Downloads verified assets to the sandbox.
     */
    static async downloadAssets(assets: Asset[], sandboxPath: string): Promise<void> {
        if (!assets || assets.length === 0) return;

        if (!CONFIG.ENABLE_ASSETS) {
            throw new AssetSecurityError('Assets support is disabled by configuration.');
        }

        // Process sequentially to be safe/simple, or parallel with limits if needed.
        // For now, simple sequential is safer for error handling.
        for (const asset of assets) {
            await this.downloadOne(asset, sandboxPath);
        }
    }

    private static async downloadOne(asset: Asset, sandboxPath: string): Promise<void> {
        // 1. Sanitize Filename
        const safeName = path.basename(asset.name).replace(/[^a-zA-Z0-9._-]/g, '');
        if (!safeName || safeName !== asset.name || safeName.includes('..')) {
            throw new AssetSecurityError(`Invalid asset filename: ${asset.name}`);
        }

        const destPath = path.join(sandboxPath, safeName);

        // Prevent escaping sandbox via join (redundant check if basename is strict, but good practice)
        if (!destPath.startsWith(sandboxPath)) {
            throw new AssetSecurityError('Asset path traversal detected.');
        }

        // 2. Validate URL (HTTPS only)
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(asset.url);
        } catch {
            throw new AssetSecurityError(`Invalid URL: ${asset.url}`);
        }

        if (parsedUrl.protocol !== 'https:') {
            throw new AssetSecurityError('Only HTTPS assets are allowed.');
        }

        // 3. DNS/IP Check is complex in Node without raw socket hooks or dns lookup before fetch.
        // However, `ip-address` library can check if the hostname IS an IP.
        // Real strict SSRF protection requires resolving DNS and checking IPs before connecting.
        // For Phase 3, we will rigorously rely on "no redirects" + "standard fetch" 
        // AND optional DNS check if it looks like an IP.
        // NOTE: A malicious domain could resolve to 127.0.0.1. 
        // To properly fix this, we'd need a custom agent. 
        // For now, we block obvious IP literals.
        if (this.isPrivateIp(parsedUrl.hostname)) {
            throw new AssetSecurityError('Private IP ranges are not allowed.');
        }

        // 4. Fetch with limits
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5s download timeout

            const res = await fetch(asset.url, {
                method: 'GET',
                redirect: 'error', // No redirects allowed
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!res.ok) {
                throw new AssetSecurityError(`Failed to fetch asset: ${res.statusText}`);
            }

            const contentLength = res.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) { // 2MB limit
                throw new AssetSecurityError('Asset too large (>2MB).');
            }

            // 5. Stream to file
            const buffer = await res.arrayBuffer();
            if (buffer.byteLength > 2 * 1024 * 1024) {
                throw new AssetSecurityError('Asset too large (>2MB).');
            }

            await fs.writeFile(destPath, Buffer.from(buffer));

        } catch (err: any) {
            if (err instanceof AssetSecurityError) throw err;
            throw new AssetSecurityError(`Asset download failed: ${err.message}`);
        }
    }

    private static isPrivateIp(hostname: string): boolean {
        // Check if hostname is an IP address
        if (Address4.isValid(hostname)) {
            const ip = new Address4(hostname);
            // blocked: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
            // simple string checks for Phase 3 or use range helpers
            const ranges = ['127.', '10.', '192.168.', '169.254.'];
            if (ranges.some(r => hostname.startsWith(r))) return true;
            if (hostname.startsWith('172.')) {
                const parts = hostname.split('.');
                const second = parseInt(parts[1]);
                if (second >= 16 && second <= 31) return true;
            }
            return false; // Public IP (assuming standard private ranges)
        }
        if (Address6.isValid(hostname)) {
            const ip = new Address6(hostname);
            if (ip.isLoopback()) return true;
            if (ip.isLinkLocal()) return true;
            if (ip.isUniqueLocal()) return true;
        }

        // Explicitly block "localhost"
        if (hostname === 'localhost') return true;

        return false;
    }
}
