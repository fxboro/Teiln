import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  KeyRound, 
  ExternalLink,
  X,
  Zap,
  Clock,
  Database
} from 'lucide-react';
import { SupabaseAuthVerificationResult } from '../lib/supabase';

interface AuthStateIndicatorProps {
  onOpenSupabaseModal?: () => void;
}

export const AuthStateIndicator: React.FC<AuthStateIndicatorProps> = ({ onOpenSupabaseModal }) => {
  const { lastAuthEvent, dismissLastAuthEvent, verifyAuthSession, isSupabaseConnected } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectData, setInspectData] = useState<SupabaseAuthVerificationResult | null>(null);
  const [inspecting, setInspecting] = useState(false);

  useEffect(() => {
    if (lastAuthEvent) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [lastAuthEvent]);

  const handleInspect = async () => {
    setInspecting(true);
    setInspectModalOpen(true);
    try {
      const res = await verifyAuthSession();
      setInspectData(res);
    } catch (err) {
      console.error('Inspection error:', err);
    } finally {
      setInspecting(false);
    }
  };

  return (
    <>
      {/* Toast Notification on Auth State Changes */}
      {showToast && lastAuthEvent && (
        <div 
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-full bg-[#0d121f]/95 border border-emerald-500/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-white">Auth State:</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold">
                    {lastAuthEvent.event}
                  </span>
                </div>
                <p className="text-slate-300 mt-1 leading-snug">
                  {lastAuthEvent.message}
                </p>
                {lastAuthEvent.tokenExpiresInText && lastAuthEvent.tokenExpiresInText !== 'No active token' && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400/90 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>Token valid: {lastAuthEvent.tokenExpiresInText}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleInspect}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-1.5 py-1 rounded hover:bg-emerald-500/10 transition-colors cursor-pointer"
                title="Inspect token claims and session persistence"
              >
                Inspect
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowToast(false);
                  dismissLastAuthEvent();
                }}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                aria-label="Dismiss auth indicator"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Diagnostic & Token Verification Modal */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div 
            className="w-full max-w-xl bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative my-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-diag-title"
          >
            <button
              onClick={() => setInspectModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 id="auth-diag-title" className="text-lg font-bold font-display text-white">
                  Supabase Auth & Session Verification
                </h3>
                <p className="text-xs text-slate-400">
                  Cryptographic JWT token validation, persistence, and claims inspection
                </p>
              </div>
            </div>

            {inspecting ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                <span>Validating session with Supabase Auth server...</span>
              </div>
            ) : inspectData ? (
              <div className="mt-5 space-y-4">
                {/* Summary Pill */}
                <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  inspectData.statusSummary === 'AUTHENTICATED_AND_VALIDATED'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                    : inspectData.statusSummary === 'UNAUTHENTICATED'
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                }`}>
                  {inspectData.statusSummary === 'AUTHENTICATED_AND_VALIDATED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">
                      {inspectData.statusSummary === 'AUTHENTICATED_AND_VALIDATED'
                        ? 'Token Validated Successfully by Supabase Auth'
                        : inspectData.statusSummary === 'UNAUTHENTICATED'
                        ? 'No Active Supabase Session'
                        : 'Token Expired or Verification Notice'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {inspectData.serverValidation.success 
                        ? `Cryptographically validated by server in ${inspectData.serverValidation.latencyMs}ms. User ID: ${inspectData.serverValidation.verifiedUserId}`
                        : inspectData.serverValidation.serverError || 'Session is not currently active.'}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">User ID</span>
                    <span className="font-mono text-white text-[11px] truncate block mt-0.5">
                      {inspectData.user?.id || 'None'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Email Address</span>
                    <span className="font-mono text-white text-[11px] truncate block mt-0.5">
                      {inspectData.user?.email || 'None'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Token Expiration</span>
                    <span className="font-mono text-emerald-400 text-[11px] block mt-0.5">
                      {inspectData.token.expiresInText}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Storage Persistence</span>
                    <span className="font-mono text-cyan-400 text-[11px] block mt-0.5 truncate">
                      {inspectData.persistence.persistsInLocalStorage ? 'Active in localStorage' : 'Not found'}
                    </span>
                  </div>
                </div>

                {/* Token Claims JSON (if present) */}
                {inspectData.token.claims && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Decoded JWT Token Payload Claims:
                    </span>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-36 overflow-y-auto">
                      {JSON.stringify(inspectData.token.claims, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Execution Logs */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Diagnostic Verification Trace:
                  </span>
                  <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-[10px] font-mono text-slate-400 space-y-0.5 max-h-28 overflow-y-auto">
                    {inspectData.logs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleInspect}
                disabled={inspecting}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${inspecting ? 'animate-spin' : ''}`} />
                <span>Re-verify Token</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
