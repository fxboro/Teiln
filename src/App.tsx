/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { GroupDetails } from './components/GroupDetails';
import { MonthlyBudgetDashboard } from './components/MonthlyBudgetDashboard';
import { UpgradeModal } from './components/UpgradeModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AuthModal } from './components/AuthModal';
import { ConvertGuestModal } from './components/ConvertGuestModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthStateIndicator } from './components/AuthStateIndicator';
import { BackgroundGraphic } from './components/BackgroundGraphic';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Lock, Sparkles, CheckCircle2 } from 'lucide-react';

function MainApp() {
  const { currentUser, isAuthenticated, loginAnonymously } = useAuth();
  const { setActiveGroupId, joinGroupByToken } = useData();
  const { t } = useLanguage();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isConvertGuestModalOpen, setIsConvertGuestModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login',
  });

  // Universal Invite Link Handler
  // Supports ?join=grp, ?group=grp, ?invite=grp, /join/:id, /group/:id, /invite/:id, and hash variations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleJoinLink = async () => {
      let targetGroupId: string | null = null;
      let targetToken: string | undefined = undefined;
      let fallbackName: string | undefined = undefined;
      let fallbackCurr: string | undefined = undefined;
      let fallbackBudget: number | undefined = undefined;

      // 1. Check URL query params: ?join=, ?group=, ?invite=, ?token=
      const searchParams = new URLSearchParams(window.location.search);
      targetGroupId = searchParams.get('join') || searchParams.get('group') || searchParams.get('invite') || null;
      targetToken = searchParams.get('token') || undefined;
      fallbackName = searchParams.get('name') || undefined;
      fallbackCurr = searchParams.get('curr') || undefined;
      const budgetParam = searchParams.get('budget');
      if (budgetParam) {
        const parsed = parseFloat(budgetParam);
        if (!isNaN(parsed)) fallbackBudget = parsed;
      }

      // 2. Check URL pathname: /join/:id, /group/:id, /invite/:id
      if (!targetGroupId) {
        const pathMatch = window.location.pathname.match(/\/(join|group|invite)\/([a-zA-Z0-9_.-]+)/i);
        if (pathMatch) {
          targetGroupId = pathMatch[2];
        }
      }

      // 3. Check hash URL: #/join/:id, #join=:id, #/group/:id
      if (!targetGroupId && window.location.hash) {
        const hashClean = window.location.hash.replace(/^#/, '');
        const hashQueryPart = hashClean.includes('?') ? hashClean.split('?')[1] : hashClean;
        const hashParams = new URLSearchParams(hashQueryPart);
        targetGroupId = hashParams.get('join') || hashParams.get('group') || hashParams.get('invite') || null;
        if (!targetToken) targetToken = hashParams.get('token') || undefined;

        if (!targetGroupId) {
          const hashMatch = window.location.hash.match(/(?:join|group|invite)[=/]([a-zA-Z0-9_.-]+)/i);
          if (hashMatch) {
            targetGroupId = hashMatch[1];
          }
        }
      }

      // If token provided without explicit group ID, use token as lookup identifier
      if (!targetGroupId && targetToken) {
        targetGroupId = targetToken;
      }

      if (targetGroupId) {
        let activeUser = currentUser;

        // Auto-create guest session if none exists
        if (!activeUser) {
          try {
            activeUser = await loginAnonymously('Guest Friend');
          } catch (err) {
            console.error('Anonymous login failed:', err);
          }
        }

        if (activeUser) {
          const res = await joinGroupByToken(
            targetGroupId, 
            targetToken, 
            activeUser.id,
            {
              name: fallbackName,
              baseCurrency: (fallbackCurr as any) || undefined,
              budgetLimit: fallbackBudget,
            }
          );

          if (res.success && res.group) {
            setActiveGroupId(res.group.id);
            setCurrentView('group-details');
            setJoinNotice(`Welcome! Joined group "${res.group.name}" via Invite Link ✨`);
            setTimeout(() => setJoinNotice(null), 6000);

            // Clean query parameters from address bar cleanly without page reload
            try {
              const cleanPath = window.location.pathname.replace(/\/(join|group|invite)\/.*$/, '') || '/';
              window.history.replaceState({}, document.title, cleanPath);
            } catch {
              // ignore
            }
          } else if (res.error) {
            setJoinNotice(res.error);
            setTimeout(() => setJoinNotice(null), 6000);
          }
        }
      }
    };

    handleJoinLink();
    window.addEventListener('popstate', handleJoinLink);
    window.addEventListener('hashchange', handleJoinLink);

    return () => {
      window.removeEventListener('popstate', handleJoinLink);
      window.removeEventListener('hashchange', handleJoinLink);
    };
  }, []);

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setCurrentView('group-details');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setCurrentView('dashboard');
    } else {
      setAuthModalState({ isOpen: true, mode: 'login' });
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col relative selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Original, minimalistic background vector graphic */}
      <BackgroundGraphic />

      {/* Offline connectivity banner & cached data indicator */}
      <OfflineIndicator />

      {/* Real-time Supabase Auth state notification toast & token validator */}
      <AuthStateIndicator onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />

      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (!isAuthenticated && (view === 'dashboard' || view === 'group-details')) {
            setAuthModalState({ isOpen: true, mode: 'login' });
          } else {
            setCurrentView(view);
          }
        }}
        openUpgradeModal={() => setIsUpgradeModalOpen(true)}
        openSupabaseModal={() => setIsSupabaseModalOpen(true)}
        openAuthModal={(mode) => setAuthModalState({ isOpen: true, mode })}
        openConvertGuestModal={() => setIsConvertGuestModalOpen(true)}
        openNotificationModal={() => setIsNotificationModalOpen(true)}
      />

      {/* Floating Magic Join Banner / Toast */}
      {joinNotice && (
        <div className="fixed top-20 right-4 z-50 p-3.5 px-4 rounded-2xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 text-xs shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{joinNotice}</span>
        </div>
      )}

      <main className="flex-1 relative z-10">
        {currentView === 'landing' && (
          <LandingPage
            onGetStarted={handleGetStarted}
            openUpgradeModal={() => setIsUpgradeModalOpen(true)}
            openSupabaseModal={() => setIsSupabaseModalOpen(true)}
          />
        )}

        {!isAuthenticated && (currentView === 'dashboard' || currentView === 'group-details') ? (
          <div className="max-w-md mx-auto px-4 py-20 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white">{t('auth.protectedTitle')}</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              {t('auth.protectedDesc')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setAuthModalState({ isOpen: true, mode: 'login' })}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {t('nav.signIn')}
              </button>
              <button
                onClick={() => setAuthModalState({ isOpen: true, mode: 'register' })}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer"
              >
                {t('auth.createButton')}
              </button>
              <button
                onClick={async () => {
                  await loginAnonymously('Guest Friend');
                  setCurrentView('dashboard');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs active:scale-95 transition-all cursor-pointer"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <Dashboard
                onSelectGroup={handleSelectGroup}
                openUpgradeModal={() => setIsUpgradeModalOpen(true)}
                openConvertGuestModal={() => setIsConvertGuestModalOpen(true)}
              />
            )}

            {currentView === 'budget-dashboard' && (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
                <MonthlyBudgetDashboard
                  onSelectGroup={handleSelectGroup}
                  openUpgradeModal={() => setIsUpgradeModalOpen(true)}
                />
              </div>
            )}

            {currentView === 'group-details' && (
              <GroupDetails
                onBack={handleBackToDashboard}
                openUpgradeModal={() => setIsUpgradeModalOpen(true)}
                openConvertGuestModal={() => setIsConvertGuestModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      <BottomNav
        currentView={currentView}
        setCurrentView={(view) => {
          if (!isAuthenticated && (view === 'dashboard' || view === 'group-details')) {
            setAuthModalState({ isOpen: true, mode: 'login' });
          } else {
            setCurrentView(view);
          }
        }}
        openUpgradeModal={() => setIsUpgradeModalOpen(true)}
        openSupabaseModal={() => setIsSupabaseModalOpen(true)}
        openNotificationModal={() => setIsNotificationModalOpen(true)}
      />

      {/* Global Modals */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalState.isOpen}
        mode={authModalState.mode}
        onClose={() => setAuthModalState({ isOpen: false, mode: 'login' })}
      />

      <ConvertGuestModal
        isOpen={isConvertGuestModalOpen}
        onClose={() => setIsConvertGuestModalOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onNavigateToGroup={(groupId) => {
          setActiveGroupId(groupId);
          setCurrentView('group-details');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <MainApp />
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
