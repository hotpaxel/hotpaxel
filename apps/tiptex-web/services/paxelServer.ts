/**
 * PAXEL Server Service - Real Integration
 * Communicates with the PAXEL backend to render PDF from TeX source.
 */

const PAXEL_URL = '/api';

import { FontInfo } from '../types';

export const generatePdfPreview = async (texSource: string, fontFamily?: string): Promise<string> => {
    try {
        console.log('[PAXEL] Compiling TeX with font:', fontFamily);

        let fontConfig = '';
        if (fontFamily) {
            fontConfig = `\\usepackage{fontspec}\n\\setmainfont{${fontFamily}}`;
        } else {
            fontConfig = `\\usepackage{kotex}\n\\setmainhangulfont{NanumGothic}`;
        }

        const fullTex = `\\documentclass{article}
${fontConfig}
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
            throw new Error(errorData.message || `PAXEL Error: ${response.status}`);
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