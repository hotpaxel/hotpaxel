import React, { useState } from 'react';
import { SdkStatus, StatusPanelProps } from '../types';
import { CheckCircle2, AlertTriangle, Loader2, FilePlus, Save, FolderOpen, Settings, Check, X, LogOut } from 'lucide-react';

const StatusPanel: React.FC<StatusPanelProps> = ({ 
  status, 
  version, 
  errorMessage, 
  onNew, 
  onSave, 
  onLoad, 
  paxelEndpoint, 
  onEndpointChange,
  authRequired,
  onLogout
}) => {
  const [isEditingEndpoint, setIsEditingEndpoint] = useState(false);
  const [tempEndpoint, setTempEndpoint] = useState(paxelEndpoint);

  const handleEndpointSave = () => {
    onEndpointChange(tempEndpoint);
    setIsEditingEndpoint(false);
  };

  const handleEndpointCancel = () => {
    setTempEndpoint(paxelEndpoint);
    setIsEditingEndpoint(false);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 h-12 flex items-center justify-between text-sm shadow-sm z-20">
      {/* Left Section: Logo & Document Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center mr-2">
           <span className="text-[#D90429] font-bold tracking-tight text-lg" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>HOT</span>
           <span className="text-[#1A1A1A] ml-0.5 font-serif text-lg">Paxel</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={onNew}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white hover:text-brand-600 text-slate-600 rounded-md transition-all text-xs font-bold"
            title="New Document"
          >
            <FilePlus size={14} /> New
          </button>
          
          <label className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white hover:text-brand-600 text-slate-600 rounded-md transition-all text-xs font-bold cursor-pointer">
            <FolderOpen size={14} /> Load
            <input type="file" className="hidden" accept=".hotpaxel" onChange={onLoad} />
          </label>

          <button 
            onClick={onSave}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white hover:text-brand-600 text-slate-600 rounded-md transition-all text-xs font-bold"
            title="Save Document"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      {/* Right Section: Settings, Version & Status */}
      <div className="flex items-center gap-4">
        
        {/* Endpoint Settings */}
        <div className="flex items-center gap-2">
          {isEditingEndpoint ? (
            <div className="flex items-center bg-slate-50 border border-brand-200 rounded-md px-2 py-1 shadow-inner">
              <input 
                type="text" 
                value={tempEndpoint}
                onChange={(e) => setTempEndpoint(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-[10px] font-mono text-slate-600 w-48"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEndpointSave();
                  if (e.key === 'Escape') handleEndpointCancel();
                }}
              />
              <button onClick={handleEndpointSave} className="text-emerald-600 hover:text-emerald-700 p-0.5"><Check size={14} /></button>
              <button onClick={handleEndpointCancel} className="text-slate-400 hover:text-slate-500 p-0.5"><X size={14} /></button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditingEndpoint(true)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors py-1 px-2 hover:bg-slate-50 rounded"
              title="Change PAXEL Endpoint"
            >
              <Settings size={14} />
              <span className="text-[10px] font-mono opacity-60 truncate max-w-[120px]">{paxelEndpoint}</span>
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

        {/* Unified Status & Version */}
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Ver</span>
             <span className="font-mono font-bold text-slate-700">{version}</span>
           </div>

           {/* State Indicator */}
           <div className="min-w-[140px] flex justify-end">
            {status === SdkStatus.IDLE && (
              <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Ready
              </span>
            )}
            
            {status === SdkStatus.SYNCING && (
              <span className="text-brand-600 flex items-center gap-1.5 text-xs font-medium">
                <Loader2 size={14} className="animate-spin" /> Syncing...
              </span>
            )}

            {status === SdkStatus.SUCCESS && (
              <span className="text-emerald-600 flex items-center gap-1.5 text-xs font-bold">
                <CheckCircle2 size={14} /> Round-trip Verified
              </span>
            )}

            {status === SdkStatus.FAILURE && (
              <span className="text-red-600 flex items-center gap-1.5 text-xs font-bold animate-pulse">
                <AlertTriangle size={14} /> Sync Failed
              </span>
            )}
           </div>
        </div>
        
        {authRequired && onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-brand-600 transition-colors py-1 px-2 hover:bg-brand-50 rounded text-xs"
            title="Lock Workspace (Logout)"
          >
            <LogOut size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-brand-600 hidden sm:inline">Lock</span>
          </button>
        )}

        {errorMessage && (
            <div className="group relative">
                <AlertTriangle size={14} className="text-red-400 animate-bounce" />
                <div className="absolute right-0 top-full mt-2 w-64 bg-red-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                    {errorMessage}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StatusPanel;
