import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Group, CurrencyCode, ExpenseCategory, CATEGORY_ICONS } from '../types';
import { AddExpenseModal } from './AddExpenseModal';
import { ActivityFeed } from './ActivityFeed';
import { MonthlyBudgetDashboard } from './MonthlyBudgetDashboard';
import { 
  Plus, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  ChevronRight, 
  Archive, 
  Sparkles, 
  Layers, 
  Search,
  X,
  Receipt,
  Filter,
  Calendar,
  Tag,
  ArrowRight,
  Camera,
  BarChart3,
  Repeat
} from 'lucide-react';

interface DashboardProps {
  onSelectGroup: (groupId: string) => void;
  openUpgradeModal: () => void;
  openConvertGuestModal?: () => void;
}

const CATEGORY_LIST: Array<{ key: ExpenseCategory; icon: string }> = [
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

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectGroup,
  openUpgradeModal,
  openConvertGuestModal,
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { 
    userGroups, 
    archivedGroups, 
    userExpenses,
    createGroup, 
    getOverallNetBalance,
  } = useData();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [searchScope, setSearchScope] = useState<'all' | 'groups' | 'expenses'>('all');

  // Group tab state (Active vs Archived)
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Top Dashboard View Mode: Groups & Activity vs Monthly Budget Visualizer
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'monthly_budgets'>('overview');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCurrency, setNewGroupCurrency] = useState<CurrencyCode>('USD');
  const [newGroupBudget, setNewGroupBudget] = useState<string>('');

  const netBalance = getOverallNetBalance();

  const isSearchActive = searchQuery.trim().length > 0 || selectedCategory !== 'all';

  // Filter Groups by query and category
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const sourceGroups = isSearchActive 
      ? [...userGroups, ...archivedGroups] // Search across all accessible groups when searching
      : (activeTab === 'active' ? userGroups : archivedGroups);

    return sourceGroups.filter((g) => {
      // Name & description matching
      const matchesQuery = !q || 
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        g.base_currency.toLowerCase().includes(q);

      // Category matching
      let matchesCategory = true;
      if (selectedCategory !== 'all') {
        const catKey = selectedCategory.toLowerCase();
        const catLabel = t(`cat.${selectedCategory}`).toLowerCase();
        // Check if group has expenses in this category or mentions it
        const hasExpensesInCat = userExpenses.some(
          e => e.group_id === g.id && e.category === selectedCategory
        );
        matchesCategory = hasExpensesInCat || 
          g.name.toLowerCase().includes(catKey) || 
          g.name.toLowerCase().includes(catLabel) ||
          Boolean(g.description && (g.description.toLowerCase().includes(catKey) || g.description.toLowerCase().includes(catLabel)));
      }

      return matchesQuery && matchesCategory;
    });
  }, [searchQuery, selectedCategory, userGroups, archivedGroups, activeTab, isSearchActive, userExpenses, t]);

  // Filter Expenses by query and category
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return userExpenses.filter((e) => {
      // Category matching
      const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!q) return true;

      // Query matching across title, category name, payer name, group name, notes
      const catLabel = t(`cat.${e.category}`).toLowerCase();
      const payerName = e.payer?.full_name?.toLowerCase() || '';
      const groupName = e.group?.name?.toLowerCase() || '';
      const notesText = e.notes?.toLowerCase() || '';
      const amountStr = e.amount.toString();

      return (
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        catLabel.includes(q) ||
        payerName.includes(q) ||
        groupName.includes(q) ||
        notesText.includes(q) ||
        amountStr.includes(q)
      );
    });
  }, [searchQuery, selectedCategory, userExpenses, t]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSearchScope('all');
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const budget = newGroupBudget ? parseFloat(newGroupBudget) : undefined;
    const created = createGroup(newGroupName, newGroupDesc, newGroupCurrency, budget);
    
    // Reset form
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupCurrency('USD');
    setNewGroupBudget('');
    setIsCreateModalOpen(false);

    onSelectGroup(created.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      
      {/* ZERO-FRICTION GUEST SESSION BANNER & UPGRADE TRIGGER */}
      {currentUser?.is_anonymous && (
        <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0e1726] to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-in fade-in">
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
        </section>
      )}

      {/* DASHBOARD MODE SELECTOR: OVERVIEW VS. MONTHLY BUDGET VISUALIZER */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
          <button
            type="button"
            onClick={() => setDashboardTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              dashboardTab === 'overview'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('nav.groups')} & Activity</span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab('monthly_budgets')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              dashboardTab === 'monthly_budgets'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('budgetDash.title')}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
              PRO
            </span>
          </button>
        </div>

        {dashboardTab === 'overview' && (
          <div className="text-xs text-slate-400 hidden sm:block">
            <span>{userGroups.length} active groups</span>
          </div>
        )}
      </section>

      {/* RENDER VIEW ACCORDING TO DASHBOARD TAB */}
      {dashboardTab === 'monthly_budgets' ? (
        <MonthlyBudgetDashboard
          onSelectGroup={onSelectGroup}
          openUpgradeModal={openUpgradeModal}
        />
      ) : (
        <>
          {/* ============================================================ */}
          {/* SEARCH BAR & CATEGORY FILTER AT THE TOP OF THE DASHBOARD      */}
          {/* ============================================================ */}
          <section 
            className="p-4 sm:p-5 rounded-3xl bg-[#0e1320] border border-slate-800 shadow-xl space-y-3.5 transition-all"
            aria-label="Search and filter groups and expenses"
          >
        {/* Main Search Input */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
            <Search className="w-4 h-4 text-emerald-400" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dash.searchPlaceholder')}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all shadow-inner"
            aria-label="Search input"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Clear search text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row: Scope buttons & Category tags */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          
          {/* Scope Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs shrink-0 self-start">
            <button
              type="button"
              onClick={() => setSearchScope('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                searchScope === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('dash.searchAll')}
            </button>
            <button
              type="button"
              onClick={() => setSearchScope('groups')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                searchScope === 'groups'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('dash.searchGroups')} ({filteredGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setSearchScope('expenses')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                searchScope === 'expenses'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('dash.searchExpenses')} ({filteredExpenses.length})
            </button>
          </div>

          {/* Quick Clear Button (when active) */}
          {isSearchActive && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-mono text-emerald-400">
                {t('dash.resultsCount', { groups: filteredGroups.length, expenses: filteredExpenses.length })}
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-[11px] font-medium text-slate-400 hover:text-rose-400 underline cursor-pointer transition-colors"
              >
                {t('dash.clearSearch')}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Category Filter Pills */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 cursor-pointer transition-all border ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {t('dash.allCategories')}
            </button>

            {CATEGORY_LIST.map(({ key, icon }) => {
              const isSelected = selectedCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? 'all' : key)}
                  className={`px-2.5 py-1.5 rounded-xl font-medium shrink-0 cursor-pointer transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs" role="img" aria-hidden="true">{icon}</span>
                  <span>{t(`cat.${key}`)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEARCH RESULTS VIEW (When query or category is active)        */}
      {/* ============================================================ */}
      {isSearchActive ? (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Case 1: No results found at all */}
          {filteredGroups.length === 0 && filteredExpenses.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0e1320] border border-slate-800/80 text-center">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white font-display">
                {t('dash.noSearchResults')}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {t('dash.noSearchResultsSub')}
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('dash.clearSearch')}
              </button>
            </div>
          ) : (
            <>
              {/* Groups Results (Shown if scope is 'all' or 'groups') */}
              {(searchScope === 'all' || searchScope === 'groups') && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>{t('dash.searchGroups')} ({filteredGroups.length})</span>
                    </h2>
                  </div>

                  {filteredGroups.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-[#0e1320] rounded-2xl border border-slate-800">
                      No matching groups found.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {filteredGroups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => onSelectGroup(group.id)}
                          className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800 hover:border-slate-700/80 hover:bg-[#121828] transition-all text-left flex flex-col justify-between group cursor-pointer shadow-lg"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-400">
                                {group.base_currency}
                              </span>
                              {group.is_archived && (
                                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                  {t('gd.archived')}
                                </span>
                              )}
                              {group.budget_limit && (
                                <span className="text-[11px] text-emerald-400/90 font-mono tabular-nums">
                                  Budget: ${group.budget_limit}
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-bold text-white font-display mt-2 group-hover:text-emerald-300 transition-colors">
                              {group.name}
                            </h3>

                            {group.description && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                {group.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Users className="w-3.5 h-3.5" />
                              <span>{t('dash.viewGroup')}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Expenses Results (Shown if scope is 'all' or 'expenses') */}
              {(searchScope === 'all' || searchScope === 'expenses') && (
                <section className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-teal-400" />
                      <span>{t('dash.searchExpenses')} ({filteredExpenses.length})</span>
                    </h2>
                  </div>

                  {filteredExpenses.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-[#0e1320] rounded-2xl border border-slate-800">
                      No matching expenses found.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredExpenses.map((exp) => (
                        <div
                          key={exp.id}
                          onClick={() => onSelectGroup(exp.group_id)}
                          className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1320] border border-slate-800 hover:border-slate-700/80 hover:bg-[#121828] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                              {CATEGORY_ICONS[exp.category] || '📦'}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate flex items-center gap-1.5">
                                <span>{exp.title}</span>
                                {exp.recurring_parent_id && (
                                  <span className="px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[9px] font-semibold flex items-center gap-0.5 shrink-0">
                                    <Repeat className="w-2.5 h-2.5 text-teal-400" />
                                    <span>{t('rec.badge')}</span>
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                                <span className="text-emerald-400/90 font-medium">
                                  {t(`cat.${exp.category}`)}
                                </span>
                                <span>·</span>
                                <span className="truncate">
                                  {t('dash.inGroup')} <strong className="text-slate-300">{exp.group?.name || 'Group'}</strong>
                                </span>
                                <span className="hidden sm:inline">·</span>
                                <span className="hidden sm:inline truncate">
                                  {t('dash.paidBy')} {exp.payer?.full_name?.split(' ')[0] || 'Member'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-2.5">
                            <div>
                              <p className="text-sm sm:text-base font-bold font-mono text-white tabular-nums">
                                ${exp.amount.toFixed(2)}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {exp.date}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

        </div>
      ) : (
        /* ============================================================ */
        /* STANDARD DASHBOARD VIEW (When no active search is running)   */
        /* ============================================================ */
        <>
          {/* Welcome & Net Balance Hero Card */}
          <section className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0e1424] via-[#0b101c] to-[#080d18] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{t('dash.overview')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentUser?.full_name}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white mt-1 tabular-nums">
                  {netBalance.net >= 0 ? `+$${netBalance.net.toFixed(2)}` : `-$${Math.abs(netBalance.net).toFixed(2)}`}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {t('dash.netBalance')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('dash.newGroup')}</span>
                </button>
              </div>
            </div>

            {/* 2-Column Balance Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span className="font-medium">{t('dash.youAreOwed')}</span>
                </div>
                <p className="text-lg sm:text-xl font-bold font-display text-white mt-1 tabular-nums">
                  ${netBalance.owedToYou.toFixed(2)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="font-medium">{t('dash.youOwe')}</span>
                </div>
                <p className="text-lg sm:text-xl font-bold font-display text-white mt-1 tabular-nums">
                  ${netBalance.youOwe.toFixed(2)}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between sm:block">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{t('dash.activeGroups')}</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold font-display text-white mt-1 tabular-nums">
                    {userGroups.length}
                  </p>
                </div>
                {currentUser?.tier === 'free' && (
                  <button
                    onClick={openUpgradeModal}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 sm:mt-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> {t('nav.upgrade')}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Group List Section Header & Segmented Tabs */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              {/* Segmented Filter Control */}
              <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 max-w-fit">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'active' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('dash.tabActive')} ({userGroups.length})
                </button>
                <button
                  onClick={() => setActiveTab('archived')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    activeTab === 'archived' 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Archive className="w-3 h-3" />
                  <span>{t('dash.tabArchived')} ({archivedGroups.length})</span>
                </button>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('dash.newGroup')}</span>
              </button>
            </div>

            {/* Groups Grid */}
            {filteredGroups.length === 0 ? (
              <div className="p-10 rounded-3xl bg-[#0e1320] border border-slate-800/80 text-center">
                <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white font-display">
                  {activeTab === 'active' ? t('dash.noActive') : t('dash.tabArchived')}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {activeTab === 'active' ? t('dash.noActiveSub') : ''}
                </p>
                {activeTab === 'active' && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    {t('dash.createFirst')}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => onSelectGroup(group.id)}
                    className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800 hover:border-slate-700/80 hover:bg-[#121828] transition-all text-left flex flex-col justify-between group cursor-pointer shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-400">
                          {group.base_currency}
                        </span>
                        {group.budget_limit && (
                          <span className="text-[11px] text-emerald-400/90 font-mono tabular-nums">
                            Budget: ${group.budget_limit}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white font-display mt-2 group-hover:text-emerald-300 transition-colors">
                        {group.name}
                      </h3>

                      {group.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>{t('dash.viewGroup')}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ============================================================ */}
          {/* REAL-TIME GROUP ACTIVITY FEED (User Request 3)               */}
          {/* Shows recent expense additions, comments, and settlements    */}
          {/* ============================================================ */}
          <ActivityFeed onSelectGroup={onSelectGroup} />

          {/* ============================================================ */}
          {/* RECENT EXPENSES SECTION (On standard Dashboard)              */}
          {/* ============================================================ */}
          {userExpenses.length > 0 && (
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>{t('dash.recentExpenses')}</span>
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {userExpenses.length} total
                </span>
              </div>

              <div className="space-y-2">
                {userExpenses.slice(0, 5).map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => onSelectGroup(exp.group_id)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1320] border border-slate-800 hover:border-slate-700/80 hover:bg-[#121828] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                        {CATEGORY_ICONS[exp.category] || '📦'}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                          {exp.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                          {exp.milestone && (
                            <>
                              <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-medium shrink-0">
                                {exp.milestone.icon || '📍'} {exp.milestone.title.split(':')[0]}
                              </span>
                              <span>·</span>
                            </>
                          )}
                          <span className="text-emerald-400/90 font-medium">
                            {t(`cat.${exp.category}`)}
                          </span>
                          <span>·</span>
                          <span className="truncate">
                            {t('dash.inGroup')} <strong className="text-slate-300">{exp.group?.name || 'Group'}</strong>
                          </span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline truncate">
                            {t('dash.paidBy')} {exp.payer?.full_name?.split(' ')[0] || 'Member'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2.5">
                      <div>
                        <p className="text-sm sm:text-base font-bold font-mono text-white tabular-nums">
                          ${exp.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {exp.date}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
        </>
      )}

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e1320] border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <h2 className="text-xl font-display font-bold text-white">{t('group.createTitle')}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {t('group.createSub')}
            </p>

            <form onSubmit={handleCreateGroup} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('group.nameLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={t('group.namePlaceholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('group.descLabel')}
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder={t('group.descPlaceholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('group.currencyLabel')}
                  </label>
                  <select
                    value={newGroupCurrency}
                    onChange={(e) => setNewGroupCurrency(e.target.value as CurrencyCode)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('group.budgetLabel')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newGroupBudget}
                    onChange={(e) => setNewGroupBudget(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t('group.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {t('group.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Buttons in the Bottom-Right Corner */}
      <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setIsQuickAddModalOpen(true)}
          className="group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-xl shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          title="Scan Receipt with Camera & AI"
          aria-label="Scan Receipt with Camera & AI"
        >
          <Camera className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] group-hover:scale-110 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => setIsQuickAddModalOpen(true)}
          className="group flex items-center gap-2 h-12 sm:h-14 px-4 sm:px-5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-bold shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-emerald-300/40"
          aria-label={t('dash.fabAdd')}
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-950/15 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.75] transition-transform duration-200 group-hover:rotate-90 text-slate-950" />
          </div>
          <span className="text-xs sm:text-sm font-extrabold tracking-tight whitespace-nowrap">
            {t('dash.fabAdd')}
          </span>
        </button>
      </div>

      {/* Quick Add Expense Modal */}
      <AddExpenseModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        openUpgradeModal={openUpgradeModal}
        allowGroupSelection={true}
        onOpenCreateGroup={() => setIsCreateModalOpen(true)}
      />

    </div>
  );
};
