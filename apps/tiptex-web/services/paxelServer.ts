/**
 * Mock Service for PAXEL Server interactions.
 * In a real scenario, this communicates with the backend to render the PDF from TeX.
 */

export const generatePdfPreview = async (texSource: string): Promise<string> => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would POST the TeX and get a signed URL back.
    // We return a sample PDF for the demo.
    return "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
};