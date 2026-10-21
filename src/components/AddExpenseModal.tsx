import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { ExpenseCategory, Group, RecurrenceFrequency } from '../types';
import { 
  X, 
  Receipt, 
  Check, 
  ScanLine, 
  Split, 
  Layers, 
  ArrowRight,
  Camera,
  Sparkles,
  Zap,
  RotateCcw,
  Flag,
  Plus,
  Calendar,
  Repeat
} from 'lucide-react';
import { ReceiptScannerModal, ParsedReceiptData } from './ReceiptScannerModal';
import { useReceiptScanQuota } from '../lib/receiptScanQuota';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  openUpgradeModal: () => void;
  allowGroupSelection?: boolean;
  defaultGroupId?: string;
  defaultMilestoneId?: string;
  onOpenCreateGroup?: () => void;
}

const CATEGORY_KEYS: Array<{ key: ExpenseCategory; icon: string }> = [
  { key: 'dining', icon: '🍽️' },
  { key: 'groceries', icon: '🛒' },
  { key: 'housing', icon: '🏠' },
  { key: 'transport', icon: '🚗' },
  { key: 'entertainment', icon: '🎟️' },
  { key: 'travel', icon: '✈️' },
  { key: 'utilities', icon: '💡' },
  { key: 'shopping', icon: '🛍️' },
  { key: 'other', icon: '📦' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  openUpgradeModal,
  allowGroupSelection = false,
  defaultGroupId,
  defaultMilestoneId,
  onOpenCreateGroup,
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { 
    activeGroup, 
    userGroups, 
    getMembersForGroup, 
    addExpense,
    setActiveGroupId,
    userMilestones,
    createMilestone,
    createRecurringExpense
  } = useData();

  const quota = useReceiptScanQuota(currentUser?.id, currentUser?.tier);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  // Selected Group resolution
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    defaultGroupId || activeGroup?.id || userGroups[0]?.id || ''
  );

  // Milestone selection state
  const [milestoneId, setMilestoneId] = useState<string>(defaultMilestoneId || '');
  const [isCreatingInlineMilestone, setIsCreatingInlineMilestone] = useState(false);
  const [inlineMilestoneTitle, setInlineMilestoneTitle] = useState('');
  const [inlineMilestoneIcon, setInlineMilestoneIcon] = useState('📍');
  const [inlineMilestoneDayNum, setInlineMilestoneDayNum] = useState<string>('');

  // When modal opens or activeGroup changes, ensure selectedGroupId is aligned
  useEffect(() => {
    if (isOpen) {
      if (defaultGroupId) {
        setSelectedGroupId(defaultGroupId);
      } else if (activeGroup?.id && !allowGroupSelection) {
        setSelectedGroupId(activeGroup.id);
      } else if (!selectedGroupId && userGroups[0]?.id) {
        setSelectedGroupId(userGroups[0].id);
      }

      if (defaultMilestoneId) {
        setMilestoneId(defaultMilestoneId);
      }
    }
  }, [isOpen, defaultGroupId, defaultMilestoneId, activeGroup?.id, allowGroupSelection, userGroups]);

  const targetGroup: Group | null = 
    userGroups.find(g => g.id === selectedGroupId) || activeGroup || userGroups[0] || null;

  const groupMembers = targetGroup ? getMembersForGroup(targetGroup.id) : [];
  const groupMilestones = userMilestones.filter(m => m.group_id === targetGroup?.id);

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('dining');
  const [paidByUserId, setPaidByUserId] = useState(currentUser?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Recurring expense option
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('monthly');

  // Split configuration
  const [splitMode, setSplitMode] = useState<'equal' | 'exact'>('equal');
  const [includedUserIds, setIncludedUserIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  // Receipt OCR parsing state
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [receiptItems, setReceiptItems] = useState<Array<{ name: string; amount: number }>>([]);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);

  // When group changes, update members and payer
  useEffect(() => {
    if (groupMembers.length > 0) {
      setIncludedUserIds(groupMembers.map(m => m.user_id));
      const hasUser = groupMembers.some(m => m.user_id === currentUser?.id);
      setPaidByUserId(hasUser && currentUser ? currentUser.id : groupMembers[0]?.user_id || '');
      setExactAmounts({});
    }
  }, [selectedGroupId, targetGroup?.id]);

  if (!isOpen) return null;

  // Empty state if user has no groups at all
  if (userGroups.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-[#0e1320] border border-slate-800 rounded-3xl p-6 sm:p-7 text-center relative shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-display font-bold text-white">{t('dash.noActive')}</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            {t('dash.noActiveSub')}
          </p>
          <button
            onClick={() => {
              onClose();
              if (onOpenCreateGroup) onOpenCreateGroup();
            }}
            className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            {t('dash.createFirst')}
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = parseFloat(amountStr) || 0;

  // Toggle user inclusion in equal split
  const toggleUserInclusion = (uid: string) => {
    if (includedUserIds.includes(uid)) {
      if (includedUserIds.length > 1) {
        setIncludedUserIds(includedUserIds.filter(id => id !== uid));
      }
    } else {
      setIncludedUserIds([...includedUserIds, uid]);
    }
  };

  // Handle parsed receipt data from Camera AI scanner
  const handleReceiptParsed = (data: ParsedReceiptData) => {
    setTitle(data.merchant || 'Itemized Bill');
    setAmountStr(data.total.toString());
    setCategory(data.category as ExpenseCategory);
    if (data.date) setDate(data.date);
    if (data.notes) setNotes(data.notes);
    setReceiptItems(data.items || []);
    setOcrSuccessMsg(`AI Scanned: "${data.merchant}" ($${data.total.toFixed(2)}) • ${data.items?.length || 0} line items auto-filled`);
  };

  // Quick Preset Sample trigger
  const handleQuickSampleScan = async (samplePreset: 'dinner' | 'groceries' | 'travel' = 'dinner') => {
    if (!quota.canScan) {
      setIsScannerModalOpen(true);
      return;
    }

    setIsScanningOcr(true);
    setOcrSuccessMsg(null);

    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samplePreset, defaultCurrency: targetGroup?.base_currency || 'USD' }),
      });
      const data = await res.json();

      quota.recordScan();
      handleReceiptParsed(data);
    } catch (err) {
      console.error('Sample scan failed:', err);
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGroup || totalAmount <= 0) return;

    const finalTitle = title.trim() || `${t('cat.' + category)}`;

    let finalSplits: Array<{ userId: string; amount: number; splitType: 'equal' | 'exact' | 'shares' }> = [];

    if (splitMode === 'equal') {
      const count = includedUserIds.length || 1;
      const splitAmount = Math.round((totalAmount / count) * 100) / 100;
      
      let distributed = 0;
      finalSplits = includedUserIds.map((uid, index) => {
        if (index === includedUserIds.length - 1) {
          const remainder = Math.round((totalAmount - distributed) * 100) / 100;
          return { userId: uid, amount: remainder, splitType: 'equal' as const };
        }
        distributed += splitAmount;
        return { userId: uid, amount: splitAmount, splitType: 'equal' as const };
      });
    } else {
      finalSplits = groupMembers.map(m => ({
        userId: m.user_id,
        amount: parseFloat(exactAmounts[m.user_id] || '0') || 0,
        splitType: 'exact' as const,
      })).filter(s => s.amount > 0);
    }

    addExpense({
      groupId: targetGroup.id,
      title: finalTitle,
      amount: totalAmount,
      category,
      paidByUserId: paidByUserId || groupMembers[0]?.user_id || currentUser?.id || '',
      date,
      notes: notes.trim() || undefined,
      milestoneId: milestoneId || null,
      splits: finalSplits,
      receiptItems: receiptItems.length > 0 ? receiptItems : undefined,
    });

    if (isRecurring) {
      createRecurringExpense({
        groupId: targetGroup.id,
        title: finalTitle,
        amount: totalAmount,
        category,
        paidByUserId: paidByUserId || groupMembers[0]?.user_id || currentUser?.id || '',
        frequency: recurrenceFreq,
        startDate: date,
        notes: notes.trim() || undefined,
        splits: finalSplits,
        triggerFirstNow: false,
      });
    }

    // Make target group active
    setActiveGroupId(targetGroup.id);

    // Reset and close
    setTitle('');
    setAmountStr('');
    setNotes('');
    setIsRecurring(false);
    setRecurrenceFreq('monthly');
    setReceiptItems([]);
    setOcrSuccessMsg(null);
    setMilestoneId('');
    setIsCreatingInlineMilestone(false);
    setInlineMilestoneTitle('');
    onClose();
  };

  const exactSum = Object.values(exactAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const exactDifference = Math.round((totalAmount - exactSum) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-md shadow-emerald-500/10">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 id="add-expense-title" className="text-xl font-display font-bold text-white">
              {allowGroupSelection ? t('expense.quickAddTitle') : t('expense.addTitle')}
            </h2>
            <p className="text-xs text-slate-400">
              {targetGroup ? `${targetGroup.name} (${targetGroup.base_currency})` : 'Log a shared expense'}
            </p>
          </div>
        </div>

        {/* Group Selector when opened from Dashboard */}
        {allowGroupSelection && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('expense.selectGroup')}</span>
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
            >
              {userGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.base_currency})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* AI Camera Receipt Scanner Banner */}
        <div className="mt-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-white">Scan Receipt with AI</span>
                {quota.isUnlimited ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> UNLIMITED
                  </span>
                ) : (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    quota.scansRemaining > 0 
                      ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20' 
                      : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  }`}>
                    {quota.scansRemaining} of 5 free scans left
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {quota.canScan 
                  ? 'Capture with camera or upload photo to auto-fill details' 
                  : 'Monthly scan quota reached • Upgrade for unlimited scans'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isScanningOcr}
              onClick={() => handleQuickSampleScan('dinner')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/80 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              title="Test with instant sample bill"
            >
              {isScanningOcr ? 'Parsing...' : '🍽️ Sample'}
            </button>

            <button
              type="button"
              onClick={() => setIsScannerModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{quota.canScan ? 'Open Camera' : 'Upgrade Scans'}</span>
            </button>
          </div>
        </div>

        {ocrSuccessMsg && (
          <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{ocrSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setOcrSuccessMsg(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Amount & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 order-1 sm:order-2">
              <label className="block text-xs font-bold text-emerald-400 mb-1">
                {t('expense.amountLabel')} ({targetGroup?.base_currency || 'USD'}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500 text-sm">
                  {targetGroup?.base_currency === 'EUR' ? '€' : targetGroup?.base_currency === 'GBP' ? '£' : '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus={allowGroupSelection}
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-base text-white placeholder-slate-600 font-mono font-bold focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500 tabular-nums"
                />
              </div>
            </div>

            <div className="sm:col-span-2 order-2 sm:order-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('expense.descLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('expense.descPlaceholder')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {t('expense.categoryLabel')} *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_KEYS.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    category === cat.key
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold shadow-sm shadow-emerald-950'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{t('cat.' + cat.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payer and Date Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>{t('expense.payerLabel')} *</span>
                <span className="text-[10px] text-slate-500 font-normal">Payer</span>
              </label>
              <select
                value={paidByUserId}
                onChange={(e) => setPaidByUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
              >
                {groupMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user.full_name} {m.user_id === currentUser?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('expense.dateLabel')}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  const newD = e.target.value;
                  setDate(newD);
                  if (!milestoneId) {
                    const match = groupMilestones.find(m => m.date === newD);
                    if (match) setMilestoneId(match.id);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Event Day & Milestone (Financial Diary) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-teal-400" />
                <span>Event Day / Milestone (Event Diary)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingInlineMilestone(!isCreatingInlineMilestone)}
                className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>{isCreatingInlineMilestone ? 'Cancel' : 'New Day/Milestone'}</span>
              </button>
            </div>

            {!isCreatingInlineMilestone ? (
              <div className="space-y-1">
                <select
                  value={milestoneId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__new__') {
                      setIsCreatingInlineMilestone(true);
                    } else {
                      setMilestoneId(val);
                      const selectedM = groupMilestones.find(m => m.id === val);
                      if (selectedM?.date) {
                        setDate(selectedM.date);
                      }
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
                >
                  <option value="">None (General / Ungrouped Expense)</option>
                  {groupMilestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.icon || '📍'} {m.title} {m.date ? `(${m.date})` : ''}
                    </option>
                  ))}
                  <option value="__new__">+ Create New Day / Milestone...</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Tag this expense under a specific day (e.g. Day 1: Arrival, Day 2: Beach Trip) for the event diary.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 border border-teal-500/30 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <select
                    value={inlineMilestoneIcon}
                    onChange={(e) => setInlineMilestoneIcon(e.target.value)}
                    className="w-12 bg-slate-950 border border-slate-800 rounded-xl p-2 text-base text-center text-white"
                  >
                    {['📍', '🏡', '🌲', '🍻', '🏖️', '✈️', '🚗', '🍽️', '🎟️', '🛍️', '⛺', '🎉', '🎿'].map(emoji => (
                      <option key={emoji} value={emoji}>{emoji}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={inlineMilestoneTitle}
                    onChange={(e) => setInlineMilestoneTitle(e.target.value)}
                    placeholder="e.g. Day 1: Arrival, Day 2: Beach Trip"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[10px] text-slate-400">Creates milestone and attaches this expense</span>
                  <button
                    type="button"
                    disabled={!inlineMilestoneTitle.trim() || !targetGroup}
                    onClick={() => {
                      if (!inlineMilestoneTitle.trim() || !targetGroup) return;
                      const created = createMilestone({
                        groupId: targetGroup.id,
                        title: inlineMilestoneTitle.trim(),
                        date: date,
                        icon: inlineMilestoneIcon,
                      });
                      setMilestoneId(created.id);
                      setIsCreatingInlineMilestone(false);
                      setInlineMilestoneTitle('');
                    }}
                    className="px-3 py-1.5 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                  >
                    Save & Select
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Split Mode Selector */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('expense.splitOptions')}</span>
              </label>

              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSplitMode('equal')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors ${
                    splitMode === 'equal' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  {t('expense.splitEqually')}
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('exact')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors ${
                    splitMode === 'exact' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  {t('expense.exactAmounts')}
                </button>
              </div>
            </div>

            {/* Split Equal: Member selection chips */}
            {splitMode === 'equal' ? (
              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-400">
                  {t('expense.selectIncluded')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {groupMembers.map((m) => {
                    const isSelected = includedUserIds.includes(m.user_id);
                    const perPerson = totalAmount > 0 
                      ? (totalAmount / (includedUserIds.length || 1)).toFixed(2) 
                      : '0.00';

                    return (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => toggleUserInclusion(m.user_id)}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500/40 text-white'
                            : 'bg-slate-950/60 border-slate-800/60 text-slate-500'
                        }`}
                      >
                        <div className="truncate">
                          <p className="text-xs font-medium truncate">{m.user.full_name}</p>
                          {isSelected && (
                            <p className="text-[10px] text-emerald-400 font-mono tabular-nums">
                              ${perPerson}
                            </p>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Split Exact */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('expense.exactDollar')}</span>
                  <span className={`tabular-nums font-mono font-medium ${
                    exactDifference === 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {exactDifference === 0 
                      ? '✓ Balanced' 
                      : exactDifference > 0 
                        ? `$${exactDifference.toFixed(2)} remaining` 
                        : `$${Math.abs(exactDifference).toFixed(2)} over budget`}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {groupMembers.map((m) => (
                    <div key={m.user_id} className="flex items-center justify-between gap-3 p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-xs text-slate-200 truncate">{m.user.full_name}</span>
                      <div className="relative w-28">
                        <span className="text-slate-500 text-xs absolute left-2.5 top-1/2 -translate-y-1/2">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={exactAmounts[m.user_id] || ''}
                          onChange={(e) => setExactAmounts({ ...exactAmounts, [m.user_id]: e.target.value })}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-6 pr-2 py-1 text-xs text-white font-mono text-right tabular-nums focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Itemized receipt preview if OCR scanned */}
          {receiptItems.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] font-semibold text-slate-300 mb-1.5">
                Itemized Receipt Line Items:
              </p>
              <div className="space-y-1 max-h-24 overflow-y-auto text-xs text-slate-400">
                {receiptItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="truncate">{item.name}</span>
                    <span className="font-mono text-slate-200 tabular-nums">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('expense.notesLabel')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('expense.notesPlaceholder')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Repeat / Recurring Schedule Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-white">
                    {t('rec.makeRecurring')}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Automatically trigger future cycles in this group
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-teal-400 bg-slate-900 border-slate-700 focus:ring-teal-500 cursor-pointer"
              />
            </label>

            {isRecurring && (
              <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <span className="text-xs font-semibold text-slate-300">
                  {t('rec.frequency')}:
                </span>
                <select
                  value={recurrenceFreq}
                  onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFrequency)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer font-medium"
                >
                  <option value="monthly">{t('rec.freqMonthly')}</option>
                  <option value="biweekly">{t('rec.freqBiweekly')}</option>
                  <option value="weekly">{t('rec.freqWeekly')}</option>
                  <option value="yearly">{t('rec.freqYearly')}</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {t('group.cancel')}
            </button>
            <button
              type="submit"
              disabled={splitMode === 'exact' && exactDifference !== 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{t('expense.save')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

      </div>

      {/* AI Receipt Scanner Modal (Camera & Vision Parser) */}
      <ReceiptScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onReceiptParsed={handleReceiptParsed}
        openUpgradeModal={openUpgradeModal}
        defaultCurrency={targetGroup?.base_currency || 'USD'}
      />
    </div>
  );
};
