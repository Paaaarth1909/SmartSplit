'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Receipt,
  Calendar,
  Tag,
  CreditCard,
  Upload,
  Camera,
  Send,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Group, SplitType } from './types';
import SplitMethodSelector from './SplitMethodSelector';
import SplitInputPanel from './SplitInputPanel';

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

const AddExpenseModal: React.FC<Props> = ({ group, onClose, onExpenseCreated }) => {
  const { getToken } = useAuth();
  
  // ── Step management ────────────────────────────────────────────
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0 = Smart Input

  // ── Smart Input state ──────────────────────────────────────────
  const [nlpText, setNlpText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 1 state (Details) ─────────────────────────────────────
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('General');
  const [paidBy, setPaidBy] = useState(group.members[0]?._id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageHash, setImageHash] = useState<string | undefined>();
  const [merchant, setMerchant] = useState('');

  // ── Step 2 state (Split) ───────────────────────────────────────
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
      return participants.reduce((s, p) => s + (p.shares ?? 0), 0);
    }
    return false;
  })();

  // ── AI Smart Input Handlers ────────────────────────────────────
  const processAIResponse = (data: any) => {
    if (data.amount) setAmount(data.amount);
    if (data.description || data.merchantName) setDescription(data.description || data.merchantName);
    if (data.category) setCategory(data.category);
    if (data.date) setDate(data.date);
    if (data.imageHash) setImageHash(data.imageHash);
    
    // Auto-advance to details step
    setStep(1);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAI(true);
    setAiError('');

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('groupId', group._id);

      const res = await fetch(`${API_BASE}/ai/ocr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      
      if (!res.ok) {
        if (res.status === 409 && json.isDuplicate) {
          throw new Error('This receipt has already been uploaded previously.');
        }
        throw new Error(json.error || 'Failed to process receipt');
      }

      processAIResponse(json.data);
    } catch (err: any) {
      setAiError(err.message || 'Error processing receipt image.');
    } finally {
      setIsProcessingAI(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNLP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpText.trim()) return;

    setIsProcessingAI(true);
    setAiError('');

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/ai/nlp`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: nlpText }),
      });

      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Failed to parse natural language');

      processAIResponse(json.data);
    } catch (err: any) {
      setAiError(err.message || 'Error parsing text.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // ── Final Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      
      const token = await getToken();
      const payload = {
        groupId: group._id,
        description,
        amount,
        category,
        paidBy,
        splitType,
        participants,
        date,
        imageHash
      };

      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create expense');

      onExpenseCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Steps Titles ───────────────────────────────────────────────
  const getStepTitle = () => {
    switch(step) {
      case 0: return 'Smart Input';
      case 1: return 'Details';
      case 2: return 'Split Method';
      case 3: return 'Review';
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#121214] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              Add Expense <ArrowRight className="text-white/30" size={16} /> <span className="text-[#b2f5d1]">{getStepTitle()}</span>
            </h2>
            <div className="flex items-center gap-2 mt-3">
              {[0, 1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    step === s ? 'w-8 bg-[#b2f5d1]' : step > s ? 'w-4 bg-[#b2f5d1]/50' : 'w-4 bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="m-6 mb-0 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* ── Step 0: Smart Input ────────────────────────── */}
          {step === 0 && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {aiError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <p>{aiError}</p>
                </div>
              )}
              
              <div 
                className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-[#b2f5d1]/50 hover:bg-[#b2f5d1]/5 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {isProcessingAI && (
                  <div className="absolute inset-0 bg-[#121214]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
                    <Loader2 className="w-8 h-8 text-[#b2f5d1] animate-spin" />
                    <span className="text-sm font-bold text-[#b2f5d1] tracking-widest uppercase animate-pulse">Processing AI...</span>
                  </div>
                )}
                
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#b2f5d1]/20 transition-colors">
                  <Upload className="w-8 h-8 text-white/40 group-hover:text-[#b2f5d1] transition-colors" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-white mb-1">Drop Receipt Image</h3>
                  <p className="text-sm text-white/40">or click to browse files</p>
                </div>
                
                <div className="flex items-center gap-4 w-full max-w-xs my-2">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">OR</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <button 
                  className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                  onClick={(e) => { e.stopPropagation(); /* Mobile camera trigger */ }}
                >
                  <Camera size={16} /> Open Camera
                </button>

                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Or type natural language</span>
                <form onSubmit={handleNLP} className="relative">
                  <input
                    type="text"
                    value={nlpText}
                    onChange={(e) => setNlpText(e.target.value)}
                    placeholder="Dinner $84 at Olive Garden split with Raj"
                    className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-[#b2f5d1]/50 transition-colors placeholder:text-white/20"
                    disabled={isProcessingAI}
                  />
                  <button 
                    type="submit"
                    disabled={!nlpText.trim() || isProcessingAI}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:bg-[#b2f5d1]/20 hover:text-[#b2f5d1] transition-colors disabled:opacity-50"
                  >
                    {isProcessingAI ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Step 1: Expense Details ────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <Receipt size={14} /> Description
                </label>
                <input
                  className="bg-[#1a1a1c] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#b2f5d1]/50 transition-colors"
                  type="text"
                  placeholder="e.g., Dinner at Olive Garden"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                    <CreditCard size={14} /> Total Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">$</span>
                    <input
                      className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-sm text-white focus:outline-none focus:border-[#b2f5d1]/50 transition-colors"
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder="0.00"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                    <Calendar size={14} /> Date
                  </label>
                  <input
                    className="bg-[#1a1a1c] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#b2f5d1]/50 transition-colors"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                    <Tag size={14} /> Category
                  </label>
                  <select
                    className="bg-[#1a1a1c] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#b2f5d1]/50 transition-colors appearance-none"
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

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">Paid by</label>
                  <select
                    className="bg-[#1a1a1c] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#b2f5d1]/50 transition-colors appearance-none"
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
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SplitMethodSelector selected={splitType} onSelect={setSplitType} />
              <SplitInputPanel
                members={group.members}
                splitType={splitType}
                totalAmount={amount}
                onChange={setParticipants}
              />
            </div>
          )}

          {/* ── Step 3: Review ─────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">Expense Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-[#1a1a1c] border border-white/10 rounded-xl p-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Description</span>
                    <span className="text-sm font-medium text-white">{description}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Amount</span>
                    <span className="text-lg font-bold text-[#b2f5d1]">${amount.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Category</span>
                    <span className="text-sm font-medium text-white">{category}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Paid by</span>
                    <span className="text-sm font-medium text-white">{payer?.name || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Date</span>
                    <span className="text-sm font-medium text-white">{date}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Split method</span>
                    <span className="text-sm font-medium text-white">
                      {splitType === 'exact' ? 'By Amount' : splitType === 'shares' ? 'By Share' : 'By Percentage'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">Split Breakdown</h3>
                <div className="flex flex-col divide-y divide-white/5 bg-[#1a1a1c] border border-white/10 rounded-xl px-5">
                  {participants.map((p) => {
                    const member = group.members.find((m) => m._id === p.userId);
                    const display =
                      splitType === 'exact'
                        ? `$${(p.amount ?? 0).toFixed(2)}`
                        : splitType === 'shares'
                          ? `${p.shares ?? 0}× share`
                          : `${(p.percentage ?? 0).toFixed(1)}%`;
                    return (
                      <div key={p.userId} className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-[#b2f5d1]">
                            {(member?.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-white">{member?.name || 'Unknown'}</span>
                        </div>
                        <span className="text-sm font-bold text-[#b2f5d1]">{display}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer navigation ──────────────────────────────── */}
        <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/5">
          <div>
            {step > 0 && (
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-white transition-colors flex items-center gap-2"
                onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2 | 3)}
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {step === 0 && (
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 hover:text-white text-sm font-bold transition-colors"
                onClick={() => setStep(1)}
              >
                Skip Smart Input
              </button>
            )}
          </div>

          <div>
            {step > 0 && step < 3 && (
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-[#b2f5d1] hover:bg-[#9de4c2] text-black text-sm font-bold transition-all shadow-[0_0_15px_rgba(178,245,209,0.2)] hover:shadow-[0_0_20px_rgba(178,245,209,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                onClick={() => setStep((s) => (s + 1) as 0 | 1 | 2 | 3)}
              >
                Next <ArrowRight size={16} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-[#b2f5d1] hover:bg-[#9de4c2] text-black text-sm font-bold transition-all shadow-[0_0_15px_rgba(178,245,209,0.2)] hover:shadow-[0_0_20px_rgba(178,245,209,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating...</>
                ) : (
                  <><Check size={16} /> Create Expense</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
