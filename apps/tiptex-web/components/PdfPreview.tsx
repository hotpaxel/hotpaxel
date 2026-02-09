import React from 'react';
import { RefreshCw, FileText } from 'lucide-react';

interface PdfPreviewProps {
  url: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ url, isLoading, onRefresh }) => {
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
        
        {url ? (
          <iframe 
            src={url} 
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        ) : (
          <div className="text-center p-8 text-slate-400">
            <p>No PDF Generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
