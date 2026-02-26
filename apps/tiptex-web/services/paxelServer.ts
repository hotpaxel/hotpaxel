/**
 * PAXEL Server Service - Real Integration
 * Communicates with the PAXEL backend to render PDF from TeX source.
 */

const PAXEL_URL = '/api';

import { FontInfo } from '../types';

export const generatePdfPreview = async (texSource: string, fontFamily?: string, fontSize?: string): Promise<string> => {
    try {
        console.log('[PAXEL] Compiling TeX with font:', fontFamily, 'size:', fontSize);

        // Base font config: set document default font (used when no inline font is specified)
        let fontConfig = '';
        if (fontFamily) {
            fontConfig = `\\usepackage{kotex}\n\\usepackage{fontspec}\n\\setmainfont{${fontFamily}}[AutoFakeSlant,AutoFakeBold]\n\\setmainhangulfont{${fontFamily}}[AutoFakeSlant,AutoFakeBold]`;
        } else {
            fontConfig = `\\usepackage{kotex}\n\\usepackage{fontspec}\n\\setmainfont{NanumGothic}[AutoFakeSlant,AutoFakeBold]\n\\setmainhangulfont{NanumGothic}[AutoFakeSlant,AutoFakeBold]`;
        }

        // No global font size injection - now handled inline per-text
        // enumitem package for list styling
        const fullTex = `\\documentclass{article}
${fontConfig}
\\usepackage{enumitem}
\\begin{document}
${texSource}
\\end{document}`;

        const response = await fetch(`${PAXEL_URL}/compile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tex: fullTex }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.message || `PAXEL Error: ${response.status}`;
            if (errorData.output) {
                errorMessage += `\n\n--- Compiler Output ---\n${errorData.output}`;
            }
            throw new Error(errorMessage);
        }

        // Response is PDF binary stream
        const pdfBlob = await response.blob();
        const blobUrl = URL.createObjectURL(pdfBlob);

        return blobUrl;
    } catch (error: any) {
        console.error('[PAXEL] Compilation failed:', error);
        throw error;
    }
};

export const fetchFonts = async (): Promise<FontInfo[]> => {
    try {
        const response = await fetch(`${PAXEL_URL}/fonts`);
        if (!response.ok) throw new Error('Failed to fetch fonts');
        return await response.json();
    } catch (error) {
        console.error('[PAXEL] Failed to fetch fonts:', error);
        return [];
    }
};

// Cleanup function to revoke blob URLs when no longer needed
export const revokePdfUrl = (url: string) => {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};