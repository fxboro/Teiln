/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  RecurringExpense, 
  RecurrenceFrequency, 
  ExpenseCategory, 
  CATEGORY_ICONS 
} from '../types';
import { 
  Repeat, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Calendar, 
  Clock, 
  Check, 
  Zap, 
  X, 
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface RecurringExpensesManagerProps {
  onOpenAddExpenseWithRecurring?: () => void;
}

const CATEGORY_LIST: Array<{ key: ExpenseCategory; icon: string }> = [
  { key: 'housing', icon: '🏠' },
  { key: 'utilities', icon: '💡' },
  { key: 'dining', icon: '🍽️' },
  { key: 'groceries', icon: '🛒' },
  { key: 'entertainment', icon: '🎟️' },
  { key: 'transport', icon: '🚗' },
  { key: 'travel', icon: '✈️' },
  { key: 'shopping', icon: '🛍️' },
  { key: 'other', icon: '📦' },
];

export const RecurringExpensesManager: React.FC<RecurringExpensesManagerProps> = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { 
    activeGroup, 
    activeRecurringExpenses, 
    activeMembers, 
    createRecurringExpense, 
    deleteRecurringExpense, 
    toggleRecurringStatus, 
    triggerRecurringExpenseNow,
    processDueRecurringExpenses
  } = useData();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for creating a new recurring rule
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('housing');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [paidByUserId, setPaidByUserId] = useState(currentUser?.id || activeMembers[0]?.user_id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [triggerToday, setTriggerToday] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  if (!activeGroup) {
    return (
      <div className="p-8 text-center bg-[#0e1320] rounded-2xl border border-slate-800 text-slate-400 text-sm">
        No active group selected.
      </div>
    );
  }

  const currencySymbol = activeGroup.base_currency === 'EUR' ? '€' : activeGroup.base_currency === 'GBP' ? '£' : '$';

  // Compute monthly equivalent total for committed budget
  const monthlyTotal = activeRecurringExpenses
    .filter(r => r.status === 'active')
    .reduce((sum, r) => {
      switch (r.frequency) {
        case 'weekly':
          return sum + (r.amount * 52) / 12;
        case 'biweekly':
          return sum + (r.amount * 26) / 12;
        case 'monthly':
          return sum + r.amount;
        case 'yearly':
          return sum + r.amount / 12;
        default:
          return sum + r.amount;
      }
    }, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const val = parseFloat(amountStr);
    if (!val || val <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }
    if (!title.trim()) {
      setFormError('Please enter a title (e.g., Monthly Rent, WiFi).');
      return;
    }

    // Default equal split among all group members
    const count = activeMembers.length || 1;
    const splitAmount = Math.round((val / count) * 100) / 100;
    let distributed = 0;
    const splits = activeMembers.map((m, idx) => {
      if (idx === activeMembers.length - 1) {
        const rem = Math.round((val - distributed) * 100) / 100;
        return { userId: m.user_id, amount: rem, splitType: 'equal' as const };
      }
      distributed += splitAmount;
      return { userId: m.user_id, amount: splitAmount, splitType: 'equal' as const };
    });

    createRecurringExpense({
      groupId: activeGroup.id,
      title: title.trim(),
      amount: val,
      category,
      paidByUserId: paidByUserId || activeMembers[0]?.user_id || currentUser?.id || '',
      frequency,
      startDate,
      notes: notes.trim() || undefined,
      splits,
      triggerFirstNow: triggerToday,
    });

    showToast(`Recurring schedule "${title.trim()}" created successfully! ✨`);
    
    // Reset and close
    setTitle('');
    setAmountStr('');
    setNotes('');
    setIsCreateModalOpen(false);
  };

  const handleTriggerNow = (rec: RecurringExpense) => {
    const exp = triggerRecurringExpenseNow(rec.id);
    if (exp) {
      showToast(`Logged cycle for "${rec.title}" (${currencySymbol}${rec.amount.toFixed(2)}) into group expenses! ⚡`);
    }
  };

  const handleCheckDue = () => {
    const count = processDueRecurringExpenses();
    if (count > 0) {
      showToast(`Triggered ${count} due recurring bills! 🔄`);
    } else {
      showToast('All recurring bills are up-to-date. None due today.');
    }
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
    return `In ${diffDays} days`;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-3 px-4 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold shadow-sm">
              <Repeat className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-display font-bold text-white">
              {t('rec.title')}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t('rec.sub')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCheckDue}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Scan for overdue recurring items"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Check Due Bills</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('rec.addBtn')}</span>
          </button>
        </div>
      </div>

      {/* Metrics & Committed Budget Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t('rec.monthlyCommitted')}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-white tabular-nums">
              {currencySymbol}{monthlyTotal.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">/ month avg</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Subscriptions
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-teal-400 tabular-nums">
              {activeRecurringExpenses.filter(r => r.status === 'active').length}
            </span>
            <span className="text-xs text-slate-500">
              of {activeRecurringExpenses.length} total schedules
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Automation Status
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300">
              Automated cycle runner active
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            Auto-triggers on due date & logs in group ledger
          </span>
        </div>
      </div>

      {/* List of Recurring Expenses */}
      {activeRecurringExpenses.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-[#0e1320] border border-slate-800/80">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-md shadow-teal-500/5">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-base font-display font-bold text-white">
            {t('rec.emptyTitle')}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {t('rec.emptySub')}
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-5 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Recurring Schedule</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeRecurringExpenses.map((rec) => {
            const daysLabel = getDaysUntil(rec.next_run_date);
            const isDueToday = daysLabel === 'Due today' || daysLabel.startsWith('Overdue');

            return (
              <div
                key={rec.id}
                className={`p-4 sm:p-5 rounded-2xl bg-[#0e1320] border transition-all ${
                  rec.status === 'paused'
                    ? 'border-slate-800/50 opacity-70'
                    : isDueToday
                      ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/10 via-[#0e1320] to-[#0e1320] shadow-md shadow-amber-950/20'
                      : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Icon, Title & Meta */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shrink-0 mt-0.5 shadow-sm">
                      {CATEGORY_ICONS[rec.category] || '📦'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white font-display truncate">
                          {rec.title}
                        </h4>

                        {/* Frequency badge */}
                        <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[10px] font-semibold uppercase tracking-wider">
                          {rec.frequency}
                        </span>

                        {/* Status badge */}
                        {rec.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {t('rec.active')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {t('rec.paused')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                        <span>Paid by <strong className="text-slate-200">{rec.payer?.full_name || 'Someone'}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Split {rec.splits.length} ways</span>
                        {rec.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="italic text-slate-500 truncate max-w-xs">"{rec.notes}"</span>
                          </>
                        )}
                      </div>

                      {/* Next run badge & audit */}
                      <div className="mt-2.5 flex items-center gap-3 text-[11px] flex-wrap">
                        <div className={`flex items-center gap-1 font-mono font-medium ${
                          isDueToday ? 'text-amber-400 font-bold' : 'text-slate-300'
                        }`}>
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Next: <strong>{rec.next_run_date}</strong> ({daysLabel})</span>
                        </div>

                        {rec.last_run_date && (
                          <div className="flex items-center gap-1 text-slate-500 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-600" />
                            <span>Last logged: {rec.last_run_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Quick Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80">
                    <div className="text-left sm:text-right">
                      <span className="text-lg font-display font-bold text-white tabular-nums">
                        {currencySymbol}{rec.amount.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        per {rec.frequency.replace('ly', '')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Trigger Now Button */}
                      <button
                        type="button"
                        onClick={() => handleTriggerNow(rec)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title="Trigger this cycle's expense right now into the ledger"
                      >
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Trigger Now</span>
                      </button>

                      {/* Pause / Resume Button */}
                      <button
                        type="button"
                        onClick={() => toggleRecurringStatus(rec.id)}
                        className={`p-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                          rec.status === 'active'
                            ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
                            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                        }`}
                        title={rec.status === 'active' ? 'Pause automatic triggering' : 'Resume automatic schedule'}
                      >
                        {rec.status === 'active' ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete recurring schedule "${rec.title}"? Existing past logged expenses will remain.`)) {
                            deleteRecurringExpense(rec.id);
                            showToast(`Deleted "${rec.title}".`);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                        title="Delete recurring schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW RECURRING EXPENSE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div 
            className="w-full max-w-lg bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative my-8"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold shadow-md shadow-teal-500/10">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white">
                  Add Recurring Schedule
                </h3>
                <p className="text-xs text-slate-400">
                  Fixed bill automatically split on schedule in "{activeGroup.name}"
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Schedule Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Rent, Sonic Gigabit WiFi, Netflix 4K"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Amount & Frequency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Amount ({activeGroup.base_currency}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Recurrence Cadence *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="monthly">Monthly (Most common)</option>
                    <option value="biweekly">Every 2 Weeks (Bi-weekly)</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly (Annual)</option>
                  </select>
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORY_LIST.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCategory(c.key)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        category === c.key
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                          : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span className="capitalize truncate">{c.key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payer & Start Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Primary Payer
                  </label>
                  <select
                    value={paidByUserId}
                    onChange={(e) => setPaidByUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user.full_name} {m.user_id === currentUser?.id ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Start / Effective Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Memo / Account Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Due on the 1st of each month via ACH"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Trigger first charge today checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggerToday}
                  onChange={(e) => setTriggerToday(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-400 bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="text-left">
                  <span className="block text-xs font-semibold text-white">
                    {t('rec.firstTriggerToday')}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Creates today's expense in the ledger immediately and schedules future cycles
                  </span>
                </div>
              </label>

              {/* Info notice about split logic */}
              <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-teal-400" />
                <span>Automatically splits equally between all {activeMembers.length} group members on each cycle.</span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save & Schedule Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
