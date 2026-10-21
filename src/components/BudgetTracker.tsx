import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Edit2, Check } from 'lucide-react';

interface BudgetTrackerProps {
  openUpgradeModal: () => void;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ openUpgradeModal }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { activeGroup, activeBalances, updateGroup } = useData();

  const isUnlocked = currentUser?.tier === 'supporter' || currentUser?.tier === 'pro';

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(activeGroup?.budget_limit?.toString() || '');

  if (!activeGroup) return null;

  const totalSpent = activeBalances.totalGroupSpent;
  const budgetLimit = activeGroup.budget_limit || 0;
  const hasLimit = budgetLimit > 0;
  const percentage = hasLimit ? Math.min(Math.round((totalSpent / budgetLimit) * 100), 100) : 0;
  const isOverBudget = hasLimit && totalSpent > budgetLimit;
  const remaining = hasLimit ? budgetLimit - totalSpent : 0;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    updateGroup(activeGroup.id, { budget_limit: !isNaN(val) && val > 0 ? val : null });
    setIsEditingBudget(false);
  };

  if (!isUnlocked) {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0e1320] to-[#121829] border border-amber-500/30 text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {t('budget.supporterPerk')}
        </span>
        <h3 className="text-lg font-bold font-display text-white mt-2">
          {t('budget.title')}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          {t('budget.desc')}
        </p>
        <button
          onClick={openUpgradeModal}
          className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('budget.unlockSupporter')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-[#0e1320] border border-slate-800 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold font-display text-white">{t('budget.title')}</h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
              {t('budget.active')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('budget.monitor')}
          </p>
        </div>

        <div>
          {isEditingBudget ? (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-1.5">
              <input
                type="number"
                step="1"
                min="0"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Limit"
                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="p-1.5 bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setBudgetInput(activeGroup.budget_limit?.toString() || '');
                setIsEditingBudget(true);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Edit2 className="w-3 h-3 text-emerald-400" />
              <span>{hasLimit ? t('budget.editLimit') : t('budget.setLimit')}</span>
            </button>
          )}
        </div>
      </div>

      {hasLimit ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between text-xs">
            <div>
              <span className="text-slate-400">{t('budget.totalSpent')}: </span>
              <span className="text-base font-bold font-display text-white tabular-nums">
                ${totalSpent.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">{t('budget.groupLimit')}: </span>
              <span className="text-sm font-semibold text-slate-200 tabular-nums">
                ${budgetLimit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget
                  ? 'bg-rose-500'
                  : percentage > 80
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-400'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Status Alert */}
          <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
            isOverBudget
              ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              : remaining < budgetLimit * 0.2
              ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
          }`}>
            <div className="flex items-center gap-2">
              {isOverBudget ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>
                {isOverBudget
                  ? t('budget.exceeded', { amount: `$${Math.abs(remaining).toFixed(2)}` })
                  : percentage > 80
                  ? t('budget.caution', { percent: percentage })
                  : `$${remaining.toFixed(2)} (${100 - percentage}% available)`}
              </span>
            </div>
            <span className="font-mono font-bold tabular-nums">{percentage}% used</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <p className="text-xs text-slate-400">{t('budget.noLimit')}</p>
          <button
            onClick={() => setIsEditingBudget(true)}
            className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            + {t('budget.setLimit')}
          </button>
        </div>
      )}
    </div>
  );
};
