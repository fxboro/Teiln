import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle, Database } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

export const OfflineIndicator: React.FC = () => {
  const { t } = useLanguage();
  const { userGroups, userExpenses } = useData();
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setDismissed(false);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (dismissed && !showReconnected) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="fixed bottom-20 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs shadow-lg backdrop-blur-md hover:bg-amber-500/20 transition-all cursor-pointer"
        title="Offline Mode Active"
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-mono text-[11px] font-medium">Offline</span>
      </button>
    );
  }

  if (showReconnected) {
    return (
      <aside 
        aria-label="Online status"
        className="bg-emerald-950/90 border-b border-emerald-500/30 px-4 py-2 text-emerald-200 text-xs flex items-center justify-between shadow-md backdrop-blur-md relative z-40 animate-in slide-in-from-top duration-200"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{t('offline.onlineRestored')}</span>
            <span className="hidden sm:inline text-emerald-300/80">
              — {t('offline.onlineDesc')}
            </span>
          </div>
          <button
            onClick={() => setShowReconnected(false)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      aria-label="Offline status"
      className="bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-amber-950/90 border-b border-amber-500/30 px-4 py-2 text-amber-200 text-xs shadow-lg backdrop-blur-md relative z-40 animate-in slide-in-from-top duration-200"
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-bold flex items-center gap-1.5 text-amber-300">
              <WifiOff className="w-3.5 h-3.5" />
              {t('offline.badge')}
            </span>
            <span className="text-slate-300 hidden md:inline">
              {t('offline.desc')}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Database className="w-3 h-3" />
              {userGroups.length} groups & {userExpenses.length} expenses cached
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            title="Reload from Service Worker Cache"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Refresh Cache</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Dismiss offline banner"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
};
