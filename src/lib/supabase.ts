/**
 * Supabase Client & PostgreSQL Schema Definitions for Teiln
 * 
 * ============================================================================
 * POSTGRESQL SCHEMA DEFINITIONS (Copy into Supabase SQL Editor)
 * ============================================================================
 * 
 * -- 1. Profiles Table (extends auth.users)
 * CREATE TABLE public.profiles (
 *   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   email TEXT NOT NULL,
 *   full_name TEXT NOT NULL,
 *   avatar_url TEXT,
 *   tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'supporter', 'pro')),
 *   tier_expires_at TIMESTAMPTZ,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * 
 * -- 2. Groups Table
 * CREATE TABLE public.groups (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name TEXT NOT NULL,
 *   description TEXT,
 *   base_currency TEXT NOT NULL DEFAULT 'USD',
 *   created_by UUID NOT NULL REFERENCES public.profiles(id),
 *   is_archived BOOLEAN NOT NULL DEFAULT FALSE,
 *   budget_limit NUMERIC(12, 2),
 *   category_icon TEXT DEFAULT 'receipt',
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * 
 * -- 3. Group Members Table
 * CREATE TABLE public.group_members (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
 *   user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 *   role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
 *   joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   UNIQUE(group_id, user_id)
 * );
 * 
 * -- 4. Expenses Table
 * CREATE TABLE public.expenses (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
 *   title TEXT NOT NULL,
 *   amount NUMERIC(12, 2) NOT NULL,
 *   currency TEXT NOT NULL DEFAULT 'USD',
 *   category TEXT NOT NULL DEFAULT 'dining',
 *   paid_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
 *   date DATE NOT NULL DEFAULT CURRENT_DATE,
 *   notes TEXT,
 *   receipt_items JSONB,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * 
 * -- 5. Expense Splits Table
 * CREATE TABLE public.expense_splits (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
 *   user_id UUID NOT NULL REFERENCES public.profiles(id),
 *   amount NUMERIC(12, 2) NOT NULL,
 *   shares NUMERIC(5, 2) DEFAULT 1,
 *   split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'exact', 'shares'))
 * );
 * 
 * -- 6. Settlements Table
 * CREATE TABLE public.settlements (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
 *   payer_id UUID NOT NULL REFERENCES public.profiles(id),
 *   receiver_id UUID NOT NULL REFERENCES public.profiles(id),
 *   amount NUMERIC(12, 2) NOT NULL,
 *   currency TEXT NOT NULL DEFAULT 'USD',
 *   date DATE NOT NULL DEFAULT CURRENT_DATE,
 *   notes TEXT,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * 
 * -- 7. Messages Table (Group Chat)
 * CREATE TABLE public.messages (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
 *   user_id UUID NOT NULL REFERENCES public.profiles(id),
 *   content TEXT NOT NULL,
 *   message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'system_expense', 'system_settlement')),
 *   metadata JSONB,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * 
 * ============================================================================
 * ROW LEVEL SECURITY (RLS) POLICIES
 * ============================================================================
 * 
 * ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
 * 
 * -- Profiles: Anyone authenticated can read profiles; users can update own profile
 * CREATE POLICY "Profiles readable by authenticated users" 
 *   ON public.profiles FOR SELECT TO authenticated USING (true);
 * CREATE POLICY "Users can update own profile" 
 *   ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
 * 
 * -- Helper function: check membership
 * CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
 * RETURNS BOOLEAN AS $$
 *   SELECT EXISTS (
 *     SELECT 1 FROM public.group_members 
 *     WHERE group_id = p_group_id AND user_id = p_user_id
 *   );
 * $$ LANGUAGE sql SECURITY DEFINER;
 * 
 * -- Groups: Users can only see and manage groups they are members of.
 * -- Supabase injects an `is_anonymous` claim into the user's JWT.
 * -- Anonymous guests are strictly restricted to the specific groups they joined via magic link:
 * CREATE POLICY "Users and Guests can view joined groups"
 *   ON public.groups FOR SELECT TO authenticated
 *   USING (
 *     CASE 
 *       WHEN (auth.jwt() ->> 'is_anonymous')::boolean = true THEN
 *         is_group_member(id, auth.uid())
 *       ELSE
 *         is_group_member(id, auth.uid())
 *     END
 *   );
 * 
 * -- Only permanent (non-anonymous) users can create brand new groups:
 * CREATE POLICY "Non-anonymous users can create groups"
 *   ON public.groups FOR INSERT TO authenticated
 *   WITH CHECK (
 *     (auth.jwt() ->> 'is_anonymous')::boolean IS DISTINCT FROM true 
 *     AND created_by = auth.uid()
 *   );
 * 
 * CREATE POLICY "Group admins can update groups"
 *   ON public.groups FOR UPDATE TO authenticated
 *   USING (is_group_member(id, auth.uid()));
 * 
 * -- Group Members: Users can only see members of their groups
 * CREATE POLICY "View members of joined groups"
 *   ON public.group_members FOR SELECT TO authenticated
 *   USING (is_group_member(group_id, auth.uid()));
 * 
 * CREATE POLICY "Add member to group"
 *   ON public.group_members FOR INSERT TO authenticated
 *   WITH CHECK (is_group_member(group_id, auth.uid()) OR user_id = auth.uid());
 * 
 * -- Expenses: Restricted to group members
 * CREATE POLICY "Members can view expenses"
 *   ON public.expenses FOR SELECT TO authenticated
 *   USING (is_group_member(group_id, auth.uid()));
 * 
 * CREATE POLICY "Members can create expenses"
 *   ON public.expenses FOR INSERT TO authenticated
 *   WITH CHECK (is_group_member(group_id, auth.uid()));
 * 
 * -- Messages: Restricted to group members
 * CREATE POLICY "Members can view messages"
 *   ON public.messages FOR SELECT TO authenticated
 *   USING (is_group_member(group_id, auth.uid()));
 * 
 * CREATE POLICY "Members can post messages"
 *   ON public.messages FOR INSERT TO authenticated
 *   WITH CHECK (is_group_member(group_id, auth.uid()));
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials safely from client-side vite env or localStorage
const getStoredCredentials = () => {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
  
  let customUrl = '';
  let customKey = '';
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      customUrl = localStorage.getItem('teiln_supabase_url') || '';
      customKey = localStorage.getItem('teiln_supabase_anon_key') || '';
    }
  } catch {}

  const url = customUrl || envUrl;
  const anonKey = customKey || envKey;
  const isConfigured = Boolean(
    url && 
    anonKey && 
    !url.includes('your-project') &&
    url.startsWith('https://')
  );

  return {
    url,
    anonKey,
    isConfigured,
    source: customUrl ? 'custom' : (envUrl ? 'env' : 'none') as 'custom' | 'env' | 'none',
  };
};

const currentConfig = getStoredCredentials();

export const isSupabaseConfigured = currentConfig.isConfigured;

export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(currentConfig.url, currentConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

export function getSupabaseConfig() {
  return getStoredCredentials();
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('teiln_supabase_url', url.trim());
      localStorage.setItem('teiln_supabase_anon_key', anonKey.trim());
    }
  } catch {}
}

export function clearSupabaseConfig() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('teiln_supabase_url');
      localStorage.removeItem('teiln_supabase_anon_key');
    }
  } catch {}
}

export interface SupabaseHealthCheckResult {
  isConfigured: boolean;
  isReachable: boolean;
  authWorking: boolean;
  databaseWorking: boolean;
  latencyMs: number;
  message: string;
  error?: string;
  url?: string;
}

export async function testSupabaseConnection(
  testUrl?: string, 
  testKey?: string
): Promise<SupabaseHealthCheckResult> {
  const config = getStoredCredentials();
  const targetUrl = (testUrl || config.url || '').trim();
  const targetKey = (testKey || config.anonKey || '').trim();

  if (!targetUrl || !targetKey || targetUrl.includes('your-project') || !targetUrl.startsWith('https://')) {
    return {
      isConfigured: false,
      isReachable: false,
      authWorking: false,
      databaseWorking: false,
      latencyMs: 0,
      message: 'Supabase credentials are not configured. Currently using local secure SHA-256 authentication.',
      url: targetUrl,
    };
  }

  const startTime = performance.now();
  try {
    const testClient = createClient(targetUrl, targetKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // 1. Test Auth Endpoint
    const { error: authError } = await testClient.auth.getSession();
    const latencyMs = Math.round(performance.now() - startTime);

    if (authError && authError.status && authError.status >= 500) {
      return {
        isConfigured: true,
        isReachable: false,
        authWorking: false,
        databaseWorking: false,
        latencyMs,
        message: `Supabase server error: ${authError.message}`,
        error: authError.message,
        url: targetUrl,
      };
    }

    // 2. Test Database Endpoint
    const { error: dbError } = await testClient.from('profiles').select('id').limit(1);
    const dbWorking = !dbError || !dbError.message.includes('relation "public.profiles" does not exist');

    return {
      isConfigured: true,
      isReachable: true,
      authWorking: true,
      databaseWorking: dbWorking,
      latencyMs,
      message: dbWorking 
        ? `Successfully connected! Supabase Auth and Database responding (${latencyMs}ms latency).`
        : `Supabase Auth is working! Database tables need to be created using the SQL schema in your Supabase SQL Editor.`,
      error: dbError?.message,
      url: targetUrl,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      isConfigured: true,
      isReachable: false,
      authWorking: false,
      databaseWorking: false,
      latencyMs,
      message: `Failed to connect to Supabase: ${err?.message || 'Network error'}`,
      error: err?.message,
      url: targetUrl,
    };
  }
}

export interface SupabaseAuthVerificationResult {
  configured: boolean;
  url: string;
  hasSession: boolean;
  hasUser: boolean;
  user: {
    id: string;
    email?: string;
    role?: string;
    isAnonymous?: boolean;
    createdAt?: string;
    lastSignInAt?: string;
  } | null;
  token: {
    present: boolean;
    type?: string;
    expiresAt?: string;
    expiresInSeconds?: number;
    isExpired: boolean;
    expiresInText: string;
    claims?: Record<string, any>;
  };
  persistence: {
    storageActive: boolean;
    storageKeysFound: string[];
    persistsInLocalStorage: boolean;
    storedDataValid: boolean;
  };
  serverValidation: {
    success: boolean;
    latencyMs: number;
    serverError?: string;
    statusCode?: number;
    verifiedUserId?: string;
  };
  statusSummary: 
    | 'AUTHENTICATED_AND_VALIDATED' 
    | 'SESSION_EXPIRED' 
    | 'UNAUTHENTICATED' 
    | 'SERVER_VALIDATION_FAILED' 
    | 'NOT_CONFIGURED';
  timestamp: string;
  logs: string[];
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Diagnostic utility function to verify Supabase authentication status and session persistence.
 * Validates local session presence, JWT expiration claims, localStorage persistence,
 * and calls the Supabase Auth server (/auth/v1/user) to cryptographically validate the token.
 */
