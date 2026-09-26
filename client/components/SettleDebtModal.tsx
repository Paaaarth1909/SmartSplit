'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ArrowRight, DollarSign, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { settleDebt } from '@/lib/api';

interface SettleDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettled: () => void;
  groupId: string;
  currency?: string;
  members: any[];
  balances: any[];
  settlements: any[];
  prefill?: {
    payerId?: string;
    receiverId?: string;
    amount?: number;
  };
}

export default function SettleDebtModal({
  isOpen,
  onClose,
  onSettled,
  groupId,
  currency = 'INR',
  members,
  balances,
  settlements,
  prefill
}: SettleDebtModalProps) {
  const [payerId, setPayerId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('UPI / Direct Payment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialise or update form when modal opens or prefill changes
  useEffect(() => {
    if (!isOpen) return;
    setError('');

    if (prefill?.payerId && prefill?.receiverId) {
      setPayerId(prefill.payerId);
      setReceiverId(prefill.receiverId);
      setAmount(prefill.amount ? prefill.amount.toString() : '');
    } else if (settlements.length > 0) {
      // Pick first pending settlement
      const first = settlements[0];
      setPayerId(first.from);
      setReceiverId(first.to);
      setAmount(first.amount.toString());
    } else if (balances.length > 1) {
      // Pick debtor and creditor if available
      const debtor = balances.find(b => b.netAmount < -0.01);
      const creditor = balances.find(b => b.netAmount > 0.01);
      if (debtor) setPayerId(debtor.userId);
      if (creditor) setReceiverId(creditor.userId);
      if (debtor) setAmount(Math.abs(debtor.netAmount).toString());
    }
  }, [isOpen, prefill, settlements, balances]);

  if (!isOpen) return null;

  const getMemberName = (id: string) => {
    const bal = balances.find(b => b.userId === id);
    if (bal) return bal.name;
    const mem = members.find(m => m._id === id || (m as any).id === id);
    if (mem) return mem.name;
    return 'Member';
  };

  const payerName = getMemberName(payerId);
  const receiverName = getMemberName(receiverId);

  const handleSelectQuickSettlement = (s: any) => {
    setPayerId(s.from);
    setReceiverId(s.to);
    setAmount(s.amount.toString());
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerId) {
      setError('Please select who made the payment.');
      return;
    }
    if (!receiverId) {
      setError('Please select who received the payment.');
      return;
    }
    if (payerId === receiverId) {
      setError('Payer and receiver cannot be the same person.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive settlement amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await settleDebt(groupId, {
        payerId,
        receiverId,
        amount: numAmount,
        notes: notes.trim()
      });
      onSettled();
    } catch (err: any) {
      setError(err.message || 'Failed to record settlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b2f5d1]/10 border border-[#b2f5d1]/20 flex items-center justify-center text-[#b2f5d1]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Settle Debt</h2>
              <p className="text-xs text-white/50">Record a payment to clear balances between members.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Settlement Recommendations */}
          {settlements.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Pending Settlements (Click to auto-fill)
              </span>
              <div className="flex flex-col gap-1.5">
                {settlements.map((s, idx) => {
                  const isSelected = payerId === s.from && receiverId === s.to;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuickSettlement(s)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-[#b2f5d1]/10 border-[#b2f5d1]/40 text-white' 
                          : 'bg-[#1a1a1c] border-white/5 text-white/80 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-white">{s.fromName}</span>
                        <ArrowRight className="w-3 h-3 text-white/40" />
                        <span className="font-semibold text-white">{s.toName}</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#b2f5d1]">
                        ₹{s.amount.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payer and Receiver Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Payer (Who Paid / Clearing Debt)
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="bg-[#1a1a1c] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#b2f5d1]/50"
              >
                <option value="">Select payer...</option>
                {balances.map((b) => (
                  <option key={b.userId} value={b.userId}>
                    {b.name} {b.netAmount < -0.01 ? `(Owes ₹${Math.abs(b.netAmount).toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Receiver (Who Got Paid)
              </label>
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="bg-[#1a1a1c] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#b2f5d1]/50"
              >
                <option value="">Select receiver...</option>
                {balances.map((b) => (
                  <option key={b.userId} value={b.userId}>
                    {b.name} {b.netAmount > 0.01 ? `(Owed ₹${b.netAmount.toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Amount Paid
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-medium">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-base font-mono font-bold text-[#b2f5d1] focus:outline-none focus:border-[#b2f5d1]/50"
              />
            </div>
          </div>

          {/* Payment Method / Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Payment Method / Note
            </label>
            <input
              type="text"
              placeholder="e.g., Google Pay / UPI, Cash, Bank Transfer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-[#1a1a1c] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-[#b2f5d1]/50"
            />
          </div>

          {/* Impact preview card */}
          {payerId && receiverId && amount && parseFloat(amount) > 0 && (
            <div className="p-4 rounded-xl bg-[#1a1a1c] border border-[#b2f5d1]/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#b2f5d1]/10 flex items-center justify-center text-[#b2f5d1] shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Recording this payment will credit <strong className="text-white">{payerName}</strong> by <strong className="text-[#b2f5d1]">₹{parseFloat(amount).toFixed(2)}</strong> and clear corresponding debt owed to <strong className="text-white">{receiverName}</strong>.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !payerId || !receiverId || !amount || parseFloat(amount) <= 0}
              className="px-5 py-2.5 rounded-xl bg-[#b2f5d1] hover:bg-[#a0f0c4] active:scale-95 text-[#121214] font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(178,245,209,0.25)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Recording Settlement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Record Settlement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
