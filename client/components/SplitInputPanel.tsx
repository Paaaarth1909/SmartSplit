'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Minus, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SplitType, Member, ComputedSplit } from './types';
import { previewSplit } from '../lib/api';

interface ParticipantState {
  userId: string;
  name: string;
  amount: number;
  percentage: number;
  shares: number;
}

interface Props {
  members: Member[];
  splitType: SplitType;
  totalAmount: number;
  /** Called whenever the participant split values change. */
  onChange: (
    participants: { userId: string; amount?: number; percentage?: number; shares?: number }[]
  ) => void;
}

const SplitInputPanel: React.FC<Props> = ({
  members,
  splitType,
  totalAmount,
  onChange,
}) => {
  // ── Local state per participant ────────────────────────────────
  const [participants, setParticipants] = useState<ParticipantState[]>([]);
  const [preview, setPreview] = useState<ComputedSplit[]>([]);
  const [previewError, setPreviewError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise / reset when members or splitType change
  useEffect(() => {
    const initial: ParticipantState[] = members.map((m) => ({
      userId: m._id,
      name: m.name,
      amount: 0,
      percentage: members.length > 0 ? parseFloat((100 / members.length).toFixed(2)) : 0,
      shares: 1,
    }));
    setParticipants(initial);
    setPreview([]);
    setPreviewError('');
  }, [members, splitType]);

  // ── Emit changes to parent ─────────────────────────────────────
  const emitChange = useCallback(
    (parts: ParticipantState[]) => {
      const payload = parts.map((p) => {
        switch (splitType) {
          case 'exact':
            return { userId: p.userId, amount: p.amount };
          case 'shares':
            return { userId: p.userId, shares: p.shares };
          case 'percentage':
            return { userId: p.userId, percentage: p.percentage };
        }
      });
      onChange(payload);
    },
    [splitType, onChange]
  );

  // ── Live preview via API (debounced) ───────────────────────────
  useEffect(() => {
    if (totalAmount <= 0 || participants.length === 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const payload = participants.map((p) => {
          switch (splitType) {
            case 'exact':
              return { userId: p.userId, amount: p.amount };
            case 'shares':
              return { userId: p.userId, shares: p.shares };
            case 'percentage':
              return { userId: p.userId, percentage: p.percentage };
          }
        });
        const result = await previewSplit({
          amount: totalAmount,
          splitType,
          participants: payload,
        });
        setPreview(result);
        setPreviewError('');
      } catch (err: any) {
        setPreviewError(err.message || 'Preview failed');
        setPreview([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [participants, splitType, totalAmount]);

  // ── Helpers ────────────────────────────────────────────────────
  const update = (index: number, field: keyof ParticipantState, value: number) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      emitChange(next);
      return next;
    });
  };

  const getPreviewAmount = (userId: string): number | null => {
    const entry = preview.find((p) => p.userId === userId);
    return entry ? entry.amount : null;
  };

  // ── Validation indicators ──────────────────────────────────────
  const sumAmounts = participants.reduce((s, p) => s + p.amount, 0);
  const sumPct = participants.reduce((s, p) => s + p.percentage, 0);
  const totalShares = participants.reduce((s, p) => s + p.shares, 0);

  const isValid =
    splitType === 'exact'
      ? Math.abs(sumAmounts - totalAmount) < 0.02
      : splitType === 'percentage'
        ? Math.abs(sumPct - 100) < 0.1
        : totalShares > 0;

  const validationMsg =
    splitType === 'exact'
      ? `${sumAmounts.toFixed(2)} / ${totalAmount.toFixed(2)}`
      : splitType === 'percentage'
        ? `${sumPct.toFixed(1)}% / 100%`
        : `${totalShares} total share${totalShares !== 1 ? 's' : ''}`;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="bg-[#1a1a1c] border border-white/10 rounded-xl overflow-hidden mt-6">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 bg-white/5 text-xs font-bold uppercase tracking-wider text-white/50">
        <div className="col-span-5">Participant</div>
        <div className="col-span-4 text-center">
          {splitType === 'exact'
            ? 'Amount'
            : splitType === 'shares'
              ? 'Shares'
              : 'Percentage'}
        </div>
        <div className="col-span-3 text-right">Owes</div>
      </div>

      {/* Per-participant rows */}
      <div className="divide-y divide-white/5">
        {participants.map((p, i) => {
          const previewAmt = getPreviewAmount(p.userId);
          return (
            <div key={p.userId} className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
              {/* Avatar + name */}
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-[#b2f5d1]">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white">{p.name}</span>
              </div>

              {/* Input control */}
              <div className="col-span-4 flex justify-center">
                {splitType === 'exact' && (
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-medium">$</span>
                    <input
                      type="number"
                      className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg py-2 pl-7 pr-3 text-sm text-white font-medium focus:outline-none focus:border-[#b2f5d1] transition-colors"
                      min={0}
                      step={0.01}
                      value={p.amount || ''}
                      placeholder="0.00"
                      onChange={(e) => update(i, 'amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}

                {splitType === 'shares' && (
                  <div className="flex items-center gap-3 bg-[#0f0f0f] border border-white/10 rounded-lg p-1">
                    <button
                      type="button"
                      className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                      onClick={() => update(i, 'shares', Math.max(0, p.shares - 1))}
                      disabled={p.shares <= 0}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold text-white w-6 text-center">{p.shares}×</span>
                    <button
                      type="button"
                      className="w-7 h-7 rounded bg-[#b2f5d1]/20 hover:bg-[#b2f5d1]/40 flex items-center justify-center text-[#b2f5d1] transition-colors"
                      onClick={() => update(i, 'shares', p.shares + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}

                {splitType === 'percentage' && (
                  <div className="relative w-24">
                    <input
                      type="number"
                      className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg py-2 pr-7 pl-3 text-sm text-white font-medium focus:outline-none focus:border-[#b2f5d1] transition-colors text-right"
                      min={0}
                      max={100}
                      step={0.1}
                      value={p.percentage || ''}
                      placeholder="0"
                      onChange={(e) =>
                        update(i, 'percentage', parseFloat(e.target.value) || 0)
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 font-medium">%</span>
                  </div>
                )}
              </div>

              {/* Computed amount */}
              <div className="col-span-3 text-right">
                {previewAmt !== null ? (
                  <span className="text-sm font-bold text-[#b2f5d1]">${previewAmt.toFixed(2)}</span>
                ) : (
                  <span className="text-sm text-white/30">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation footer */}
      <div className={`flex items-center gap-2 px-5 py-4 border-t border-white/5 text-sm font-semibold transition-colors ${isValid ? 'bg-[#b2f5d1]/5 text-[#b2f5d1]' : 'bg-red-500/5 text-red-400'}`}>
        {isValid ? (
          <CheckCircle2 size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
        <span>{validationMsg}</span>
        {previewError && <span className="ml-auto text-xs text-red-400 opacity-80">{previewError}</span>}
      </div>
    </div>
  );
};

export default SplitInputPanel;
