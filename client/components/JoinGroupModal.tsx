import React, { useState } from 'react';
import { X, Search, Loader2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5050/api';

export default function JoinGroupModal({ onClose, onJoined }: { onClose: () => void, onJoined: () => void }) {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const getToken = async () => 'mock-token';

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setIsSubmitting(true);
    setError('');

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      onJoined();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-[#121214] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Join Group
          </h2>
          <button 
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="p-6">
          <p className="text-sm text-white/60 mb-4">
            Enter the 6-character invite code provided by the group creator.
          </p>
          <input 
            type="text" 
            placeholder="e.g. A3F9XQ" 
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-4 px-4 text-center text-2xl font-mono tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:border-[#b2f5d1]/50 transition-colors uppercase"
          />
        </div>

        <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-end gap-3">
          <button 
            className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-white text-sm font-bold transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-6 py-2.5 rounded-xl bg-[#b2f5d1] hover:bg-[#9de4c2] text-black text-sm font-bold transition-all shadow-[0_0_15px_rgba(178,245,209,0.2)] hover:shadow-[0_0_20px_rgba(178,245,209,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
            onClick={handleJoin}
            disabled={!inviteCode.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Joining...</>
            ) : (
              'Join Group'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
