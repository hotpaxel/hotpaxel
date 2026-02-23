import React from 'react';
import { RefreshCw, FileText, AlertCircle } from 'lucide-react';

interface PdfPreviewProps {
  url: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ url, isLoading, error, onRefresh }) => {
  return (
    <div className="flex flex-col h-full bg-slate-100 border-l border-slate-200">
      <div className="h-10 border-b border-slate-200 bg-white px-4 flex items-center justify-between shadow-sm z-10">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} />
            PAXEL Preview
        </span>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded-full hover:bg-slate-100 disabled:opacity-50"
          title="Refresh PDF"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 relative bg-slate-200 overflow-hidden flex items-center justify-center">
        {isLoading && (
            <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="animate-spin text-brand-600" size={32} />
                    <span className="text-sm font-medium text-brand-700">Rendering TeX...</span>
                </div>
            </div>
        )}

        {error && (
            <div className="absolute inset-0 z-10 bg-red-50 p-6 flex flex-col items-center justify-center overflow-auto">
                <div className="max-w-md w-full">
                    <div className="flex items-center gap-2 text-red-700 font-bold mb-3">
                        <AlertCircle size={20} />
                        <span>Compilation Error</span>
                    </div>
                    <pre className="bg-red-100 border border-red-200 p-4 rounded text-xs text-red-900 font-mono whitespace-pre-wrap break-all shadow-inner">
                        {error}
                    </pre>
                    <button 
                        onClick={onRefresh}
                        className="mt-6 w-full bg-red-600 text-white rounded-lg py-2 px-4 text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )}
        
        {url ? (
          <iframe 
            src={url} 
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        ) : !isLoading && !error && (
          <div className="text-center p-8 text-slate-400">
            <p>Ready to render.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
