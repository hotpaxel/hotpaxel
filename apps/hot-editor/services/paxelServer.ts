/**
 * PAXEL Server Service - Real Integration
 * Communicates with the PAXEL backend to render PDF from TeX source.
 */

// const PAXEL_URL = 'http://localhost:8888/api'; // Removed global constant

import { FontInfo, Asset } from '../types';

export const generatePdfPreview = async (
    endpoint: string,
    texSource: string, 
    fontFamily?: string, 
    fontSize?: string, 
    assets: Asset[] = [],
    requiredFonts: string[] = []
): Promise<{ url: string, durationMs: number }> => {
    try {
        if (!endpoint || !endpoint.startsWith('http')) {
            console.error('[PAXEL] INVALID ENDPOINT PASSED:', endpoint);
            console.error('[PAXEL] TeX Source was:', texSource);
            throw new Error(`Invalid Paxel endpoint: ${endpoint}. Please check your settings.`);
        }
        
        console.log(`[PAXEL] Compiling at ${endpoint}...`);

        // 1. Base font config (Default)
        let fontConfig = `\\usepackage{kotex}\n\\usepackage{graphicx}\n\\usepackage{fontspec}\n`;
        const baseFont = fontFamily || 'NanumGothic';
        fontConfig += `\\setmainfont{${baseFont}}[AutoFakeSlant,AutoFakeBold]\n`;
        fontConfig += `\\setmainhangulfont{${baseFont}}[AutoFakeSlant,AutoFakeBold]\n`;

        // 2. Dynamic Preamble for Inline Fonts
        // We use \newfontfamily for each font used in the document to ensure they are loaded
        const extraFonts = requiredFonts
            .filter(f => f !== baseFont)
            .map(f => `\\newfontfamily\\HOTFont${f.replace(/\s+/g, '')}{${f}}[AutoFakeSlant,AutoFakeBold]`)
            .join('\n');

        const fullTex = `\\documentclass{article}
${fontConfig}
${extraFonts}
\\usepackage{enumitem}
\\begin{document}
${texSource}
\\end{document}`;

        const response = await fetch(`${endpoint}/compile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tex: fullTex, assets }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // Convert Base64 PDF to Blob URL
        const pdfBlob = new Blob(
            [Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))],
            { type: 'application/pdf' }
        );
        
        return { 
            url: URL.createObjectURL(pdfBlob), 
            durationMs: data.totalTimeMs || data.compile_time_ms || 0 
        };
    } catch (error: any) {
        console.error('[PAXEL] Preview generation failed:', error);
        throw error;
    }
};

export const fetchFonts = async (endpoint: string): Promise<FontInfo[]> => {
    try {
        const response = await fetch(`${endpoint}/fonts`);
        if (!response.ok) throw new Error('Failed to fetch fonts');
        return await response.json();
    } catch (error) {
        console.error('[PAXEL] Font fetch failed:', error);
        return [];
    }
};

// Cleanup function to revoke blob URLs when no longer needed
export const revokePdfUrl = (url: string) => {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};