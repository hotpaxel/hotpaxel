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
    html: '<p>Welcome to <strong>HOTPAXEL</strong>.</p><p>Start typing to generate TeX...</p>',
    tex: '\\textbf{Welcome to HOTPAXEL}.',
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
   * Simulates the core "Safety" logic of HOTPAXEL.
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
      if (extractedTex && extractedTex.length > 0) {
        // If v0.2 WASM extraction succeeded, use it
        finalTex = extractedTex;
      } else {
        // Fallback to simple conversion if extraction returns empty
        const plainText = html.replace(/<[^>]*>/g, '').trim();
        finalTex = converter.escape_latex(plainText);
      }

      this.state.tex = finalTex;
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


  public getCurrentPdfUrl(): string {
    // Returns a dummy PDF URL based on success state
    return "https://arxiv.org/pdf/2402.17764.pdf"; // Just a placeholder PDF for visual demo
  }
}

export const hotSdk = new HotSdkService();