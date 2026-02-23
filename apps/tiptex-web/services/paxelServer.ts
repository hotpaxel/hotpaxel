/**
 * PAXEL Server Service - Real Integration
 * Communicates with the PAXEL backend to render PDF from TeX source.
 */

const PAXEL_URL = import.meta.env.VITE_PAXEL_URL || 'http://localhost:8888';

export const generatePdfPreview = async (texSource: string): Promise<string> => {
    try {
        const response = await fetch(`${PAXEL_URL}/compile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tex: texSource }),
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

// Cleanup function to revoke blob URLs when no longer needed
export const revokePdfUrl = (url: string) => {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};