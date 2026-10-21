import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Group, 
  GroupMember, 
  Expense, 
  ExpenseSplit, 
  Settlement, 
  Message, 
  User, 
  CurrencyCode, 
  ExpenseCategory,
  SimplifiedDebt,
  Reaction,
  Milestone,
  RecurringExpense,
  RecurrenceFrequency,
  SettlementRequest,
  InAppNotification,
  NotificationPreferences,
} from '../types';
import { 
  SEED_GROUPS, 
  SEED_GROUP_MEMBERS, 
  SEED_EXPENSES, 
  SEED_SETTLEMENTS, 
  SEED_MESSAGES,
  SEED_REACTIONS,
  SEED_MILESTONES,
  SEED_RECURRING_EXPENSES,
  SEED_SETTLEMENT_REQUESTS,
} from '../data/seedData';
import { calculateBalances, GroupBalancesResult } from '../lib/debtSimplification';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  loadNotificationPreferences,
  saveNotificationPreferences,
  loadNotificationHistory,
  saveNotificationHistory,
  dispatchPushNotification,
  DEFAULT_NOTIFICATION_PREFS,
} from '../lib/pushNotifications';

interface DataContextType {
  // Current user's accessible groups (RLS enforced)
  userGroups: Group[];
  archivedGroups: Group[];
  userExpenses: Expense[];
  userSettlements: Settlement[];
  userMessages: Message[];
  activeGroup: Group | null;
  setActiveGroupId: (groupId: string | null) => void;
  
  // Active group data
  activeMembers: GroupMember[];
  activeExpenses: Expense[];
  activeSettlements: Settlement[];
  activeMessages: Message[];
  activeBalances: GroupBalancesResult;
  activeMilestones: Milestone[];
  userMilestones: Milestone[];

  // Actions
  createGroup: (name: string, description: string, baseCurrency: CurrencyCode, budgetLimit?: number) => Group;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  archiveGroup: (groupId: string, archiveState: boolean) => void;
  inviteMember: (groupId: string, email: string) => Promise<{ success: boolean; error?: string }>;
  
