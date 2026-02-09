import React, { useEffect, useState, useCallback } from 'react';
import EditorComponent from './components/Editor';
import PdfPreview from './components/PdfPreview';
import StatusPanel from './components/StatusPanel';
import { hotSdk } from './services/hotSdk';
import { generatePdfPreview, revokePdfUrl } from './services/paxelServer';
import { SdkStatus, HotDocumentState } from './types';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  // Application State derived from HOT SDK
  // We do not modify these directly from UI events, only via SDK subscription.
  const [sdkStatus, setSdkStatus] = useState<SdkStatus>(SdkStatus.IDLE);
  const [documentState, setDocumentState] = useState<HotDocumentState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  
  // PDF Preview State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);

  // Handler for PDF Generation
  const handlePdfRefresh = useCallback(async (texSource: string) => {
    setIsPdfLoading(true);
    try {
      const url = await generatePdfPreview(texSource);
      
      // Clean up previous blob URL to prevent memory leaks
      setPdfUrl(prevUrl => {
        if (prevUrl) revokePdfUrl(prevUrl);
        return url;
      });
    } catch (e) {
      console.error("Failed to load PDF", e);
    } finally {
      setIsPdfLoading(false);
    }
  }, []);

  // 1. Subscribe to HOT SDK changes
  useEffect(() => {
    const unsubscribe = hotSdk.subscribe((status, state, error) => {
      setSdkStatus(status);
      setDocumentState({ ...state }); // Copy to trigger re-render
      setErrorMessage(error);
      
      // Auto-refresh PDF logic
      // Trigger on SUCCESS, or on initial IDLE state if we have content
      if (status === SdkStatus.SUCCESS || (status === SdkStatus.IDLE && state.tex)) {
        handlePdfRefresh(state.tex);
      }
    });

    return () => unsubscribe();
  }, [handlePdfRefresh]);

  if (!documentState) {
    return <div className="flex items-center justify-center h-screen text-slate-400">Loading HOT SDK...</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      
      {/* 1. Top Status Bar - The Source of Truth Display */}
      <StatusPanel 
        status={sdkStatus} 
        error={errorMessage} 
        version={documentState.version} 
      />

      {/* 2. Critical Error Banner (Constraint: Must clearly show failure) */}
      {sdkStatus === SdkStatus.FAILURE && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="text-sm font-bold text-red-800">Round-trip Verification Failed</h3>
            <p className="text-sm text-red-700 mt-1">
              The generated HTML cannot be safely converted back to TeX. 
              Editing is still enabled, but PDF generation is paused until the error is resolved.
            </p>
            {errorMessage && (
                <code className="block mt-2 bg-red-100 p-2 rounded text-xs text-red-900 font-mono">
                    {errorMessage}
                </code>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Workspace - Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Editor (Input) */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 relative">
          <EditorComponent 
            initialContent={documentState.html}
            onUpdateStatus={setSdkStatus}
          />
        </div>

        {/* Right: PDF Preview (Output) */}
        <div className="w-1/2 bg-slate-100 relative">
           <PdfPreview 
             url={pdfUrl} 
             isLoading={isPdfLoading}
             onRefresh={() => documentState && handlePdfRefresh(documentState.tex)}
           />
        </div>

      </div>
    </div>
  );
};

export default App;