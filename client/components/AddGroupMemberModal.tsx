'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check, Copy, Loader2, Users, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { Group } from './types';
import { API_BASE, getAuthHeaders } from '@/lib/api';

interface MemberCandidate {
  _id: string;
  fullName: string;
  avatar?: string;
  isAlreadyMember?: boolean;
}

interface Props {
  group: Group;
  onClose: () => void;
  onMembersAdded: () => void;
}

export default function AddGroupMemberModal({ group, onClose, onMembersAdded }: Props) {
  const groupId = group._id || (group as any).id;
  
  const [inviteCode, setInviteCode] = useState<string>(group.inviteCode || '');
  const [loadingCode, setLoadingCode] = useState<boolean>(!group.inviteCode);
  const [copied, setCopied] = useState<boolean>(false);

  const [friends, setFriends] = useState<MemberCandidate[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const existingMemberIds = new Set(
    (group.members || [])
      .map(m => (m._id ? m._id.toString() : ''))
      .filter(Boolean)
  );

  const existingMemberNames = new Set(
    (group.members || [])
      .map(m => (m.name || '').toLowerCase().trim())
      .filter(Boolean)
  );

  useEffect(() => {
    const fetchCode = async () => {
      if (inviteCode) return;
      try {
        setLoadingCode(true);
        const res = await fetch(`${API_BASE}/groups/${groupId}/invite-code`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data.inviteCode) {
            setInviteCode(data.inviteCode);
          }
        }
      } catch (err) {
        console.error('Failed to fetch invite code', err);
      } finally {
        setLoadingCode(false);
      }
    };

    fetchCode();
  }, [groupId, inviteCode]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoadingFriends(true);
        const res = await fetch(`${API_BASE}/users/me/friends`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const json = await res.json();
          const mappedFriends: MemberCandidate[] = (json.data || []).map((f: any) => ({
            _id: f._id,
            fullName: f.fullName,
            avatar: f.avatar,
            isAlreadyMember:
              existingMemberIds.has(f._id.toString()) ||
              existingMemberNames.has((f.fullName || '').toLowerCase().trim())
          }));
          setFriends(mappedFriends);
        }
      } catch (err) {
        console.error('Failed to load friends', err);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, [groupId]);

  const handleCopyCode = () => {
    const code = inviteCode || group.inviteCode;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSelect = (candidate: MemberCandidate) => {
    if (candidate.isAlreadyMember) return;

    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(candidate._id)) {
        next.delete(candidate._id);
      } else {
        next.add(candidate._id);
      }
      return next;
    });
  };

  const displayList: MemberCandidate[] = friends.filter(friend =>
    searchQuery.trim() === ''
      ? true
      : friend.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSubmit = async () => {
    if (selectedUserIds.size === 0) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const candidatesToAdd = friends.filter(f => selectedUserIds.has(f._id));
      
      for (const candidate of candidatesToAdd) {
        const payload = {
          friendId: candidate._id,
          name: candidate.fullName,
          role: 'member'
        };
        
        const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.error || `Failed to invite ${candidate.fullName}`);
        }
      }
      
      setSuccessMessage('Join requests sent! They will get a pop up on their Recent Activity screen to accept before you can add them.');
      setTimeout(() => {
        onMembersAdded();
        onClose();
      }, 2200);
    } catch (err: any) {
      setError(err.message || 'An error occurred while inviting members.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#121214] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <UserPlus className="text-[#b2f5d1]" size={20} /> Add Friends to Group
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Only mutual network friends can be invited to groups.
            </p>
          </div>
          <button 
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-[#b2f5d1]/10 border border-[#b2f5d1]/30 text-[#b2f5d1] text-xs font-semibold flex items-center gap-2">
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="px-6 pt-5">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-4 transition-colors">
            <span className="text-[11px] uppercase tracking-wider text-white/50 mb-1 font-bold">Group Invite Code</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-bold tracking-widest text-[#b2f5d1]">
                {loadingCode ? (
                  <span className="text-sm font-sans font-medium text-white/40 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[#b2f5d1]" /> Generating...
                  </span>
                ) : (
                  inviteCode || group.inviteCode || 'N/A'
                )}
              </span>
              <button 
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
                onClick={handleCopyCode}
                disabled={(!inviteCode && !group.inviteCode) || loadingCode}
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check size={18} className="text-[#b2f5d1]" />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>
            {copied ? (
              <span className="text-xs text-[#b2f5d1] mt-1 font-medium">Copied to clipboard!</span>
            ) : (
              <p className="text-[11px] text-white/40 mt-1 text-center">Share this code with friends so they can join directly.</p>
            )}
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search your friends by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#b2f5d1]/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1 mb-2">
            {loadingFriends ? (
              <div className="py-8 flex flex-col items-center justify-center text-white/40 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#b2f5d1]" />
                <span className="text-xs font-bold uppercase tracking-widest">Loading friends...</span>
              </div>
            ) : displayList.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-white/40">
                <Users className="w-8 h-8 text-white/20 mb-2" />
                <p className="text-xs font-semibold">
                  {searchQuery.trim() ? 'No friends match this name.' : 'No friends in your network yet.'}
                </p>
                <p className="text-[11px] mt-1 max-w-xs text-white/30">
                  {searchQuery.trim()
                    ? 'Only people who are your accepted friends can be added.'
                    : 'Add friends in the Friends section first before adding them to groups.'}
                </p>
              </div>
            ) : (
              displayList.map(candidate => {
                const isSelected = selectedUserIds.has(candidate._id);
                const isAlready = !!candidate.isAlreadyMember;

                return (
                  <div 
                    key={candidate._id}
                    onClick={() => toggleSelect(candidate)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isAlready
                        ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#b2f5d1]/10 border-[#b2f5d1]/50 cursor-pointer'
                        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 aspect-square ${
                        isSelected ? 'bg-[#b2f5d1]/20 text-[#b2f5d1]' : 'bg-[#1a1a1c] text-white/50 border border-white/10'
                      }`}>
                        {candidate.avatar ? (
                          <img src={candidate.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          candidate.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-[#b2f5d1]' : 'text-white'}`}>
                          {candidate.fullName}
                        </h4>
                        <span className="text-[10px] text-white/40">Network Friend</span>
                      </div>
                    </div>
                    
                    {isAlready ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/40 border border-white/10">
                        Member
                      </span>
                    ) : (
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected ? 'bg-[#b2f5d1] border-[#b2f5d1] text-black' : 'border-white/20 bg-transparent text-transparent'
                      }`}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-white/5 bg-white/5 flex items-center justify-between gap-3">
          <div className="text-[11px] text-white/40">
            {selectedUserIds.size > 0 
              ? `${selectedUserIds.size} friend${selectedUserIds.size > 1 ? 's' : ''} selected` 
              : 'Select friends to invite'}
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button"
              className="px-5 py-2 rounded-xl bg-[#b2f5d1] hover:bg-[#9de4c2] text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(178,245,209,0.2)] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:shadow-none cursor-pointer whitespace-nowrap"
              onClick={handleSubmit}
              disabled={selectedUserIds.size === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" /> Sending...</>
              ) : (
                <>
                  <Send size={13} />
                  <span>Send Join Request{selectedUserIds.size > 0 ? ` (${selectedUserIds.size})` : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
