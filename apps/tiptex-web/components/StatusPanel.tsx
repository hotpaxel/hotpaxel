import React from 'react';
import { SdkStatus } from '../types';
import { CheckCircle2, AlertTriangle, Loader2, FileCode } from 'lucide-react';

interface StatusPanelProps {
  status: SdkStatus;
  error?: string;
  version: number;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ status, error, version }) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-700 flex items-center gap-2">
           HOTPAXEL <span className="text-slate-300 font-light">|</span> Tiptex
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
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
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
