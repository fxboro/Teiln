import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Merge,
  Eye,
  EyeOff
} from 'lucide-react';

interface ConvertGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConvertGuestModal: React.FC<ConvertGuestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, convertGuestToPermanent, login, mergeGuestAccount } = useAuth();
  const { reassignGuestData, userExpenses } = useData();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState(
    currentUser?.full_name && !currentUser.full_name.toLowerCase().includes('guest') 
      ? currentUser.full_name 
      : ''
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collision state
  const [isCollision, setIsCollision] = useState(false);
  const [collisionEmail, setCollisionEmail] = useState('');
  const [collisionPassword, setCollisionPassword] = useState('');
  const [showCollisionPassword, setShowCollisionPassword] = useState(false);

  // Success state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const guestExpenseCount = userExpenses.filter(e => e.paid_by_user_id === currentUser.id).length;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await convertGuestToPermanent(email, fullName, password);

      if (res.success) {
        setSuccessMessage(t('guest.convertSuccess'));
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1600);
      } else if (res.collision) {
        setIsCollision(true);
        setCollisionEmail(email.trim().toLowerCase());
        setError(res.error || null);
      } else {
        setError(res.error || 'Conversion failed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during account conversion.');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const guestId = currentUser.id;
      const res = await login(collisionEmail, collisionPassword);

      if (res.success) {
        // Find the permanent user who just logged in
        // Reassign all guest expenses and memberships to the permanent account!
        // We get current user after login
        setTimeout(() => {
          const storedUser = localStorage.getItem('teiln_current_user');
          if (storedUser) {
            const permUser = JSON.parse(storedUser);
            if (permUser.id !== guestId) {
              reassignGuestData(guestId, permUser.id);
              mergeGuestAccount(guestId, permUser.id);
            }
          }
        }, 50);

        setSuccessMessage(t('guest.mergeSuccess'));
        setTimeout(() => {
          setSuccessMessage(null);
          setIsCollision(false);
          onClose();
        }, 1600);
      } else {
        setError(res.error || 'Incorrect password for existing account.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-guest-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {successMessage ? (
          <div className="py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-display text-white">
              {successMessage}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">
              All group memberships and balances remain connected to your profile.
            </p>
          </div>
        ) : isCollision ? (
          /* ========================================================= */
          /* COLLISION RESOLUTION: MERGE GUEST DATA INTO EXISTING USER */
          /* ========================================================= */
          <div className="space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Merge className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h2 id="convert-guest-title" className="text-xl font-display font-bold text-white">
                {t('guest.collisionTitle')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t('guest.collisionDesc', { email: collisionEmail })}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Guest Progress to Merge</p>
                <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                  {guestExpenseCount} {guestExpenseCount === 1 ? 'expense' : 'expenses'} logged as Guest
                </p>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">
                AUTO-TRANSFER
              </span>
            </div>

            <form onSubmit={handleMergeLogin} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Enter Password for {collisionEmail}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showCollisionPassword ? 'text' : 'password'}
                    required
                    value={collisionPassword}
                    onChange={(e) => setCollisionPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCollisionPassword(!showCollisionPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded transition-colors cursor-pointer focus:outline-none"
                    aria-label={showCollisionPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showCollisionPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showCollisionPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500 hover:text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Merging...' : 'Log In & Merge Guest Expenses'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCollision(false);
                  setError(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer pt-1"
              >
                ← Use a different email address
              </button>
            </form>
          </div>
        ) : (
          /* ========================================================= */
          /* STANDARD UPGRADE PROMPT: CONVERT TO PERMANENT ACCOUNT     */
          /* ========================================================= */
          <div className="space-y-4 animate-in fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('guest.saveProgress')}</span>
            </div>

            <div>
              <h2 id="convert-guest-title" className="text-xl font-display font-bold text-white">
                {t('guest.convertTitle')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t('guest.convertDesc')}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Guest Session Integrity Notice */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Your session ID remains identical: all group splits, receipts, and IOUs stay attached.
              </span>
            </div>

            <form onSubmit={handleConvert} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded transition-colors cursor-pointer focus:outline-none"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500 hover:text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : 'Save Progress & Permanently Register'}</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
