import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Mail, Copy, Check, Sparkles, UserPlus } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const { activeGroup, inviteMember } = useData();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !activeGroup) return null;

  // Compute invite link based on current running origin (supports dev, localhost, and live production domains)
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = currentOrigin
    ? `${currentOrigin}/?join=${encodeURIComponent(activeGroup.id)}&token=${encodeURIComponent(activeGroup.invite_token || 'magic')}&name=${encodeURIComponent(activeGroup.name)}&curr=${encodeURIComponent(activeGroup.base_currency)}${activeGroup.budget_limit ? `&budget=${encodeURIComponent(activeGroup.budget_limit)}` : ''}`
    : '';

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // ignore and try fallback
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const res = document.execCommand('copy');
      document.body.removeChild(textArea);
      return res;
    } catch {
      return false;
    }
  };

  const handleCopyLink = async () => {
    if (inviteLink) {
      await copyToClipboard(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const res = await inviteMember(activeGroup.id, email);
    if (res.success) {
      setSuccess(t('invite.success'));
      setEmail('');
    } else {
      setError(res.error || 'Failed to add member.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 id="invite-title" className="text-xl font-display font-bold text-white">
              {t('invite.title')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('invite.sub', { group: activeGroup.name })}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{success}</span>
          </div>
        )}

        {/* ZERO-FRICTION MAGIC GUEST LINK (Feature Highlight) */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-[#121c29] to-[#0b101c] border border-emerald-500/40 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {t('guest.magicLinkTitle')}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              No Sign-up Required
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {t('guest.magicLinkDesc')}
          </p>

          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <input
              type="text"
              readOnly
              value={inviteLink}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="truncate flex-1 font-mono text-[11px] text-emerald-300 bg-transparent border-0 outline-none select-all cursor-pointer"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0 active:scale-95 shadow-sm"
              title={t('guest.copyMagic')}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleInvite} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('invite.byEmail')}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('invite.placeholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {t('invite.send')}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
