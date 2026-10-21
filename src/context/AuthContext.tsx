import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SubscriptionTier } from '../types';
import { 
  supabase, 
  isSupabaseConfigured, 
  testSupabaseConnection, 
  verifySupabaseAuthStatus,
  SupabaseHealthCheckResult,
  SupabaseAuthVerificationResult 
} from '../lib/supabase';
import { SEED_USERS } from '../data/seedData';
import { 
  hashPassword, 
  generateSalt, 
  saveUserCredential, 
  verifyUserPassword, 
  userHasCredential 
} from '../lib/authSecurity';

export interface AuthChangeEventInfo {
  event: string;
  timestamp: string;
  userId?: string;
  email?: string;
  tokenExpiresAt?: string;
  tokenExpiresInText?: string;
  isTokenValid: boolean;
  message: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  allUsers: User[];
  isSupabaseConnected: boolean;
  lastAuthEvent: AuthChangeEventInfo | null;
  dismissLastAuthEvent: () => void;
  verifyAuthSession: () => Promise<SupabaseAuthVerificationResult>;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, fullName: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginAnonymously: (guestName?: string) => Promise<User>;
  convertGuestToPermanent: (email: string, fullName: string, password?: string) => Promise<{ success: boolean; collision?: boolean; existingUser?: User; error?: string }>;
  mergeGuestAccount: (guestUserId: string, permanentUserId: string) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateSubscriptionTier: (tier: SubscriptionTier) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to purge legacy demo accounts (Alex, Clara, Sam, Maya)
const DEMO_USER_IDS = new Set(['usr_alex', 'usr_clara', 'usr_sam', 'usr_maya']);

const purgeLegacyDemoAccounts = () => {
  try {
    const storedUser = localStorage.getItem('teiln_current_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (DEMO_USER_IDS.has(parsed.id) || parsed.email?.includes('alex.rivera@example.com')) {
        localStorage.removeItem('teiln_current_user');
      }
    }
    const storedUsers = localStorage.getItem('teiln_users');
    if (storedUsers) {
      const parsedUsers: User[] = JSON.parse(storedUsers);
      const filtered = parsedUsers.filter(u => !DEMO_USER_IDS.has(u.id) && !u.email?.includes('@example.com'));
      localStorage.setItem('teiln_users', JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }
};

// Run purge immediately on evaluation
if (typeof window !== 'undefined') {
  purgeLegacyDemoAccounts();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('teiln_users');
      if (stored) {
        const parsed: User[] = JSON.parse(stored);
        return parsed.filter(u => !DEMO_USER_IDS.has(u.id) && !u.email?.includes('@example.com'));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('teiln_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!DEMO_USER_IDS.has(parsed.id) && !parsed.email?.includes('alex.rivera@example.com')) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null; // Production: start logged out until user signs in or joins as guest
  });

  // Track latest authentication state change event for diagnostics & UI indicators
  const [lastAuthEvent, setLastAuthEvent] = useState<AuthChangeEventInfo | null>(null);

  const dismissLastAuthEvent = () => {
    setLastAuthEvent(null);
  };

  const verifyAuthSession = async (): Promise<SupabaseAuthVerificationResult> => {
    return await verifySupabaseAuthStatus();
  };

  useEffect(() => {
    try {
      localStorage.setItem('teiln_users', JSON.stringify(allUsers));
    } catch {
      // ignore
    }
  }, [allUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('teiln_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('teiln_current_user');
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Sync Supabase Auth listener if Supabase is connected
  useEffect(() => {
    const client = supabase;
    if (!client || !isSupabaseConfigured) return;

    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      const now = new Date();
      const expSec = session?.expires_at ? session.expires_at - Math.round(Date.now() / 1000) : null;
      const isTokenValid = Boolean(session?.access_token && expSec !== null && expSec > 0);
      let expiresInText = 'No active token';
      if (expSec !== null) {
        if (expSec > 0) {
          const mins = Math.floor(expSec / 60);
          const secs = expSec % 60;
          expiresInText = `${mins}m ${secs}s remaining`;
        } else {
          expiresInText = `Expired ${Math.abs(Math.round(expSec / 60))}m ago`;
        }
      }

      // Detailed Console Diagnostic Log on every Auth State change
      console.group(
        `🔑 [Teiln Supabase Auth] State Changed: %c${event}`,
        'color: #10b981; font-weight: bold; font-size: 11px;'
      );
      console.log('Timestamp:', now.toLocaleTimeString());
      console.log('Auth Event:', event);
      console.log('Session Active:', Boolean(session));
      if (session) {
        console.log('User ID:', session.user?.id);
        console.log('Email:', session.user?.email);
        console.log('Token Expiration:', session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A');
        console.log('Token Countdown:', expiresInText);
        console.log('Token Validated:', isTokenValid);
        console.log('Token Type:', session.token_type);
        console.log('Storage Persistence:', 'Active (persisted in browser localStorage)');
      } else {
        console.log('Session:', null);
      }
      console.groupEnd();

      // Update state for real-time UI indicator
      const eventDetails: AuthChangeEventInfo = {
        event,
        timestamp: now.toISOString(),
        userId: session?.user?.id,
        email: session?.user?.email,
        tokenExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
        tokenExpiresInText: expiresInText,
        isTokenValid,
        message: session 
          ? `Supabase [${event}]: Token active (${expiresInText})` 
          : `Supabase [${event}]: Session cleared`,
      };
      setLastAuthEvent(eventDetails);

      if (!session || event === 'SIGNED_OUT') {
        setCurrentUser(null);
        return;
      }

      if (session?.user) {
        try {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const userObj: User = {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              tier: (profile.tier as SubscriptionTier) || 'free',
              tier_expires_at: profile.tier_expires_at,
              created_at: profile.created_at,
            };
            setCurrentUser(userObj);
            setAllUsers(prev => [...prev.filter(u => u.id !== userObj.id), userObj]);
          } else {
            // Profile row not found yet (e.g. freshly verified magic link or anonymous user)
            const fallbackEmail = session.user.email || `guest_${session.user.id.slice(0, 6)}@guest.teiln.app`;
            const fallbackName = session.user.user_metadata?.full_name || (session.user.email ? session.user.email.split('@')[0] : 'Guest Member');
            const userObj: User = {
              id: session.user.id,
              email: fallbackEmail,
              full_name: fallbackName,
              tier: 'free',
              is_anonymous: Boolean(session.user.is_anonymous),
              tier_expires_at: null,
              created_at: session.user.created_at || new Date().toISOString(),
            };
            setCurrentUser(userObj);
            setAllUsers(prev => [...prev.filter(u => u.id !== userObj.id), userObj]);

            // Attempt to create profile row in background safely
            client.from('profiles').upsert({
              id: userObj.id,
              email: userObj.email,
              full_name: userObj.full_name,
              tier: userObj.tier,
            }).then(() => {}, () => {});
          }
        } catch (err) {
          console.warn('Profile sync notice:', err);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: redirectTo,
          },
        });
        if (error) {
          if (error.message.includes('redirect') || error.message.includes('403') || error.status === 403) {
            return {
              success: false,
              error: 'Supabase redirect URL error (403): Please add this app URL to Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs.',
            };
          }
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to send magic link' };
      }
    }

    // Local mode fallback when Supabase is not yet configured
    const found = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (found) {
      setCurrentUser(found);
      return { success: true };
    }
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      tier: 'free',
      tier_expires_at: null,
      created_at: new Date().toISOString(),
    };
    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true };
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    // 1. Supabase Cloud Authentication (when configured)
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          // Strictly report Supabase error — DO NOT bypass authentication!
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const authedUser: User = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: profile?.full_name || data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            avatar_url: profile?.avatar_url,
            tier: (profile?.tier as SubscriptionTier) || 'free',
            tier_expires_at: profile?.tier_expires_at || null,
            created_at: profile?.created_at || data.user.created_at || new Date().toISOString(),
          };

          setCurrentUser(authedUser);
          setAllUsers(prev => [...prev.filter(u => u.id !== authedUser.id), authedUser]);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Supabase authentication failed.' };
      }
    }