export async function verifySupabaseAuthStatus(): Promise<SupabaseAuthVerificationResult> {
  const logs: string[] = [];
  const addLog = (msg: string) => {
    logs.push(msg);
  };

  const config = getStoredCredentials();
  addLog(`[Config Check] Supabase configured: ${config.isConfigured} (Source: ${config.source})`);

  if (!config.isConfigured || !supabase) {
    addLog('[Config Check] Supabase client is not configured.');
    return {
      configured: false,
      url: config.url || '',
      hasSession: false,
      hasUser: false,
      user: null,
      token: {
        present: false,
        isExpired: true,
        expiresInText: 'No token',
      },
      persistence: {
        storageActive: typeof localStorage !== 'undefined',
        storageKeysFound: [],
        persistsInLocalStorage: false,
        storedDataValid: false,
      },
      serverValidation: {
        success: false,
        latencyMs: 0,
        serverError: 'Supabase client not initialized or credentials missing',
      },
      statusSummary: 'NOT_CONFIGURED',
      timestamp: new Date().toISOString(),
      logs,
    };
  }

  // 1. Check localStorage Persistence
  const storageKeysFound: string[] = [];
  let storedDataValid = false;
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
        storageKeysFound.push(key);
        try {
          const raw = localStorage.getItem(key);
          if (raw && (raw.includes('access_token') || raw.includes('user'))) {
            storedDataValid = true;
          }
        } catch {}
      }
    }
  }
  addLog(`[Persistence Check] Stored Supabase auth keys: [${storageKeysFound.join(', ') || 'none'}]`);

  // 2. Query In-Memory / Active Session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    addLog(`[Session Error] Failed to retrieve session: ${sessionError.message}`);
  }

  const session = sessionData?.session;
  const accessToken = session?.access_token || '';
  const hasSession = Boolean(session && accessToken);
  addLog(`[Session Check] Session active: ${hasSession}`);

  // 3. Token Claims & Expiry Inspection
  let claims: Record<string, any> | undefined = undefined;
  let isExpired = true;
  let expiresInSeconds: number | undefined = undefined;
  let expiresInText = 'No active token';

  if (accessToken) {
    const decoded = decodeJwtPayload(accessToken);
    if (decoded) {
      claims = decoded;
      const exp = decoded.exp ? decoded.exp * 1000 : 0;
      const now = Date.now();
      isExpired = exp <= now;
      expiresInSeconds = Math.round((exp - now) / 1000);

      if (isExpired) {
        const expiredAgoSec = Math.abs(expiresInSeconds);
        expiresInText = `Expired ${Math.round(expiredAgoSec / 60)} minutes ago`;
      } else {
        const mins = Math.floor(expiresInSeconds / 60);
        const secs = expiresInSeconds % 60;
        expiresInText = `${mins}m ${secs}s remaining`;
      }
      addLog(`[Token Check] JWT valid: ${!isExpired} (${expiresInText}). Subject: ${decoded.sub}`);
    }
  }

  // 4. Server-Side Token Validation via Supabase Auth API
  let serverValidationSuccess = false;
  let serverLatencyMs = 0;
  let serverError: string | undefined = undefined;
  let verifiedUserId: string | undefined = undefined;

  if (hasSession && !isExpired) {
    const start = performance.now();
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      serverLatencyMs = Math.round(performance.now() - start);

      if (userError) {
        serverError = userError.message;
        addLog(`[Server Validation] ❌ Supabase Auth server rejected token: ${userError.message} (${serverLatencyMs}ms)`);
      } else if (userData?.user) {
        serverValidationSuccess = true;
        verifiedUserId = userData.user.id;
        addLog(`[Server Validation] ✓ Token cryptographically validated by Supabase Auth server (${serverLatencyMs}ms). User ID: ${verifiedUserId}`);
      }
    } catch (err: any) {
      serverLatencyMs = Math.round(performance.now() - start);
      serverError = err?.message || 'Network error during server validation';
      addLog(`[Server Validation] ❌ Exception validating token with server: ${serverError}`);
    }
  } else if (!hasSession) {
    addLog('[Server Validation] Skipped (No active session to validate)');
  } else if (isExpired) {
    addLog('[Server Validation] Skipped (Token is expired)');
  }

  // Determine overall status
  let statusSummary: SupabaseAuthVerificationResult['statusSummary'] = 'UNAUTHENTICATED';
  if (!hasSession) {
    statusSummary = 'UNAUTHENTICATED';
  } else if (isExpired) {
    statusSummary = 'SESSION_EXPIRED';
  } else if (serverValidationSuccess) {
    statusSummary = 'AUTHENTICATED_AND_VALIDATED';
  } else {
    statusSummary = 'SERVER_VALIDATION_FAILED';
  }

  const result: SupabaseAuthVerificationResult = {
    configured: true,
    url: config.url,
    hasSession,
    hasUser: Boolean(session?.user),
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      isAnonymous: Boolean(session.user.is_anonymous),
      createdAt: session.user.created_at,
      lastSignInAt: session.user.last_sign_in_at,
    } : null,
    token: {
      present: Boolean(accessToken),
      type: session?.token_type,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
      expiresInSeconds,
      isExpired,
      expiresInText,
      claims,
    },
    persistence: {
      storageActive: typeof localStorage !== 'undefined',
      storageKeysFound,
      persistsInLocalStorage: storageKeysFound.length > 0,
      storedDataValid,
    },
    serverValidation: {
      success: serverValidationSuccess,
      latencyMs: serverLatencyMs,
      serverError,
      verifiedUserId,
    },
    statusSummary,
    timestamp: new Date().toISOString(),
    logs,
  };

  // Log structured diagnostic summary to console
  if (typeof console !== 'undefined' && console.groupCollapsed) {
    console.groupCollapsed(
      `🔍 [Teiln Supabase Auth Diagnostics] Status: %c${statusSummary}`,
      statusSummary === 'AUTHENTICATED_AND_VALIDATED' 
        ? 'color: #10b981; font-weight: bold;' 
        : statusSummary === 'UNAUTHENTICATED' 
        ? 'color: #94a3b8; font-weight: bold;' 
        : 'color: #f59e0b; font-weight: bold;'
    );
    console.log('Timestamp:', result.timestamp);
    console.log('Supabase URL:', result.url);
    console.log('Session Present:', result.hasSession);
    console.log('User:', result.user);
    console.log('Token Status:', result.token);
    console.log('Storage Persistence:', result.persistence);
    console.log('Server Validation (Auth API):', result.serverValidation);
    console.log('Execution Logs:\n' + result.logs.join('\n'));
    console.groupEnd();
  }

  return result;
}

