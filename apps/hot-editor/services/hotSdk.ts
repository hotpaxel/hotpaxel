import { SdkStatus, HotDocumentState } from '../types';
// @ts-ignore
import init, { HotConverter } from '@hotpaxel/hot';

/**
 * ⚠️ HOT SDK SIMULATION ⚠️
 * In a real environment, this would be an npm package `@hotpaxel/sdk`.
 * We simulate the strict state management and "Round-trip" verification here.
 */

type Listener = (status: SdkStatus, state: HotDocumentState, error?: string) => void;

class HotSdkService {
  // Start with SUCCESS because the initial state is valid
  private status: SdkStatus = SdkStatus.SUCCESS;

  private state: HotDocumentState = {
    html: '<p>Welcome to <strong>HOTPaxel</strong>.</p><p>Start typing to generate TeX...</p>',
    tex: '\\textbf{Welcome to HOTPaxel}.',
    assets: [],
    requiredFonts: [],
    lastUpdated: new Date(),
    version: 1
  };
  private error: string | undefined = undefined;
  private listeners: Set<Listener> = new Set();

  // Debounce timer for simulated processing
  private processingTimer: any = null;

  private converter: HotConverter | null = null;
  private initialized: Promise<void> | null = null;

  constructor() {
    console.log('[HOT SDK] Initialized');
  }

  /**
   * Public API to subscribe to SDK changes.
   * UI components must use this to react to state, not internal component state.
   */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Initial emit
    listener(this.status, this.state, this.error);

    // Auto-trigger sync on the first subscriber so that PDF updates matching editor state
    if (this.listeners.size === 1) {
      this.updateHtml(this.state.html);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.status, this.state, this.error));
  }

  /**
   * The UI calls this when content changes.
   * This triggers the Round-trip test cycle.
   */
  public updateHtml(newHtml: string) {
    // 1. Update local state immediately for UI responsiveness
    this.state.html = newHtml;
    this.status = SdkStatus.SYNCING;
    this.error = undefined;
    this.notify();

    // 2. Simulate the Async Round-trip Verification & TeX Generation
    if (this.processingTimer) clearTimeout(this.processingTimer);

    this.processingTimer = setTimeout(() => {
      this.performRoundTripCheck(newHtml);
    }, 600); // Simulate network/processing delay
  }

  /**
   * Add an asset (e.g. image) to the document
   */
  public addAsset(name: string, content: string) {
    // Update assets in state
    const existing = this.state.assets.findIndex(a => a.name === name);
    if (existing >= 0) {
      this.state.assets[existing] = { name, content };
    } else {
      this.state.assets.push({ name, content });
    }

    // Trigger re-render and re-verification
    this.status = SdkStatus.SYNCING;
    this.notify();

    // Re-verify to ensure TeX is updated if needed
    if (this.processingTimer) clearTimeout(this.processingTimer);
    this.performRoundTripCheck(this.state.html);
  }

  private async ensureInitialized() {
    if (this.initialized) return this.initialized;
    this.initialized = (async () => {
      await init();
      this.converter = new HotConverter();
      console.log('[HOT SDK] WASM Initialized');
    })();
    return this.initialized;
  }

  /**
   * Simulates the core "Safety" logic of HOTPaxel.
   * Checks for broken tokens or invalid structures.
   */
  private async performRoundTripCheck(html: string) {
    try {
      await this.ensureInitialized();
      const converter = this.converter!;

      // 1. Extract TeX from HTML (Round-trip)
      const wrappedHtml = `<pre data-hot-tex="true">${html}</pre>`;
      const extractedTex = converter.extract_hot_tex(wrappedHtml);

      let finalTex: string;
      // Normalize HTML to check if it's truly empty (ignoring empty tags like <p></p>)
      const textOnly = html.replace(/<[^>]*>/g, '').trim();

      const requiredFonts = new Set<string>();

      if (textOnly === '' && !html.includes('<img')) {
        // If no text and no images/assets, it's effectively empty
        finalTex = '';
      } else if (extractedTex && extractedTex.includes('%% HOT-TEX-START %%')) {
        // If v0.2 WASM extraction found actual Round-trip markers, use it
        finalTex = extractedTex;
      } else {
        // Fallback to manual conversion for rich text without markers
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Helper to process nodes recursively
        const processNode = (node: Node): string => {
          if (node.nodeType === Node.TEXT_NODE) {
            return converter.escape_latex(node.textContent || '');
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement; // Use HTMLElement to access style
            let content = '';

            for (const child of Array.from(el.childNodes)) {
              content += processNode(child);
            }

            // --- FONT & SIZE START ---
            let fontPrefix = '';
            let fontSuffix = '';
            
            const style = el.style;
            if (style.fontFamily) {
                const family = style.fontFamily.replace(/['"]/g, '');
                requiredFonts.add(family);
                // We use a naming convention: \F{FontName}{content}
                // The actual definition of \F will be handled in preamble
                fontPrefix += `\\fontfamily{${family}}\\selectfont `;
            }
            if (style.fontSize) {
                const size = style.fontSize;
                // Basic mapping for common sizes, or use \fontsize
                if (size.endsWith('pt')) {
                    const pt = parseFloat(size);
                    fontPrefix += `\\fontsize{${pt}}{${pt * 1.2}}\\selectfont `;
                }
            }

            if (fontPrefix) {
                content = `{${fontPrefix}${content}}`;
            }
            // --- FONT & SIZE END ---

            if (el.tagName === 'P' || el.tagName === 'DIV') {
              return content + '\n\n';
            }
            if (el.tagName === 'BR') {
              return ' \\\\ \n';
            }
            if (el.tagName === 'STRONG' || el.tagName === 'B') {
                return `\\textbf{${content}}`;
            }
            if (el.tagName === 'EM' || el.tagName === 'I') {
                return `\\textit{${content}}`;
            }
            if (el.tagName === 'IMG') {
              const src = el.getAttribute('src') || '';
              // If it's a local filename, we've already matched it in assets
              const fileName = el.getAttribute('data-filename') || src.split('/').pop() || 'image';
              return `\\includegraphics[width=\\linewidth]{${fileName}}\n\n`;
            }
            return content;
          }
          return '';
        };

        finalTex = processNode(doc.body).trim();
        // Final normalization to ensure paragraph breaks are exactly \n\n
        finalTex = finalTex.replace(/\n\n+/g, '\n\n');
      }

      this.state.tex = finalTex;
      this.state.requiredFonts = Array.from(requiredFonts);
      this.state.version += 1;
      this.state.lastUpdated = new Date();
      this.status = SdkStatus.SUCCESS;
      this.notify();

    } catch (err: any) {
      console.error('[HOT SDK] Round-trip failed:', err);
      this.status = SdkStatus.FAILURE;
      this.error = err.message || "Unknown verification error";
      this.notify();
    }
  }


  public newDocument() {
    this.state = {
      html: '',
      tex: '',
      assets: [],
      requiredFonts: [],
      lastUpdated: new Date(),
      version: 1
    };
    this.status = SdkStatus.SUCCESS;
    this.error = undefined;
    if (this.processingTimer) clearTimeout(this.processingTimer);
    this.notify();
  }

  public getCurrentPdfUrl(): string {
    // Returns a dummy PDF URL based on success state
    return "https://arxiv.org/pdf/2402.17764.pdf"; // Just a placeholder PDF for visual demo
  }
}

export const hotSdk = new HotSdkService();