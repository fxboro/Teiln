/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionTier } from '../types';

export const FREE_TIER_MONTHLY_SCAN_LIMIT = 5;

export interface ScanQuotaInfo {
  scansUsed: number;
  scansRemaining: number;
  monthlyLimit: number;
  isUnlimited: boolean;
  canScan: boolean;
  periodKey: string;
  monthName: string;
}

export function getCurrentPeriodKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getCurrentMonthName(): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
}

function getStorageKey(userId?: string): string {
  const uid = userId || 'anonymous_guest';
  return `teiln_receipt_scans_${uid}_${getCurrentPeriodKey()}`;
}

export function getScanUsage(userId?: string, tier: SubscriptionTier = 'free'): ScanQuotaInfo {
  const isUnlimited = tier === 'supporter' || tier === 'pro';
  const periodKey = getCurrentPeriodKey();
  const monthName = getCurrentMonthName();

  let scansUsed = 0;
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      scansUsed = parseInt(raw, 10) || 0;
    }
  } catch {
    scansUsed = 0;
  }

  const monthlyLimit = isUnlimited ? Infinity : FREE_TIER_MONTHLY_SCAN_LIMIT;
  const scansRemaining = isUnlimited ? Infinity : Math.max(0, FREE_TIER_MONTHLY_SCAN_LIMIT - scansUsed);
  const canScan = isUnlimited || scansRemaining > 0;

  return {
    scansUsed,
    scansRemaining,
    monthlyLimit,
    isUnlimited,
    canScan,
    periodKey,
    monthName,
  };
}

export function recordScanUsage(userId?: string): number {
  const key = getStorageKey(userId);
  let current = 0;
  try {
    const raw = localStorage.getItem(key);
    current = raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    current = 0;
  }

  const next = current + 1;
  try {
    localStorage.setItem(key, String(next));
    window.dispatchEvent(new CustomEvent('teiln-scan-quota-updated', { detail: { count: next, userId } }));
  } catch {
    // ignore
  }

  return next;
}

export function resetScanUsage(userId?: string): void {
  const key = getStorageKey(userId);
  try {
    localStorage.setItem(key, '0');
    window.dispatchEvent(new CustomEvent('teiln-scan-quota-updated', { detail: { count: 0, userId } }));
  } catch {
    // ignore
  }
}

export function useReceiptScanQuota(userId?: string, tier: SubscriptionTier = 'free') {
  const [quota, setQuota] = useState<ScanQuotaInfo>(() => getScanUsage(userId, tier));

  const refresh = useCallback(() => {
    setQuota(getScanUsage(userId, tier));
  }, [userId, tier]);

  useEffect(() => {
    refresh();

    const handleCustom = () => refresh();
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('teiln_receipt_scans_')) {
        refresh();
      }
    };

    window.addEventListener('teiln-scan-quota-updated', handleCustom);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('teiln-scan-quota-updated', handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh]);

  const recordScan = useCallback(() => {
    const newCount = recordScanUsage(userId);
    refresh();
    return newCount;
  }, [userId, refresh]);

  const resetScan = useCallback(() => {
    resetScanUsage(userId);
    refresh();
  }, [userId, refresh]);

  return {
    ...quota,
    recordScan,
    resetScan,
    refresh,
  };
}
