'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { Group } from './types';

interface Friend {
  _id: string;
  fullName: string;
  email: string;
  avatar: string;
}

interface Props {
  group: Group;
  onClose: () => void;
  onMembersAdded: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

export default function AddGroupMemberModal({ group, onClose, onMembersAdded }: Props) {
  const { getToken } = useAuth();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch friends
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/users/me/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          // Filter out friends that are already in this group
          const existingEmails = new Set(group.members.map(m => m.email));
          const eligibleFriends = (json.data || []).filter((f: Friend) => !existingEmails.has(f.email));
          setFriends(eligibleFriends);
        }
      } catch (err) {
        console.error('Failed to load friends', err);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, [group, getToken]);

  // 2. Handle submit
  const handleSubmit = async () => {
    if (selectedFriends.size === 0) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = await getToken();
      
      // We will loop and hit POST /api/groups/:id/members for each selected friend
      const friendsToAdd = friends.filter(f => selectedFriends.has(f._id));
      
      for (const friend of friendsToAdd) {
        const payload = {
          name: friend.fullName,
          email: friend.email,
          phone: '', // Optional
          role: 'member'
        };
        
        const res = await fetch(`${API_BASE}/groups/${group._id}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          throw new Error(`Failed to add ${friend.fullName}`);
        }
      }
      
      onMembersAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding members.');
      setIsSubmitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedFriends(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFriends = friends.filter(f => 
    f.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search friends..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#b2f5d1]/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {loadingFriends ? (
              <div className="py-8 flex flex-col items-center justify-center text-white/40 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#b2f5d1]" />
                <span className="text-sm font-bold uppercase tracking-widest">Loading Friends...</span>
              </div>
            ) : friends.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-white/40">
                <p className="text-sm">No eligible friends found.</p>
                <p className="text-xs mt-1 max-w-xs">They might already be in this group, or you need to add them from the Network & Friends page.</p>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-sm">No friends match your search.</div>
            ) : (
              filteredFriends.map(friend => {
                const isSelected = selectedFriends.has(friend._id);
                return (
                  <div 
                    key={friend._id}
                    onClick={() => toggleSelect(friend._id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected ? 'bg-[#b2f5d1]/10 border-[#b2f5d1]/50' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${isSelected ? 'bg-[#b2f5d1]/20 text-[#b2f5d1]' : 'bg-[#1a1a1c] text-white/50 border border-white/10'}`}>
                        {friend.avatar ? (
                          <img src={friend.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          friend.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${isSelected ? 'text-[#b2f5d1]' : 'text-white'}`}>{friend.fullName}</h4>
                        <p className="text-xs text-white/40">{friend.email}</p>
                      </div>
                    </div>
                    
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected ? 'bg-[#b2f5d1] border-[#b2f5d1] text-black' : 'border-white/20 bg-transparent text-transparent'
                    }`}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
            onClick={handleSubmit}
            disabled={selectedFriends.size === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Adding...</>
            ) : (
              `Add ${selectedFriends.size > 0 ? selectedFriends.size : ''} to Group`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
