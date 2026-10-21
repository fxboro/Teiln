import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Bell, 
  BellOff, 
  Check, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Receipt, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToGroup?: (groupId: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToGroup,
}) => {
  const { t } = useLanguage();
  const {
    notifications,
    unreadNotificationCount,
    notificationPrefs,
    updateNotificationPrefs,
    requestPushPermission,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotificationHistory,
    sendManualTestPushNotification,
    isPushSupported,
    pushPermission,
  } = useData();

  const [activeTab, setActiveTab] = useState<'feed' | 'settings'>('feed');
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const res = await requestPushPermission();
    if (res === 'granted') {
      updateNotificationPrefs({ enabled: true });
    }
  };

  const handleTestNotification = async () => {
    setTestSent(true);
    await sendManualTestPushNotification();
    setTimeout(() => setTestSent(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-center-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="notification-center-title" className="text-lg font-bold font-display text-white">
                  {t('notif.title')}
                </h2>
                {unreadNotificationCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[11px] font-mono">
                    {unreadNotificationCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time browser push notifications & alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Close notifications modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-800/50 flex items-center justify-between gap-2 shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Feed</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{t('notif.settings')}</span>
            </button>
          </div>

          {activeTab === 'feed' && notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[11px] text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                title={t('notif.markAllRead')}
              >
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">{t('notif.markAllRead')}</span>
              </button>
              <button
                onClick={clearNotificationHistory}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
                title={t('notif.clearAll')}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Browser Permission Banner (if not yet granted or denied) */}
        {pushPermission !== 'granted' && (
          <div className="p-3.5 mx-6 mt-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {pushPermission === 'denied' ? t('notif.pushBlocked') : t('notif.enablePush')}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {pushPermission === 'denied' ? t('notif.unblockHint') : t('notif.pushDesc')}
                </p>
              </div>
            </div>

            {pushPermission !== 'denied' && (
              <button
                onClick={handleEnablePush}
                className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shrink-0 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
              >
                Allow
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeTab === 'feed' ? (
            notifications.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <BellOff className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t('notif.empty')}</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    {t('notif.emptySub')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={testSent}
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{testSent ? 'Notification Dispatched!' : t('notif.testPush')}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((item) => {
                  const isExpense = item.type === 'expense_added';
                  const isReq = item.type === 'settlement_requested';
                  const isSettled = item.type === 'settlement_completed';

                  return (
                    <div
                      key={item.id}
                      onClick={() => markNotificationAsRead(item.id)}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        !item.read
                          ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {!item.read && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}

                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                          isExpense 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : isReq 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        }`}>
                          {isExpense ? '💸' : isReq ? '🔔' : '✨'}
                        </div>

                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white font-display">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {item.body}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                              {item.group_name}
                            </span>

                            {item.group_id && onNavigateToGroup && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToGroup(item.group_id);
                                  onClose();
                                }}
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <span>Open group</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Settings Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Browser Push Alerts</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Show system popups even when tab is in background
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.enabled && pushPermission === 'granted'}
                    onChange={(e) => {
                      if (e.target.checked && pushPermission !== 'granted') {
                        handleEnablePush();
                      } else {
                        updateNotificationPrefs({ enabled: e.target.checked });
                      }
                    }}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {notificationPrefs.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white">{t('notif.soundToggle')}</h4>
                      <p className="text-[11px] text-slate-400">Play soft chime on incoming notification</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.soundEnabled}
                    onChange={(e) => updateNotificationPrefs({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Trigger Events</h4>
                
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-xs text-slate-200">{t('notif.notifyExpense')}</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.notifyOnExpense}
                    onChange={(e) => updateNotificationPrefs({ notifyOnExpense: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-900">
                  <span className="text-xs text-slate-200">{t('notif.notifyRequest')}</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.notifyOnSettlementRequest}
                    onChange={(e) => updateNotificationPrefs({ notifyOnSettlementRequest: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-900">
                  <span className="text-xs text-slate-200">{t('notif.notifyCompleted')}</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.notifyOnSettlementCompleted}
                    onChange={(e) => updateNotificationPrefs({ notifyOnSettlementCompleted: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Push Test Button */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-950 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Real-Time Engine Test</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Dispatch an instant test notification to check audio and browser push
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={testSent}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-all shadow-md shadow-emerald-500/20"
                >
                  {testSent ? 'Sent!' : t('notif.testPush')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Browser push enabled via Service Worker</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
