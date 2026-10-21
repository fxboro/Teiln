import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { 
  Layers, 
  Sparkles, 
  Compass, 
  Database,
  Bell
} from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openUpgradeModal: () => void;
  openSupabaseModal: () => void;
  openNotificationModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  setCurrentView,
  openUpgradeModal,
  openSupabaseModal,
  openNotificationModal,
}) => {
  const { t } = useLanguage();
  const { unreadNotificationCount } = useData();

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 pb-safe"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 cursor-pointer transition-colors ${
            currentView === 'dashboard' || currentView === 'group-details' || currentView === 'budget-dashboard'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label={t('nav.groups')}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">{t('nav.groups')}</span>
        </button>

        <button
          onClick={() => setCurrentView('landing')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 cursor-pointer transition-colors ${
            currentView === 'landing'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label={t('nav.explore')}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">{t('nav.explore')}</span>
        </button>

        {openNotificationModal && (
          <button
            onClick={openNotificationModal}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 cursor-pointer text-slate-400 hover:text-emerald-400 transition-colors relative"
            aria-label={t('notif.title')}
          >
            <div className="relative">
              <Bell className="w-5 h-5 text-emerald-400" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px] flex items-center justify-center font-mono ring-2 ring-[#090d16]">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-1">Alerts</span>
          </button>
        )}

        <button
          onClick={openUpgradeModal}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 cursor-pointer text-amber-400/90 hover:text-amber-300 transition-colors"
          aria-label={t('nav.upgrade')}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">{t('nav.upgrade')}</span>
        </button>

        <button
          onClick={openSupabaseModal}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
          aria-label={t('nav.supabase')}
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Supabase</span>
        </button>
      </div>
    </nav>
  );
};
