import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { SimplifiedDebt } from '../types';
import { X, CheckCircle, ArrowRight, Bell, Send, Check } from 'lucide-react';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetDebt?: SimplifiedDebt | null;
  mode?: 'record' | 'request';
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  presetDebt,
  mode: initialMode = 'record',
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { activeGroup, activeMembers, recordSettlement, requestSettlement } = useData();

  const [activeTab, setActiveTab] = useState<'record' | 'request'>(initialMode);
  const [payerId, setPayerId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      if (presetDebt) {
        setPayerId(presetDebt.from_user_id);
        setReceiverId(presetDebt.to_user_id);
        setAmountStr(presetDebt.amount.toString());
      } else {
        setPayerId(currentUser?.id || activeMembers[0]?.user_id || '');
        setReceiverId(activeMembers[1]?.user_id || activeMembers[0]?.user_id || '');
        setAmountStr('');
      }
      setNotes('');
      setIsSuccess(false);
    }
  }, [isOpen, presetDebt, initialMode, currentUser?.id, activeMembers]);

  if (!isOpen || !activeGroup) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0 || payerId === receiverId) return;

    if (activeTab === 'record') {
      recordSettlement({
        groupId: activeGroup.id,
        payerId,
        receiverId,
        amount,
        notes: notes.trim() || undefined,
      });
      setSuccessMessage(t('settle.success'));
    } else {
      // Request settlement from debtor
      await requestSettlement({
        groupId: activeGroup.id,
        fromUserId: payerId,   // debtor who needs to pay
        toUserId: receiverId,  // creditor who is requesting
        amount,
        notes: notes.trim() || undefined,
      });
      const debtorName = activeMembers.find(m => m.user_id === payerId)?.user.full_name || 'Member';
      setSuccessMessage(t('settle.requestSentSub', { debtor: debtorName }));
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  const payerUser = activeMembers.find(m => m.user_id === payerId)?.user;
  const receiverUser = activeMembers.find(m => m.user_id === receiverId)?.user;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settle-up-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close settle modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-display text-white">
              {activeTab === 'record' ? t('settle.success') : t('settle.requestSent')}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {successMessage || t('settle.successSub', { group: activeGroup.name })}
            </p>
          </div>
        ) : (
          <>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-5 max-w-[280px]">
              <button
                type="button"
                onClick={() => setActiveTab('record')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'record'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Record Payment
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('request')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'request'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="w-3 h-3" />
                <span>Request Push</span>
              </button>
            </div>

            <h2 id="settle-up-title" className="text-xl font-display font-bold text-white">
              {activeTab === 'record' ? t('settle.title') : t('settle.requestTitle')}
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {activeTab === 'record' ? t('settle.sub') : t('settle.requestSub')}
            </p>

            {/* Visual Transfer Badge */}
            <div className="mt-5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {activeTab === 'record' ? t('settle.paidBy') : 'Debtor (Pays)'}
                </p>
                <p className="text-xs font-semibold text-white mt-0.5">{payerUser?.full_name || 'Select Member'}</p>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {activeTab === 'record' ? t('settle.receivedBy') : 'Creditor (Receives)'}
                </p>
                <p className="text-xs font-semibold text-white mt-0.5">{receiverUser?.full_name || 'Select Member'}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {activeTab === 'record' ? t('settle.whoPaid') : 'Who owes money?'}
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {activeTab === 'record' ? t('settle.whoReceived') : 'Who should receive?'}
                  </label>
                  <select
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id} disabled={m.user_id === payerId}>
                        {m.user.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('settle.amountPaid')} ({activeGroup.base_currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-bold font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {activeTab === 'record' ? t('settle.notes') : 'Reminder message / Note'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={activeTab === 'record' ? "e.g. Sent via Venmo, Cash, PayPal" : "e.g. Please settle for Tahoe trip"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t('group.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!amountStr || payerId === receiverId}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'record'
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/20'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  {activeTab === 'record' ? (
                    t('settle.submit')
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('settle.requestBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
