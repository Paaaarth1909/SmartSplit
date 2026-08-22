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
    <div className="split-input-panel">
      {/* Header */}
      <div className="split-input-header">
        <span className="split-input-label">Participant</span>
        <span className="split-input-label">
          {splitType === 'exact'
            ? 'Amount'
            : splitType === 'shares'
              ? 'Shares'
              : 'Percentage'}
        </span>
        <span className="split-input-label">Owes</span>
      </div>

      {/* Per-participant rows */}
      {participants.map((p, i) => {
        const previewAmt = getPreviewAmount(p.userId);
        return (
          <div key={p.userId} className="split-input-row">
            {/* Avatar + name */}
            <div className="split-input-user">
              <div className="split-avatar">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="split-username">{p.name}</span>
            </div>

            {/* Input control */}
            <div className="split-input-control">
              {splitType === 'exact' && (
                <div className="amount-input-wrapper">
                  <span className="amount-currency">$</span>
                  <input
                    type="number"
                    className="form-input split-number-input"
                    min={0}
                    step={0.01}
                    value={p.amount || ''}
                    placeholder="0.00"
                    onChange={(e) => update(i, 'amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              {splitType === 'shares' && (
                <div className="share-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => update(i, 'shares', Math.max(0, p.shares - 1))}
                    disabled={p.shares <= 0}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="stepper-value">{p.shares}×</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => update(i, 'shares', p.shares + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}

              {splitType === 'percentage' && (
                <div className="percentage-input-wrapper">
                  <input
                    type="number"
                    className="form-input split-number-input"
                    min={0}
                    max={100}
                    step={0.1}
                    value={p.percentage || ''}
                    placeholder="0"
                    onChange={(e) =>
                      update(i, 'percentage', parseFloat(e.target.value) || 0)
                    }
                  />
                  <span className="percentage-symbol">%</span>
                </div>
              )}
            </div>

            {/* Computed amount */}
            <div className="split-input-preview">
              {previewAmt !== null ? (
                <span className="preview-amount">${previewAmt.toFixed(2)}</span>
              ) : (
                <span className="preview-amount dim">—</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Validation footer */}
      <div className={`split-validation ${isValid ? 'valid' : 'invalid'}`}>
        {isValid ? (
          <CheckCircle2 size={16} className="validation-icon valid" />
        ) : (
          <AlertCircle size={16} className="validation-icon invalid" />
        )}
        <span>{validationMsg}</span>
        {previewError && <span className="preview-error">{previewError}</span>}
      </div>
    </div>
  );
};

export default SplitInputPanel;
