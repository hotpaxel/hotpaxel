import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import { app } from '../src/index';

// Mock Execa
const execaMock = vi.fn();
vi.mock('execa', () => ({
    execa: (...args: any[]) => execaMock(...args)
}));

describe('API Integration', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        execaMock.mockResolvedValue({ exitCode: 0 }); // Default success

        // Mock fs.pathExists to simulate PDF creation
        vi.spyOn(fs, 'pathExists').mockImplementation(async (p) => {
            if (typeof p === 'string' && p.endsWith('.pdf')) return true;
            return false;
        });
        vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
        vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fs, 'remove').mockResolvedValue(undefined);
        vi.spyOn(fs, 'createReadStream').mockReturnValue({
            pipe: vi.fn(),
            on: vi.fn((event, cb) => { if (event === 'close') cb(); }),
        } as any);
    });

    it('Happy Path: Returns PDF Stream', async () => {
        const res = await app.request('/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tex: '\\documentclass{article}' })
        });

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('application/pdf');
        expect(execaMock).toHaveBeenCalled();

        // Check Flags
        const args = execaMock.mock.calls[0][1];
        expect(args).toContain('-no-shell-escape');
        expect(args).toContain('-halt-on-error');
    });

    it('Limits: Rejects Large Payload (Content-Length)', async () => {
        const res = await app.request('/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': (5 * 1024 * 1024 + 100).toString()
            },
            body: JSON.stringify({ tex: 'foo' })
        });

        expect(res.status).toBe(413);
    });

    it('Security: Passes correct flags to XeLaTeX', async () => {
        await app.request('/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tex: '\\foo' })
        });

        const args = execaMock.mock.calls[0][1];
        expect(args).toEqual(expect.arrayContaining([
            '-no-shell-escape',
            '-interaction=nonstopmode',
            '-halt-on-error'
        ]));
    });
});
