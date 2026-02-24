import React from 'react';
import { SdkStatus, FontInfo } from '../types';
import { CheckCircle2, AlertTriangle, Loader2, Type } from 'lucide-react';

interface StatusPanelProps {
  status: SdkStatus;
  error?: string;
  version: number;
  fonts: FontInfo[];
  selectedFont: string;
  onFontChange: (fontFamily: string) => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ 
  status, 
  error, 
  version, 
  fonts, 
  selectedFont, 
  onFontChange 
}) => {
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

        <div className="h-4 w-px bg-slate-200 mx-2"></div>

        {/* Font Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
          <Type size={14} className="text-slate-400" />
          <select 
            className="bg-transparent border-none text-xs text-slate-700 focus:outline-none cursor-pointer font-sans"
            value={selectedFont}
            onChange={(e) => onFontChange(e.target.value)}
          >
            {/* Default Option if fonts not loaded yet */}
            {fonts.length === 0 && <option value="NanumGothic">Loading Fonts...</option>}
            {fonts.map((font, idx) => (
              <option key={`${font.family}-${idx}`} value={font.family}>
                {font.family}
              </option>
            ))}
          </select>
        </div>
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
