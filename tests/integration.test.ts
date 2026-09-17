import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8888';

describe('HotPaxel Integration Tests', () => {
    describe('Server API', () => {
        it('should respond with "ok" on /health', async () => {
            const res = await fetch(`${SERVER_URL}/health`);
            expect(await res.text()).toBe('ok');
        });

        it('should return version information', async () => {
            const res = await fetch(`${SERVER_URL}/version`);
            const data: any = await res.json();
            expect(data).toHaveProperty('name', 'paxel');
            expect(data).toHaveProperty('version');
        });

        it('should list available fonts', async () => {
            const res = await fetch(`${SERVER_URL}/fonts`);
            const data: any = await res.json();
            expect(Array.isArray(data)).toBe(true);
            if (data.length > 0) {
                expect(data[0]).toHaveProperty('family');
            }
        });

        it('should return compile and total times on /compile', async () => {
            const res = await fetch(`${SERVER_URL}/compile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tex: '\\documentclass{article}\\begin{document}Performance test\\end{document}',
                    passes: 1
                })
            });
            const data: any = await res.json();
            expect(data).toHaveProperty('pdf');
            expect(data).toHaveProperty('compileTimeMs');
            expect(data).toHaveProperty('totalTimeMs');
            expect(typeof data.compileTimeMs).toBe('number');
            expect(typeof data.totalTimeMs).toBe('number');
            expect(data.totalTimeMs).toBeGreaterThanOrEqual(data.compileTimeMs);
        });
    });

    describe('Hot CLI', () => {
        it('should compile a TeX file with local assets using fixtures', () => {
            const texPath = path.join(__dirname, 'fixtures/asset_test.tex');
            const pdfPath = path.join(__dirname, 'fixtures/asset_test.pdf');

            // Clean up old PDF if exists
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

            const hotBin = path.join(__dirname, '../target/debug/hot');
            const cmd = fs.existsSync(hotBin)
                ? `${hotBin} --host ${SERVER_URL} compile ${texPath} ${pdfPath}`
                : `cargo run --package hot -- --host ${SERVER_URL} compile ${texPath} ${pdfPath}`;

            const output = execSync(cmd).toString();

            expect(fs.existsSync(pdfPath)).toBe(true);
            expect(fs.statSync(pdfPath).size).toBeGreaterThan(0);
            expect(output).toContain('compile:');
            expect(output).toContain('total:');
            expect(output).toContain('ms');
        });

        it('should compile korean_test.tex fixture', () => {
            const texPath = path.join(__dirname, 'fixtures/korean_test.tex');
            const pdfPath = path.join(__dirname, 'fixtures/korean_test.pdf');

            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

            const cmd = `cargo run --package hot -- --host ${SERVER_URL} compile ${texPath} ${pdfPath}`;
            const output = execSync(cmd).toString();

            expect(fs.existsSync(pdfPath)).toBe(true);
            expect(fs.statSync(pdfPath).size).toBeGreaterThan(0);
            expect(output).toContain('compile:');
            expect(output).toContain('total:');
            expect(output).toContain('ms');
        });

        it('should compile test_font.tex fixture (NanumGothic)', () => {
            const texPath = path.join(__dirname, 'fixtures/test_font.tex');
            const pdfPath = path.join(__dirname, 'fixtures/test_font.pdf');

            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

            const cmd = `cargo run --package hot -- --host ${SERVER_URL} compile ${texPath} ${pdfPath}`;
            const output = execSync(cmd).toString();

            expect(fs.existsSync(pdfPath)).toBe(true);
            expect(fs.statSync(pdfPath).size).toBeGreaterThan(0);
            expect(output).toContain('compile:');
            expect(output).toContain('total:');
            expect(output).toContain('ms');
        });
    });
});
