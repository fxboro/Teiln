import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { 
  Users, 
  Sparkles, 
  LogOut, 
  Database, 
  ChevronDown,
  BarChart3,
  Bell
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openUpgradeModal: () => void;
  openSupabaseModal: () => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  openConvertGuestModal?: () => void;
  openNotificationModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openUpgradeModal,
  openSupabaseModal,
  openAuthModal,
  openConvertGuestModal,
  openNotificationModal,
}) => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { unreadNotificationCount } = useData();
  const { t } = useLanguage();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getTierBadge = () => {
    if (!currentUser) return null;
    if (currentUser.is_anonymous) {
      return (
        <span className="text-[10px] font-bold text-slate-400 bg-slate-800/90 border border-slate-700/80 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> GUEST
        </span>
      );
    }
    if (currentUser.tier === 'pro') {
      return (
        <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> PRO
        </span>
      );
    }
    if (currentUser.tier === 'supporter') {
      return (
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
          SUPPORTER
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
        FREE
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              T
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              Teiln
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`transition-colors cursor-pointer ${
              currentView === 'dashboard' || currentView === 'group-details'
                ? 'text-emerald-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            {t('nav.dashboard')}
          </button>
          <button
            onClick={() => setCurrentView('budget-dashboard')}
            className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentView === 'budget-dashboard'
                ? 'text-emerald-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('budgetDash.title')}</span>
          </button>
          <button
            onClick={() => setCurrentView('landing')}
            className={`transition-colors cursor-pointer ${
              currentView === 'landing' ? 'text-emerald-400 font-semibold' : 'hover:text-white'
            }`}
          >
            {t('nav.features')}
          </button>
          <button
            onClick={openUpgradeModal}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('nav.upgrade')}</span>
          </button>
          <button
            onClick={openSupabaseModal}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer text-xs"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('nav.supabase')}</span>
          </button>
        </nav>

        {/* Zone 3: Language Toggle & User Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language Toggle (EN / DE) */}
          <LanguageToggle />

          {/* Browser Push Notifications Bell */}
          {openNotificationModal && (
            <button
              onClick={openNotificationModal}
              className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Push Notifications"
              aria-label="Open push notifications"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center font-mono ring-2 ring-[#090d16] animate-pulse">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {/* Guest Save Progress Upgrade Trigger (Prompt requirement: show "Save your progress" upgrade trigger) */}
          {isAuthenticated && currentUser?.is_anonymous && openConvertGuestModal && (
            <button
              onClick={openConvertGuestModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-md shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer animate-pulse"
              title={t('guest.saveProgress')}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline sm:inline">{t('guest.saveProgress')}</span>
            </button>
          )}

          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border transition-colors cursor-pointer text-left ${
                  currentUser.is_anonymous
                    ? 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
                aria-expanded={userDropdownOpen}
                aria-label="User profile and switcher"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className={`text-xs font-semibold truncate max-w-[110px] ${
                    currentUser.is_anonymous ? 'text-slate-400 italic' : 'text-slate-200'
                  }`}>
                    {currentUser.full_name}
                  </span>
                  <div className="mt-0.5">{getTierBadge()}</div>
                </div>

                {/* Grayed-out avatar for anonymous guest users as specified in instructions */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden ${
                  currentUser.is_anonymous
                    ? 'bg-slate-800/90 border border-slate-700/80 grayscale opacity-60 text-slate-400 shadow-inner'
                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                }`}>
                  {currentUser.is_anonymous ? (
                    <span title="Anonymous Guest Session">👤</span>
                  ) : currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.full_name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0f1422] border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  {/* Guest Session Upgrade Notice */}
                  {currentUser.is_anonymous && (
                    <div className="p-3 mb-1 rounded-xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/20 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t('guest.badge')}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {t('guest.banner')}
                      </p>
                      {openConvertGuestModal && (
                        <button
                          onClick={() => {
                            openConvertGuestModal();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full mt-2 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{t('guest.saveProgress')}</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="p-3 border-b border-slate-800/80">
                    <p className={`text-sm font-semibold ${currentUser.is_anonymous ? 'text-slate-300 italic' : 'text-white'}`}>
                      {currentUser.full_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{t('nav.currentPlan')}</span>
                      {getTierBadge()}
                    </div>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        openUpgradeModal();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('nav.upgradeMembership')}</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('nav.signOut')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {t('nav.signIn')}
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3.5 py-2 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {t('nav.getStarted')}
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
