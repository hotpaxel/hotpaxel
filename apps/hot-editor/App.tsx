import React, { useEffect, useState, useCallback } from 'react';
import EditorComponent from './components/Editor';
import PdfPreview from './components/PdfPreview';
import StatusPanel from './components/StatusPanel';
import { hotSdk } from './services/hotSdk';
import { generatePdfPreview, fetchFonts } from './services/paxelServer';
import { SdkStatus, HotDocumentState, FontInfo, Asset } from './types';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  // 1. Application State
  const [sdkStatus, setSdkStatus] = useState<SdkStatus>(SdkStatus.IDLE);
  const [documentState, setDocumentState] = useState<HotDocumentState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  
  // 2. Settings (Paxel Endpoint)
  const [paxelEndpoint, setPaxelEndpoint] = useState(() => {
    // Force a valid default if localStorage is empty or looks like garbage (e.g. contains TeX)
    const saved = localStorage.getItem('hotpaxel_endpoint');
    if (saved && saved.startsWith('http')) return saved;
    return 'http://localhost:8888/api';
  });

  // 3. User Preferences & Assets
  const [fonts, setFonts] = useState<FontInfo[]>([]);
  const [selectedFontFamily, setSelectedFontFamily] = useState<string>('NanumGothic');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('12pt');

  // 4. Preview State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfDuration, setPdfDuration] = useState<number | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'tex' | 'pdf'>('tex');

  // PDF Generation Logic
  const handlePdfRefresh = useCallback(async (
    texSource: string, 
    fontFamily: string, 
    fontSize: string, 
    assets: Asset[] = [],
    requiredFonts: string[] = []
  ) => {
    if (!texSource || !paxelEndpoint.startsWith('http')) return;
    
    setIsPdfLoading(true);
    setRenderError(null);
    try {
      const { url, durationMs } = await generatePdfPreview(paxelEndpoint, texSource, fontFamily, fontSize, assets, requiredFonts);
      
      setPdfUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return url;
      });
      setPdfDuration(durationMs);
    } catch (e: any) {
      console.error("[PAXEL] Error refreshing PDF:", e);
      setRenderError(e.message || "Failed to connect to Paxel server.");
      setPdfDuration(null);
    } finally {
      setIsPdfLoading(false);
    }
  }, [paxelEndpoint]);

  // Load fonts and save endpoint
  useEffect(() => {
    if (paxelEndpoint.startsWith('http')) {
        localStorage.setItem('hotpaxel_endpoint', paxelEndpoint);
        fetchFonts(paxelEndpoint).then(fetched => {
            if (fetched && fetched.length > 0) {
                setFonts(fetched);
                // Ensure default font exists in list
                if (!fetched.find(f => f.family === selectedFontFamily)) {
                    const fallback = fetched.find(f => f.family.includes('Nanum')) || fetched[0];
                    setSelectedFontFamily(fallback.family);
                }
            }
        });
    }
  }, [paxelEndpoint]);

  // Inject Font Faces
  useEffect(() => {
    if (fonts.length === 0) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-fonts';
    styleEl.innerHTML = fonts.map(f => `
      @font-face {
        font-family: '${f.family}';
        src: url('${paxelEndpoint}/fonts/${encodeURIComponent(f.fileName)}');
      }
    `).join('\n');
    document.head.appendChild(styleEl);
    return () => {
        const existing = document.getElementById('dynamic-fonts');
        if (existing) document.head.removeChild(existing);
    };
  }, [fonts, paxelEndpoint]);

  // SDK Subscription
  useEffect(() => {
    const unsubscribe = hotSdk.subscribe((status, state, error) => {
      setSdkStatus(status);
      setDocumentState({ ...state });
      setErrorMessage(error);
      
      // Auto-trigger PDF refresh
      if (status === SdkStatus.SUCCESS || (status === SdkStatus.IDLE && state.tex)) {
        const isTexEmpty = !state.tex || state.tex.replace(/\\[\s\S]/g, '').trim() === '';
        if (isTexEmpty) {
          setPdfUrl(null);
          setPdfDuration(null);
          return;
        }
        handlePdfRefresh(state.tex, selectedFontFamily, selectedFontSize, state.assets, state.requiredFonts);
      }
    });

    return () => unsubscribe();
  }, [handlePdfRefresh, selectedFontFamily, selectedFontSize]);

  // Action Handlers
  const handleSave = () => {
    if (!documentState) return;
    const blob = new Blob([JSON.stringify(documentState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paxel_${Date.now()}.hotpaxel`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const state = JSON.parse(e.target?.result as string);
          if (state.html) {
            hotSdk.newDocument();
            if (state.assets) state.assets.forEach((a: Asset) => hotSdk.addAsset(a.name, a.content));
            hotSdk.updateHtml(state.html);
          }
        } catch (err) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!documentState) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            <div className="text-slate-400 font-medium animate-pulse">Initializing HOT SDK...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-slate-900 font-sans">
      {/* 1. Header */}
      <StatusPanel 
        status={sdkStatus} 
        version={documentState.version} 
        errorMessage={errorMessage}
        onNew={() => hotSdk.newDocument()}
        onSave={handleSave}
        onLoad={handleLoad}
        paxelEndpoint={paxelEndpoint}
        onEndpointChange={setPaxelEndpoint}
      />

      {/* 2. Error Banner */}
      {sdkStatus === SdkStatus.FAILURE && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-3 shrink-0">
          <AlertCircle className="text-red-500" size={16} />
          <span className="text-xs text-red-800 font-bold">Round-trip Verification Failed: </span>
          <span className="text-xs text-red-700 truncate">{errorMessage || "Invalid TeX content detected."}</span>
        </div>
      )}

      {/* 3. Split Main View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Editors */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 bg-white">
          <EditorComponent 
            initialContent={documentState.html}
            onUpdateStatus={setSdkStatus}
            fonts={fonts}
            selectedFont={selectedFontFamily}
            onFontChange={setSelectedFontFamily}
            selectedFontSize={selectedFontSize}
            onFontSizeChange={setSelectedFontSize}
            onAddAsset={(name, content) => hotSdk.addAsset(name, content)}
          />
        </div>

        {/* Right Side: Preview & Source */}
        <div className="w-1/2 flex flex-col bg-slate-50 border-l border-slate-200">
           {/* Tab Headers */}
           <div className="flex border-b border-slate-200 bg-slate-100/50 px-2 h-10 items-end shrink-0">
              <button 
                onClick={() => setRightTab('tex')} 
                className={`px-4 py-2 text-xs font-bold transition-all ${rightTab === 'tex' ? 'text-brand-600 border-b-2 border-brand-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                TEX SOURCE
              </button>
              <button 
                onClick={() => setRightTab('pdf')} 
                className={`px-4 py-2 text-xs font-bold transition-all ${rightTab === 'pdf' ? 'text-brand-600 border-b-2 border-brand-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                PDF PREVIEW
              </button>
           </div>

           {/* Content Area */}
           <div className="flex-1 relative overflow-hidden">
             {rightTab === 'tex' ? (
               <div className="absolute inset-0 p-6 bg-[#0F172A] overflow-auto">
                 <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest italic">Generated LaTeX Code</span>
                 </div>
                 <pre className="text-emerald-400 font-mono text-sm whitespace-pre-wrap leading-relaxed select-all">{documentState.tex}</pre>
               </div>
             ) : (
               <PdfPreview 
                    pdfUrl={pdfUrl} 
                    isLoading={isPdfLoading} 
                    error={renderError}
                    durationMs={pdfDuration}
                    onRefresh={() => handlePdfRefresh(documentState.tex, selectedFontFamily, selectedFontSize, documentState.assets, documentState.requiredFonts)}
                />
             )}
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;