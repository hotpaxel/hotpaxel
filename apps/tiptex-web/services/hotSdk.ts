import { SdkStatus, HotDocumentState } from '../types';

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

  /**
   * Simulates the core "Safety" logic of HOTPAXEL.
   * Checks for broken tokens or invalid structures.
   */
  private performRoundTripCheck(html: string) {
    try {
      // ⚠️ SIMULATED VALIDATION LOGIC ⚠️
      
      // Rule 1: Check for broken protection tokens (Simulated simple check)
      // If a user tried to edit inside a token manually and broke the format
      if (html.includes('{%') && !html.includes('%}')) {
        throw new Error("Syntax Error: Unclosed logic block '{%'.");
      }

      // Rule 2: Check for invalid HTML structures not supported by TeX mapper
      if (html.includes('<div style="')) {
         throw new Error("Architecture Violation: Inline styles are not supported by the TeX mapper.");
      }

      // If valid, simulate TeX generation
      // In reality, this calls the WASM or Server-side converter
      const simulatedTex = this.mockHtmlToTex(html);
      
      this.state.tex = simulatedTex;
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

  /**
   * Mock converter to demonstrate "Source is TeX" output.
   */
  private mockHtmlToTex(html: string): string {
    let tex = html
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<strong>/g, '\\textbf{')
      .replace(/<\/strong>/g, '}')
      .replace(/<em>/g, '\\textit{')
      .replace(/<\/em>/g, '}')
      .replace(/&nbsp;/g, '~');
    
    // Simulate finding our custom nodes
    // Note: The TokenNode extension will render something wrapping these values, 
    // but the raw HTML usually contains the value.
    
    return `\\documentclass{article}\n\\begin{document}\n${tex.trim()}\n\\end{document}`;
  }

  public getCurrentPdfUrl(): string {
    // Returns a dummy PDF URL based on success state
    return "https://arxiv.org/pdf/2402.17764.pdf"; // Just a placeholder PDF for visual demo
  }
}

export const hotSdk = new HotSdkService();