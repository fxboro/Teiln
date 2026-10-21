/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  AreaChart, 
  Area, 
  ComposedChart, 
  Line, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  TrendingUp, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  DollarSign, 
  Calendar, 
  Edit2, 
  Check, 
  ChevronRight, 
  ArrowUpRight, 
  PieChart as PieIcon, 
  BarChart3, 
  Wallet,
  Users,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Group, CATEGORY_ICONS, ExpenseCategory } from '../types';

interface MonthlyBudgetDashboardProps {
  onSelectGroup?: (groupId: string) => void;
  openUpgradeModal: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  housing: '#6366f1',
  dining: '#f97316',
  groceries: '#10b981',
  transport: '#06b6d4',
  entertainment: '#ec4899',
  travel: '#8b5cf6',
  utilities: '#eab308',
  shopping: '#14b8a6',
  other: '#64748b',
};

// Formatter helper for month labels (YYYY-MM to "October 2026")
const formatMonthLabel = (monthKey: string) => {
  if (!monthKey || monthKey === 'all') return 'All Months';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const date = new Date(year, monthIndex, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatShortMonth = (monthKey: string) => {
  if (!monthKey || monthKey === 'all') return 'All';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const date = new Date(year, monthIndex, 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
};

export const MonthlyBudgetDashboard: React.FC<MonthlyBudgetDashboardProps> = ({
  onSelectGroup,
  openUpgradeModal,
}) => {
  const { currentUser } = useAuth();
  const { userGroups, userExpenses, updateGroup } = useData();
  const { t } = useLanguage();

  // Paying user validation: Supporter or Pro tiers only
  const isPayingUser = currentUser?.tier === 'supporter' || currentUser?.tier === 'pro';

  // State: Selected month, group filter, and inline editing
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');

  // Extract all available months from expenses
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    // Default current month
    monthSet.add('2026-10');
    monthSet.add('2026-09');
    monthSet.add('2026-08');

    userExpenses.forEach(exp => {
      if (exp.date) {
        const m = exp.date.slice(0, 7);
        if (m.length === 7) monthSet.add(m);
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [userExpenses]);

  // Aggregate monthly spending vs limit by group for selected month
  const groupBudgetData = useMemo(() => {
    const groupsToProcess = selectedGroupId === 'all'
      ? userGroups
      : userGroups.filter(g => g.id === selectedGroupId);

    return groupsToProcess.map(group => {
      // Filter expenses for this group and month
      const groupExpensesForMonth = userExpenses.filter(e => {
        if (e.group_id !== group.id) return false;
        if (selectedMonth === 'all') return true;
        return e.date?.startsWith(selectedMonth);
      });

      const spent = groupExpensesForMonth.reduce((sum, e) => sum + e.amount, 0);
      const limit = group.budget_limit || 0;
      const hasLimit = limit > 0;
      const percentage = hasLimit ? Math.round((spent / limit) * 100) : 0;
      const isOver = hasLimit && spent > limit;
      const variance = hasLimit ? limit - spent : 0;

      return {
        id: group.id,
        name: group.name,
        currency: group.base_currency,
        spent: Math.round(spent * 100) / 100,
        limit: Math.round(limit * 100) / 100,
        hasLimit,
        percentage,
        isOver,
        variance: Math.round(variance * 100) / 100,
        expenseCount: groupExpensesForMonth.length,
      };
    });
  }, [userGroups, userExpenses, selectedMonth, selectedGroupId]);

  // Historical Multi-Month Trend (Past 6 Months)
  const historicalTrendData = useMemo(() => {
    // Generate recent 5 months in chronological order
    const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    
    return months.map(mKey => {
      // Filter expenses for this month
      const monthExpenses = userExpenses.filter(e => {
        if (!e.date?.startsWith(mKey)) return false;
        if (selectedGroupId !== 'all') return e.group_id === selectedGroupId;
        return true;
      });

      const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Total limit for relevant groups
      const relevantGroups = selectedGroupId === 'all' 
        ? userGroups 
        : userGroups.filter(g => g.id === selectedGroupId);
      const totalLimit = relevantGroups.reduce((sum, g) => sum + (g.budget_limit || 0), 0);

      return {
        monthKey: mKey,
        monthName: formatShortMonth(mKey),
        spent: Math.round(spent * 100) / 100,
        limit: totalLimit > 0 ? Math.round(totalLimit * 100) / 100 : null,
        isOver: totalLimit > 0 && spent > totalLimit,
      };
    });
  }, [userExpenses, userGroups, selectedGroupId]);

  // Category Breakdown for the selected month and group
  const categoryData = useMemo(() => {
    const relevantExpenses = userExpenses.filter(e => {
      if (selectedGroupId !== 'all' && e.group_id !== selectedGroupId) return false;
      if (selectedMonth !== 'all' && !e.date?.startsWith(selectedMonth)) return false;
      return true;
    });

    const categoryTotals: Record<string, number> = {};
    relevantExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return Object.entries(categoryTotals)
      .map(([cat, total]) => ({
        name: t(`cat.${cat}`) || cat,
        key: cat,
        value: Math.round(total * 100) / 100,
        color: CATEGORY_COLORS[cat] || '#94a3b8',
        icon: CATEGORY_ICONS[cat as ExpenseCategory] || '📦',
      }))
      .sort((a, b) => b.value - a.value);
  }, [userExpenses, selectedGroupId, selectedMonth, t]);

  // Overall KPI metrics
  const kpiMetrics = useMemo(() => {
    const totalSpent = groupBudgetData.reduce((sum, g) => sum + g.spent, 0);
    const totalLimit = groupBudgetData.reduce((sum, g) => sum + g.limit, 0);
    const groupsWithLimit = groupBudgetData.filter(g => g.hasLimit);
    const groupsOverLimit = groupsWithLimit.filter(g => g.isOver);
    const groupsOnTrack = groupsWithLimit.filter(g => !g.isOver);
    const netVariance = totalLimit - totalSpent;

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalLimit: Math.round(totalLimit * 100) / 100,
      netVariance: Math.round(netVariance * 100) / 100,
      onTrackCount: groupsOnTrack.length,
      overLimitCount: groupsOverLimit.length,
      totalGroups: groupBudgetData.length,
    };
  }, [groupBudgetData]);

  const handleStartEdit = (group: Group) => {
    setEditingGroupId(group.id);
    setEditLimitValue(group.budget_limit?.toString() || '');
  };

  const handleSaveLimit = (groupId: string) => {
    const val = parseFloat(editLimitValue);
    updateGroup(groupId, {
      budget_limit: !isNaN(val) && val > 0 ? val : null,
    });
    setEditingGroupId(null);
  };

  // =========================================================================
  // LOCKED GATE VIEW (For Free / Non-Paying Users)
  // =========================================================================
  if (!isPayingUser) {
    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Pro / Supporter Lockout Hero */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0e1320] via-[#141226] to-[#0e1320] border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto text-center space-y-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Lock className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('budgetDash.badge')}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              {t('budgetDash.lockedTitle')}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
              {t('budgetDash.lockedDesc')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <BarChart3 className="w-4 h-4 text-emerald-400 mb-1" />
                <h4 className="text-xs font-bold text-white">Multi-Group Charts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Visualize monthly expenditure vs. limits with interactive Recharts.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <AlertTriangle className="w-4 h-4 text-amber-400 mb-1" />
                <h4 className="text-xs font-bold text-white">Threshold Alerts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Instant visual status when spending nears or exceeds 100%.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <TrendingUp className="w-4 h-4 text-purple-400 mb-1" />
                <h4 className="text-xs font-bold text-white">Multi-Month Trends</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Month-over-month trajectory analysis to prevent budget drift.</p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={openUpgradeModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{t('budgetDash.unlockCta')}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Blurred Preview Demonstration of the Dashboard */}
        <section className="relative rounded-3xl overflow-hidden border border-slate-800/60 opacity-60 pointer-events-none select-none">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-mono font-medium">
              PREVIEW ONLY · UPGRADE TO INTERACT
            </span>
          </div>

          <div className="p-6 bg-[#0e1320] space-y-4">
            <div className="h-6 w-48 bg-slate-800 rounded-md" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 bg-slate-900 rounded-xl" />
              <div className="h-20 bg-slate-900 rounded-xl" />
              <div className="h-20 bg-slate-900 rounded-xl" />
            </div>
            <div className="h-64 bg-slate-900 rounded-2xl" />
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // UNLOCKED VIEW (For Paying Users: Supporter & Pro)
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner & Filter Controls */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#0e1320] border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                {t('budgetDash.title')}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                {currentUser?.tier === 'pro' ? 'PRO TIER' : 'SUPPORTER TIER'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('budgetDash.subtitle')}
            </p>
          </div>

          {/* Interactive Selectors: Month & Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <label htmlFor="month-select" className="text-slate-400 text-[11px] font-medium sr-only">
                {t('budgetDash.selectMonth')}
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-900 text-white">
                  {t('budgetDash.allMonths')}
                </option>
                {availableMonths.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Group Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Users className="w-3.5 h-3.5 text-teal-400" />
              <label htmlFor="group-filter-select" className="text-slate-400 text-[11px] font-medium sr-only">
                {t('budgetDash.allGroups')}
              </label>
              <select
                id="group-filter-select"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-900 text-white">
                  {t('budgetDash.allGroups')} ({userGroups.length})
                </option>
                {userGroups.map(g => (
                  <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('budgetDash.totalSpending')}</span>
            </div>
            <p className="text-lg sm:text-xl font-bold font-display text-white mt-1 tabular-nums">
              ${kpiMetrics.totalSpent.toFixed(2)}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('budgetDash.totalBudget')}</span>
            </div>
            <p className="text-lg sm:text-xl font-bold font-display text-white mt-1 tabular-nums">
              ${kpiMetrics.totalLimit.toFixed(2)}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('budgetDash.netVariance')}</span>
            </div>
            <p className={`text-lg sm:text-xl font-bold font-display mt-1 tabular-nums ${
              kpiMetrics.netVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {kpiMetrics.netVariance >= 0 ? `+$${kpiMetrics.netVariance.toFixed(2)}` : `-$${Math.abs(kpiMetrics.netVariance).toFixed(2)}`}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/70">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('budgetDash.onTrackCount')}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-lg sm:text-xl font-bold font-display text-white tabular-nums">
                {kpiMetrics.onTrackCount}
              </p>
              {kpiMetrics.overLimitCount > 0 && (
                <span className="text-xs font-semibold text-rose-400 tabular-nums">
                  ({kpiMetrics.overLimitCount} over)
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* CHART 1: RECHARTS GROUP COMPARISON: ACTUAL SPENT VS. BUDGET LIMIT     */}
      {/* ===================================================================== */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#0e1320] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>{t('budgetDash.spendingVsLimit')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison for {formatMonthLabel(selectedMonth)}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
              <span>Within Limit</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
              <span>Exceeded</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-slate-600 inline-block" />
              <span>Budget Cap</span>
            </div>
          </div>
        </div>

        {groupBudgetData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {t('budgetDash.noGroups')}
          </div>
        ) : (
          <div className="w-full h-[320px] pt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={groupBudgetData}
                margin={{ top: 20, right: 20, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  interval={0}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={14}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={11}
                        fontWeight={500}
                      >
                        {payload.value.length > 16 ? `${payload.value.slice(0, 14)}…` : payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
                        <p className="font-bold text-white text-sm border-b border-slate-800 pb-1">
                          {data.name}
                        </p>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>{t('budgetDash.actualSpent')}:</span>
                          <span className="font-bold text-white font-mono tabular-nums">
                            ${data.spent.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>{t('budgetDash.budgetLimit')}:</span>
                          <span className="font-semibold text-slate-300 font-mono tabular-nums">
                            {data.hasLimit ? `$${data.limit.toFixed(2)}` : 'None'}
                          </span>
                        </div>
                        {data.hasLimit && (
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                            <span className={data.isOver ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                              {data.isOver ? 'Over Budget' : 'Remaining'}:
                            </span>
                            <span className={`font-mono font-bold tabular-nums ${data.isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {data.isOver ? `+$${Math.abs(data.variance).toFixed(2)}` : `$${data.variance.toFixed(2)}`} ({data.percentage}%)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  wrapperStyle={{ paddingBottom: 10, fontSize: 11 }} 
                />
                <Bar 
                  name="Spent" 
                  dataKey="spent" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {groupBudgetData.map((entry) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.hasLimit ? (entry.isOver ? '#f43f5e' : entry.percentage > 80 ? '#f59e0b' : '#10b981') : '#06b6d4'}
                    />
                  ))}
                </Bar>
                <Bar 
                  name="Limit" 
                  dataKey="limit" 
                  fill="#475569" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={48} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* CHART 2 & 3: HISTORICAL MONTHLY TREND & CATEGORY BREAKDOWN            */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Historical Monthly Trend */}
        <section className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#0e1320] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>{t('budgetDash.monthlyTrend')}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Past 5 months spending burn rate
              </p>
            </div>
            {selectedGroupId !== 'all' && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                Filtered Group
              </span>
            )}
          </div>

          <div className="w-full h-[260px] pt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart
                data={historicalTrendData}
                margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                        <p className="font-bold text-white">{formatMonthLabel(item.monthKey)}</p>
                        <p className="text-emerald-400 font-mono font-semibold">
                          Spent: ${item.spent.toFixed(2)}
                        </p>
                        {item.limit && (
                          <p className="text-slate-400 font-mono text-[11px]">
                            Limit: ${item.limit.toFixed(2)}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="spent" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#spendingGradient)" 
                  name="Monthly Spending"
                />
                <Line 
                  type="monotone" 
                  dataKey="limit" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={false}
                  name="Budget Limit"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Category Breakdown Donut / Pie */}
        <section className="p-5 sm:p-6 rounded-3xl bg-[#0e1320] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-400" />
              <span>{t('budgetDash.categoryBreakdown')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Allocations in {formatShortMonth(selectedMonth)}
            </p>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No expenses recorded for this selection.
            </div>
          ) : (
            <>
              <div className="w-full h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry) => (
                        <Cell key={`cat-${entry.key}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-2.5 shadow-xl text-xs">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <span>{data.icon}</span> {data.name}: ${data.value.toFixed(2)}
                            </span>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend list */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {categoryData.slice(0, 4).map((cat) => (
                  <div key={cat.key} className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className="font-mono font-medium text-white tabular-nums shrink-0">
                      ${cat.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ===================================================================== */}
      {/* PER-GROUP BUDGET CARDS & QUICK LIMIT ADJUSTMENT                        */}
      {/* ===================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Group Budget Management & Spending Status</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {groupBudgetData.length} groups
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupBudgetData.map((group) => {
            const rawGroup = userGroups.find(g => g.id === group.id);
            const isEditing = editingGroupId === group.id;

            return (
              <div
                key={group.id}
                className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800 hover:border-slate-700/80 transition-all space-y-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white font-display">
                        {group.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {group.currency}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs mt-1">
                      {group.hasLimit ? (
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          group.isOver 
                            ? 'text-rose-400' 
                            : group.percentage > 80 
                            ? 'text-amber-400' 
                            : 'text-emerald-400'
                        }`}>
                          {group.isOver ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Over by ${Math.abs(group.variance).toFixed(2)}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>${group.variance.toFixed(2)} remaining</span>
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          {t('budgetDash.noLimitSet')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Inline Limit Edit Action */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editLimitValue}
                        onChange={(e) => setEditLimitValue(e.target.value)}
                        placeholder="Limit"
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveLimit(group.id)}
                        className="p-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg transition-colors cursor-pointer"
                        title={t('budgetDash.saveLimit')}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingGroupId(null)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <Check className="w-3.5 h-3.5 hidden" />
                        <span className="text-xs px-1">✕</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => rawGroup && handleStartEdit(rawGroup)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors p-1 rounded-lg hover:bg-slate-800"
                      title="Adjust Limit"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">
                        {group.hasLimit ? t('budgetDash.editLimit') : t('budgetDash.setLimitNow')}
                      </span>
                    </button>
                  )}
                </div>

                {/* Spending Progress Bar */}
                {group.hasLimit ? (
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">
                        Spent: <strong className="text-white font-mono font-bold">${group.spent.toFixed(2)}</strong>
                      </span>
                      <span className="text-slate-400">
                        Limit: <strong className="text-slate-200 font-mono font-semibold">${group.limit.toFixed(2)}</strong>
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          group.isOver
                            ? 'bg-rose-500'
                            : group.percentage > 80
                            ? 'bg-amber-400'
                            : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        }`}
                        style={{ width: `${Math.min(group.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Spent this month: ${group.spent.toFixed(2)}</span>
                    <button
                      onClick={() => rawGroup && handleStartEdit(rawGroup)}
                      className="text-emerald-400 hover:underline cursor-pointer font-medium"
                    >
                      + Set spending limit
                    </button>
                  </div>
                )}

                {/* Footer Link to Group Details */}
                {onSelectGroup && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {group.expenseCount} entries this month
                    </span>
                    <button
                      onClick={() => onSelectGroup(group.id)}
                      className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer font-medium"
                    >
                      <span>{t('budgetDash.viewGroup')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
