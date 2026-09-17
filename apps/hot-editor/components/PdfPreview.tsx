import React, { useState } from 'react';
import { RefreshCw, FileText, AlertCircle, Copy, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdf.js worker for Vite
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { PdfPreviewProps } from '../types';

const PdfPreview: React.FC<PdfPreviewProps> = ({ pdfUrl, isLoading, error, durationMs, onRefresh }) => {
  const [copied, setCopied] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.2);

  const handleCopy = () => {
    if (error) {
      navigator.clipboard.writeText(error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div className="flex flex-col h-full bg-slate-100 border-l border-slate-200">
      <div className="h-10 border-b border-slate-200 bg-white px-4 flex items-center justify-between shadow-sm z-10">
        <span className="text-xs font-bold text-slate-500 tracking-wider flex items-center gap-2">
            <FileText size={14} />
            Paxel Preview
            {durationMs != null && !isLoading && !error && (
              <span className="text-[10px] text-slate-400 font-mono font-normal ml-2">
                ({durationMs.toLocaleString()}ms)
              </span>
            )}
        </span>
        <div className="flex items-center gap-2">
            {pdfUrl && !error && (
                <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 p-0.5 mr-2">
                    <button onClick={zoomOut} className="p-1 hover:bg-white rounded text-slate-500 transition-colors"><ZoomOut size={14} /></button>
                    <span className="text-xs font-mono text-slate-600 px-2 select-none w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={zoomIn} className="p-1 hover:bg-white rounded text-slate-500 transition-colors"><ZoomIn size={14} /></button>
                </div>
            )}
            <button 
              onClick={onRefresh}
              disabled={isLoading}
              className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded-full hover:bg-slate-100 disabled:opacity-50"
              title="Refresh PDF"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-200 overflow-auto flex flex-col items-center p-4">
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
                <div className="max-w-md w-full relative">
                    <div className="flex items-center justify-between mb-3 text-red-700 font-bold">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={20} />
                            <span>Compilation Error</span>
                        </div>
                        <button 
                            onClick={handleCopy}
                            className="bg-red-100 hover:bg-red-200 p-1.5 rounded transition-colors"
                            title="Copy Error Output"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                    <pre className="bg-red-100 border border-red-200 p-4 rounded text-xs text-red-900 font-mono whitespace-pre-wrap break-all shadow-inner max-h-96 overflow-y-auto">
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
        
        {pdfUrl && !error && (
          <div className="pb-8 transition-transform origin-top">
            <Document 
              file={pdfUrl} 
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="text-slate-400 text-sm py-10">Loading Document Structure...</div>}
              error={<div className="text-red-500 text-sm py-10">Failed to load PDF.</div>}
              className="flex flex-col gap-4 drop-shadow-lg"
            >
              {Array.from(new Array(numPages || 0), (_, index) => (
                <Page 
                  key={`page_${index + 1}`} 
                  pageNumber={index + 1} 
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white"
                />
              ))}
            </Document>
          </div>
        )}

        {!pdfUrl && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <p>Ready to render.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
