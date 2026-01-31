import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetManager, AssetSecurityError } from '../src/asset-manager';
import { CONFIG } from '../src/config';

describe('AssetManager Security', () => {
    beforeEach(() => {
        CONFIG.ENABLE_ASSETS = true;
        vi.restoreAllMocks();
    });

    it('blocks HTTP URLs (Force HTTPS)', async () => {
        const assets = [{ name: 'test.png', url: 'http://example.com/test.png' }];
        await expect(AssetManager.downloadAssets(assets, '/tmp')).rejects.toThrow('Only HTTPS assets are allowed');
    });

    it('blocks Private IPs (SSRF)', async () => {
        const assets = [{ name: 'test.png', url: 'https://127.0.0.1/test.png' }];
        await expect(AssetManager.downloadAssets(assets, '/tmp')).rejects.toThrow('Private IP ranges are not allowed');
    });

    it('blocks Localhost', async () => {
        const assets = [{ name: 'test.png', url: 'https://localhost/test.png' }];
        await expect(AssetManager.downloadAssets(assets, '/tmp')).rejects.toThrow('Private IP ranges are not allowed');
    });

    it('sanitizes filenames', async () => {
        const assets = [{ name: '../../etc/passwd', url: 'https://example.com/bad.png' }];
        // The sanitizer regex [^a-zA-Z0-9._-] removes slashes, so it becomes 'etcpasswd' or similar, 
        // OR it throws if the result is empty/dot.
        // Our implementation throws "Invalid asset filename" if it has .. or result is different from original?
        // Let's check implementation: 
        // const safeName = path.basename(asset.name).replace...
        // if (safeName !== asset.name) throw...
        await expect(AssetManager.downloadAssets(assets, '/tmp')).rejects.toThrow('Invalid asset filename');
    });

    it('disallows assets when disabled via config', async () => {
        CONFIG.ENABLE_ASSETS = false;
        const assets = [{ name: 'ok.png', url: 'https://example.com/ok.png' }];
        await expect(AssetManager.downloadAssets(assets, '/tmp')).rejects.toThrow('disabled by configuration');
    });
});
