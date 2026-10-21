/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Milestone, Expense } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  Calendar, 
  Sparkles, 
  Filter, 
  RotateCcw, 
  Plus, 
  Flag, 
  Layers, 
  X,
  Clock
} from 'lucide-react';

interface TimelineFilterProps {
  milestones: Milestone[];
  selectedFilter: string; // 'all' | milestone.id | 'unassigned'
  onSelectFilter: (filterId: string) => void;
  expenses: Expense[];
  baseCurrency?: string;
  onCreateMilestone?: () => void;
  className?: string;
}

export const TimelineFilter: React.FC<TimelineFilterProps> = ({
  milestones,
  selectedFilter,
  onSelectFilter,
  expenses,
  baseCurrency = 'USD',
  onCreateMilestone,
  className = '',
}) => {
  const { t } = useLanguage();

  const totalSpentAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const unassignedExpenses = expenses.filter(e => !e.milestone_id);
  const unassignedTotal = unassignedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const selectedMilestone = selectedFilter !== 'all' && selectedFilter !== 'unassigned'
    ? milestones.find(m => m.id === selectedFilter)
    : null;

  const currencySymbol = baseCurrency === 'EUR' ? '€' : baseCurrency === 'GBP' ? '£' : '$';

  return (
    <div className={`p-4 rounded-3xl bg-[#0e1320] border border-slate-800 shadow-xl space-y-3 ${className}`}>
      
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-display flex items-center gap-1.5">
              <span>{t('timelineFilter.title')}</span>
              {selectedFilter !== 'all' && (
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {t('timelineFilter.sub')}
            </p>
          </div>
        </div>

        {/* Right Status / Reset */}
        <div className="flex items-center gap-2">
          {selectedFilter !== 'all' ? (
            <button
              type="button"
              onClick={() => onSelectFilter('all')}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 hover:border-teal-400/50 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-teal-400" />
              <span>{t('timelineFilter.clearFilter')}</span>
            </button>
          ) : (
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {expenses.length} {expenses.length === 1 ? 'charge' : 'charges'} · {currencySymbol}{totalSpentAll.toFixed(2)}
            </span>
          )}

          {onCreateMilestone && (
            <button
              type="button"
              onClick={onCreateMilestone}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Add Event Day / Milestone"
              aria-label="Add Milestone"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* 'All Time' Chip */}
        <button
          type="button"
          onClick={() => onSelectFilter('all')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 border ${
            selectedFilter === 'all'
              ? 'bg-gradient-to-r from-teal-500/20 via-emerald-500/20 to-teal-500/10 border-teal-400/60 text-white shadow-md shadow-teal-500/10'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${selectedFilter === 'all' ? 'text-teal-400' : 'text-slate-500'}`} />
          <span>{t('timelineFilter.allTime')}</span>
          <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] tabular-nums ${
            selectedFilter === 'all'
              ? 'bg-teal-400/20 text-teal-200 font-bold'
              : 'bg-slate-900 text-slate-500'
          }`}>
            {expenses.length}
          </span>
          <span className={`font-mono text-[11px] tabular-nums ${
            selectedFilter === 'all' ? 'text-teal-300 font-bold' : 'text-slate-500'
          }`}>
            {currencySymbol}{totalSpentAll.toFixed(2)}
          </span>
        </button>

        {/* Milestones / Event Days Chips */}
        {milestones.map((m) => {
          const mExpenses = expenses.filter(e => e.milestone_id === m.id);
          const mTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);
          const isSelected = selectedFilter === m.id;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectFilter(m.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? 'bg-gradient-to-r from-teal-500/25 via-emerald-500/20 to-slate-900 border-teal-400/70 text-white shadow-md shadow-teal-500/15 ring-1 ring-teal-400/30'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="text-sm shrink-0">{m.icon || '📍'}</span>
              <div className="text-left flex items-center gap-1.5">
                <span className="truncate max-w-[130px] font-display">
                  {m.title}
                </span>
                {m.date && (
                  <span className={`text-[10px] font-mono shrink-0 ${
                    isSelected ? 'text-teal-200/80' : 'text-slate-500'
                  }`}>
                    {m.date.slice(5)}
                  </span>
                )}
              </div>
              <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] tabular-nums ${
                isSelected
                  ? 'bg-teal-400/20 text-teal-200 font-bold'
                  : 'bg-slate-900 text-slate-500'
              }`}>
                {mExpenses.length}
              </span>
              <span className={`font-mono text-[11px] tabular-nums ${
                isSelected ? 'text-teal-300 font-bold' : 'text-slate-400'
              }`}>
                {currencySymbol}{mTotal.toFixed(2)}
              </span>
            </button>
          );
        })}

        {/* 'Ungrouped' Chip (if unassigned expenses exist) */}
        {unassignedExpenses.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectFilter('unassigned')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 border ${
              selectedFilter === 'unassigned'
                ? 'bg-gradient-to-r from-amber-500/20 to-slate-900 border-amber-400/60 text-white shadow-md shadow-amber-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span className="text-sm">📦</span>
            <span>{t('timelineFilter.ungrouped')}</span>
            <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] tabular-nums ${
              selectedFilter === 'unassigned'
                ? 'bg-amber-400/20 text-amber-200 font-bold'
                : 'bg-slate-900 text-slate-500'
            }`}>
              {unassignedExpenses.length}
            </span>
            <span className={`font-mono text-[11px] tabular-nums ${
              selectedFilter === 'unassigned' ? 'text-amber-300 font-bold' : 'text-slate-500'
            }`}>
              {currencySymbol}{unassignedTotal.toFixed(2)}
            </span>
          </button>
        )}
      </div>

      {/* Selected Day Highlights Banner */}
      {selectedMilestone && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/30 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center text-base shrink-0 shadow-sm">
              {selectedMilestone.icon || '📍'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white truncate font-display">
                  {selectedMilestone.title}
                </span>
                {selectedMilestone.date && (
                  <span className="text-[10px] text-teal-300 font-mono flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-teal-400" />
                    {selectedMilestone.date}
                  </span>
                )}
                {selectedMilestone.day_number !== undefined && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-200 font-mono font-bold uppercase">
                    Day {selectedMilestone.day_number}
                  </span>
                )}
              </div>
              {selectedMilestone.description && (
                <p className="text-[11px] text-slate-300 italic mt-0.5 truncate flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>"{selectedMilestone.description}"</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
            <span className="text-xs font-bold font-mono text-teal-300 tabular-nums">
              {currencySymbol}
              {expenses
                .filter(e => e.milestone_id === selectedMilestone.id)
                .reduce((sum, e) => sum + e.amount, 0)
                .toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => onSelectFilter('all')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Show All Time"
              aria-label="Reset filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Ungrouped Highlights Banner */}
      {selectedFilter === 'unassigned' && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">📦</span>
            <div>
              <p className="text-xs font-bold text-white">
                {t('milestones.unassignedTitle')}
              </p>
              <p className="text-[10px] text-slate-400">
                {t('milestones.unassignedSub')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectFilter('all')}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Show All Time"
            aria-label="Reset filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
