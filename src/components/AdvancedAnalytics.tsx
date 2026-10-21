import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, PieChart, TrendingUp, DollarSign, Users, ScanLine } from 'lucide-react';

interface AdvancedAnalyticsProps {
  openUpgradeModal: () => void;
  openAddExpenseWithOcr: () => void;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  openUpgradeModal,
  openAddExpenseWithOcr,
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { activeGroup, activeExpenses, activeMembers } = useData();

  const isPro = currentUser?.tier === 'pro';

  if (!activeGroup) return null;

  if (!isPro) {
    return (
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0e1320] via-[#141226] to-[#0e1320] border border-purple-500/30 text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
          <PieChart className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {t('analytics.proExclusive')}
        </span>
        <h3 className="text-xl font-bold font-display text-white mt-2">
          {t('analytics.title')}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          {t('analytics.desc')}
        </p>
        <button
          onClick={openUpgradeModal}
          className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-semibold text-xs shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('analytics.unlockPro')}</span>
        </button>
      </div>
    );
  }

  // Calculate Category Breakdowns
  const categoryTotals: Record<string, number> = {};
  let totalSpending = 0;

  for (const exp of activeExpenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    totalSpending += exp.amount;
  }

  const categoryEntries = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  // Calculate Spender Contribution
  const spenderTotals: Record<string, number> = {};
  for (const exp of activeExpenses) {
    spenderTotals[exp.paid_by_user_id] = (spenderTotals[exp.paid_by_user_id] || 0) + exp.amount;
  }

  const avgTransaction = activeExpenses.length > 0 
    ? (totalSpending / activeExpenses.length).toFixed(2) 
    : '0.00';

  return (
    <div className="space-y-6">
      
      {/* Top Pro Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-purple-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t('analytics.velocity')}</span>
          </div>
          <p className="text-2xl font-bold font-display text-white mt-1 tabular-nums">
            ${totalSpending.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('analytics.totalEntries', { n: activeExpenses.length })}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{t('analytics.avgTransaction')}</span>
          </div>
          <p className="text-2xl font-bold font-display text-white mt-1 tabular-nums">
            ${avgTransaction}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('analytics.perExpense')}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <ScanLine className="w-3.5 h-3.5" /> {t('analytics.smartOcr')}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">READY</span>
          </div>
          <button
            onClick={openAddExpenseWithOcr}
            className="w-full mt-2 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-semibold rounded-lg border border-purple-500/30 cursor-pointer transition-colors"
          >
            {t('expense.ocrTitle')}
          </button>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="p-6 rounded-3xl bg-[#0e1320] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-white">
            {t('analytics.categoryAlloc')}
          </h3>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {categoryEntries.length} active
          </span>
        </div>

        {categoryEntries.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">{t('analytics.noData')}</p>
        ) : (
          <div className="space-y-3">
            {categoryEntries.map(([cat, amount]) => {
              const pct = totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-slate-300 font-medium">{t(`cat.${cat}`) || cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono tabular-nums">{pct}%</span>
                      <span className="text-white font-semibold font-mono tabular-nums">${amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Contributors / Spenders */}
      <div className="p-6 rounded-3xl bg-[#0e1320] border border-slate-800 space-y-4">
        <h3 className="text-base font-bold font-display text-white">
          {t('analytics.topSpenders')}
        </h3>
        <div className="space-y-2">
          {activeMembers.map((m) => {
            const spent = spenderTotals[m.user_id] || 0;
            const pct = totalSpending > 0 ? Math.round((spent / totalSpending) * 100) : 0;
            return (
              <div key={m.user_id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center">
                    {m.user.full_name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{m.user.full_name}</p>
                    <p className="text-[10px] text-slate-500">{pct}% of group expenses paid</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                    ${spent.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-500">total</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
