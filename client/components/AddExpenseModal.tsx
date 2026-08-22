'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Receipt,
  Calendar,
  Tag,
  CreditCard,
} from 'lucide-react';
import { Group, Member, SplitType } from './types';
import SplitMethodSelector from './SplitMethodSelector';
import SplitInputPanel from './SplitInputPanel';
import { createExpense } from '../lib/api';

interface Props {
  group: Group;
  onClose: () => void;
  onExpenseCreated: () => void;
}

const CATEGORIES = [
  'Dining',
  'Groceries',
  'Travel',
  'Entertainment',
  'Utilities',
  'General',
];

const AddExpenseModal: React.FC<Props> = ({ group, onClose, onExpenseCreated }) => {
  // ── Step management ────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step 1 state ───────────────────────────────────────────────
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('General');
  const [paidBy, setPaidBy] = useState(group.members[0]?._id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // ── Step 2 state ───────────────────────────────────────────────
  const [splitType, setSplitType] = useState<SplitType>('exact');
  const [participants, setParticipants] = useState<
    { userId: string; amount?: number; percentage?: number; shares?: number }[]
  >([]);

  // ── UI state ───────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Helpers ────────────────────────────────────────────────────
  const payer = group.members.find((m) => m._id === paidBy);

  const canProceedStep1 = description.trim().length > 0 && amount > 0 && paidBy;

  const canProceedStep2 = (() => {
    if (participants.length === 0) return false;
    if (splitType === 'exact') {
      const sum = participants.reduce((s, p) => s + (p.amount ?? 0), 0);
      return Math.abs(sum - amount) < 0.02;
    }
    if (splitType === 'percentage') {
      const sum = participants.reduce((s, p) => s + (p.percentage ?? 0), 0);
      return Math.abs(sum - 100) < 0.1;
    }
    if (splitType === 'shares') {
      return participants.reduce((s, p) => s + (p.shares ?? 0), 0) > 0;
    }
    return false;
  })();

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await createExpense({
        groupId: group._id,
        description,
        amount,
        category,
        paidBy,
        splitType,
        participants,
        date,
      });
      onExpenseCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel modal-content expense-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add Expense</h2>
            <div className="step-indicator">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`step-dot${step >= s ? ' active' : ''}${step === s ? ' current' : ''}`}
                />
              ))}
              <span className="step-label">
                {step === 1
                  ? 'Details'
                  : step === 2
                    ? 'Split Method'
                    : 'Review'}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="expense-error">{error}</div>
        )}

        {/* ── Step 1: Expense Details ────────────────────────── */}
        {step === 1 && (
          <div className="expense-step">
            <div className="form-group">
              <label className="form-label">
                <Receipt size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Description
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g., Dinner at Olive Garden"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  <CreditCard size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Total Amount
                </label>
                <div className="amount-input-wrapper">
                  <span className="amount-currency">$</span>
                  <input
                    className="form-input"
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    style={{ paddingLeft: '2rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Date
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  <Tag size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Category
                </label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Paid by</label>
                <select
                  className="form-input"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                >
                  {group.members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Split Method + Inputs ──────────────────── */}
        {step === 2 && (
          <div className="expense-step">
            <SplitMethodSelector selected={splitType} onSelect={setSplitType} />

            <div className="split-panel-wrapper">
              <SplitInputPanel
                members={group.members}
                splitType={splitType}
                totalAmount={amount}
                onChange={setParticipants}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Review ─────────────────────────────────── */}
        {step === 3 && (
          <div className="expense-step">
            <div className="review-section">
              <h3 className="review-heading">Expense Summary</h3>

              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Description</span>
                  <span className="review-value">{description}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Amount</span>
                  <span className="review-value highlight">${amount.toFixed(2)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Category</span>
                  <span className="review-value">{category}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Paid by</span>
                  <span className="review-value">{payer?.name || '—'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Date</span>
                  <span className="review-value">{date}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Split method</span>
                  <span className="review-value">
                    {splitType === 'exact'
                      ? 'By Amount'
                      : splitType === 'shares'
                        ? 'By Share'
                        : 'By Percentage'}
                  </span>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h3 className="review-heading">Split Breakdown</h3>
              <div className="review-splits">
                {participants.map((p) => {
                  const member = group.members.find((m) => m._id === p.userId);
                  const display =
                    splitType === 'exact'
                      ? `$${(p.amount ?? 0).toFixed(2)}`
                      : splitType === 'shares'
                        ? `${p.shares ?? 0}× share`
                        : `${(p.percentage ?? 0).toFixed(1)}%`;
                  return (
                    <div key={p.userId} className="review-split-row">
                      <div className="split-input-user">
                        <div className="split-avatar">
                          {(member?.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="split-username">{member?.name || 'Unknown'}</span>
                      </div>
                      <span className="review-split-value">{display}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer navigation ──────────────────────────────── */}
        <div className="expense-footer">
          {step > 1 && (
            <button
              type="button"
              className="btn"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          <div style={{ flex: 1 }} />

          {step < 3 && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
            >
              Next <ArrowRight size={16} />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Creating…' : (
                <>
                  <Check size={16} /> Create Expense
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