  // Event Timelines & Milestones
  createMilestone: (data: {
    groupId: string;
    title: string;
    date?: string;
    day_number?: number;
    description?: string;
    icon?: string;
  }) => Milestone;
  updateMilestone: (milestoneId: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (milestoneId: string) => void;
  assignExpenseToMilestone: (expenseId: string, milestoneId?: string | null) => void;

  addExpense: (expenseData: {
    groupId: string;
    title: string;
    amount: number;
    category: ExpenseCategory;
    paidByUserId: string;
    date: string;
    notes?: string;
    milestoneId?: string | null;
    splits: Array<{ userId: string; amount: number; splitType: 'equal' | 'exact' | 'shares' }>;
    receiptItems?: Array<{ name: string; amount: number }>;
    recurringParentId?: string | null;
  }) => Expense;
  deleteExpense: (expenseId: string) => void;

  // Automated Recurring Expenses & Subscriptions
  recurringExpenses: RecurringExpense[];
  activeRecurringExpenses: RecurringExpense[];
  userRecurringExpenses: RecurringExpense[];
  createRecurringExpense: (data: {
    groupId: string;
    title: string;
    amount: number;
    category: ExpenseCategory;
    paidByUserId: string;
    frequency: RecurrenceFrequency;
    startDate: string;
    notes?: string;
    splits: Array<{ userId: string; amount: number; splitType: 'equal' | 'exact' | 'shares' }>;
    triggerFirstNow?: boolean;
  }) => RecurringExpense;
  updateRecurringExpense: (id: string, updates: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  toggleRecurringStatus: (id: string) => void;
  triggerRecurringExpenseNow: (id: string) => Expense | null;
  processDueRecurringExpenses: () => number;

  recordSettlement: (settlementData: {
    groupId: string;
    payerId: string;
    receiverId: string;
    amount: number;
    notes?: string;
  }) => Settlement;

  sendMessage: (groupId: string, content: string) => Message;

  // Social Emoji Reactions
  reactions: Reaction[];
  toggleReaction: (targetId: string, targetType: 'expense' | 'message' | 'settlement', emoji: string) => void;
  getReactionsForTarget: (targetId: string) => Reaction[];

  exportGroupData: (groupId: string, format: 'csv' | 'json') => void;
  getOverallNetBalance: () => { net: number; owedToYou: number; youOwe: number };
  getMembersForGroup: (groupId: string) => GroupMember[];
  joinGroupByToken: (
    groupId: string, 
    token?: string, 
    userId?: string, 
    fallbackMeta?: { name?: string; baseCurrency?: CurrencyCode; budgetLimit?: number }
  ) => Promise<{ success: boolean; group?: Group; error?: string }>;
  reassignGuestData: (guestUserId: string, permanentUserId: string) => void;

  // Real-Time Settlement Requests
  settlementRequests: SettlementRequest[];
  activeSettlementRequests: SettlementRequest[];
  requestSettlement: (data: {
    groupId: string;
    fromUserId: string; // debtor
    toUserId: string;   // creditor (requester)
    amount: number;
    notes?: string;
  }) => Promise<SettlementRequest>;
  respondToSettlementRequest: (requestId: string, action: 'accept' | 'decline') => Promise<void>;

  // Browser Push & In-App Notifications
  notifications: InAppNotification[];
  unreadNotificationCount: number;
  notificationPrefs: NotificationPreferences;
  updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => void;
  requestPushPermission: () => Promise<NotificationPermission>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotificationHistory: () => void;
  sendManualTestPushNotification: () => Promise<void>;
  isPushSupported: boolean;
  pushPermission: NotificationPermission;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();

  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_groups');
      return stored ? JSON.parse(stored) : SEED_GROUPS;
    } catch {
      return SEED_GROUPS;
    }
  });

  const [groupMembers, setGroupMembers] = useState<GroupMember[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_group_members');
      return stored ? JSON.parse(stored) : SEED_GROUP_MEMBERS;
    } catch {
      return SEED_GROUP_MEMBERS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_expenses');
      if (stored) {
        const parsed: Expense[] = JSON.parse(stored);
        const existingIds = new Set(parsed.map(e => e.id));
        const missingSeeds = SEED_EXPENSES.filter(s => !existingIds.has(s.id));
        return missingSeeds.length > 0 ? [...parsed, ...missingSeeds] : parsed;
      }
      return SEED_EXPENSES;
    } catch {
      return SEED_EXPENSES;
    }
  });

  const [settlements, setSettlements] = useState<Settlement[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_settlements');
      return stored ? JSON.parse(stored) : SEED_SETTLEMENTS;
    } catch {
      return SEED_SETTLEMENTS;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_messages');
      return stored ? JSON.parse(stored) : SEED_MESSAGES;
    } catch {
      return SEED_MESSAGES;
    }
  });

  const [reactions, setReactions] = useState<Reaction[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_reactions');
      return stored ? JSON.parse(stored) : SEED_REACTIONS;
    } catch {
      return SEED_REACTIONS;
    }
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_milestones');
      return stored ? JSON.parse(stored) : SEED_MILESTONES;
    } catch {
      return SEED_MILESTONES;
    }
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_recurring_expenses');
      return stored ? JSON.parse(stored) : SEED_RECURRING_EXPENSES;
    } catch {
      return SEED_RECURRING_EXPENSES;
    }
  });

  const [settlementRequests, setSettlementRequests] = useState<SettlementRequest[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_settlement_requests');
      return stored ? JSON.parse(stored) : SEED_SETTLEMENT_REQUESTS;
    } catch {
      return SEED_SETTLEMENT_REQUESTS;
    }
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    return loadNotificationHistory();
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => {
    return loadNotificationPreferences();
  });

  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    return getNotificationPermission();
  });

  const [activeGroupId, setActiveGroupId] = useState<string | null>(() => {
    return 'grp_tahoe'; // Default selected group
  });

  // Keep pushPermission in sync on mount and register service worker if possible
  useEffect(() => {
    setPushPermission(getNotificationPermission());

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        // service worker registration failed in some restricted iframes
        console.warn('SW registration skipped:', err);
      });
    }
  }, []);

  // Local storage persistence
  useEffect(() => {
    try {
      localStorage.setItem('teiln_groups', JSON.stringify(groups));
      localStorage.setItem('teiln_group_members', JSON.stringify(groupMembers));
      localStorage.setItem('teiln_expenses', JSON.stringify(expenses));
      localStorage.setItem('teiln_settlements', JSON.stringify(settlements));
      localStorage.setItem('teiln_messages', JSON.stringify(messages));
      localStorage.setItem('teiln_reactions', JSON.stringify(reactions));
      localStorage.setItem('teiln_milestones', JSON.stringify(milestones));
      localStorage.setItem('teiln_recurring_expenses', JSON.stringify(recurringExpenses));
      localStorage.setItem('teiln_settlement_requests', JSON.stringify(settlementRequests));
    } catch {
      // ignore
    }
  }, [groups, groupMembers, expenses, settlements, messages, reactions, milestones, recurringExpenses, settlementRequests]);

  useEffect(() => {
    saveNotificationPreferences(notificationPrefs);
  }, [notificationPrefs]);

  useEffect(() => {
    saveNotificationHistory(notifications);
  }, [notifications]);

  // Lookup map for fast user resolution
  const usersMap: Record<string, User> = {};
  for (const u of allUsers) {
    usersMap[u.id] = u;
  }

  // Lookup map for fast milestone resolution
  const milestonesMap: Record<string, Milestone> = {};
  for (const m of milestones) {
    milestonesMap[m.id] = m;
  }

  // STRICT ROW-LEVEL SECURITY (RLS) ENFORCEMENT:
  // A user can ONLY view groups where their user_id is in group_members!
  const userJoinedGroupIds = new Set(
    currentUser 
      ? groupMembers.filter(gm => gm.user_id === currentUser.id).map(gm => gm.group_id)
      : []
  );

  const accessibleGroups = groups.filter(g => userJoinedGroupIds.has(g.id));
  const userGroups = accessibleGroups.filter(g => !g.is_archived);
  const archivedGroups = accessibleGroups.filter(g => g.is_archived);

  // All accessible milestones across user's groups
  const userMilestones: Milestone[] = milestones
    .filter(m => userJoinedGroupIds.has(m.group_id));

  // All accessible expenses across user's groups (RLS enforced)
  const userExpenses: Expense[] = expenses
    .filter(e => userJoinedGroupIds.has(e.group_id))
    .map(e => ({
      ...e,
      payer: usersMap[e.paid_by_user_id],
      group: groups.find(g => g.id === e.group_id),
      milestone: e.milestone_id ? milestonesMap[e.milestone_id] : undefined,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // All accessible settlements across user's groups (RLS enforced)
  const userSettlements: Settlement[] = settlements
    .filter(s => userJoinedGroupIds.has(s.group_id))
    .map(s => ({
      ...s,
      payer: usersMap[s.payer_id],
      receiver: usersMap[s.receiver_id],
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // All accessible messages & comments across user's groups (RLS enforced)
  const userMessages: Message[] = messages
    .filter(m => userJoinedGroupIds.has(m.group_id))
    .map(m => ({
      ...m,
      user: usersMap[m.user_id],
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // All accessible recurring expense rules across user's groups (RLS enforced)
  const userRecurringExpenses: RecurringExpense[] = recurringExpenses
    .filter(r => userJoinedGroupIds.has(r.group_id))
    .map(r => ({
      ...r,
      payer: usersMap[r.paid_by_user_id],
    }));

  // Active Group Resolution (RLS check: must be accessible)
  const activeGroup = (activeGroupId && userJoinedGroupIds.has(activeGroupId))
    ? groups.find(g => g.id === activeGroupId) || null
    : (userGroups[0] || null);

  const activeMembers = activeGroup
    ? groupMembers
        .filter(gm => gm.group_id === activeGroup.id)
        .map(gm => ({
          ...gm,
          user: usersMap[gm.user_id] || gm.user || {
            id: gm.user_id,
            email: 'user@teiln.app',
            full_name: 'Member',
            tier: 'free',
            created_at: new Date().toISOString(),
          }
        }))
    : [];

  const activeMilestones: Milestone[] = activeGroup
    ? milestones
        .filter(m => m.group_id === activeGroup.id)
        .sort((a, b) => {
          if (a.day_number !== undefined && b.day_number !== undefined) {
            return a.day_number - b.day_number;
          }
          if (a.date && b.date) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })
    : [];

  const activeExpenses = activeGroup
    ? expenses
        .filter(e => e.group_id === activeGroup.id)
        .map(e => ({
          ...e,
          payer: usersMap[e.paid_by_user_id],
          milestone: e.milestone_id ? milestonesMap[e.milestone_id] : undefined,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const activeSettlements = activeGroup
    ? settlements
        .filter(s => s.group_id === activeGroup.id)
        .map(s => ({
          ...s,
          payer: usersMap[s.payer_id],
          receiver: usersMap[s.receiver_id],
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const activeMessages = activeGroup
    ? messages
        .filter(m => m.group_id === activeGroup.id)
        .map(m => ({
          ...m,
          user: usersMap[m.user_id],
        }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const activeRecurringExpenses: RecurringExpense[] = activeGroup
    ? recurringExpenses
        .filter(r => r.group_id === activeGroup.id)
        .map(r => ({
          ...r,
          payer: usersMap[r.paid_by_user_id],
        }))
        .sort((a, b) => new Date(a.next_run_date).getTime() - new Date(b.next_run_date).getTime())
    : [];

  // Active Settlement Requests (RLS enforced)
  const activeSettlementRequests: SettlementRequest[] = activeGroup
    ? settlementRequests
        .filter(r => r.group_id === activeGroup.id)
        .map(r => ({
          ...r,
          from_user: usersMap[r.from_user_id],
          to_user: usersMap[r.to_user_id],
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const isPushSupported = isPushNotificationSupported();

  // Active Group Balances & Debt Simplification
  const activeMemberIds = activeMembers.map(m => m.user_id);
  const activeBalances = calculateBalances(
    activeMemberIds,
    activeExpenses,
    activeSettlements,
    usersMap
  );

  // Overall net balance across all user's accessible groups
  const getOverallNetBalance = () => {
    if (!currentUser) return { net: 0, owedToYou: 0, youOwe: 0 };

    let totalNet = 0;
    let owedToYou = 0;
    let youOwe = 0;

    for (const grp of accessibleGroups) {
      const gMembers = groupMembers.filter(gm => gm.group_id === grp.id).map(gm => gm.user_id);
      const gExpenses = expenses.filter(e => e.group_id === grp.id);
      const gSettlements = settlements.filter(s => s.group_id === grp.id);
      const calc = calculateBalances(gMembers, gExpenses, gSettlements, usersMap);

      const userNet = calc.netBalances[currentUser.id] || 0;
      totalNet += userNet;
      if (userNet > 0) owedToYou += userNet;
      if (userNet < 0) youOwe += Math.abs(userNet);
    }

    return {
      net: Math.round(totalNet * 100) / 100,
      owedToYou: Math.round(owedToYou * 100) / 100,
      youOwe: Math.round(youOwe * 100) / 100,
    };
  };

  const createGroup = (
    name: string, 
    description: string, 
    baseCurrency: CurrencyCode, 
    budgetLimit?: number
  ): Group => {
    if (!currentUser) throw new Error('Must be logged in to create a group');

    const newGroup: Group = {
      id: `grp_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      base_currency: baseCurrency,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      is_archived: false,
      budget_limit: budgetLimit || null,
      category_icon: 'tag',
      invite_token: Math.random().toString(36).substring(2, 10),
    };

    const newMember: GroupMember = {
      id: `gm_${Date.now()}`,
      group_id: newGroup.id,
      user_id: currentUser.id,
      role: 'admin',
      joined_at: new Date().toISOString(),
      user: currentUser,
    };

    setGroups(prev => [newGroup, ...prev]);
    setGroupMembers(prev => [...prev, newMember]);
    setActiveGroupId(newGroup.id);

    // Sync to backend API in background so invite links work across devices & browsers
    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroup),
    }).catch(() => {});

    // Sync to Supabase if configured
    if (supabase && isSupabaseConfigured) {
      try {
        supabase.from('groups').upsert({
          id: newGroup.id,
          name: newGroup.name,
          description: newGroup.description,
          base_currency: newGroup.base_currency,
          created_by: currentUser.id,
          budget_limit: newGroup.budget_limit,
          invite_token: newGroup.invite_token,
        }).then();
        supabase.from('group_members').upsert({
          group_id: newGroup.id,
          user_id: currentUser.id,
          role: 'admin',
        }).then();
      } catch (err) {
        console.warn('Supabase createGroup sync notice:', err);
      }
    }

    // Initial system greeting message
    const welcomeMsg: Message = {
      id: `msg_${Date.now()}`,
      group_id: newGroup.id,
      user_id: currentUser.id,
      content: `Group "${newGroup.name}" created. Base currency is ${newGroup.base_currency}.`,
      message_type: 'chat',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, welcomeMsg]);

    return newGroup;
  };

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const archiveGroup = (groupId: string, archiveState: boolean) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, is_archived: archiveState } : g));
  };

  const inviteMember = async (groupId: string, email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: 'Email cannot be empty' };

    let targetUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!targetUser) {
      // Auto-register contact for demo simplicity
      targetUser = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        tier: 'free',
        tier_expires_at: null,
        created_at: new Date().toISOString(),
      };
    }

    // Check if already member
    const alreadyMember = groupMembers.some(gm => gm.group_id === groupId && gm.user_id === targetUser!.id);
    if (alreadyMember) {
      return { success: false, error: `${targetUser.full_name} is already in this group.` };
    }

    const newMember: GroupMember = {
      id: `gm_${Date.now()}`,
      group_id: groupId,
      user_id: targetUser.id,
      role: 'member',
      joined_at: new Date().toISOString(),
      user: targetUser,
    };

    setGroupMembers(prev => [...prev, newMember]);

    // Send join message
    const joinMsg: Message = {
      id: `msg_${Date.now()}`,
      group_id: groupId,
      user_id: currentUser?.id || targetUser.id,
      content: `${targetUser.full_name} joined the group via email invite.`,
      message_type: 'chat',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, joinMsg]);

    return { success: true };
  };

  const createMilestone = (data: {
    groupId: string;
    title: string;
    date?: string;
    day_number?: number;
    description?: string;
    icon?: string;
  }): Milestone => {
    const newMilestone: Milestone = {
      id: `mls_${Date.now()}`,
      group_id: data.groupId,
      title: data.title.trim(),
      date: data.date,
      day_number: data.day_number,
      description: data.description?.trim(),
      icon: data.icon || '📍',
      created_at: new Date().toISOString(),
    };

    setMilestones(prev => [...prev, newMilestone]);

    if (currentUser) {
      const chatMsg: Message = {
        id: `msg_${Date.now()}`,
        group_id: data.groupId,
        user_id: currentUser.id,
        content: `📍 New event milestone: "${newMilestone.title}"${newMilestone.date ? ` (${newMilestone.date})` : ''}`,
        message_type: 'chat',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, chatMsg]);
    }

    return newMilestone;
  };

  const updateMilestone = (milestoneId: string, updates: Partial<Milestone>) => {
    setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, ...updates } : m));
  };

  const deleteMilestone = (milestoneId: string) => {
    setMilestones(prev => prev.filter(m => m.id !== milestoneId));
    setExpenses(prev => prev.map(e => e.milestone_id === milestoneId ? { ...e, milestone_id: null } : e));
  };

  const assignExpenseToMilestone = (expenseId: string, milestoneId?: string | null) => {
    setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, milestone_id: milestoneId || null } : e));
  };

  const addExpense = (data: {
    groupId: string;
    title: string;
    amount: number;
    category: ExpenseCategory;
    paidByUserId: string;
    date: string;
    notes?: string;
    milestoneId?: string | null;
    splits: Array<{ userId: string; amount: number; splitType: 'equal' | 'exact' | 'shares' }>;
    receiptItems?: Array<{ name: string; amount: number }>;
    recurringParentId?: string | null;
  }): Expense => {
    const expId = `exp_${Date.now()}`;
    const newSplits: ExpenseSplit[] = data.splits.map((s, idx) => ({
      id: `sp_${expId}_${idx}`,
      expense_id: expId,
      user_id: s.userId,
      amount: Math.round(s.amount * 100) / 100,
      split_type: s.splitType,
    }));

    const newExpense: Expense = {
      id: expId,
      group_id: data.groupId,
      title: data.title.trim(),
      amount: Math.round(data.amount * 100) / 100,
      currency: activeGroup?.base_currency || 'USD',
      category: data.category,
      paid_by_user_id: data.paidByUserId,
      date: data.date,
      notes: data.notes,
      milestone_id: data.milestoneId || null,
      receipt_items: data.receiptItems,
      recurring_parent_id: data.recurringParentId || null,
      created_at: new Date().toISOString(),
      splits: newSplits,
      payer: usersMap[data.paidByUserId],
      milestone: data.milestoneId ? milestonesMap[data.milestoneId] : undefined,
    };

    setExpenses(prev => [newExpense, ...prev]);

    // Add activity to group chat
    const payerName = usersMap[data.paidByUserId]?.full_name || 'Someone';
    const currencySymbol = activeGroup?.base_currency === 'EUR' ? '€' : activeGroup?.base_currency === 'GBP' ? '£' : '$';
    const chatMsg: Message = {
      id: `msg_${Date.now()}`,
      group_id: data.groupId,
      user_id: data.paidByUserId,
      content: `${payerName} added "${newExpense.title}" for ${currencySymbol}${newExpense.amount.toFixed(2)} (${newExpense.splits.length} people split)`,
      message_type: 'system_expense',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, chatMsg]);

    // TRIGGER BROWSER PUSH NOTIFICATION & IN-APP NOTIFICATION
    const groupName = groups.find(g => g.id === data.groupId)?.name || 'Group';
    dispatchPushNotification(
      {
        type: 'expense_added',
        title: `💸 New Expense: ${newExpense.title}`,
        body: `${payerName} logged ${currencySymbol}${newExpense.amount.toFixed(2)} in "${groupName}" (${newExpense.splits.length} people split)`,
        groupId: data.groupId,
        groupName: groupName,
        amount: newExpense.amount,
        currency: activeGroup?.base_currency || 'USD',
        actorName: payerName,
        actorAvatar: usersMap[data.paidByUserId]?.avatar_url,
        tag: `expense-${newExpense.id}`,
      },
      notificationPrefs
    ).then(({ inAppNotification }) => {
      setNotifications(prev => [inAppNotification, ...prev]);
    });

    return newExpense;
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // Helper for computing next recurring run date
  const calculateNextRunDate = (fromDateStr: string, frequency: RecurrenceFrequency): string => {
    const d = new Date(fromDateStr);
    if (isNaN(d.getTime())) {
      d.setTime(Date.now());
    }
    switch (frequency) {
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'biweekly':
        d.setDate(d.getDate() + 14);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
    }
    return d.toISOString().split('T')[0];
  };

  // Create new recurring expense schedule
  const createRecurringExpense = (data: {
    groupId: string;
    title: string;
    amount: number;
    category: ExpenseCategory;
    paidByUserId: string;
    frequency: RecurrenceFrequency;
    startDate: string;
    notes?: string;
    splits: Array<{ userId: string; amount: number; splitType: 'equal' | 'exact' | 'shares' }>;
    triggerFirstNow?: boolean;
  }): RecurringExpense => {
    const id = `rec_${Date.now()}`;
    const nextRun = data.triggerFirstNow 
      ? calculateNextRunDate(data.startDate, data.frequency)
      : data.startDate;

    const mappedSplits = data.splits.map(s => ({
      user_id: s.userId,
      amount: s.amount,
      split_type: s.splitType,
    }));

    const newRec: RecurringExpense = {
      id,
      group_id: data.groupId,
      title: data.title.trim(),
      amount: Math.round(data.amount * 100) / 100,
      currency: activeGroup?.base_currency || 'USD',
      category: data.category,
      paid_by_user_id: data.paidByUserId,
      frequency: data.frequency,
      start_date: data.startDate,
      next_run_date: nextRun,
      last_run_date: data.triggerFirstNow ? data.startDate : null,
      status: 'active',
      notes: data.notes?.trim(),
      splits: mappedSplits,
      created_at: new Date().toISOString(),
      payer: usersMap[data.paidByUserId],
    };

    setRecurringExpenses(prev => [...prev, newRec]);

    // If immediate execution requested for today
    if (data.triggerFirstNow) {
      addExpense({
        groupId: data.groupId,
        title: data.title.trim(),
        amount: data.amount,
        category: data.category,
        paidByUserId: data.paidByUserId,
        date: data.startDate,
        notes: data.notes ? `${data.notes} (Recurring: ${data.frequency})` : `Recurring cycle (${data.frequency})`,
        splits: data.splits,
        recurringParentId: id,
      });
    }

    if (currentUser) {
      const currencySymbol = activeGroup?.base_currency === 'EUR' ? '€' : activeGroup?.base_currency === 'GBP' ? '£' : '$';
      const chatMsg: Message = {
        id: `msg_${Date.now()}`,
        group_id: data.groupId,
        user_id: currentUser.id,
        content: `🔁 Recurring schedule created: "${newRec.title}" (${currencySymbol}${newRec.amount.toFixed(2)} / ${newRec.frequency}, next due: ${nextRun})`,
        message_type: 'chat',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, chatMsg]);
    }

    return newRec;
  };

  const updateRecurringExpense = (id: string, updates: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRecurringExpense = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const toggleRecurringStatus = (id: string) => {
    setRecurringExpenses(prev => prev.map(r => {
      if (r.id !== id) return r;
      const nextStatus = r.status === 'active' ? 'paused' : 'active';
      return { ...r, status: nextStatus };
    }));
  };

  // Manually trigger a recurring cycle early/immediately
  const triggerRecurringExpenseNow = (id: string): Expense | null => {
    const rec = recurringExpenses.find(r => r.id === id);
    if (!rec) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const createdExp = addExpense({
      groupId: rec.group_id,
      title: rec.title,
      amount: rec.amount,
      category: rec.category,
      paidByUserId: rec.paid_by_user_id,
      date: todayStr,
      notes: rec.notes ? `${rec.notes} (Recurring cycle)` : `Recurring cycle (${rec.frequency})`,
      splits: rec.splits.map(s => ({
        userId: s.user_id,
        amount: s.amount,
        splitType: s.split_type,
      })),
      recurringParentId: rec.id,
    });

    const nextRun = calculateNextRunDate(todayStr, rec.frequency);
    setRecurringExpenses(prev => prev.map(r => r.id === id ? {
      ...r,
      last_run_date: todayStr,
      next_run_date: nextRun,
    } : r));

    return createdExp;
  };

  // Automated Trigger Engine: processes any overdue or due recurring bills
  const processDueRecurringExpenses = (): number => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dueItems = recurringExpenses.filter(r => r.status === 'active' && r.next_run_date <= todayStr);
    if (dueItems.length === 0) return 0;

    dueItems.forEach(r => {
      const expId = `exp_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nextRun = calculateNextRunDate(r.next_run_date, r.frequency);

      const newSplits: ExpenseSplit[] = r.splits.map((s, idx) => ({
        id: `sp_${expId}_${idx}`,
        expense_id: expId,
        user_id: s.user_id,
        amount: Math.round(s.amount * 100) / 100,
        split_type: s.split_type,
      }));

      const newExp: Expense = {
        id: expId,
        group_id: r.group_id,
        title: r.title,
        amount: r.amount,
        currency: r.currency,
        category: r.category,
        paid_by_user_id: r.paid_by_user_id,
        date: r.next_run_date,
        notes: r.notes ? `${r.notes} (Automated Recurring)` : `Automated recurring cycle (${r.frequency})`,
        created_at: new Date().toISOString(),
        splits: newSplits,
        payer: usersMap[r.paid_by_user_id],
        recurring_parent_id: r.id,
      };

      setExpenses(prev => [newExp, ...prev]);

      const payerName = usersMap[r.paid_by_user_id]?.full_name || 'Someone';
      const currencySymbol = r.currency === 'EUR' ? '€' : r.currency === 'GBP' ? '£' : '$';
      const chatMsg: Message = {
        id: `msg_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        group_id: r.group_id,
        user_id: r.paid_by_user_id,
        content: `🔄 Automated recurring bill logged: "${r.title}" for ${currencySymbol}${r.amount.toFixed(2)} (${payerName})`,
        message_type: 'system_expense',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, chatMsg]);
    });

    // Advance due dates in state
    setRecurringExpenses(prev => prev.map(r => {
      if (r.status === 'active' && r.next_run_date <= todayStr) {
        return {
          ...r,
          last_run_date: todayStr,
          next_run_date: calculateNextRunDate(r.next_run_date, r.frequency),
        };
      }
      return r;
    }));

    return dueItems.length;
  };

  // Check recurring schedule on mount and periodically every 60s
  useEffect(() => {
    processDueRecurringExpenses();
    const timer = setInterval(() => {
      processDueRecurringExpenses();
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const recordSettlement = (data: {
    groupId: string;
    payerId: string;
    receiverId: string;
    amount: number;
    notes?: string;
  }): Settlement => {
    const newSettlement: Settlement = {
      id: `stl_${Date.now()}`,
      group_id: data.groupId,
      payer_id: data.payerId,
      receiver_id: data.receiverId,
      amount: Math.round(data.amount * 100) / 100,
      currency: activeGroup?.base_currency || 'USD',
      date: new Date().toISOString().split('T')[0],
      notes: data.notes,
      created_at: new Date().toISOString(),
      payer: usersMap[data.payerId],
      receiver: usersMap[data.receiverId],
    };

    setSettlements(prev => [newSettlement, ...prev]);

    // Add settlement chat message
    const payerName = usersMap[data.payerId]?.full_name || 'Payer';
    const receiverName = usersMap[data.receiverId]?.full_name || 'Receiver';
    const currencySymbol = activeGroup?.base_currency === 'EUR' ? '€' : activeGroup?.base_currency === 'GBP' ? '£' : '$';

    const chatMsg: Message = {
      id: `msg_${Date.now()}`,
      group_id: data.groupId,
      user_id: data.payerId,
      content: `Payment recorded: ${payerName} sent ${currencySymbol}${newSettlement.amount.toFixed(2)} to ${receiverName}. Debt settled! ✨`,
      message_type: 'system_settlement',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, chatMsg]);

    // TRIGGER BROWSER PUSH NOTIFICATION FOR SETTLEMENT COMPLETED
    const groupName = groups.find(g => g.id === data.groupId)?.name || 'Group';
    dispatchPushNotification(
      {
        type: 'settlement_completed',
        title: `✅ Debt Settled in ${groupName}`,
        body: `${payerName} paid ${currencySymbol}${newSettlement.amount.toFixed(2)} to ${receiverName}`,
        groupId: data.groupId,
        groupName: groupName,
        amount: newSettlement.amount,
        currency: activeGroup?.base_currency || 'USD',
        actorName: payerName,
        actorAvatar: usersMap[data.payerId]?.avatar_url,
        tag: `settlement-${newSettlement.id}`,
      },
      notificationPrefs
    ).then(({ inAppNotification }) => {
      setNotifications(prev => [inAppNotification, ...prev]);
    });

    return newSettlement;
  };

  // REQUEST SETTLEMENT: A creditor requests a debtor to settle their pending balance
  const requestSettlement = async (data: {
    groupId: string;
    fromUserId: string; // debtor
    toUserId: string;   // creditor (requester)
    amount: number;
    notes?: string;
  }): Promise<SettlementRequest> => {
    const fromUser = usersMap[data.fromUserId];
    const toUser = usersMap[data.toUserId];
    const targetGroup = groups.find(g => g.id === data.groupId);
    const currency = targetGroup?.base_currency || 'USD';
    const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

    const newRequest: SettlementRequest = {
      id: `req_${Date.now()}`,
      group_id: data.groupId,
      from_user_id: data.fromUserId,
      to_user_id: data.toUserId,
      amount: Math.round(data.amount * 100) / 100,
      currency,
      notes: data.notes,
      status: 'pending',
      created_at: new Date().toISOString(),
      from_user: fromUser,
      to_user: toUser,
    };

    setSettlementRequests(prev => [newRequest, ...prev]);

    // Send system message to group chat
    const requesterName = toUser?.full_name || 'Creditor';
    const debtorName = fromUser?.full_name || 'Debtor';
    const chatMsg: Message = {
      id: `msg_req_${Date.now()}`,
      group_id: data.groupId,
      user_id: data.toUserId,
      content: `🔔 Settlement requested: ${requesterName} pinged ${debtorName} for ${currencySymbol}${newRequest.amount.toFixed(2)}${data.notes ? ` ("${data.notes}")` : ''}`,
      message_type: 'system_settlement',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, chatMsg]);

    // TRIGGER BROWSER PUSH NOTIFICATION FOR SETTLEMENT REQUEST
    const groupName = targetGroup?.name || 'Group';
    dispatchPushNotification(
      {
        type: 'settlement_requested',
        title: `🔔 Settlement Request in ${groupName}`,
        body: `${requesterName} requested ${currencySymbol}${newRequest.amount.toFixed(2)} settlement from ${debtorName}`,
        groupId: data.groupId,
        groupName: groupName,
        amount: newRequest.amount,
        currency,
        actorName: requesterName,
        actorAvatar: toUser?.avatar_url,
        targetUserId: data.fromUserId,
        tag: `req-${newRequest.id}`,
      },
      notificationPrefs
    ).then(({ inAppNotification }) => {
      setNotifications(prev => [inAppNotification, ...prev]);
    });

    return newRequest;
  };

  // RESPOND TO SETTLEMENT REQUEST
  const respondToSettlementRequest = async (requestId: string, action: 'accept' | 'decline'): Promise<void> => {
    const targetReq = settlementRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    if (action === 'accept') {
      // Record payment automatically
      recordSettlement({
        groupId: targetReq.group_id,
        payerId: targetReq.from_user_id,
        receiverId: targetReq.to_user_id,
        amount: targetReq.amount,
        notes: `Accepted settlement request: ${targetReq.notes || 'Full debt balance'}`,
      });

      setSettlementRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'settled' } : r));
    } else {
      setSettlementRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'declined' } : r));
      
      const declinerName = usersMap[targetReq.from_user_id]?.full_name || 'Member';
      const chatMsg: Message = {
        id: `msg_dec_${Date.now()}`,
        group_id: targetReq.group_id,
        user_id: targetReq.from_user_id,
        content: `⚠️ ${declinerName} declined the settlement request for $${targetReq.amount.toFixed(2)}.`,
        message_type: 'system_settlement',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, chatMsg]);
    }
  };

  // NOTIFICATION MANAGEMENT ACTIONS
  const updateNotificationPrefs = (newPrefs: Partial<NotificationPreferences>) => {
    setNotificationPrefs(prev => ({ ...prev, ...newPrefs }));
  };

  const requestPushPermission = async (): Promise<NotificationPermission> => {
    const res = await requestNotificationPermission();
    setPushPermission(res);
    return res;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotificationHistory = () => {
    setNotifications([]);
  };

  const sendManualTestPushNotification = async () => {
    const activeGroupName = activeGroup?.name || 'Lake Tahoe Cabin Retreat';
    const currencySymbol = activeGroup?.base_currency === 'EUR' ? '€' : activeGroup?.base_currency === 'GBP' ? '£' : '$';
    const { inAppNotification } = await dispatchPushNotification(
      {
        type: 'expense_added',
        title: `🧪 Real-Time Push Test`,
        body: `Notification successfully received for ${activeGroupName}! Teiln keeps you informed in real-time.`,
        groupId: activeGroup?.id,
        groupName: activeGroupName,
        amount: 42.50,
        currency: activeGroup?.base_currency || 'USD',
        actorName: currentUser?.full_name || 'Teiln Bot',
        tag: `test-${Date.now()}`,
      },
      notificationPrefs
    );
    setNotifications(prev => [inAppNotification, ...prev]);
  };

  const sendMessage = (groupId: string, content: string): Message => {
    if (!currentUser) throw new Error('Must be logged in to chat');

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      group_id: groupId,
      user_id: currentUser.id,
      content: content.trim(),
      message_type: 'chat',
      created_at: new Date().toISOString(),
      user: currentUser,
    };

    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  };

  const toggleReaction = (targetId: string, targetType: 'expense' | 'message' | 'settlement', emoji: string) => {
    if (!currentUser) return;

    setReactions(prev => {
      const existingIndex = prev.findIndex(
        r => r.target_id === targetId && r.user_id === currentUser.id && r.emoji === emoji
      );

      if (existingIndex >= 0) {
        // Toggle OFF (remove user's reaction)
        return prev.filter((_, idx) => idx !== existingIndex);
      } else {
        // Toggle ON (add user's reaction)
        const newReaction: Reaction = {
          id: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          target_id: targetId,
          target_type: targetType,
          emoji,
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          created_at: new Date().toISOString(),
        };
        return [...prev, newReaction];
      }
    });
  };

  const getReactionsForTarget = (targetId: string): Reaction[] => {
    return reactions.filter(r => r.target_id === targetId);
  };

  const exportGroupData = (groupId: string, format: 'csv' | 'json') => {
    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return;

    const grpExpenses = expenses.filter(e => e.group_id === groupId);
    const grpSettlements = settlements.filter(s => s.group_id === groupId);

    const exportPayload = {
      group: targetGroup,
      exportedAt: new Date().toISOString(),
      expenses: grpExpenses.map(e => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        currency: e.currency,
        category: e.category,
        payer: usersMap[e.paid_by_user_id]?.full_name || e.paid_by_user_id,
        date: e.date,
        notes: e.notes || '',
        splits: e.splits.map(s => ({
          member: usersMap[s.user_id]?.full_name || s.user_id,
          amount: s.amount,
        })),
      })),
      settlements: grpSettlements.map(s => ({
        id: s.id,
        payer: usersMap[s.payer_id]?.full_name || s.payer_id,
        receiver: usersMap[s.receiver_id]?.full_name || s.receiver_id,
        amount: s.amount,
        currency: s.currency,
        date: s.date,
        notes: s.notes || '',
      })),
    };

    let mimeType = 'application/json';
    let fileExtension = 'json';
    let content = '';

    if (format === 'json') {
      content = JSON.stringify(exportPayload, null, 2);
    } else {
      mimeType = 'text/csv;charset=utf-8;';
      fileExtension = 'csv';
      
      const csvRows = [
        ['Type', 'ID', 'Date', 'Title / Description', 'Category', 'Payer / From', 'Receiver / To', 'Amount', 'Currency', 'Notes'].join(','),
      ];

      for (const exp of exportPayload.expenses) {
        csvRows.push([
          'Expense',
          `"${exp.id}"`,
          `"${exp.date}"`,
          `"${exp.title.replace(/"/g, '""')}"`,
          `"${exp.category}"`,
          `"${exp.payer.replace(/"/g, '""')}"`,
          '""',
          exp.amount.toFixed(2),
          `"${exp.currency}"`,
          `"${exp.notes.replace(/"/g, '""')}"`,
        ].join(','));
      }

      for (const stl of exportPayload.settlements) {
        csvRows.push([
          'Settlement',
          `"${stl.id}"`,
          `"${stl.date}"`,
          '"Settlement Payment"',
          '"settlement"',
          `"${stl.payer.replace(/"/g, '""')}"`,
          `"${stl.receiver.replace(/"/g, '""')}"`,
          stl.amount.toFixed(2),
          `"${stl.currency}"`,
          `"${stl.notes.replace(/"/g, '""')}"`,
        ].join(','));
      }

      content = csvRows.join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teiln_${targetGroup.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getMembersForGroup = (groupId: string): GroupMember[] => {
    return groupMembers
      .filter(gm => gm.group_id === groupId)
      .map(gm => ({
        ...gm,
        user: usersMap[gm.user_id] || gm.user || {
          id: gm.user_id,
          email: 'user@teiln.app',
          full_name: 'Member',
          tier: 'free',
          created_at: new Date().toISOString(),
        }
      }));
  };

  /**
   * Zero-Friction Magic Guest Join
   * Allows anyone with an invite link to immediately view and join the group,
   * even across different devices, tabs, or incognito windows.
   */
  const joinGroupByToken = async (
    groupId: string, 
    token?: string, 
    userId?: string,
    fallbackMeta?: { name?: string; baseCurrency?: CurrencyCode; budgetLimit?: number }
  ): Promise<{ success: boolean; group?: Group; error?: string }> => {
    // 1. Search local state groups
    let targetGroup = groups.find(g => g.id === groupId || (token && g.invite_token === token));

    // 2. Search local seed groups
    if (!targetGroup) {
      const seedMatch = SEED_GROUPS.find(g => g.id === groupId || (token && g.invite_token === token));
      if (seedMatch) {
        targetGroup = seedMatch;
        setGroups(prev => [seedMatch, ...prev.filter(g => g.id !== seedMatch.id)]);
      }
    }

    // 3. Search server API (for groups created by other users or on another device)
    if (!targetGroup) {
      try {
        const lookupKey = token || groupId;
        const res = await fetch(`/api/join/${lookupKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.group) {
            targetGroup = data.group;
            setGroups(prev => [data.group, ...prev.filter(g => g.id !== data.group.id)]);
          }
        }
      } catch (err) {
        // network fallback
      }
    }

    // 4. Search Supabase directly if configured
    if (!targetGroup && supabase && isSupabaseConfigured) {
      try {
        const lookupKey = token || groupId;
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .or(`id.eq.${lookupKey},invite_token.eq.${lookupKey}`)
          .maybeSingle();

        if (!error && data) {
          const sbGroup: Group = {
            id: data.id,
            name: data.name,
            description: data.description,
            base_currency: (data.base_currency as CurrencyCode) || 'USD',
            created_by: data.created_by,
            created_at: data.created_at,
            is_archived: Boolean(data.is_archived),
            budget_limit: data.budget_limit ? Number(data.budget_limit) : null,
            invite_token: data.invite_token,
          };
          targetGroup = sbGroup;
          setGroups(prev => [sbGroup, ...prev.filter(g => g.id !== sbGroup.id)]);
        }
      } catch (sbErr) {
        console.warn('Supabase join query error:', sbErr);
      }
    }

    // 5. URL parameter fallback reconstruction (guarantees invite links NEVER fail!)
    if (!targetGroup && fallbackMeta?.name) {
      const reconstructed: Group = {
        id: groupId,
        name: fallbackMeta.name,
        description: 'Joined via invite link',
        base_currency: fallbackMeta.baseCurrency || 'USD',
        created_by: 'system',
        created_at: new Date().toISOString(),
        is_archived: false,
        budget_limit: fallbackMeta.budgetLimit || null,
        invite_token: token || 'magic',
      };
      targetGroup = reconstructed;
      setGroups(prev => [reconstructed, ...prev.filter(g => g.id !== reconstructed.id)]);
    }

    if (!targetGroup) {
      return { success: false, error: 'Group not found or invite expired.' };
    }

    const effectiveUserId = userId || currentUser?.id;
    if (!effectiveUserId) {
      return { success: false, error: 'User session required to join group.' };
    }

    const effectiveUser = allUsers.find(u => u.id === effectiveUserId) || currentUser || {
      id: effectiveUserId,
      email: 'guest@teiln.app',
      full_name: 'Guest Member',
      tier: 'free' as const,
      is_anonymous: true,
      created_at: new Date().toISOString(),
    };

    // Check if already a member
    const alreadyMember = groupMembers.some(
      gm => gm.group_id === targetGroup!.id && gm.user_id === effectiveUserId
    );

    if (!alreadyMember) {
      const newMember: GroupMember = {
        id: `gm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        group_id: targetGroup.id,
        user_id: effectiveUserId,
        role: 'member',
        joined_at: new Date().toISOString(),
        user: effectiveUser,
      };
      setGroupMembers(prev => [...prev, newMember]);

      // Add a system welcome notice in group chat
      const joinMsg: Message = {
        id: `msg_${Date.now()}_join`,
        group_id: targetGroup.id,
        user_id: effectiveUserId,
        content: `${effectiveUser.full_name} joined via Invite Link ✨`,
        message_type: 'chat',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, joinMsg]);

      // Notify backend API and Supabase
      fetch(`/api/groups/${targetGroup.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: effectiveUserId, role: 'member' }),
      }).catch(() => {});

      if (supabase && isSupabaseConfigured) {
        supabase.from('group_members').upsert({
          group_id: targetGroup.id,
          user_id: effectiveUserId,
          role: 'member',
        }).then();
      }
    }

    setActiveGroupId(targetGroup.id);
    return { success: true, group: targetGroup };
  };

  /**
   * Reassign Guest Data on Permanent User Collision & Merge
   * When a guest logs in with an existing permanent account, all expenses,
   * splits, messages, and settlements they created as a guest are reassigned
   * to their permanent account id.
   */
  const reassignGuestData = (guestUserId: string, permanentUserId: string) => {
    if (!guestUserId || !permanentUserId || guestUserId === permanentUserId) return;

    // 1. Reassign expenses paid by guest
    setExpenses(prev => prev.map(exp => {
      if (exp.paid_by_user_id === guestUserId) {
        return { ...exp, paid_by_user_id: permanentUserId };
      }
      return exp;
    }));

    // 2. Reassign expense splits
    setExpenses(prev => prev.map(exp => {
      const hasGuestSplit = exp.splits.some(s => s.user_id === guestUserId);
      if (!hasGuestSplit) return exp;
      return {
        ...exp,
        splits: exp.splits.map(s => s.user_id === guestUserId ? { ...s, user_id: permanentUserId } : s)
      };
    }));

    // 3. Reassign settlements
    setSettlements(prev => prev.map(stl => {
      let updated = { ...stl };
      if (stl.payer_id === guestUserId) updated.payer_id = permanentUserId;
      if (stl.receiver_id === guestUserId) updated.receiver_id = permanentUserId;
      return updated;
    }));

    // 4. Reassign messages
    setMessages(prev => prev.map(msg => {
      if (msg.user_id === guestUserId) {
        return { ...msg, user_id: permanentUserId };
      }
      return msg;
    }));

    // 5. Reassign group memberships: ensure permanent user has membership, remove guest record
    setGroupMembers(prev => {
      const guestMemberships = prev.filter(gm => gm.user_id === guestUserId);
      const otherMemberships = prev.filter(gm => gm.user_id !== guestUserId);
      
      const updated = [...otherMemberships];
      for (const gm of guestMemberships) {
        const alreadyInGroup = updated.some(m => m.group_id === gm.group_id && m.user_id === permanentUserId);
        if (!alreadyInGroup) {
          const permUser = allUsers.find(u => u.id === permanentUserId) || currentUser!;
          updated.push({
            id: `gm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            group_id: gm.group_id,
            user_id: permanentUserId,
            role: gm.role,
            joined_at: new Date().toISOString(),
            user: permUser,
          });
        }
      }
      return updated;
    });
  };

  return (
    <DataContext.Provider
      value={{
        userGroups,
        archivedGroups,
        userExpenses,
        userSettlements,
        userMessages,
        activeGroup,
        setActiveGroupId,
        activeMembers,
        activeExpenses,
        activeSettlements,
        activeMessages,
        activeBalances,
        activeMilestones,
        userMilestones,
        createGroup,
        updateGroup,
        archiveGroup,
        inviteMember,
        createMilestone,
        updateMilestone,
        deleteMilestone,
        assignExpenseToMilestone,
        addExpense,
        deleteExpense,
        recordSettlement,
        sendMessage,
        reactions,
        toggleReaction,
        getReactionsForTarget,
        exportGroupData,
        getOverallNetBalance,
        getMembersForGroup,
        joinGroupByToken,
        reassignGuestData,
        recurringExpenses,
        activeRecurringExpenses,
        userRecurringExpenses,
        createRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        toggleRecurringStatus,
        triggerRecurringExpenseNow,
        processDueRecurringExpenses,
        settlementRequests,
        activeSettlementRequests,
        requestSettlement,
        respondToSettlementRequest,
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
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
