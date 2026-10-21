import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  isSupabaseConfigured, 
  SUPABASE_SQL_SCHEMA, 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection,
  verifySupabaseAuthStatus,
  refreshSupabaseToken,
  SupabaseHealthCheckResult,
  SupabaseAuthVerificationResult
} from '../lib/supabase';
import { 
  X, 
  Copy, 
  Check, 
  Database, 
  ShieldCheck, 
  Terminal, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  KeyRound, 
  Globe, 
  Zap, 
  Lock 
} from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'schema'>('status');

  // Credentials form state
  const config = getSupabaseConfig();
  const [inputUrl, setInputUrl] = useState(config.url || '');
  const [inputKey, setInputKey] = useState(config.anonKey || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Diagnostic state
  const [testing, setTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<SupabaseHealthCheckResult | null>(null);

  // Session & Token verification state
  const [verifyingAuth, setVerifyingAuth] = useState(false);
  const [authVerification, setAuthVerification] = useState<SupabaseAuthVerificationResult | null>(null);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
      runAuthVerification();
    }
  }, [isOpen]);

  const runHealthCheck = async (urlToTest?: string, keyToTest?: string) => {
    setTesting(true);
    try {
      const res = await testSupabaseConnection(urlToTest, keyToTest);
      setHealthResult(res);
    } catch (err: any) {
      setHealthResult({
        isConfigured: false,
        isReachable: false,
        authWorking: false,
        databaseWorking: false,
        latencyMs: 0,
        message: err?.message || 'Failed to complete connection test',
      });
    } finally {
      setTesting(false);
    }
  };

  const runAuthVerification = async () => {
    setVerifyingAuth(true);
    setRefreshNotice(null);
    try {
      const res = await verifySupabaseAuthStatus();
      setAuthVerification(res);
    } catch (err: any) {
      console.error('Auth verification error:', err);
    } finally {
      setVerifyingAuth(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    try {
      const res = await refreshSupabaseToken();
      if (res.success) {
        setRefreshNotice('✓ Token successfully refreshed by Supabase Auth server!');
        await runAuthVerification();
      } else {
        setRefreshNotice(`❌ Token refresh error: ${res.error}`);
      }
    } finally {
      setRefreshingToken(false);
      setTimeout(() => setRefreshNotice(null), 4000);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText?.(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = inputUrl.trim();
    const cleanKey = inputKey.trim();

    if (!cleanUrl || !cleanKey) {
      return;
    }

    saveSupabaseConfig(cleanUrl, cleanKey);
    setSaveSuccess(true);
    await runHealthCheck(cleanUrl, cleanKey);
    setTimeout(() => {
      setSaveSuccess(false);
      window.location.reload();
    }, 1200);
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect Supabase and switch back to local secure SHA-256 mode?')) {
      clearSupabaseConfig();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative my-8 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supabase-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 id="supabase-title" className="text-xl font-display font-bold text-white flex items-center gap-2">
              Supabase Authentication & Cloud SQL
            </h2>
            <p className="text-xs text-slate-400">
              Live authentication status, PostgreSQL diagnostics, and connection settings
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mt-5">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'status' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connection Diagnostics</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'config' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>API Credentials</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'schema' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>SQL Schema & RLS</span>
          </button>
        </div>

        {/* TAB 1: STATUS & DIAGNOSTICS */}
        {activeTab === 'status' && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-150">
            {/* Status Summary Banner */}
            <div className={`p-4 rounded-2xl border ${
              isSupabaseConfigured && healthResult?.isReachable 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                : isSupabaseConfigured
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-3 h-3 rounded-full shrink-0 ${
                    isSupabaseConfigured && healthResult?.isReachable ? 'bg-emerald-400 animate-pulse' : isSupabaseConfigured ? 'bg-amber-400' : 'bg-slate-500'
                  }`} />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isSupabaseConfigured 
                        ? (healthResult?.isReachable ? 'Supabase Cloud Connected & Active' : 'Supabase Configured (Unreachable / Error)') 
                        : 'Local Secure Mode Active (Offline / In-Memory)'}
                    </h3>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {healthResult?.message || (isSupabaseConfigured 
                        ? 'Testing live connection to Supabase Auth API...' 
                        : 'When Supabase is not connected, Teiln operates in Local Secure Mode with Web Crypto SHA-256 salted password hashing.')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runHealthCheck()}
                  disabled={testing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing...' : 'Test Now'}</span>
                </button>
              </div>

              {/* Diagnostic Items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-800/80 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Auth Engine</div>
                  <div className="font-semibold mt-0.5 text-white flex items-center gap-1">
                    {isSupabaseConfigured ? (
                      <>
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Supabase Auth</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>SHA-256 Salted</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Response Time</div>
                  <div className="font-semibold mt-0.5 text-emerald-400 font-mono">
                    {healthResult?.latencyMs ? `${healthResult.latencyMs} ms` : 'Local Instant'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Password Check</div>
                  <div className="font-semibold mt-0.5 text-white flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Strictly Enforced</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Session Persistence & Token Verification Panel */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Active Session & JWT Token Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRefreshToken}
                    disabled={refreshingToken || !isSupabaseConfigured}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
                    title="Call supabase.auth.refreshSession() to test token refresh"
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshingToken ? 'animate-spin' : ''}`} />
                    <span>Refresh Token</span>
                  </button>
                  <button
                    type="button"
                    onClick={runAuthVerification}
                    disabled={verifyingAuth}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${verifyingAuth ? 'animate-spin' : ''}`} />
                    <span>Verify Now</span>
                  </button>
                </div>
              </div>

              {refreshNotice && (
                <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                  {refreshNotice}
                </div>
              )}

              {verifyingAuth ? (
                <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Validating session and JWT tokens...</span>
                </div>
              ) : authVerification ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Session Status</span>
                      <span className={`font-semibold block truncate ${
                        authVerification.hasSession ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {authVerification.hasSession ? 'Active Session' : 'No Session'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Token Countdown</span>
                      <span className="font-semibold text-emerald-400 block font-mono truncate">
                        {authVerification.token.expiresInText}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Server Validated</span>
                      <span className={`font-semibold block truncate ${
                        authVerification.serverValidation.success ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {authVerification.serverValidation.success 
                          ? `HTTP 200 (${authVerification.serverValidation.latencyMs}ms)` 
                          : authVerification.hasSession ? 'Failed' : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Persistence</span>
                      <span className="font-semibold text-cyan-400 block truncate">
                        {authVerification.persistence.persistsInLocalStorage ? 'localStorage' : 'None'}
                      </span>
                    </div>
                  </div>

                  {authVerification.hasSession && authVerification.token.claims && (
                    <div className="pt-1">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Decoded JWT Payload (Auth Server Claims):
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-[10px] text-emerald-300/90 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
                        <div><span className="text-slate-500">sub:</span> {authVerification.token.claims.sub?.slice(0, 8)}...</div>
                        <div><span className="text-slate-500">role:</span> {authVerification.token.claims.role || 'authenticated'}</div>
                        <div><span className="text-slate-500">email:</span> {authVerification.token.claims.email || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Explanatory notes */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>How Authentication Works in Teiln</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                1. <strong>Password Enforcement:</strong> Every login attempt strictly validates the password against either your live Supabase project credentials or the cryptographic local hash. Incorrect passwords are immediately rejected.
              </p>
              <p className="text-slate-400 leading-relaxed">
                2. <strong>Account Verification:</strong> Signing in with an unregistered email will not bypass authentication or create a phantom account. New users must explicitly register via "Create Free Account".
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: CREDENTIALS CONFIGURATION */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveCredentials} className="mt-5 space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="url"
                  required
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Found in Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project URL
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supabase Public Anon Key (anon public)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Found in Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project API keys (<code className="text-emerald-400">anon public</code>)
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Credentials saved! Reloading application...</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {config.source === 'custom' ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors cursor-pointer"
                >
                  Disconnect & Revert to Local
                </button>
              ) : (
                <span className="text-xs text-slate-500">
                  {config.source === 'env' ? 'Configured via Environment Variables' : 'No custom credentials saved'}
                </span>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Save & Connect
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SCHEMA & RLS */}
        {activeTab === 'schema' && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostgreSQL DDL & RLS Policies</span>
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-56 overflow-y-auto leading-relaxed">
              {SUPABASE_SQL_SCHEMA}
            </pre>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">⚠️ Notice:</span>
                <span className="text-slate-300 leading-relaxed">
                  If Supabase reports <em>"This query includes destructive operations..."</em>, click <strong>"Run this query"</strong>. This cleans up previous policies using <code className="text-emerald-400">DROP POLICY IF EXISTS</code> before applying fresh rules.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
