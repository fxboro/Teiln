/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Receipt, 
  MessageSquare, 
  CheckCircle2, 
  Send, 
  ChevronRight, 
  Filter, 
  Layers, 
  Zap, 
  ArrowRight,
  Clock,
  UserCheck,
  SmilePlus,
  Smile,
  Heart
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ExpenseCategory, CATEGORY_ICONS, User, Reaction } from '../types';

export type ActivityKind = 'expense' | 'comment' | 'settlement';

export interface UnifiedActivityItem {
  id: string;
  rawId: string;
  kind: ActivityKind;
  targetType: 'expense' | 'message' | 'settlement';
  timestamp: string;
  groupId: string;
  groupName: string;
  user?: User;
  userName: string;
  title: string;
  content?: string;
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  receiverName?: string;
  receiverUser?: User;
  splitsCount?: number;
  notes?: string;
}

export const POPULAR_REACTION_EMOJIS = ['👍', '❤️', '🔥', '💸', '🎉', '👏', '😂', '🙌', '💡', '☕'];

interface ActivityFeedProps {
  onSelectGroup: (groupId: string) => void;
  selectedGroupId?: string;
  limit?: number;
  showQuickComposer?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  onSelectGroup,
  selectedGroupId: initialGroupId,
  limit = 20,
  showQuickComposer = true,
}) => {
  const { 
    userGroups, 
    userExpenses, 
    userSettlements, 
    userMessages, 
    sendMessage,
    addExpense,
    recordSettlement,
    reactions,
    toggleReaction,
    allUsers: dataAllUsers
  } = useData() as any;
  const { currentUser, allUsers } = useAuth();
  const { t } = useLanguage();

  const [kindFilter, setKindFilter] = useState<'all' | ActivityKind>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId || 'all');
  const [quickCommentText, setQuickCommentText] = useState('');
  const [targetCommentGroupId, setTargetCommentGroupId] = useState<string>(
    userGroups[0]?.id || ''
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [composerFeedback, setComposerFeedback] = useState<string | null>(null);
  const [openReactionPickerId, setOpenReactionPickerId] = useState<string | null>(null);

  // Close reaction picker on window click
  useEffect(() => {
    const handleClosePickers = () => setOpenReactionPickerId(null);
    window.addEventListener('click', handleClosePickers);
    return () => window.removeEventListener('click', handleClosePickers);
  }, []);

  // Map of groups for quick name lookup
  const groupMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of userGroups) {
      map.set(g.id, g.name);
    }
    return map;
  }, [userGroups]);

  // Combine expenses, comments (chat messages), and settlements into unified activity timeline
  const activities = useMemo<UnifiedActivityItem[]>(() => {
    const items: UnifiedActivityItem[] = [];

    // 1. Recent Expenses
    for (const exp of userExpenses) {
      const gName = groupMap.get(exp.group_id) || exp.group?.name || 'Group';
      items.push({
        id: `act_exp_${exp.id}`,
        rawId: exp.id,
        kind: 'expense',
        targetType: 'expense',
        timestamp: exp.created_at || exp.date,
        groupId: exp.group_id,
        groupName: gName,
        user: exp.payer,
        userName: exp.payer?.full_name || 'Member',
        title: exp.title,
        amount: exp.amount,
        currency: exp.currency || 'USD',
        category: exp.category,
        splitsCount: exp.splits?.length || 0,
        notes: exp.notes,
      });
    }

    // 2. Comments / Chat Messages
    for (const msg of userMessages) {
      if (msg.message_type === 'chat') {
        const gName = groupMap.get(msg.group_id) || 'Group';
        items.push({
          id: `act_msg_${msg.id}`,
          rawId: msg.id,
          kind: 'comment',
          targetType: 'message',
          timestamp: msg.created_at,
          groupId: msg.group_id,
          groupName: gName,
          user: msg.user,
          userName: msg.user?.full_name || 'Member',
          title: `Commented in ${gName}`,
          content: msg.content,
        });
      }
    }

    // 3. Settlement Events
    for (const stl of userSettlements) {
      const gName = groupMap.get(stl.group_id) || 'Group';
      items.push({
        id: `act_stl_${stl.id}`,
        rawId: stl.id,
        kind: 'settlement',
        targetType: 'settlement',
        timestamp: stl.created_at || stl.date,
        groupId: stl.group_id,
        groupName: gName,
        user: stl.payer,
        userName: stl.payer?.full_name || 'Payer',
        receiverUser: stl.receiver,
        receiverName: stl.receiver?.full_name || 'Receiver',
        title: `${stl.payer?.full_name || 'Payer'} paid ${stl.receiver?.full_name || 'Receiver'}`,
        amount: stl.amount,
        currency: stl.currency || 'USD',
        notes: stl.notes || t('feed.settledDebt'),
      });
    }

    // Sort by timestamp descending (newest first)
    return items.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [userExpenses, userMessages, userSettlements, groupMap, t]);

  // Filter items based on user selected filters
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (kindFilter !== 'all' && act.kind !== kindFilter) return false;
      if (selectedGroupId !== 'all' && act.groupId !== selectedGroupId) return false;
      return true;
    }).slice(0, limit);
  }, [activities, kindFilter, selectedGroupId, limit]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const scoped = selectedGroupId === 'all' 
      ? activities 
      : activities.filter(a => a.groupId === selectedGroupId);
    
    return {
      all: scoped.length,
      expense: scoped.filter(a => a.kind === 'expense').length,
      comment: scoped.filter(a => a.kind === 'comment').length,
      settlement: scoped.filter(a => a.kind === 'settlement').length,
    };
  }, [activities, selectedGroupId]);

  // Handle Quick Comment Submission
  const handleQuickComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCommentText.trim()) return;

    const targetId = selectedGroupId !== 'all' ? selectedGroupId : targetCommentGroupId;
    if (!targetId) return;

    try {
      sendMessage(targetId, quickCommentText.trim());
      setQuickCommentText('');
      setComposerFeedback('Comment posted to live feed! ✨');
      setTimeout(() => setComposerFeedback(null), 3000);
    } catch (err: any) {
      console.error('Failed to post quick comment:', err);
    }
  };

  // Helper: Format relative timestamp
  const formatRelativeTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 45) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  // Simulate an incoming live activity to demonstrate real-time feed responsiveness
  const handleSimulateLiveActivity = () => {
    if (userGroups.length === 0) return;
    setIsSimulating(true);

    const targetGroup = userGroups[0];
    const groupUsers = (allUsers && allUsers.length > 0) ? allUsers : [currentUser];
    const randomMember = groupUsers[Math.floor(Math.random() * groupUsers.length)];

    const simTypes = ['comment', 'expense', 'reaction', 'settlement'] as const;
    const chosenType = simTypes[Math.floor(Math.random() * simTypes.length)];

    setTimeout(() => {
      try {
        if (chosenType === 'comment') {
          const sampleComments = [
            'Just checked the receipts, looks great!',
            'Thanks for fronting this everyone!',
            'Will send my share via bank transfer tonight ⚡',
            'Added notes for our next stop tomorrow morning ☕',
          ];
          const text = sampleComments[Math.floor(Math.random() * sampleComments.length)];
          sendMessage(targetGroup.id, text);
          setComposerFeedback(`Simulated comment added by ${randomMember?.full_name || 'Member'}!`);
        } else if (chosenType === 'expense') {
          const sampleExpenses = [
            { title: 'Morning Artisanal Coffee & Croissants', amount: 18.50, cat: 'dining' as ExpenseCategory },
            { title: 'Highway Toll & Gas Refill', amount: 42.00, cat: 'transport' as ExpenseCategory },
            { title: 'Snacks & Bottled Water for Hike', amount: 15.20, cat: 'groceries' as ExpenseCategory },
          ];
          const exp = sampleExpenses[Math.floor(Math.random() * sampleExpenses.length)];
          addExpense({
            groupId: targetGroup.id,
            title: exp.title,
            amount: exp.amount,
            category: exp.cat,
            paidByUserId: randomMember?.id || currentUser?.id || 'usr_alex',
            date: new Date().toISOString().split('T')[0],
            notes: 'Live expense addition demonstration',
            splits: [
              { userId: currentUser?.id || 'usr_alex', amount: exp.amount / 2, splitType: 'equal' },
              { userId: randomMember?.id || 'usr_clara', amount: exp.amount / 2, splitType: 'equal' },
            ],
          });
          setComposerFeedback(`Simulated expense "${exp.title}" added to ${targetGroup.name}!`);
        } else if (chosenType === 'reaction' && activities.length > 0) {
          const targetAct = activities[Math.floor(Math.random() * Math.min(activities.length, 4))];
          const rxEmojis = ['❤️', '🔥', '🎉', '👍', '💸', '👏'];
          const pickedEmoji = rxEmojis[Math.floor(Math.random() * rxEmojis.length)];
          toggleReaction(targetAct.rawId, targetAct.targetType, pickedEmoji);
          setComposerFeedback(`${randomMember?.full_name || 'Member'} reacted ${pickedEmoji} to "${targetAct.title}"!`);
        } else {
          const otherMember = groupUsers.find((u: any) => u.id !== randomMember?.id) || currentUser;
          recordSettlement({
            groupId: targetGroup.id,
            payerId: randomMember?.id || 'usr_clara',
            receiverId: otherMember?.id || currentUser?.id || 'usr_alex',
            amount: 25.00,
            notes: 'Quick Venmo transfer',
          });
          setComposerFeedback(`Simulated settlement recorded in ${targetGroup.name}!`);
        }
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setIsSimulating(false);
        setTimeout(() => setComposerFeedback(null), 3500);
      }
    }, 400);
  };

  const getCurrencySymbol = (code?: string) => {
    switch (code) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      default: return '$';
    }
  };

  return (
    <section 
      className="p-5 sm:p-6 rounded-3xl bg-[#0e1320] border border-slate-800 shadow-xl space-y-5 transition-all"
      aria-label="Real-time Activity Feed"
    >
      {/* Header Row: Title, Live Sync Pulse, and Event Simulation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-display font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>{t('feed.title')}</span>
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('feed.badgeLive')}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('feed.subtitle')}
          </p>
        </div>
      </div>

      {/* Temporary Toast feedback on new activity simulation or comment */}
      {composerFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{composerFeedback}</span>
        </div>
      )}

      {/* Filter Row: Type pills & Group selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Kind Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/90 text-xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setKindFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              kindFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('feed.filterAll')}</span>
            <span className="text-[10px] opacity-75 font-mono">({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setKindFilter('expense')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              kindFilter === 'expense'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('feed.filterExpenses')}</span>
            <span className="text-[10px] opacity-75 font-mono">({counts.expense})</span>
          </button>

          <button
            type="button"
            onClick={() => setKindFilter('comment')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              kindFilter === 'comment'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('feed.filterComments')}</span>
            <span className="text-[10px] opacity-75 font-mono">({counts.comment})</span>
          </button>

          <button
            type="button"
            onClick={() => setKindFilter('settlement')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              kindFilter === 'settlement'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('feed.filterSettlements')}</span>
            <span className="text-[10px] opacity-75 font-mono">({counts.settlement})</span>
          </button>
        </div>

        {/* Group Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/60 cursor-pointer"
            aria-label="Filter activity by group"
          >
            <option value="all">{t('feed.allGroups')}</option>
            {userGroups.map((g: any) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QUICK COMMENT COMPOSER: Write a message directly from the Dashboard feed */}
      {showQuickComposer && userGroups.length > 0 && (
        <form 
          onSubmit={handleQuickComment}
          className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-2.5 transition-all focus-within:border-emerald-500/50"
        >
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('feed.quickComment')}</span>
              {selectedGroupId !== 'all' ? (
                <strong className="text-emerald-400">
                  {groupMap.get(selectedGroupId) || 'Group'}
                </strong>
              ) : (
                <select
                  value={targetCommentGroupId}
                  onChange={(e) => setTargetCommentGroupId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                >
                  {userGroups.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Instant group sync
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={quickCommentText}
              onChange={(e) => setQuickCommentText(e.target.value)}
              placeholder={t('feed.commentPlaceholder')}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
            <button
              type="submit"
              disabled={!quickCommentText.trim()}
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('feed.post')}</span>
            </button>
          </div>
        </form>
      )}

      {/* FEED ITEMS LIST */}
      <div className="space-y-2.5">
        {filteredActivities.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
            <Zap className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">{t('feed.noActivity')}</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t('feed.noActivitySub')}
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const isAnonymous = Boolean(act.user?.is_anonymous);
            const userInitial = act.userName.charAt(0).toUpperCase() || 'M';

            // Group reactions for this specific activity item
            const itemReactions = (reactions || []).filter((r: Reaction) => r.target_id === act.rawId);
            const reactionGroupsMap = new Map<string, { count: number; users: string[]; hasReacted: boolean }>();
            for (const r of itemReactions) {
              const existing = reactionGroupsMap.get(r.emoji) || { count: 0, users: [], hasReacted: false };
              existing.count += 1;
              if (r.user_name) existing.users.push(r.user_name);
              if (currentUser && r.user_id === currentUser.id) {
                existing.hasReacted = true;
              }
              reactionGroupsMap.set(r.emoji, existing);
            }
            const reactionGroups = Array.from(reactionGroupsMap.entries()).map(([emoji, data]) => ({ emoji, ...data }));

            return (
              <div
                key={act.id}
                onClick={() => onSelectGroup(act.groupId)}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 transition-all flex items-start justify-between gap-3 group cursor-pointer shadow-sm relative overflow-visible"
              >
                {/* Left side: Avatar / Badge + Details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Avatar or Icon Indicator */}
                  <div className="relative shrink-0">
                    <div 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-105 shadow-inner ${
                        isAnonymous
                          ? 'bg-slate-800 text-slate-400 border border-slate-700 grayscale'
                          : act.kind === 'expense'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : act.kind === 'settlement'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                              : 'bg-teal-950 text-teal-300 border border-teal-500/30'
                      }`}
                    >
                      {act.kind === 'expense' ? (
                        <span className="text-base">{CATEGORY_ICONS[act.category || 'other'] || '💳'}</span>
                      ) : act.kind === 'settlement' ? (
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-teal-400" />
                      )}
                    </div>

                    {/* Mini Type Badge Indicator at bottom right */}
                    <span 
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] border border-slate-900 shadow-sm ${
                        act.kind === 'expense'
                          ? 'bg-emerald-400 text-slate-950'
                          : act.kind === 'settlement'
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-teal-400 text-slate-950'
                      }`}
                    >
                      {act.kind === 'expense' ? '€' : act.kind === 'settlement' ? '✓' : '💬'}
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="min-w-0 space-y-1 flex-1">
                    {/* Top Row: User name, Action Kind Badge, and Group Tag */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className={`font-semibold truncate ${isAnonymous ? 'text-slate-400' : 'text-white group-hover:text-emerald-300 transition-colors'}`}>
                        {act.userName}
                        {isAnonymous && <span className="text-[10px] text-slate-500 ml-1 font-normal">(Guest)</span>}
                      </span>

                      {/* Group Tag */}
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 truncate">
                        {act.groupName}
                      </span>
                    </div>

                    {/* Main Description */}
                    {act.kind === 'expense' && (
                      <div className="text-xs text-slate-300">
                        <span>Added </span>
                        <strong className="text-white font-medium">"{act.title}"</strong>
                        {act.splitsCount && act.splitsCount > 0 && (
                          <span className="text-slate-400 text-[11px] ml-1.5">
                            · {t('feed.splitAmong', { n: act.splitsCount })}
                          </span>
                        )}
                      </div>
                    )}

                    {act.kind === 'comment' && (
                      <p className="text-xs text-slate-200 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 mt-1">
                        "{act.content}"
                      </p>
                    )}

                    {act.kind === 'settlement' && (
                      <div className="text-xs text-slate-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Paid <strong className="text-white">{act.receiverName}</strong></span>
                        {act.notes && (
                          <span className="text-slate-400 text-[11px] italic">
                            ({act.notes})
                          </span>
                        )}
                      </div>
                    )}

                    {/* SOCIAL EMOJI REACTIONS BAR (Interactive Social Enhancement) */}
                    <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                      {/* Active Reaction Pills */}
                      {reactionGroups.map(({ emoji, count, users, hasReacted }) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReaction(act.rawId, act.targetType, emoji);
                          }}
                          className={`px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5 border transition-all active:scale-90 cursor-pointer shadow-sm select-none ${
                            hasReacted
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 ring-1 ring-emerald-500/40 font-bold'
                              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                          }`}
                          title={`${users.join(', ')} reacted with ${emoji}`}
                          aria-label={`Reaction ${emoji} (${count})`}
                        >
                          <span className="text-sm leading-none">{emoji}</span>
                          <span className="text-[11px] font-mono tabular-nums">{count}</span>
                        </button>
                      ))}

                      {/* Add Reaction Button & Popover */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenReactionPickerId(openReactionPickerId === act.id ? null : act.id);
                          }}
                          className="px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                          title={t('feed.addReaction')}
                          aria-label="Add reaction"
                        >
                          <SmilePlus className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] hidden sm:inline">{t('feed.react')}</span>
                        </button>

                        {/* Floating Emoji Picker Popover */}
                        {openReactionPickerId === act.id && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 bottom-full mb-2 z-50 p-2 rounded-2xl bg-[#0b101c]/98 border border-slate-700/90 shadow-2xl backdrop-blur-md flex items-center gap-1 animate-in fade-in zoom-in-95"
                          >
                            {POPULAR_REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReaction(act.rawId, act.targetType, emoji);
                                  setOpenReactionPickerId(null);
                                }}
                                className="w-7 h-7 rounded-xl hover:bg-slate-800 flex items-center justify-center text-base hover:scale-125 transition-transform cursor-pointer"
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick 1-tap reaction shortcuts when no reactions exist yet */}
                      {reactionGroups.length === 0 && (
                        <div className="hidden sm:flex items-center gap-1 text-slate-500 text-xs pl-0.5">
                          {['👍', '❤️', '🔥'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReaction(act.rawId, act.targetType, emoji);
                              }}
                              className="hover:scale-125 transition-transform cursor-pointer p-0.5"
                              title={`Quick react ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Amount & Relative Time */}
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    {act.amount !== undefined && (
                      <p className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
                        act.kind === 'settlement' ? 'text-cyan-400' : 'text-emerald-400'
                      }`}>
                        {getCurrencySymbol(act.currency)}{act.amount.toFixed(2)}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatRelativeTime(act.timestamp)}</span>
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
