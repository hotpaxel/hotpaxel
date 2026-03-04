import React from 'react';
import { SdkStatus, FontInfo } from '../types';
import { CheckCircle2, AlertTriangle, Loader2, FilePlus } from 'lucide-react';

interface StatusPanelProps {
  status: SdkStatus;
  version: number;
  error?: string;
  onNew?: () => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ status, version, error, onNew }) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-3">
        <span className="font-bold flex items-center">
           <span className="text-[#ff4d4d] font-sans tracking-tight">HOT</span>
           <span className="text-[#0f172a] font-serif ml-0.5">Paxel</span>
        </span>
        
        <div className="h-4 w-px bg-slate-300 mx-2"></div>

        {/* State Indicator */}
        {status === SdkStatus.IDLE && (
          <span className="text-slate-500 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div> Ready
          </span>
        )}
        
        {status === SdkStatus.SYNCING && (
          <span className="text-brand-600 flex items-center gap-1.5">
            <Loader2 size={14} className="animate-spin" /> Syncing TeX...
          </span>
        )}

        {status === SdkStatus.SUCCESS && (
          <span className="text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Round-trip Verified
          </span>
        )}

        {status === SdkStatus.FAILURE && (
          <span className="text-red-600 flex items-center gap-1.5 font-medium animate-pulse">
            <AlertTriangle size={14} /> Sync Failed
          </span>
        )}

        <div className="h-4 w-px bg-slate-200 mx-2"></div>

        {/* Version Display */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Ver:</span>
          <span className="font-mono font-bold text-slate-700">{version}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
        {onNew && (
          <button 
            onClick={onNew}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-sans font-medium"
            title="Create a new document (Reset editor)"
          >
            <FilePlus size={14} /> 
            New
          </button>
        )}
        <div className="h-4 w-px bg-slate-200"></div>
        <span>v.{version}</span>
        {error && (
            <span className="text-red-500 font-sans max-w-md truncate bg-red-50 px-2 py-0.5 rounded border border-red-100">
                Error: {error}
            </span>
        )}
      </div>
    </div>
  );
};

export default StatusPanel;
