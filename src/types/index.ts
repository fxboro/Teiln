export type SubscriptionTier = 'free' | 'supporter' | 'pro';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  tier: SubscriptionTier;
  tier_expires_at?: string | null;
  created_at: string;
  is_anonymous?: boolean;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'CHF' | 'AUD';

export interface Group {
  id: string;
  name: string;
  description?: string;
  base_currency: CurrencyCode;
  created_by: string;
  created_at: string;
  is_archived: boolean;
  budget_limit?: number | null;
  category_icon?: string;
  invite_token?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user: User;
}

export type ExpenseCategory = 
  | 'dining' 
  | 'groceries' 
  | 'transport' 
  | 'housing' 
  | 'entertainment' 
  | 'travel' 
  | 'utilities' 
  | 'shopping' 
  | 'other';

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
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

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  shares?: number;
  split_type: 'equal' | 'exact' | 'shares';
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  paid_by_user_id: string;
  date: string;
  notes?: string;
  milestone_id?: string | null;
  receipt_items?: Array<{ name: string; amount: number }>;
  recurring_parent_id?: string | null;
  created_at: string;
  splits: ExpenseSplit[];
  payer?: User;
  group?: Group;
  milestone?: Milestone;
}

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringExpense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  paid_by_user_id: string;
  frequency: RecurrenceFrequency;
  start_date: string;
  next_run_date: string;
  last_run_date?: string | null;
  status: 'active' | 'paused';
  notes?: string;
  splits: Array<{
    user_id: string;
    amount: number;
    split_type: 'equal' | 'exact' | 'shares';
  }>;
  created_at: string;
  payer?: User;
}

export interface Settlement {
  id: string;
  group_id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  notes?: string;
  created_at: string;
  payer?: User;
  receiver?: User;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: 'chat' | 'system_expense' | 'system_settlement';
  metadata?: Record<string, any>;
  created_at: string;
  user?: User;
}

export interface SimplifiedDebt {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  from_user?: User;
  to_user?: User;
}

export interface Milestone {
  id: string;
  group_id: string;
  title: string;
  date?: string;
  day_number?: number;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  target_id: string; // expense_id, message_id, or settlement_id
  target_type: 'expense' | 'message' | 'settlement';
  emoji: string;
  user_id: string;
  user_name?: string;
  created_at: string;
}

export interface SettlementRequest {
  id: string;
  group_id: string;
  from_user_id: string; // The debtor who needs to pay
  to_user_id: string;   // The creditor who requested settlement
  amount: number;
  currency: CurrencyCode;
  notes?: string;
  status: 'pending' | 'settled' | 'declined';
  created_at: string;
  from_user?: User;
  to_user?: User;
}

export interface InAppNotification {
  id: string;
  type: 'expense_added' | 'settlement_requested' | 'settlement_completed';
  title: string;
  body: string;
  group_id: string;
  group_name: string;
  amount?: number;
  currency?: CurrencyCode;
  actor_name: string;
  actor_avatar?: string;
  target_user_id?: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  notifyOnExpense: boolean;
  notifyOnSettlementRequest: boolean;
  notifyOnSettlementCompleted: boolean;
  soundEnabled: boolean;
}
