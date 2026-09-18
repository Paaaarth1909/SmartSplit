'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface Props {
  onClose: () => void;
  onGroupCreated: () => void;
  apiUrl: string;
}

const CreateGroupModal: React.FC<Props> = ({ onClose, onGroupCreated, apiUrl }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const { getToken } = useAuth();

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const token = await getToken();
        const res = await fetch('http://127.0.0.1:5050/api/users/me/friends', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFriends(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load friends", err);
      }
    };
    loadFriends();
  }, [getToken]);

  const toggleFriend = (id: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const token = await getToken();
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          description,
          friendIds: selectedFriendIds
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create group');
      }

      onGroupCreated();
      onClose();
    } catch (err) {
      setError('Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b2f5d1]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 p-6 sm:p-8 flex-shrink-0 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create New Group</h2>
            <button 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors" 
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="relative z-10 p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form id="createGroupForm" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2" htmlFor="groupName">
                Group Name
              </label>
              <input 
                id="groupName"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#b2f5d1]/50 focus:bg-white/10 transition-colors" 
                type="text" 
                placeholder="e.g., Trip to Bali, Apartment 4B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2" htmlFor="groupDesc">
                Description (Optional)
              </label>
              <textarea 
                id="groupDesc"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#b2f5d1]/50 focus:bg-white/10 transition-colors resize-none" 
                rows={3}
                placeholder="What is this group for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                Add Friends to Group
              </label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {friends.length === 0 ? (
                  <div className="text-xs text-white/40 italic p-2 border border-white/5 rounded-xl bg-white/5 text-center">
                    You don't have any friends yet.
                  </div>
                ) : (
                  friends.map(friend => {
                    const isSelected = selectedFriendIds.includes(friend._id);
                    return (
                      <div 
                        key={friend._id}
                        onClick={() => toggleFriend(friend._id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-[#b2f5d1]/10 border-[#b2f5d1]/30' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#b2f5d1] border-[#b2f5d1]' : 'border-white/20'}`}>
                          {isSelected && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-white font-bold">{friend.fullName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-white font-medium truncate">{friend.fullName}</span>
                          <span className="text-[10px] text-white/40 truncate">{friend.email}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="relative z-10 p-6 sm:p-8 border-t border-white/5 flex-shrink-0 bg-[#121214]">
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="createGroupForm"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#b2f5d1] hover:bg-[#9de4c2] text-black shadow-[0_0_15px_rgba(178,245,209,0.3)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : <><Check size={18} /> Create Group</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
