import React, { useState } from 'react';
import { KeyRound, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  endpoint: string;
  onAuthenticated: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ endpoint, onAuthenticated }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token.trim()) {
      setError('Please enter an access token.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${endpoint}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid access token.');
      }

      onAuthenticated();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center mb-1">
            <span className="text-[#D90429] font-bold tracking-tight text-2xl" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>HOT</span>
            <span className="text-[#1A1A1A] ml-0.5 font-serif text-2xl">Paxel</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Access Token Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Access Token
            </label>
            <div className="relative">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token here..."
                autoFocus
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pl-9 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-inner"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#D90429] hover:bg-[#b80323] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Tip: Bookmark with <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded font-mono">?token=...</code> for 1-click access
        </p>
      </div>
    </div>
  );
};
