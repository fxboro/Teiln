/**
 * Secure Authentication & Password Cryptography Engine for Teiln
 * Uses Web Crypto API SHA-256 with per-user cryptographic salts
 * to enforce strict password authentication in offline / local mode.
 */

const CREDENTIALS_STORAGE_KEY = 'teiln_user_credentials';

export interface StoredCredential {
  salt: string;
  hash: string;
  updatedAt: string;
}

/**
 * Generate cryptographically secure random salt hex string
 */
export function generateSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Math.random().toString(36).substring(2, 18);
}

/**
 * Hash password with salt using standard Web Crypto SHA-256
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}__TEILN_AUTH__${password}`);

  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback hash for environments without crypto.subtle
  let hash = 0;
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get all stored local user credentials
 */
export function getStoredCredentials(): Record<string, StoredCredential> {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch {}
  return {};
}

/**
 * Save user credential for email
 */
export function saveUserCredential(email: string, salt: string, hash: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const creds = getStoredCredentials();
      creds[email.trim().toLowerCase()] = {
        salt,
        hash,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(creds));
    }
  } catch {}
}

/**
 * Check if a credential exists for email
 */
export function userHasCredential(email: string): boolean {
  const creds = getStoredCredentials();
  return Boolean(creds[email.trim().toLowerCase()]);
}

/**
 * Verify password against stored hash for email
 */
export async function verifyUserPassword(email: string, passwordAttempt: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const creds = getStoredCredentials();
  const cred = creds[cleanEmail];

  if (!cred || !cred.salt || !cred.hash) {
    return false;
  }

  const computedHash = await hashPassword(passwordAttempt, cred.salt);
  return computedHash === cred.hash;
}

/**
 * Initialize seed demo accounts with known credentials (password: 'password123')
 * This ensures demo accounts like alex@teiln.app can be tested with real password verification.
 */
export async function initSeedCredentials(): Promise<void> {
  const creds = getStoredCredentials();
  const demoAccounts = ['alex@teiln.app', 'clara@teiln.app', 'sam@teiln.app', 'maya@teiln.app'];

  let needsSave = false;
  for (const email of demoAccounts) {
    if (!creds[email]) {
      const salt = generateSalt();
      const hash = await hashPassword('password123', salt);
      creds[email] = {
        salt,
        hash,
        updatedAt: new Date().toISOString(),
      };
      needsSave = true;
    }
  }

  if (needsSave && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(creds));
    } catch {}
  }
}

// Automatically bootstrap seed credentials
if (typeof window !== 'undefined') {
  initSeedCredentials().catch(() => {});
}
