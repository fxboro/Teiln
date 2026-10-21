import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { CurrencyCode, ExpenseCategory, SimplifiedDebt, Milestone } from '../types';
import { AddExpenseModal } from './AddExpenseModal';
import { SettleUpModal } from './SettleUpModal';
import { InviteMemberModal } from './InviteMemberModal';
import { BudgetTracker } from './BudgetTracker';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { LanguageToggle } from './LanguageToggle';
import { MilestoneModal } from './MilestoneModal';
import { TimelineFilter } from './TimelineFilter';
import { 
  ArrowLeft, 
  Plus, 
  UserPlus, 
  Download, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  PieChart, 
  Settings as SettingsIcon, 
  Archive, 
  CheckCircle, 
  Send, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  Receipt,
  Lock,
  SmilePlus,
  Camera,
  Calendar,
  Flag,
  BookOpen,
  Edit2,
  LayoutList,
  ChevronDown,
  Repeat,
  Bell
} from 'lucide-react';
import { RecurringExpensesManager } from './RecurringExpensesManager';

interface GroupDetailsProps {
  onBack: () => void;
  openUpgradeModal: () => void;
  openConvertGuestModal?: () => void;
}

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  dining: '🍽️',
  groceries: '🛒',
  housing: '🏠',
  transport: '🚗',
  entertainment: '🎟️',
  travel: '✈️',
  utilities: '💡',
  shopping: '🛍️',
  other: '📦',
};

