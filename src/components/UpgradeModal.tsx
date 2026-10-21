import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SubscriptionTier } from '../types';
import { 
  X, 
  Check, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  Heart, 
  Zap, 
  CheckCircle2, 
  RotateCcw 
} from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateSubscriptionTier } = useAuth();
  const { t } = useLanguage();
  
  const [selectedPlan, setSelectedPlan] = useState<'supporter' | 'pro'>('supporter');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = (tier: 'supporter' | 'pro') => {
    setIsProcessing(true);
    setPaymentSuccess(null);

    setTimeout(() => {
      updateSubscriptionTier(tier);
      setIsProcessing(false);
      setPaymentSuccess(tier === 'supporter' ? t('upgrade.successSupporter') : t('upgrade.successPro'));
      setTimeout(() => {
        setPaymentSuccess(null);
        onClose();
      }, 1500);
    }, 800);
  };

  const handleResetToFree = () => {
    updateSubscriptionTier('free');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close upgrade dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {paymentSuccess ? (
          <div className="py-12 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-display font-extrabold text-white">
              {paymentSuccess}
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              {t('upgrade.thankYou')}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('upgrade.badge')}</span>
              </div>
              <h2 id="upgrade-title" className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                {t('upgrade.title')}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5">
                {t('upgrade.current')}: <span className="text-white font-semibold uppercase">{currentUser?.tier || 'FREE'}</span>
              </p>
            </div>

            {/* Two Payment Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              
              {/* Option 1: 3 Months Supporter */}
              <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                selectedPlan === 'supporter'
                  ? 'bg-gradient-to-b from-[#121c29] to-[#0e1320] border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" /> Supporter
                    </span>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                      3 Months
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-display font-extrabold text-white">$9.99</span>
                    <span className="text-xs text-slate-400">/ 3 mos</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    {t('price.supporterDesc')}
                  </p>

                  <ul className="mt-5 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{t('upgrade.supporterPerk1')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{t('upgrade.supporterPerk2')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-medium">{t('upgrade.supporterPerk3')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{t('upgrade.supporterPerk4')}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCheckout('supporter')}
                  className="mt-6 w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{isProcessing ? t('upgrade.processing') : t('upgrade.donate3m')}</span>
                </button>
              </div>

              {/* Option 2: Annual Pro */}
              <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                selectedPlan === 'pro'
                  ? 'bg-gradient-to-b from-[#1c182d] to-[#0e1320] border-amber-500/50 shadow-lg shadow-amber-950/30'
                  : 'bg-slate-950 border-slate-800'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Annual Pro
                    </span>
                    <span className="text-[10px] bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded text-amber-400 font-bold">
                      Full Year (365d)
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-display font-extrabold text-white">$29.99</span>
                    <span className="text-xs text-slate-400">/ full year</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    {t('price.proDesc')}
                  </p>

                  <ul className="mt-5 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{t('upgrade.proPerk1')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{t('upgrade.proPerk2')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{t('upgrade.proPerk3')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{t('upgrade.proPerk4')}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCheckout('pro')}
                  className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isProcessing ? t('upgrade.processing') : t('upgrade.subscribeAnnual')}</span>
                </button>
              </div>

            </div>

            {/* Test Helper: Downgrade / Reset */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {t('upgrade.secure')}
              </span>
              {currentUser?.tier !== 'free' && (
                <button
                  type="button"
                  onClick={handleResetToFree}
                  className="text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" /> {t('upgrade.resetFree')}
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};
