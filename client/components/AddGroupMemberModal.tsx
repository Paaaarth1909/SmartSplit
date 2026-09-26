'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check, Copy, Loader2 } from 'lucide-react';
import { Group } from './types';
import { API_BASE, getAuthHeaders } from '@/lib/api';

interface MemberCandidate {
  _id: string;
  fullName: string;
  email: string;
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
  const [searchResults, setSearchResults] = useState<MemberCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set of lowercase emails of current members
  const existingEmails = new Set(
    (group.members || [])
      .map(m => (m.email || '').toLowerCase().trim())
      .filter(Boolean)
  );

  // 1. Ensure invite code is loaded / generated
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

  // 2. Fetch friends
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
            email: f.email,
            avatar: f.avatar,
            isAlreadyMember: existingEmails.has((f.email || '').toLowerCase().trim())
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

  // 3. Search database users when user types query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(searchQuery.trim())}&includeFriends=true`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const json = await res.json();
          const results: MemberCandidate[] = (json.data || []).map((u: any) => ({
            _id: u._id,
            fullName: u.fullName,
            email: u.email,
            avatar: u.avatar,
            isAlreadyMember: existingEmails.has((u.email || '').toLowerCase().trim())
          }));
          setSearchResults(results);
        }
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Combine candidates: If searching, show searchResults. Otherwise show friends.
  const displayList: MemberCandidate[] = searchQuery.trim().length >= 2
    ? searchResults
    : friends;

  // Find all selected candidates across search results and friends
  const allCandidatesMap = new Map<string, MemberCandidate>();
  friends.forEach(f => allCandidatesMap.set(f._id, f));
  searchResults.forEach(s => allCandidatesMap.set(s._id, s));

  // 4. Handle submit
  const handleSubmit = async () => {
    if (selectedUserIds.size === 0) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const candidatesToAdd = Array.from(selectedUserIds)
        .map(id => allCandidatesMap.get(id))
        .filter(Boolean) as MemberCandidate[];
      
      for (const candidate of candidatesToAdd) {
        const payload = {
          name: candidate.fullName,
          email: candidate.email,
          phone: '',
          role: 'member'
        };
        
        const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to add ${candidate.fullName}`);
        }
      }
      
      onMembersAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding members.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#121214] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserPlus className="text-[#b2f5d1]" size={20} /> Add to Group
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

        <div className="px-6 pt-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-4 transition-colors">
            <span className="text-xs uppercase tracking-wider text-white/50 mb-1 font-semibold">Group Invite Code</span>
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
              <span className="text-xs text-[#b2f5d1] mt-2 font-medium">Copied to clipboard!</span>
            ) : (
              <p className="text-xs text-white/40 mt-2 text-center">Share this code with friends so they can join automatically.</p>
            )}
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search by name or email in database..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#b2f5d1]/50 transition-colors"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b2f5d1] animate-spin" />
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2 mb-2">
            {loadingFriends ? (
              <div className="py-8 flex flex-col items-center justify-center text-white/40 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#b2f5d1]" />
                <span className="text-sm font-bold uppercase tracking-widest">Loading...</span>
              </div>
            ) : displayList.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-white/40">
                <p className="text-sm">
                  {searchQuery.trim().length >= 2 ? 'No users found matching your search.' : 'No friends in network yet.'}
                </p>
                <p className="text-xs mt-1 max-w-xs text-white/30">
                  {searchQuery.trim().length >= 2
                    ? 'Check spelling or enter the full email address.'
                    : 'Type a name or email above to search all registered users.'}
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
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${
                        isSelected ? 'bg-[#b2f5d1]/20 text-[#b2f5d1]' : 'bg-[#1a1a1c] text-white/50 border border-white/10'
                      }`}>
                        {candidate.avatar ? (
                          <img src={candidate.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          candidate.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold ${isSelected ? 'text-[#b2f5d1]' : 'text-white'}`}>
                            {candidate.fullName}
                          </h4>
                          {isAlready && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10">
                              Already in group
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{candidate.email}</p>
                      </div>
                    </div>
                    
                    {!isAlready && (
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

        <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
          <div className="text-xs text-white/40">
            {selectedUserIds.size > 0 && `${selectedUserIds.size} user(s) selected`}
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-white text-sm font-bold transition-colors cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="px-6 py-2.5 rounded-xl bg-[#b2f5d1] hover:bg-[#9de4c2] text-black text-sm font-bold transition-all shadow-[0_0_15px_rgba(178,245,209,0.2)] hover:shadow-[0_0_20px_rgba(178,245,209,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:shadow-none cursor-pointer"
              onClick={handleSubmit}
              disabled={selectedUserIds.size === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Adding...</>
              ) : (
                `Add ${selectedUserIds.size > 0 ? selectedUserIds.size : ''} to Group`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