export const GroupDetails: React.FC<GroupDetailsProps> = ({
  onBack,
  openUpgradeModal,
  openConvertGuestModal,
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { 
    activeGroup, 
    activeMembers, 
    activeExpenses, 
    activeSettlements, 
    activeMessages, 
    activeBalances,
    activeMilestones,
    activeRecurringExpenses,
    activeSettlementRequests,
    respondToSettlementRequest,
    deleteExpense,
    assignExpenseToMilestone,
    deleteMilestone,
    sendMessage,
    reactions,
    toggleReaction,
    archiveGroup,
    updateGroup,
    exportGroupData,
  } = useData();

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'chat' | 'timeline' | 'recurring' | 'budget' | 'analytics' | 'settings'>('expenses');
  const [settleModalMode, setSettleModalMode] = useState<'record' | 'request'>('record');
  
  // Milestones & Diary state
  const [expenseViewMode, setExpenseViewMode] = useState<'diary' | 'list'>('diary');
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [defaultMilestoneIdForExpense, setDefaultMilestoneIdForExpense] = useState<string | null>(null);
  const [openExpensePickerId, setOpenExpensePickerId] = useState<string | null>(null);
  const [reassigningExpenseId, setReassigningExpenseId] = useState<string | null>(null);
  const [expandedReceiptExpenseId, setExpandedReceiptExpenseId] = useState<string | null>(null);

  // Filtered expenses based on timeline filter selection
  const filteredExpenses = useMemo(() => {
    if (timelineFilter === 'all') return activeExpenses;
    if (timelineFilter === 'unassigned') return activeExpenses.filter(e => !e.milestone_id);
    return activeExpenses.filter(e => e.milestone_id === timelineFilter);
  }, [activeExpenses, timelineFilter]);

  // Filtered milestones based on timeline filter selection
  const filteredMilestones = useMemo(() => {
    if (timelineFilter === 'all') return activeMilestones;
    if (timelineFilter === 'unassigned') return [];
    return activeMilestones.filter(m => m.id === timelineFilter);
  }, [activeMilestones, timelineFilter]);

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [selectedDebtToSettle, setSelectedDebtToSettle] = useState<SimplifiedDebt | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const [openChatPickerMsgId, setOpenChatPickerMsgId] = useState<string | null>(null);

  // Settings state
  const [editName, setEditName] = useState(activeGroup?.name || '');
  const [editCurrency, setEditCurrency] = useState<CurrencyCode>(activeGroup?.base_currency || 'USD');

  if (!activeGroup) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-400">
        <p>No active group selected.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 rounded-xl text-white text-xs cursor-pointer">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isSupporterOrPro = currentUser?.tier === 'supporter' || currentUser?.tier === 'pro';

  const userNet = currentUser ? (activeBalances.netBalances[currentUser.id] || 0) : 0;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(activeGroup.id, chatInput);
    setChatInput('');
  };

  const handleOpenSettleDebt = (debt: SimplifiedDebt, mode: 'record' | 'request' = 'record') => {
    setSelectedDebtToSettle(debt);
    setSettleModalMode(mode);
    setIsSettleUpOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateGroup(activeGroup.id, {
      name: editName.trim() || activeGroup.name,
      base_currency: editCurrency,
    });
  };

  const isAnonymous = Boolean(currentUser?.is_anonymous);

  const handleExport = (format: 'csv' | 'json') => {
    if (isAnonymous) {
      if (openConvertGuestModal) openConvertGuestModal();
      return;
    }
    if (!isSupporterOrPro) {
      openUpgradeModal();
      return;
    }
    exportGroupData(activeGroup.id, format);
  };

  const handleOpenAddExpenseToMilestone = (milestoneId?: string) => {
    setDefaultMilestoneIdForExpense(milestoneId || null);
    setIsAddExpenseOpen(true);
  };

  const handleOpenCreateMilestone = () => {
    setEditingMilestone(null);
    setIsMilestoneModalOpen(true);
  };

  const handleOpenEditMilestone = (m: Milestone) => {
    setEditingMilestone(m);
    setIsMilestoneModalOpen(true);
  };

  const renderExpenseCard = (exp: any, showMilestoneBadge: boolean = false) => {
    const mySplit = exp.splits.find((s: any) => s.user_id === currentUser?.id);
    const isPayer = exp.paid_by_user_id === currentUser?.id;
    const isReceiptExpanded = expandedReceiptExpenseId === exp.id;

    const expReactions = (reactions || []).filter((r: any) => r.target_id === exp.id);
    const rxMap = new Map<string, { count: number; users: string[]; hasReacted: boolean }>();
    for (const r of expReactions) {
      const existing = rxMap.get(r.emoji) || { count: 0, users: [], hasReacted: false };
      existing.count += 1;
      if (r.user_name) existing.users.push(r.user_name);
      if (currentUser && r.user_id === currentUser.id) existing.hasReacted = true;
      rxMap.set(r.emoji, existing);
    }
    const rxGroups = Array.from(rxMap.entries()).map(([emoji, data]) => ({ emoji, ...data }));

    return (
      <div
        key={exp.id}
        className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1320] border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col gap-2.5 group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shrink-0 mt-0.5 shadow-sm">
              {CATEGORY_ICONS[exp.category as ExpenseCategory] || '📦'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white truncate font-display">
                  {exp.title}
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  {exp.date}
                </span>
                {showMilestoneBadge && exp.milestone && (
                  <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[10px] font-semibold flex items-center gap-1">
                    <span>{exp.milestone.icon || '📍'}</span>
                    <span className="truncate max-w-[130px]">{exp.milestone.title}</span>
                  </span>
                )}
                {exp.recurring_parent_id && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                    <Repeat className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{t('rec.badge')}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {t('gd.paidBy')} <strong className="text-slate-200">{exp.payer?.full_name || 'Someone'}</strong> · {t('gd.splitWays', { n: exp.splits.length })}
              </p>
              {exp.notes && (
                <p className="text-[11px] text-slate-400 italic mt-0.5">
                  "{exp.notes}"
                </p>
              )}

              {/* Itemized receipt items toggle */}
              {exp.receipt_items && exp.receipt_items.length > 0 && (
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedReceiptExpenseId(isReceiptExpanded ? null : exp.id)}
                    className="text-[10px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>{isReceiptExpanded ? 'Hide receipt items' : `View ${exp.receipt_items.length} receipt items`}</span>
                  </button>
                  {isReceiptExpanded && (
                    <div className="mt-1.5 p-2 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] space-y-1">
                      {exp.receipt_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-slate-300 font-mono">
                          <span className="truncate">{item.name}</span>
                          <span className="text-slate-400 font-bold">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <p className="text-sm sm:text-base font-bold font-mono text-white tabular-nums">
                ${exp.amount.toFixed(2)}
              </p>
              {mySplit ? (
                <p className={`text-[11px] font-mono tabular-nums ${
                  isPayer ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}>
                  {isPayer 
                    ? `${t('gd.youLent')} $${(exp.amount - mySplit.amount).toFixed(2)}`
                    : `${t('gd.yourShare')} $${mySplit.amount.toFixed(2)}`}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">{t('gd.notInvolved')}</p>
              )}
            </div>

            <button
              onClick={() => deleteExpense(exp.id)}
              className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
              title="Delete expense"
              aria-label="Delete expense"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Actions: Emoji reactions & Day assignment */}
        <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2 flex-wrap">
          
          {/* Reactions bar */}
          <div className="flex items-center gap-1 flex-wrap">
            {rxGroups.map(({ emoji, count, users, hasReacted }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => toggleReaction(exp.id, 'expense', emoji)}
                className={`px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 border transition-all active:scale-90 cursor-pointer ${
                  hasReacted
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
                title={`${users.join(', ')}`}
              >
                <span className="text-xs leading-none">{emoji}</span>
                <span className="font-mono text-[10px]">{count}</span>
              </button>
            ))}

            {/* Emoji picker trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenExpensePickerId(openExpensePickerId === exp.id ? null : exp.id)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-[10px] transition-all cursor-pointer flex items-center gap-1"
                title="Add reaction"
              >
                <SmilePlus className="w-3 h-3" />
                {rxGroups.length === 0 && <span className="text-[10px] text-slate-500">React</span>}
              </button>

              {openExpensePickerId === exp.id && (
                <div className="absolute left-0 bottom-full mb-1 z-30 p-1.5 rounded-xl bg-slate-950 border border-slate-700 shadow-xl flex items-center gap-1 animate-in zoom-in-95">
                  {['👍', '❤️', '🔥', '🎉', '😂', '👏', '💸'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        toggleReaction(exp.id, 'expense', emoji);
                        setOpenExpensePickerId(null);
                      }}
                      className="w-6 h-6 hover:bg-slate-850 rounded-lg flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Day assignment selector */}
          {activeMilestones.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] ml-auto">
              <span className="text-[10px] text-slate-500">Day:</span>
              <select
                value={exp.milestone_id || ''}
                onChange={(e) => assignExpenseToMilestone(exp.id, e.target.value || null)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[11px] text-slate-300 hover:text-white focus:outline-none focus:border-teal-500 cursor-pointer max-w-[150px] truncate"
              >
                <option value="">Ungrouped</option>
                {activeMilestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon || '📍'} {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 pb-28 md:pb-16 space-y-5">
      
      {/* ZERO-FRICTION GUEST SESSION BANNER & UPGRADE TRIGGER */}
      {isAnonymous && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0e1726] to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {t('guest.badge')}
                </span>
                <h3 className="text-sm font-semibold text-white">
                  {t('guest.banner')}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('guest.convertDesc')}
              </p>
            </div>
          </div>
          {openConvertGuestModal && (
            <button
              onClick={openConvertGuestModal}
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('guest.saveProgress')}</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('nav.dashboard')}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Export to CSV/JSON (Prompt requirement: disable CSV export button for anonymous users) */}
          <div className="relative group">
            <button
              onClick={() => handleExport('csv')}
              disabled={isAnonymous}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isAnonymous
                  ? 'bg-slate-950/60 border border-slate-800/80 text-slate-600 cursor-not-allowed opacity-60'
                  : isSupporterOrPro
                    ? 'bg-slate-900 border border-slate-700 text-slate-200 hover:text-emerald-400 cursor-pointer'
                    : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-amber-400 cursor-pointer'
              }`}
              title={
                isAnonymous
                  ? t('guest.exportDisabled')
                  : isSupporterOrPro
                    ? 'Export Group Data to CSV'
                    : 'Export requires Supporter or Pro tier'
              }
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('gd.export')}</span>
              {isAnonymous ? (
                <Lock className="w-3 h-3 text-slate-600" />
              ) : (
                !isSupporterOrPro && <Sparkles className="w-3 h-3 text-amber-400" />
              )}
            </button>
          </div>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{t('gd.invite')}</span>
          </button>

          <button
            onClick={() => {
              setSelectedDebtToSettle(null);
              setIsSettleUpOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {t('gd.settleUp')}
          </button>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="p-1.5 sm:px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Scan Receipt with Camera & AI"
            aria-label="Scan Receipt"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden md:inline">Scan Receipt</span>
          </button>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('gd.addExpense')}</span>
          </button>
        </div>
      </div>

      {/* Group Hero Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0e1424] to-[#090e1a] border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider">{activeGroup.base_currency}</span>
              <span aria-hidden="true">·</span>
              <span>{activeMembers.length} {t('gd.members')}</span>
              {activeGroup.is_archived && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Archive className="w-3 h-3" /> {t('gd.archived')}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white mt-1">
              {activeGroup.name}
            </h1>
            {activeGroup.description && (
              <p className="text-xs text-slate-400 mt-1">{activeGroup.description}</p>
            )}
          </div>

          {/* User Net Position inside this Group */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 min-w-[180px] text-right sm:text-right">
            <span className="text-[11px] font-medium text-slate-400">{t('gd.groupBalance')}</span>
            <div className={`text-xl sm:text-2xl font-bold font-display mt-0.5 tabular-nums ${
              userNet > 0.009 ? 'text-emerald-400' : userNet < -0.009 ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {userNet > 0.009 
                ? `+$${userNet.toFixed(2)}` 
                : userNet < -0.009 
                  ? `-$${Math.abs(userNet).toFixed(2)}` 
                  : `${t('gd.allSquared')}`}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {userNet > 0.009 ? t('dash.youAreOwed') : userNet < -0.009 ? t('dash.youOwe') : t('gd.allSquared')}
            </p>
          </div>
        </div>

        {/* Member Avatars Row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 text-[11px] mr-1">{t('gd.members')}:</span>
            {activeMembers.map((m) => {
              const isMemberAnonymous = m.user?.is_anonymous || (m.user_id === currentUser?.id && currentUser?.is_anonymous);
              const isCurrentUser = m.user_id === currentUser?.id;
              return (
                <div 
                  key={m.user_id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium ${
                    isMemberAnonymous
                      ? 'bg-slate-950/90 border-slate-700/60 text-slate-400'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isMemberAnonymous ? 'bg-slate-500' : 'bg-emerald-400'}`} />
                  <span className={isMemberAnonymous ? 'italic' : ''}>{m.user.full_name}</span>
                  {isCurrentUser && (
                    <span className={`text-[10px] font-bold ${isMemberAnonymous ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isMemberAnonymous ? '(Guest · You)' : '(You)'}
                    </span>
                  )}
                  {!isCurrentUser && isMemberAnonymous && (
                    <span className="text-[10px] text-slate-500 font-medium">(Guest)</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 font-mono tabular-nums">
            {t('gd.totalSpent')}: <strong className="text-white">${activeBalances.totalGroupSpent.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'expenses' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{t('gd.tabExpenses')} ({activeExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'balances' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('gd.tabBalances')}</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'chat' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
          <span>{t('gd.tabChat')} ({activeMessages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'timeline' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{t('gd.tabHistory')}</span>
        </button>

        <button
          onClick={() => setActiveTab('recurring')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'recurring' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Repeat className="w-3.5 h-3.5 text-teal-400" />
          <span>{t('gd.tabRecurring')} ({activeRecurringExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'budget' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('gd.tabBudget')}</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-purple-400" />
          <span>{t('gd.tabAnalytics')}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>{t('gd.tabSettings')}</span>
        </button>
      </div>

      {/* TAB CONTENT 1: EXPENSES & EVENT TIMELINES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          
          {/* Timeline Filter UI Component at the top of Group Details View */}
          <TimelineFilter
            milestones={activeMilestones}
            selectedFilter={timelineFilter}
            onSelectFilter={setTimelineFilter}
            expenses={activeExpenses}
            baseCurrency={activeGroup.base_currency}
            onCreateMilestone={handleOpenCreateMilestone}
          />

          {/* View Mode Bar & Milestone Controls */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0e1320] border border-slate-800 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            
            {/* View Switcher: Timeline Diary vs Compact List */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setExpenseViewMode('diary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  expenseViewMode === 'diary'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>{t('milestones.viewDiary')}</span>
              </button>

              <button
                type="button"
                onClick={() => setExpenseViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  expenseViewMode === 'list'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>{t('milestones.viewList')}</span>
              </button>
            </div>

            {/* Actions: Add Day/Milestone & Log Expense */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleOpenCreateMilestone}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/30 hover:border-teal-400/50 text-teal-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Flag className="w-3.5 h-3.5 text-teal-400" />
                <span>{t('milestones.addBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddExpenseToMilestone(timelineFilter !== 'all' && timelineFilter !== 'unassigned' ? timelineFilter : undefined)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('gd.addExpense')}</span>
              </button>
            </div>
          </div>

          {/* Empty state when no expenses and no milestones */}
          {activeExpenses.length === 0 && activeMilestones.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0e1320] border border-slate-800 text-center">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white font-display">{t('gd.noExpenses')}</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {t('milestones.emptyPromptSub')}
              </p>
              <div className="flex items-center justify-center gap-2.5 mt-4">
                <button
                  onClick={handleOpenCreateMilestone}
                  className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {t('milestones.createFirst')}
                </button>
                <button
                  onClick={() => handleOpenAddExpenseToMilestone()}
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {t('gd.firstExpense')}
                </button>
              </div>
            </div>
          ) : expenseViewMode === 'diary' ? (
            /* TIMELINE DIARY VIEW */
            <div className="space-y-6">
              
              {/* If no milestones yet but has expenses: Prompt banner */}
              {activeMilestones.length === 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/30 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-lg shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {t('milestones.emptyPrompt')}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t('milestones.emptyPromptSub')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateMilestone}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-colors"
                  >
                    {t('milestones.createFirst')}
                  </button>
                </div>
              )}

              {/* Milestone Chapters Timeline Spine */}
              {filteredMilestones.length > 0 && (
                <div className="space-y-6 relative before:absolute before:left-5 sm:before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-teal-500/50 via-teal-500/20 before:to-slate-800">
                  {filteredMilestones.map((m, idx) => {
                    const mExpenses = activeExpenses.filter(e => e.milestone_id === m.id);
                    const mTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);

                    return (
                      <div 
                        key={m.id} 
                        id={`milestone-section-${m.id}`}
                        className="relative pl-12 sm:pl-14 space-y-3 pt-1"
                      >
                        {/* Timeline Node on Spine */}
                        <div className="absolute left-0 top-1.5 -translate-x-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0e1320] border-2 border-teal-400/60 shadow-lg shadow-teal-500/20 flex items-center justify-center text-lg sm:text-xl shrink-0 z-10 ring-4 ring-[#070a12]">
                          {m.icon || '📍'}
                        </div>

                        {/* Milestone Header Banner */}
                        <div className="p-4 sm:p-4.5 rounded-3xl bg-gradient-to-r from-[#0e1726] to-[#0c121e] border border-teal-500/20 shadow-md space-y-2.5">
                          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-mono font-bold text-[10px] uppercase tracking-wider">
                                  {m.day_number !== undefined ? `DAY ${m.day_number}` : `CHAPTER ${idx + 1}`}
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                                  {m.title}
                                </h3>
                                {m.date && (
                                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-500" />
                                    {m.date}
                                  </span>
                                )}
                              </div>
                              
                              {m.description && (
                                <p className="text-xs text-slate-300 italic flex items-center gap-1.5 pt-0.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>"{m.description}"</span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 sm:ml-auto shrink-0">
                              <div className="text-right">
                                <p className="text-xs sm:text-sm font-bold font-mono text-teal-300 tabular-nums">
                                  ${mTotal.toFixed(2)}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {mExpenses.length} {mExpenses.length === 1 ? 'charge' : 'charges'}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenAddExpenseToMilestone(m.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/30 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                title="Add expense to this day"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Add</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditMilestone(m)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit milestone"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Milestone Expenses List */}
                        {mExpenses.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-center">
                            <p className="text-xs text-slate-500">
                              No charges logged under this milestone yet.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenAddExpenseToMilestone(m.id)}
                              className="mt-2 text-xs font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
                            >
                              + Log an expense to {m.title.split(':')[0] || 'this day'}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {mExpenses.map(exp => renderExpenseCard(exp, false))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ungrouped / General Expenses Section (shown when viewing All Time or Ungrouped filter) */}
              {(() => {
                if (timelineFilter !== 'all' && timelineFilter !== 'unassigned') return null;
                const unassigned = activeExpenses.filter(e => !e.milestone_id);
                if (unassigned.length === 0) {
                  if (timelineFilter === 'unassigned') {
                    return (
                      <div className="p-8 rounded-3xl bg-[#0e1320] border border-slate-800 text-center space-y-2">
                        <span className="text-2xl">📦</span>
                        <p className="text-xs text-slate-400">No ungrouped charges. All expenses are assigned to milestones!</p>
                        <button
                          type="button"
                          onClick={() => setTimelineFilter('all')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold cursor-pointer"
                        >
                          Show All Time
                        </button>
                      </div>
                    );
                  }
                  return null;
                }
                const unassignedTotal = unassigned.reduce((sum, e) => sum + e.amount, 0);

                return (
                  <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📦</span>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            {t('milestones.unassignedTitle')}
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            {t('milestones.unassignedSub')} · {unassigned.length} items
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-400 tabular-nums">
                        ${unassignedTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {unassigned.map(exp => renderExpenseCard(exp, false))}
                    </div>
                  </div>
                );
              })()}

            </div>
          ) : (
            /* COMPACT LIST VIEW */
            <div className="space-y-2.5">
              {filteredExpenses.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#0e1320] border border-slate-800 text-center space-y-2">
                  <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No expenses found for this timeline selection.</p>
                  <button
                    type="button"
                    onClick={() => setTimelineFilter('all')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold cursor-pointer"
                  >
                    Reset Filter to All Time
                  </button>
                </div>
              ) : (
                filteredExpenses.map(exp => renderExpenseCard(exp, true))
              )}
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT 2: BALANCES & DEBT SIMPLIFICATION */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          
          {/* Section A: Individual Net Balances */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0e1320] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-white">{t('gd.tabBalances')}</h3>
                <p className="text-xs text-slate-400">Total credited vs owed per member</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {activeMembers.length} {t('gd.members')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeMembers.map((m) => {
                const bal = activeBalances.netBalances[m.user_id] || 0;
                const isPositive = bal > 0.009;
                const isNegative = bal < -0.009;

                return (
                  <div
                    key={m.user_id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center shrink-0">
                        {m.user.full_name.slice(0, 1)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">
                          {m.user.full_name} {m.user_id === currentUser?.id ? '(You)' : ''}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{m.user.email}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold font-mono tabular-nums ${
                        isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {isPositive ? `+$${bal.toFixed(2)}` : isNegative ? `-$${Math.abs(bal).toFixed(2)}` : '$0.00'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {isPositive ? t('dash.youAreOwed') : isNegative ? t('dash.youOwe') : t('gd.allSquared')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Debt Simplification Engine */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0e1320] via-[#0d1624] to-[#0e1320] border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">
                    {t('gd.debtPlan')}
                  </h3>
                  <p className="text-xs text-emerald-400/90">
                    {t('gd.debtPlanSub')}
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl font-mono">
                {t('gd.transfersNeeded', { n: activeBalances.simplifiedDebts.length })}
              </span>
            </div>

            {/* Pending Settlement Requests Banner */}
            {activeSettlementRequests.filter(r => r.status === 'pending').length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    {t('settle.requestBadge')} ({activeSettlementRequests.filter(r => r.status === 'pending').length})
                  </span>
                </div>

                <div className="space-y-2">
                  {activeSettlementRequests.filter(r => r.status === 'pending').map((req) => {
                    const isDebtor = req.from_user_id === currentUser?.id;
                    const isCreditor = req.to_user_id === currentUser?.id;
                    const currencySymbol = req.currency === 'EUR' ? '€' : req.currency === 'GBP' ? '£' : '$';

                    return (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white">
                            <span className="text-amber-300">{req.to_user?.full_name || 'Creditor'}</span> requested settlement of{' '}
                            <strong className="text-white font-mono">{currencySymbol}{req.amount.toFixed(2)}</strong> from{' '}
                            <span className="text-slate-300">{req.from_user?.full_name || 'Debtor'}</span>
                          </p>
                          {req.notes && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">"{req.notes}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isDebtor ? (
                            <>
                              <button
                                onClick={() => respondToSettlementRequest(req.id, 'accept')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                              >
                                {t('settle.requestAccept')}
                              </button>
                              <button
                                onClick={() => respondToSettlementRequest(req.id, 'decline')}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                              >
                                {t('settle.requestDecline')}
                              </button>
                            </>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[11px]">
                              {t('settle.requestPending')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeBalances.simplifiedDebts.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">{t('gd.allSquared')}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t('gd.noDebts')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeBalances.simplifiedDebts.map((debt, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t('gd.debtor')}</span>
                        <p className="text-xs font-bold text-white truncate">{debt.from_user?.full_name || 'Member'}</p>
                      </div>

                      <div className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg text-slate-400 text-xs">
                        <span>{t('gd.pays')}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                      </div>

                      <div className="text-left">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t('gd.creditor')}</span>
                        <p className="text-xs font-bold text-white truncate">{debt.to_user?.full_name || 'Member'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                      <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                        ${debt.amount.toFixed(2)}
                      </span>

                      {/* Request Push button */}
                      <button
                        onClick={() => handleOpenSettleDebt(debt, 'request')}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        title="Send browser push notification request to settle this debt"
                      >
                        <Bell className="w-3 h-3 text-amber-400" />
                        <span className="hidden sm:inline">Request Push</span>
                      </button>

                      <button
                        onClick={() => handleOpenSettleDebt(debt, 'record')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                      >
                        {t('gd.settleUp')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT 3: CHAT / MESSAGE BOARD */}
      {activeTab === 'chat' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#0e1320] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold font-display text-white">{t('gd.chatTitle')}</h3>
              <p className="text-xs text-slate-400">{t('gd.chatSub')}</p>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t('gd.liveSync')}
            </span>
          </div>

          {/* Messages Feed */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {activeMessages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                {t('gd.noMessages')}
              </p>
            ) : (
              activeMessages.map((msg) => {
                const isMe = msg.user_id === currentUser?.id;
                const isSystem = msg.message_type !== 'chat';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center text-xs text-slate-400">
                      <span>{msg.content}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                }

                const msgReactions = (reactions || []).filter((r: any) => r.target_id === msg.id);
                const rxMap = new Map<string, { count: number; users: string[]; hasReacted: boolean }>();
                for (const r of msgReactions) {
                  const existing = rxMap.get(r.emoji) || { count: 0, users: [], hasReacted: false };
                  existing.count += 1;
                  if (r.user_name) existing.users.push(r.user_name);
                  if (currentUser && r.user_id === currentUser.id) existing.hasReacted = true;
                  rxMap.set(r.emoji, existing);
                }
                const rxGroups = Array.from(rxMap.entries()).map(([emoji, data]) => ({ emoji, ...data }));

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                  >
                    <span className="text-[10px] text-slate-500 px-1 mb-0.5">
                      {msg.user?.full_name || 'Member'} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div
                      className={`px-3.5 py-2 rounded-2xl max-w-sm text-xs relative ${
                        isMe
                          ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'
                          : 'bg-slate-900 text-slate-200 border border-slate-800'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Chat Reactions Bar */}
                    <div className={`flex items-center gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {rxGroups.map(({ emoji, count, users, hasReacted }) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleReaction(msg.id, 'message', emoji)}
                          className={`px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 border transition-all active:scale-90 cursor-pointer ${
                            hasReacted
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                          title={`${users.join(', ')}`}
                        >
                          <span className="text-xs leading-none">{emoji}</span>
                          <span className="font-mono text-[10px]">{count}</span>
                        </button>
                      ))}

                      {/* Add reaction trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenChatPickerMsgId(openChatPickerMsgId === msg.id ? null : msg.id)}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-[10px] transition-all cursor-pointer"
                          title="Add reaction"
                        >
                          <SmilePlus className="w-3 h-3" />
                        </button>

                        {openChatPickerMsgId === msg.id && (
                          <div className={`absolute bottom-full mb-1 z-30 p-1.5 rounded-xl bg-slate-950 border border-slate-700 shadow-xl flex items-center gap-1 ${isMe ? 'right-0' : 'left-0'}`}>
                            {['👍', '❤️', '🔥', '🎉', '😂', '👏'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  toggleReaction(msg.id, 'message', emoji);
                                  setOpenChatPickerMsgId(null);
                                }}
                                className="w-6 h-6 hover:bg-slate-850 rounded-lg flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t('gd.chatPlaceholder')}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-semibold transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT 4: TIMELINE & SETTLEMENT HISTORY */}
      {activeTab === 'timeline' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0e1320] border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold font-display text-white">{t('gd.timelineTitle')}</h3>
            <p className="text-xs text-slate-400">{t('gd.timelineSub')}</p>
          </div>

          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {activeSettlements.map((stl) => (
              <div key={stl.id} className="relative pl-7 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute left-2 top-1.5 -translate-x-1/2 ring-4 ring-[#0e1320]" />
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-semibold">{t('settle.success')}</span>
                    <p className="text-slate-200 mt-0.5">
                      {stl.payer?.full_name} sent ${stl.amount.toFixed(2)} to {stl.receiver?.full_name}
                    </p>
                    {stl.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">"{stl.notes}"</p>}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{stl.date}</span>
                </div>
              </div>
            ))}

            {activeExpenses.map((exp) => (
              <div key={exp.id} className="relative pl-7 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full absolute left-2 top-1.5 -translate-x-1/2 ring-4 ring-[#0e1320] ${
                  exp.milestone ? 'bg-teal-400' : 'bg-slate-600'
                }`} />
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-200 font-semibold">{exp.title}</span>
                      {exp.milestone && (
                        <span className="px-1.5 py-0.2 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-mono">
                          {exp.milestone.icon || '📍'} {exp.milestone.title.split(':')[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      ${exp.amount.toFixed(2)} fronted by {exp.payer?.full_name}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{exp.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: RECURRING EXPENSES & SUBSCRIPTIONS */}
      {activeTab === 'recurring' && (
        <RecurringExpensesManager 
          onOpenAddExpenseWithRecurring={() => setIsAddExpenseOpen(true)}
        />
      )}

      {/* TAB CONTENT 5: BUDGET TRACKER (Supporter/Pro) */}
      {activeTab === 'budget' && (
        <BudgetTracker openUpgradeModal={openUpgradeModal} />
      )}

      {/* TAB CONTENT 6: ADVANCED ANALYTICS (Annual Pro) */}
      {activeTab === 'analytics' && (
        <AdvancedAnalytics 
          openUpgradeModal={openUpgradeModal} 
          openAddExpenseWithOcr={() => setIsAddExpenseOpen(true)}
        />
      )}

      {/* TAB CONTENT 7: GROUP SETTINGS */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-[#0e1320] border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold font-display text-white">{t('gd.tabSettings')}</h3>
            <p className="text-xs text-slate-400">Configure base currency, group details, language, and archiving</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('group.nameLabel')}
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('group.currencyLabel')}
              </label>
              <select
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
                <option value="CHF">CHF</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('common.language')}
              </label>
              <LanguageToggle />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
            >
              {t('common.save')}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-300">{t('gd.archived')}</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Archived groups will be moved to the Archived tab on your dashboard.
            </p>
            <button
              onClick={() => archiveGroup(activeGroup.id, !activeGroup.is_archived)}
              className="mt-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {activeGroup.is_archived ? 'Unarchive Group' : 'Archive this Group'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setDefaultMilestoneIdForExpense(null);
        }}
        openUpgradeModal={openUpgradeModal}
        defaultMilestoneId={defaultMilestoneIdForExpense || undefined}
      />

      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => {
          setIsMilestoneModalOpen(false);
          setEditingMilestone(null);
        }}
        groupId={activeGroup.id}
        milestoneToEdit={editingMilestone}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        presetDebt={selectedDebtToSettle}
        mode={settleModalMode}
      />

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

    </div>
  );
};