    // 2. Local Secure Mode Authentication (SHA-256 with Cryptographic Salt)
    // Check allUsers or seed accounts
    const allKnownUsers = [...allUsers, ...SEED_USERS.filter(s => !allUsers.some(u => u.id === s.id))];
    const found = allKnownUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      return { 
        success: false, 
        error: 'No account found with this email. Please click "Create Free Account" to register.' 
      };
    }

    // Check password against stored cryptographic salt + hash
    const isPasswordValid = await verifyUserPassword(cleanEmail, password);
    if (!isPasswordValid) {
      const hasCred = userHasCredential(cleanEmail);
      if (!hasCred) {
        // If this account didn't have an initial credential stored yet, initialize it now
        const salt = generateSalt();
        const hash = await hashPassword(password, salt);
        saveUserCredential(cleanEmail, salt, hash);
        setCurrentUser(found);
        setAllUsers(prev => prev.some(u => u.id === found.id) ? prev : [...prev, found]);
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Incorrect password. Please verify your credentials or click "Forgot password?".' 
      };
    }

    // Password verified successfully
    setCurrentUser(found);
    setAllUsers(prev => prev.some(u => u.id === found.id) ? prev : [...prev, found]);
    return { success: true };
  };

  const register = async (email: string, fullName: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanName) {
      return { success: false, error: 'Full name and email are required.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // 1. Supabase Cloud Registration
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: cleanName },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          if (data.session) {
            const newUser: User = {
              id: data.user.id,
              email: cleanEmail,
              full_name: cleanName,
              tier: 'free',
              tier_expires_at: null,
              created_at: new Date().toISOString(),
            };
            setCurrentUser(newUser);
            setAllUsers(prev => [...prev.filter(u => u.id !== newUser.id), newUser]);

            // Save local credentials as cache
            const salt = generateSalt();
            const hash = await hashPassword(password, salt);
            saveUserCredential(cleanEmail, salt, hash);
            return { success: true };
          } else {
            return { 
              success: true, 
              error: 'Account created! Please check your email inbox to verify your address before logging in.' 
            };
          }
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Supabase registration failed.' };
      }
    }

    // 2. Local Secure Mode Registration
    const existing = allUsers.find(u => u.email.toLowerCase() === cleanEmail && !u.is_anonymous);
    if (existing) {
      return { 
        success: false, 
        error: 'An account with this email address already exists. Please sign in instead.' 
      };
    }

    // Hash and store password securely using SHA-256 + salt
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    saveUserCredential(cleanEmail, salt, hash);

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      full_name: cleanName,
      tier: 'free',
      tier_expires_at: null,
      created_at: new Date().toISOString(),
    };

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true };
  };

  /**
   * Zero-Friction Anonymous Guest Login
   * Creates an anonymous user session without requiring an email or password.
   */
  const loginAnonymously = async (guestName?: string): Promise<User> => {
    // If Supabase is configured and supports anonymous login
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInAnonymously?.() || {};
        if (!error && data?.user) {
          const guestUser: User = {
            id: data.user.id,
            email: `guest_${data.user.id.slice(0, 6)}@guest.teiln.app`,
            full_name: guestName || 'Guest User',
            tier: 'free',
            is_anonymous: true,
            created_at: new Date().toISOString(),
          };
          setAllUsers(prev => [...prev.filter(u => u.id !== guestUser.id), guestUser]);
          setCurrentUser(guestUser);
          return guestUser;
        }
      } catch (err) {
        console.warn('Supabase anonymous login notice:', err);
      }
    }

    const guestId = `usr_guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const guestUser: User = {
      id: guestId,
      email: `guest_${Math.random().toString(36).substring(2, 6)}@guest.teiln.app`,
      full_name: guestName || 'Guest User',
      tier: 'free',
      is_anonymous: true,
      created_at: new Date().toISOString(),
    };

    setAllUsers(prev => [...prev, guestUser]);
    setCurrentUser(guestUser);
    return guestUser;
  };

  /**
   * Convert Guest to Permanent User
   * Attaches permanent identity (email, password, name) to the anonymous session
   * without changing their user.id, preserving all their logged expenses intact.
   * If the email is already in use by another user, reports collision for merging.
   */
  const convertGuestToPermanent = async (
    email: string, 
    fullName: string, 
    password?: string
  ): Promise<{ success: boolean; collision?: boolean; existingUser?: User; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'No active session found.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    // Check collision: does another permanent user already own this email?
    const collisionUser = allUsers.find(
      u => u.id !== currentUser.id && u.email.toLowerCase() === cleanEmail && !u.is_anonymous
    );

    if (collisionUser) {
      return {
        success: false,
        collision: true,
        existingUser: collisionUser,
        error: `An account for ${cleanEmail} already exists. Sign in to merge your guest expenses into your permanent account.`,
      };
    }

    // Try Supabase updateUser if configured
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({
          email: cleanEmail,
          password: password || undefined,
          data: { full_name: cleanName },
        });
        if (error) {
          if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('exists')) {
            return {
              success: false,
              collision: true,
              error: `This email is already registered in Supabase. Sign in with your password to merge expenses.`,
            };
          }
          console.warn('Supabase updateUser error:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase updateUser exception:', err);
      }
    }

    // Save password credentials locally
    if (password && password.length >= 6) {
      const salt = generateSalt();
      const hash = await hashPassword(password, salt);
      saveUserCredential(cleanEmail, salt, hash);
    }

    // Attach permanent identity to the exact same user.id!
    const updatedUser: User = {
      ...currentUser,
      email: cleanEmail,
      full_name: cleanName,
      is_anonymous: false,
    };

    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    return { success: true };
  };

  /**
   * Merges guest user account into an existing permanent account
   */
  const mergeGuestAccount = (guestUserId: string, permanentUserId: string) => {
    const permanentUser = allUsers.find(u => u.id === permanentUserId);
    if (!permanentUser) return;

    // Remove the guest user from allUsers
    setAllUsers(prev => prev.filter(u => u.id !== guestUserId));
    // Switch to permanent user
    setCurrentUser(permanentUser);
  };

  /**
   * Sends password reset instructions or verification link
   */
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true, message: 'Password reset link sent! Please check your email inbox.' };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to send password reset link.' };
      }
    }

    // Local / Demo mode handling
    const found = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    try {
      const resetEvents = JSON.parse(localStorage.getItem('teiln_password_resets') || '[]');
      resetEvents.unshift({
        email: cleanEmail,
        timestamp: new Date().toISOString(),
        token: Math.random().toString(36).substring(2, 10),
      });
      localStorage.setItem('teiln_password_resets', JSON.stringify(resetEvents.slice(0, 10)));
    } catch {}

    if (!found) {
      return { 
        success: true, 
        message: `Password reset instructions prepared for ${cleanEmail}. You can also set a new password below.` 
      };
    }

    return { 
      success: true, 
      message: `Password reset link sent to ${cleanEmail}! You can also set a new password directly below.` 
    };
  };

  /**
   * Resets and updates the account password
   */
  const resetPassword = async (email: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Supabase password reset failed.' };
      }
    }

    // Update in secure local credentials
    const salt = generateSalt();
    const hash = await hashPassword(newPassword, salt);
    saveUserCredential(cleanEmail, salt, hash);

    // Find user and log them in immediately with new password
    const existingUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      setCurrentUser(existingUser);
      return { success: true, message: 'Password has been updated successfully! You are now logged in.' };
    } else {
      // Create user if they were entering a new account
      const newUser: User = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        tier: 'free',
        tier_expires_at: null,
        created_at: new Date().toISOString(),
      };
      setAllUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      return { success: true, message: 'Password has been saved successfully!' };
    }
  };

  const logout = () => {
    if (supabase && isSupabaseConfigured) {
      supabase.auth.signOut().catch(console.error);
    }
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const updateSubscriptionTier = (tier: SubscriptionTier) => {
    if (!currentUser) return;

    let expiryDate: string | null = null;
    if (tier === 'supporter') {
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      expiryDate = d.toISOString();
    } else if (tier === 'pro') {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      expiryDate = d.toISOString();
    }

    const updatedUser: User = {
      ...currentUser,
      tier,
      tier_expires_at: expiryDate,
    };

    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    // Also update Supabase if configured
    if (supabase && isSupabaseConfigured) {
      supabase.from('profiles').update({
        tier,
        tier_expires_at: expiryDate,
      }).eq('id', currentUser.id).then();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        allUsers,
        isSupabaseConnected: isSupabaseConfigured,
        lastAuthEvent,
        dismissLastAuthEvent,
        verifyAuthSession,
        login,
        register,
        sendMagicLink,
        loginAnonymously,
        convertGuestToPermanent,
        mergeGuestAccount,
        requestPasswordReset,
        resetPassword,
        logout,
        switchUser,
        updateSubscriptionTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
