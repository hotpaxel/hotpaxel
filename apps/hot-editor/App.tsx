import React, { useEffect, useState, useCallback } from 'react';
import EditorComponent from './components/Editor';
import PdfPreview from './components/PdfPreview';
import StatusPanel from './components/StatusPanel';
import { AuthModal } from './components/AuthModal';
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
    const saved = localStorage.getItem('hotpaxel_endpoint');
    if (typeof window !== 'undefined' && window.location.origin) {
      const isCurrentLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // If deployed on remote host, don't fall back to stale localhost stored in localStorage
      if (!isCurrentLocalhost && saved && saved.includes('localhost')) {
        return `${window.location.origin}/api`;
      }
      if (saved && saved.startsWith('http')) return saved;
      return `${window.location.origin}/api`;
    }
    if (saved && saved.startsWith('http')) return saved;
    return 'http://localhost:8888/api';
  });

  // 2.1 Auth State
  const [authRequired, setAuthRequired] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

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

  // Check Auth Status & parse ?token=... from URL
  const checkAuthStatus = useCallback(async (endpoint: string) => {
    try {
      // 1. Check URL for ?token=...
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
          const verifyRes = await fetch(`${endpoint}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: urlToken }),
          });
          if (verifyRes.ok) {
            urlParams.delete('token');
            const newSearch = urlParams.toString();
            const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
            window.history.replaceState(null, '', newUrl);

            setAuthRequired(true);
            setIsAuthenticated(true);
            return;
          }
        }
      }

      // 2. Query /api/auth/status
      const res = await fetch(`${endpoint}/auth/status`);
      if (res.ok) {
        const data = await res.json();
        setAuthRequired(!!data.auth_required);
        setIsAuthenticated(!!data.authenticated);
      }
    } catch (e) {
      console.warn('[AUTH] Check failed:', e);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${paxelEndpoint}/auth/logout`, { method: 'POST' });
    } catch (e) {
      console.error('[AUTH] Logout failed:', e);
    } finally {
      setIsAuthenticated(false);
    }
  }, [paxelEndpoint]);

  // Initial Auth Check
  useEffect(() => {
    if (paxelEndpoint.startsWith('http')) {
      checkAuthStatus(paxelEndpoint);
    }
  }, [paxelEndpoint, checkAuthStatus]);

  // Load fonts and save endpoint
  useEffect(() => {
    if (paxelEndpoint.startsWith('http') && isAuthenticated) {
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
  }, [paxelEndpoint, isAuthenticated]);

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

  // SDK Subscription & Initial Recovery
  useEffect(() => {
    // 1. Initial Recovery
    const savedState = localStorage.getItem('hotpaxel_saved_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            if (parsed.html) {
                hotSdk.newDocument();
                // Restore assets first
                if (parsed.assets) {
                    parsed.assets.forEach((a: Asset) => hotSdk.addAsset(a.name, a.content));
                }
                hotSdk.updateHtml(parsed.html);
                console.log('[App] Restored state from localStorage');
            }
        } catch (e) {
            console.error('[App] Failed to restore state:', e);
            localStorage.removeItem('hotpaxel_saved_state'); // Clear corrupted state
        }
    }

    const unsubscribe = hotSdk.subscribe((status, state, error) => {
      setSdkStatus(status);
      setDocumentState({ ...state });
      setErrorMessage(error);
      
      // Auto-save to localStorage
      if (state.html || (state.assets && state.assets.length > 0)) {
          localStorage.setItem('hotpaxel_saved_state', JSON.stringify(state));
      }
      
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
      {/* 0. Auth Modal if locked */}
      {authRequired && !isAuthenticated && (
        <AuthModal
          endpoint={paxelEndpoint}
          onAuthenticated={() => {
            setIsAuthenticated(true);
            // Refresh fonts once authenticated
            fetchFonts(paxelEndpoint).then(fetched => {
              if (fetched && fetched.length > 0) setFonts(fetched);
            });
          }}
        />
      )}

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
        authRequired={authRequired}
        onLogout={handleLogout}
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