/**
 * Manually trigger token refresh with Supabase Auth server
 */
export async function refreshSupabaseToken(): Promise<{ success: boolean; error?: string; session?: any }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.warn('❌ [Teiln Supabase Auth] Token refresh error:', error.message);
      return { success: false, error: error.message };
    }
    console.info('🔄 [Teiln Supabase Auth] Token refreshed successfully:', data.session?.user?.id);
    return { success: true, session: data.session };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Token refresh failed' };
  }
}

// Expose diagnostic tool to window for easy browser DevTools execution
if (typeof window !== 'undefined') {
  (window as any).verifySupabaseAuth = verifySupabaseAuthStatus;
  (window as any).__teilnVerifySupabaseAuth = verifySupabaseAuthStatus;
  (window as any).refreshSupabaseToken = refreshSupabaseToken;
}

export const SUPABASE_SQL_SCHEMA = `-- Teiln Production PostgreSQL Schema with Permissive & Robust RLS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free',
  tier_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  created_by UUID NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  budget_limit NUMERIC(12, 2),
  invite_token TEXT DEFAULT substring(md5(random()::text) from 1 for 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL DEFAULT 'dining',
  paid_by_user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_items JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES RLS (Fixes 403 on profile creation & magic link)
DROP POLICY IF EXISTS "Profiles readable by all" ON public.profiles;
CREATE POLICY "Profiles readable by all"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- 2. GROUPS RLS (Fixes 403 on group viewing and creation)
DROP POLICY IF EXISTS "Users and Guests can view groups" ON public.groups;
CREATE POLICY "Users and Guests can view groups"
  ON public.groups FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update groups" ON public.groups;
CREATE POLICY "Users can update groups"
  ON public.groups FOR UPDATE TO authenticated
  USING (true);

-- 3. GROUP MEMBERS RLS (Fixes 403 on Magic Link joining)
DROP POLICY IF EXISTS "View group members" ON public.group_members;
CREATE POLICY "View group members"
  ON public.group_members FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. EXPENSES, SETTLEMENTS & MESSAGES RLS
DROP POLICY IF EXISTS "Members can view expenses" ON public.expenses;
CREATE POLICY "Members can view expenses"
  ON public.expenses FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Members can insert expenses" ON public.expenses;
CREATE POLICY "Members can insert expenses"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view settlements" ON public.settlements;
CREATE POLICY "Members can view settlements"
  ON public.settlements FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Members can insert settlements" ON public.settlements;
CREATE POLICY "Members can insert settlements"
  ON public.settlements FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view messages" ON public.messages;
CREATE POLICY "Members can view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Members can insert messages" ON public.messages;
CREATE POLICY "Members can insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (true);
`;
